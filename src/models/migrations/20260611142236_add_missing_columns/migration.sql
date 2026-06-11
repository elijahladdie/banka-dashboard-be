-- AlterTable
ALTER TABLE "users" ADD COLUMN     "registrationCompleted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "source" VARCHAR(50);
