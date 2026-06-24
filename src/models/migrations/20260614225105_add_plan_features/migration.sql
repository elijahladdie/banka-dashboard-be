-- CreateTable
CREATE TABLE "plan_features" (
    "id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_transactions" (
    "id" UUID NOT NULL,
    "transactionId" VARCHAR(255) NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "subscriptionId" VARCHAR(255),
    "planName" VARCHAR(255),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'RWF',
    "amount" DECIMAL(18,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
    "eventType" VARCHAR(100) NOT NULL,
    "eventId" VARCHAR(255) NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paddle_transactions_transactionId_key" ON "paddle_transactions"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "paddle_transactions_eventId_key" ON "paddle_transactions"("eventId");
