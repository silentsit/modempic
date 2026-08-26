-- Guest checkout: carts can belong to a signed-in user or a cookie-backed guest key.
ALTER TABLE "Cart" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Cart" ADD COLUMN "guestKey" TEXT;

CREATE UNIQUE INDEX "Cart_guestKey_key" ON "Cart"("guestKey");
