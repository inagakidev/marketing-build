import { z } from "zod";

/**
 * Validation schemas for the API boundaries.
 *
 * Every input from the browser goes through here before touching the database
 * — both from the authenticated panel and from the public form, which is open
 * and therefore the system's most exposed surface. Messages are user-facing
 * (pt-BR).
 */

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente.").max(200),
  contactEmail: z.email("E-mail inválido.").max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  projectType: z.string().trim().max(200).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientInputSchema>;

export const clientUpdateSchema = clientInputSchema.partial();

export const createBriefingSchema = z.object({
  clientId: z.string().min(1),
  ttlDays: z.number().int().min(1).max(365).optional(),
});

/**
 * A form answer. `value` accepts a string (text and single choice) or an array
 * of strings (multiple choice) — the two shapes `Answer.value` stores.
 */
export const answerEntrySchema = z.object({
  questionKey: z.string().min(1).max(100),
  value: z.union([z.string().max(10_000), z.array(z.string().max(500)).max(50)]),
});

export const saveAnswersSchema = z.object({
  answers: z.array(answerEntrySchema).min(1).max(100),
});

export type AnswerEntryInput = z.infer<typeof answerEntrySchema>;
