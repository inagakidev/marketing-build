import { z } from "zod";

/**
 * Schemas de validação das bordas da API.
 *
 * Toda entrada vinda do browser passa por aqui antes de tocar o banco — tanto
 * a do painel autenticado quanto a do formulário público, que é aberto e
 * portanto a superfície mais exposta do sistema.
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
 * Uma resposta do formulário. `value` aceita string (texto e escolha única) ou
 * array de strings (escolha múltipla) — os dois formatos que `Answer.value`
 * guarda.
 */
export const answerEntrySchema = z.object({
  questionKey: z.string().min(1).max(100),
  value: z.union([z.string().max(10_000), z.array(z.string().max(500)).max(50)]),
});

export const saveAnswersSchema = z.object({
  answers: z.array(answerEntrySchema).min(1).max(100),
});

export type AnswerEntryInput = z.infer<typeof answerEntrySchema>;
