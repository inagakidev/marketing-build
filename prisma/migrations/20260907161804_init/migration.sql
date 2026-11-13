-- CreateEnum
CREATE TYPE "BriefingStatus" AS ENUM ('draft', 'awaiting_response', 'in_progress', 'submitted', 'ready_for_review', 'approved');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('local_business', 'ecommerce', 'info_product', 'freelancer', 'b2b_service', 'other');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('business', 'goals', 'audience', 'brand', 'competition', 'digital_presence', 'offer', 'closing');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('short_text', 'long_text', 'single_choice', 'multi_choice');

-- CreateEnum
CREATE TYPE "SignalSeverity" AS ENUM ('light', 'moderate', 'strong');

-- CreateEnum
CREATE TYPE "DiagnosisCategory" AS ENUM ('positioning', 'audience', 'offer', 'digital_presence', 'current_marketing');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('green', 'yellow', 'red', 'gray');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabaseAuthId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT,
    "projectType" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefings" (
    "id" TEXT NOT NULL,
    "status" "BriefingStatus" NOT NULL DEFAULT 'draft',
    "clientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "businessType" "BusinessType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "briefings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "answerType" "AnswerType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "visibilityRule" JSONB,
    "helpText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "briefingId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "briefingId" TEXT NOT NULL,
    "category" "DiagnosisCategory" NOT NULL,
    "severity" "SignalSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceAnswerIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "briefingId" TEXT NOT NULL,
    "category" "DiagnosisCategory" NOT NULL,
    "score" INTEGER,
    "status" "DiagnosisStatus" NOT NULL,
    "signalIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseAuthId_key" ON "users"("supabaseAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "briefings_token_key" ON "briefings"("token");

-- CreateIndex
CREATE INDEX "briefings_clientId_idx" ON "briefings"("clientId");

-- CreateIndex
CREATE INDEX "briefings_status_idx" ON "briefings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "questions_key_key" ON "questions"("key");

-- CreateIndex
CREATE INDEX "questions_category_order_idx" ON "questions"("category", "order");

-- CreateIndex
CREATE INDEX "answers_briefingId_idx" ON "answers"("briefingId");

-- CreateIndex
CREATE UNIQUE INDEX "answers_briefingId_questionId_key" ON "answers"("briefingId", "questionId");

-- CreateIndex
CREATE INDEX "signals_briefingId_idx" ON "signals"("briefingId");

-- CreateIndex
CREATE UNIQUE INDEX "signals_briefingId_code_key" ON "signals"("briefingId", "code");

-- CreateIndex
CREATE INDEX "diagnoses_briefingId_idx" ON "diagnoses"("briefingId");

-- CreateIndex
CREATE UNIQUE INDEX "diagnoses_briefingId_category_key" ON "diagnoses"("briefingId", "category");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefings" ADD CONSTRAINT "briefings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
