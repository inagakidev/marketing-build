import { customAlphabet } from "nanoid";
import { prisma } from "./db";
import { serverEnv } from "./env";
import type { Prisma } from "@/generated/prisma/client";
import {
  buildContext,
  processBriefing,
  visibleQuestions,
  Q,
  type AnswerValue,
  type BusinessType,
  type EvalContext,
  type QuestionOption,
  type QuestionSpec,
  type VisibilityRule,
  validateAnswerValue,
  type ProcessedBriefing,
} from "@/core";

/**
 * Adapter layer between the database and the rules engine.
 *
 * Everything involving Prisma lives here; `src/core` still doesn't know a
 * database exists.
 */

/**
 * Alphabet without ambiguous characters (0/O, 1/l/I): the link is read and
 * typed by people. 24 characters of this alphabet give ~124 bits of entropy —
 * the token is the respondent's only credential, so it must not be guessable.
 */
const generateToken = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  24,
);

export type BriefingAccessProblem =
  | "not_found"
  | "expired"
  | "already_submitted";

/** Prisma client or an ongoing transaction: reads work with both. */
type Db = Prisma.TransactionClient;

const CLOSED_STATUSES = ["submitted", "ready_for_review", "approved"];

/**
 * Why a briefing no longer accepts answers, or `null` if it does.
 *
 * "Already submitted" comes before "expired": a submitted briefing whose link
 * expired later is still, for the respondent, a submitted briefing.
 */
export function briefingAccessProblem(
  briefing: { status: string; expiresAt: Date | null },
  now: Date = new Date(),
): "expired" | "already_submitted" | null {
  if (CLOSED_STATUSES.includes(briefing.status)) return "already_submitted";
  if (briefing.expiresAt && briefing.expiresAt < now) return "expired";
  return null;
}

/** The briefing no longer accepts answers (submitted or expired). */
export class BriefingClosedError extends Error {
  constructor(public readonly problem: "expired" | "already_submitted") {
    super(problem === "expired" ? "Link expired" : "Briefing already submitted");
    this.name = "BriefingClosedError";
  }
}

/** Answers incompatible with the catalog. `issues` is keyed by question key. */
export class InvalidAnswersError extends Error {
  constructor(
    public readonly issues: Record<string, string>,
    message = "Invalid answers",
  ) {
    super(message);
    this.name = "InvalidAnswersError";
  }
}

/**
 * Locks the briefing row until the end of the transaction.
 *
 * Autosave, submission and reprocessing all go through here: with the row
 * locked they queue up, so none of them sees another's intermediate state
 * (DATA-01).
 */
