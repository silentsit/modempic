-- AlterTable
ALTER TABLE "Order" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Backfill: best-effort completion time from last update snapshot for historical paid orders
UPDATE "Order" SET "completedAt" = "updatedAt" WHERE "status" = 'COMPLETED';

-- Index for social-proof queries (recent completions)
CREATE INDEX "Order_completedAt_idx" ON "Order"("completedAt" DESC);
