-- Rename PAID -> COMPLETED and add WooCommerce-aligned statuses on the OrderStatus enum.
-- Postgres requires ALTER TYPE for enum changes; ADD VALUE cannot run inside a transaction
-- block, so we set client_min_messages and split statements explicitly.

ALTER TYPE "OrderStatus" RENAME VALUE 'PAID' TO 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- Order shipping + tracking
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "shippingMethod"   TEXT,
  ADD COLUMN IF NOT EXISTS "trackingNumber"   TEXT,
  ADD COLUMN IF NOT EXISTS "trackingCarrier"  TEXT;

-- Order attribution
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "originSource"     TEXT,
  ADD COLUMN IF NOT EXISTS "originReferrer"   TEXT,
  ADD COLUMN IF NOT EXISTS "deviceType"       TEXT,
  ADD COLUMN IF NOT EXISTS "customerIp"       TEXT,
  ADD COLUMN IF NOT EXISTS "sessionPageViews" INTEGER;
