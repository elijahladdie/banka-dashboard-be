-- AlterTable: add column as nullable first
ALTER TABLE "plan_features" ADD COLUMN     "billingInterval" "BillingInterval";

-- Set default billing interval for existing rows (assume MONTHLY)
UPDATE "plan_features" SET "billingInterval" = 'MONTHLY' WHERE "billingInterval" IS NULL;

-- Now make it required
ALTER TABLE "plan_features" ALTER COLUMN "billingInterval" SET NOT NULL;
