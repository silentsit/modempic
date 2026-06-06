-- CreateEnum
CREATE TYPE "EmailFunnelType" AS ENUM ('WELCOME_SIGNUP', 'ABANDONED_CART', 'UNPAID_ORDER');

-- CreateEnum
CREATE TYPE "EmailFunnelStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EmailFunnelEnrollment" (
    "id" TEXT NOT NULL,
    "funnelType" "EmailFunnelType" NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "status" "EmailFunnelStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSentAt" TIMESTAMP(3),
    "nextSendAt" TIMESTAMP(3) NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "EmailFunnelEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailFunnelEnrollment_funnelType_referenceId_key" ON "EmailFunnelEnrollment"("funnelType", "referenceId");

-- CreateIndex
CREATE INDEX "EmailFunnelEnrollment_status_nextSendAt_idx" ON "EmailFunnelEnrollment"("status", "nextSendAt");

-- CreateIndex
CREATE INDEX "EmailFunnelEnrollment_userId_funnelType_idx" ON "EmailFunnelEnrollment"("userId", "funnelType");

-- AddForeignKey
ALTER TABLE "EmailFunnelEnrollment" ADD CONSTRAINT "EmailFunnelEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
