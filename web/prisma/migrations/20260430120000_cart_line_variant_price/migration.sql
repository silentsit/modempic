-- Cart line pricing for tiered products (variant selection).

ALTER TABLE "CartLine" ADD COLUMN "variantKey" TEXT NOT NULL DEFAULT '';

ALTER TABLE "CartLine" ADD COLUMN "unitPriceCents" INTEGER;

UPDATE "CartLine" AS cl
SET "unitPriceCents" = p."priceCents"
FROM "Product" AS p
WHERE cl."productId" = p."id" AND cl."unitPriceCents" IS NULL;

ALTER TABLE "CartLine" ALTER COLUMN "unitPriceCents" SET NOT NULL;

DROP INDEX IF EXISTS "CartLine_cartId_productId_key";

CREATE UNIQUE INDEX "CartLine_cartId_productId_variantKey_key" ON "CartLine"("cartId", "productId", "variantKey");
