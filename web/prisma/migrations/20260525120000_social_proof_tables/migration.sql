-- CreateEnum
CREATE TYPE "SocialProofNotificationType" AS ENUM ('STREAM', 'COMBO', 'INFORMATIONAL', 'REVIEWS', 'COUNTER');

-- CreateEnum
CREATE TYPE "SocialProofNotificationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "SocialProofNotification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SocialProofNotificationType" NOT NULL,
    "status" "SocialProofNotificationStatus" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProofNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProofPresence" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialProofPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialProofNotification_status_type_priority_idx" ON "SocialProofNotification"("status", "type", "priority");

-- CreateIndex
CREATE INDEX "SocialProofPresence_pathname_lastSeenAt_idx" ON "SocialProofPresence"("pathname", "lastSeenAt");

-- CreateIndex
CREATE INDEX "SocialProofPresence_lastSeenAt_idx" ON "SocialProofPresence"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProofPresence_sessionId_pathname_key" ON "SocialProofPresence"("sessionId", "pathname");
