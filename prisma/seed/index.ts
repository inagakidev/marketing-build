import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { CORE_QUESTIONS } from "./questions.core";
import { BRANCH_QUESTIONS } from "./questions.branch";
import type { QuestionSeed } from "./types";

/**
 * Seed do catálogo de perguntas.
 *
 * IDEMPOTENTE: pode rodar quantas vezes for preciso. Perguntas são
 * identificadas por `key` e sofrem upsert; perguntas que saíram do catálogo são
 * removidas — mas só quando não têm nenhuma resposta associada, para nunca
 * apagar dados de briefing já preenchido.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida. Copie .env.example para .env.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/**
 * A ordem é atribuída pela posição na lista. As ramificadas vêm depois de
 * todas as fixas, então dentro de cada bloco do formulário elas aparecem no
 * fim — logo após as perguntas do núcleo daquela categoria.
 *
 * O passo de 10 deixa espaço para encaixar uma pergunta entre duas outras num
 * ajuste manual sem renumerar a tabela inteira.
 */
const ALL_QUESTIONS: QuestionSeed[] = [...CORE_QUESTIONS, ...BRANCH_QUESTIONS];

async function seedQuestions(): Promise<void> {
  const keys = ALL_QUESTIONS.map((q) => q.key);
  const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Chaves de pergunta duplicadas: ${duplicates.join(", ")}`);
  }

  for (const [index, question] of ALL_QUESTIONS.entries()) {
    const data = {
      text: question.text,
      category: question.category,
      answerType: question.answerType,
      required: question.required ?? false,
      order: (index + 1) * 10,
      helpText: question.helpText ?? null,
      // `Prisma.DbNull` grava NULL de verdade na coluna. Passar `null` direto
      // gravaria o valor JSON `null`, que não é a mesma coisa: a coluna
      // deixaria de ser nula e todo filtro por `IS NULL` erraria.
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
    `  ${CORE_QUESTIONS.length} fixas + ${BRANCH_QUESTIONS.length} ramificadas = ${ALL_QUESTIONS.length} perguntas`,
  );

  // Remove perguntas que saíram do catálogo, preservando as que já foram
  // respondidas por algum briefing.
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
    console.log(`  removidas ${removable.length} pergunta(s) obsoleta(s)`);
  }
  if (kept.length > 0) {
    console.warn(
      `  ! ${kept.length} pergunta(s) fora do catálogo mantidas por terem respostas: ${kept
        .map((q) => q.key)
        .join(", ")}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("Semeando catálogo de perguntas...");
  await seedQuestions();

  const total = await prisma.question.count();
  console.log(`Pronto. ${total} perguntas no catálogo.`);
}

main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
