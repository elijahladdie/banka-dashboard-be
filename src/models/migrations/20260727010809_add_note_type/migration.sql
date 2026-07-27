-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CLIENT', 'SESSION');

-- AlterTable
ALTER TABLE "AdvisoryNote" ADD COLUMN     "noteType" "NoteType" NOT NULL DEFAULT 'SESSION';