async function lockBriefing(tx: Db, briefingId: string) {
  const rows = await tx.$queryRaw<{ status: string; expiresAt: Date | null }[]>`
    SELECT status::text AS status, "expiresAt"
    FROM briefings
    WHERE id = ${briefingId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

/** Catalog questions, in the shape the engine understands. */
export async function loadQuestionSpecs(db: Db = prisma): Promise<QuestionSpec[]> {
  const questions = await db.question.findMany({
    orderBy: { order: "asc" },
  });

  return questions.map((q) => ({
    key: q.key,
    category: q.category,
    answerType: q.answerType,
    required: q.required,
    order: q.order,
    visibilityRule: (q.visibilityRule as VisibilityRule | null) ?? null,
  }));
}

/** Builds a briefing's evaluation context from the database. */
export async function loadEvalContext(
  briefingId: string,
  db: Db = prisma,
): Promise<EvalContext> {
  const [briefing, questions, answers] = await Promise.all([
    db.briefing.findUniqueOrThrow({
      where: { id: briefingId },
      select: { businessType: true },
    }),
    loadQuestionSpecs(db),
    db.answer.findMany({
      where: { briefingId },
      select: { id: true, value: true, question: { select: { key: true } } },
    }),
  ]);

  return buildContext({
    businessType: briefing.businessType as BusinessType | null,
    questions,
    answers: answers.map((a) => ({
      id: a.id,
      questionKey: a.question.key,
      value: a.value as AnswerValue,
    })),
  });
}

/**
 * Recomputes and rewrites signals and diagnosis (explicit reprocessing).
 *
 * Reading answers, computing and writing happen in the SAME transaction, with
 * the briefing row locked: the result matches exactly the answers stored at
 * that moment.
 */
export async function processAndPersist(briefingId: string): Promise<ProcessedBriefing> {
  return prisma.$transaction(async (tx) => {
    await lockBriefing(tx, briefingId);
    const result = processBriefing(await loadEvalContext(briefingId, tx));
    await persistResult(tx, briefingId, result);
    return result;
  });
}

/**
 * Deletes and recreates signals and diagnosis. Idempotent: a signal that no
 * longer applies doesn't survive. Must run inside a transaction.
 */
async function persistResult(tx: Db, briefingId: string, result: ProcessedBriefing) {
  await tx.signal.deleteMany({ where: { briefingId } });
  await tx.diagnosis.deleteMany({ where: { briefingId } });

  // Signals must be created first so the diagnosis can reference their ids
  // in `signalIds`.
  const createdSignals = [];
  for (const signal of result.signals) {
    createdSignals.push(
      await tx.signal.create({
        data: {
          briefingId,
          code: signal.code,
          category: signal.category,
          severity: signal.severity,
          description: signal.description,
          sourceAnswerIds: signal.sourceAnswerIds,
        },
        select: { id: true, code: true },
      }),
    );
  }

  const signalIdByCode = new Map(createdSignals.map((s) => [s.code, s.id] as const));

  await tx.diagnosis.createMany({
    data: result.diagnoses.map((diagnosis) => ({
      briefingId,
      category: diagnosis.category,
      score: diagnosis.score,
      status: diagnosis.status,
      signalIds: diagnosis.signals
        .map((s) => signalIdByCode.get(s.code))
        .filter((id): id is string => id != null),
    })),
  });
}

/** Creates a briefing with a unique token and an expiry date. */
export async function createBriefing(clientId: string, ttlDays?: number) {
  const days = ttlDays ?? serverEnv().briefingLinkTtlDays;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  return prisma.briefing.create({
    data: {
      clientId,
      token: generateToken(),
      status: "awaiting_response",
      expiresAt,
    },
  });
}

/**
 * Loads a briefing by token and says whether it can still be answered.
 *
 * Returns `problem` instead of throwing: each refusal reason has a different
 * message for the respondent, and an expired link isn't a system error.
 */
export async function loadBriefingByToken(token: string) {
  const briefing = await prisma.briefing.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      businessType: true,
      expiresAt: true,
      submittedAt: true,
      // Only the client's name: the public form NEVER exposes email, phone
      // or internal notes.
      client: { select: { name: true, user: { select: { name: true } } } },
    },
  });

  if (!briefing) return { problem: "not_found" as const, briefing: null };

  return { problem: briefingAccessProblem(briefing), briefing };
}

/**
 * Stores answers (autosave). Upserts by (briefing, question) and keeps the
 * briefing's `businessType` in sync with the branching question.
 *
 * Blank answers DELETE the record instead of storing an empty value: that way
 * "answered then cleared" and "never answered" are the same state, which is
 * what the rules engine expects.
 */
export async function saveAnswers(
  briefingId: string,
  entries: { questionKey: string; value: AnswerValue }[],
) {
  const keys = entries.map((e) => e.questionKey);
  const questions = await prisma.question.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, answerType: true, options: true },
  });
  const questionByKey = new Map(questions.map((q) => [q.key, q] as const));

  const unknown = keys.filter((key) => !questionByKey.has(key));
  if (unknown.length > 0) {
    throw new InvalidAnswersError(
      Object.fromEntries(unknown.map((key) => [key, "Pergunta desconhecida."])),
      `Unknown questions: ${unknown.join(", ")}`,
    );
  }

  // Validates the whole batch before writing: all or nothing (DATA-03).
  const issues: Record<string, string> = {};
  for (const entry of entries) {
    if (isBlankValue(entry.value)) continue;
    const question = questionByKey.get(entry.questionKey)!;
    const problem = validateAnswerValue(
      {
        answerType: question.answerType,
        options: (question.options as QuestionOption[] | null) ?? null,
      },
      entry.value,
    );
    if (problem) issues[entry.questionKey] = problem;
  }
  if (Object.keys(issues).length > 0) throw new InvalidAnswersError(issues);

  await prisma.$transaction(async (tx) => {
    // The state is checked WITH the row locked: a concurrent or completed
    // submission blocks the write (DATA-01).
    const current = await lockBriefing(tx, briefingId);
    if (!current) throw new Error(`Briefing ${briefingId} not found`);
    const problem = briefingAccessProblem(current);
    if (problem) throw new BriefingClosedError(problem);

    for (const entry of entries) {
      const questionId = questionByKey.get(entry.questionKey)!.id;

      if (isBlankValue(entry.value)) {
        await tx.answer.deleteMany({ where: { briefingId, questionId } });
        continue;
      }

      const value = entry.value as unknown as Prisma.InputJsonValue;
      await tx.answer.upsert({
        where: { briefingId_questionId: { briefingId, questionId } },
        create: { briefingId, questionId, value },
        update: { value },
      });
    }

    const branch = entries.find((e) => e.questionKey === Q.BUSINESS_TYPE);
    const data: Prisma.BriefingUpdateInput = {};

    if (branch) {
      // Already validated against the catalog options, which mirror the enum.
      data.businessType = isBlankValue(branch.value)
        ? null
        : (String(branch.value) as BusinessType);
    }

    // The first answer moves the briefing out of "awaiting".
    if (current.status === "awaiting_response" || current.status === "draft") {
      data.status = "in_progress";
    }

    if (Object.keys(data).length > 0) {
      await tx.briefing.update({ where: { id: briefingId }, data });
    }
  });
}

export type SubmitOutcome =
  | { ok: true; alreadySubmitted: boolean }
  | { ok: false; missing: string[] }
  | { ok: false; problem: "expired" | "not_found" };

/**
 * Closes the briefing atomically (DATA-01).
 *
 * In a single transaction, with the row locked: checks the state, validates
 * the visible required questions, runs the engine, writes signals and
 * diagnosis and changes the status. If any step fails, nothing changes — the
 * briefing is never closed without a diagnosis. Resubmission (double click,
 * concurrent submission) is idempotent.
 */
export async function submitBriefing(briefingId: string): Promise<SubmitOutcome> {
  return prisma.$transaction(async (tx) => {
    const current = await lockBriefing(tx, briefingId);
    if (!current) return { ok: false, problem: "not_found" };

    const problem = briefingAccessProblem(current);
    if (problem === "already_submitted") return { ok: true, alreadySubmitted: true };
    if (problem === "expired") return { ok: false, problem: "expired" };

    const ctx = await loadEvalContext(briefingId, tx);
    const missing = missingRequiredKeys(ctx);
    if (missing.length > 0) return { ok: false, missing };

    await persistResult(tx, briefingId, processBriefing(ctx));
    await tx.briefing.update({
      where: { id: briefingId },
      data: { status: "ready_for_review", submittedAt: new Date() },
    });

    return { ok: true, alreadySubmitted: false };
  });
}

/** Keys of visible required questions still unanswered. */
export function missingRequiredKeys(ctx: EvalContext): string[] {
  return visibleQuestions(ctx)
    .filter((q) => q.required)
    .filter((q) => {
      const answer = ctx.answersByKey[q.key];
      return !answer || isBlankValue(answer.value);
    })
    .map((q) => q.key);
}

function isBlankValue(value: AnswerValue | null | undefined): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => v.trim() === "");
  }
  return value.trim() === "";
}
