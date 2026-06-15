/*
  Warnings:

  - You are about to drop the `paddle_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "subscriber_assignments" DROP CONSTRAINT "subscriber_assignments_subscriberId_fkey";

-- DropTable
DROP TABLE "paddle_transactions";

-- AddForeignKey
ALTER TABLE "subscriber_assignments" ADD CONSTRAINT "subscriber_assignments_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
