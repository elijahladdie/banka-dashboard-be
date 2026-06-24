/*
  Warnings:

  - You are about to drop the `financial_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "financial_reports" DROP CONSTRAINT "financial_reports_advisorId_fkey";

-- DropForeignKey
ALTER TABLE "financial_reports" DROP CONSTRAINT "financial_reports_subscriberId_fkey";

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "ends_at" TIMESTAMP(3),
ADD COLUMN     "starts_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "financial_reports";
