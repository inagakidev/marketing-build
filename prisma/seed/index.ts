import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { CORE_QUESTIONS } from "./questions.core";
import { BRANCH_QUESTIONS } from "./questions.branch";
import type { QuestionSeed } from "./types";

/**
 * Question catalog seed.
 *
 * IDEMPOTENT: can run as many times as needed. Questions are identified by
 * `key` and upserted; questions removed from the catalog are deleted — but only
 * when they have no associated answer, so filled-in briefing data is never
 * erased.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/**
 * Order is assigned by position in the list. Branch questions come after all
 * fixed ones, so within each form block they appear at the end — right after
 * that category's core questions.
 *
 * The step of 10 leaves room to slot a question between two others in a manual
 * adjustment without renumbering the whole table.
 */
const ALL_QUESTIONS: QuestionSeed[] = [...CORE_QUESTIONS, ...BRANCH_QUESTIONS];

async function seedQuestions(): Promise<void> {
  const keys = ALL_QUESTIONS.map((q) => q.key);
  const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate question keys: ${duplicates.join(", ")}`);
  }

  for (const [index, question] of ALL_QUESTIONS.entries()) {
    const data = {
      text: question.text,
      category: question.category,
      answerType: question.answerType,
      required: question.required ?? false,
      order: (index + 1) * 10,
      helpText: question.helpText ?? null,
      // `Prisma.DbNull` stores a real NULL in the column. Passing `null`
      // directly would store the JSON value `null`, which isn't the same: the
      // column would no longer be null and every `IS NULL` filter would miss.
      options: question.options
        ? (question.options as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
      visibilityRule: question.visibilityRule
        ? (question.visibilityRule as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
    };

    await prisma.question.upsert({
      where: { key: question.key },
      create: { key: question.key, ...data },
      update: data,
    });
  }

  console.log(
    `  ${CORE_QUESTIONS.length} fixed + ${BRANCH_QUESTIONS.length} branch = ${ALL_QUESTIONS.length} questions`,
  );

  // Removes questions that left the catalog, keeping those already answered
  // by some briefing.
  const obsolete = await prisma.question.findMany({
    where: { key: { notIn: keys } },
    select: { id: true, key: true, _count: { select: { answers: true } } },
  });

  const removable = obsolete.filter((q) => q._count.answers === 0);
  const kept = obsolete.filter((q) => q._count.answers > 0);

  if (removable.length > 0) {
    await prisma.question.deleteMany({
      where: { id: { in: removable.map((q) => q.id) } },
    });
    console.log(`  removed ${removable.length} obsolete question(s)`);
  }
  if (kept.length > 0) {
    console.warn(
      `  ! ${kept.length} question(s) no longer in the catalog kept because they have answers: ${kept
        .map((q) => q.key)
        .join(", ")}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("Seeding the question catalog...");
  await seedQuestions();

  const total = await prisma.question.count();
  console.log(`Done. ${total} questions in the catalog.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
