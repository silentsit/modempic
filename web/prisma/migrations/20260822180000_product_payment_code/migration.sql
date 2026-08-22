-- Opaque payment-gateway product codes (no product names sent to processors).
ALTER TABLE "Product" ADD COLUMN "paymentCode" TEXT;

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "Product"
)
UPDATE "Product" AS p
SET "paymentCode" = 'MP-' || LPAD(n.rn::text, 4, '0')
FROM numbered AS n
WHERE p."id" = n."id";

ALTER TABLE "Product" ALTER COLUMN "paymentCode" SET NOT NULL;

CREATE UNIQUE INDEX "Product_paymentCode_key" ON "Product"("paymentCode");
