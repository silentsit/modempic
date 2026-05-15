-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "maxOrderCents" INTEGER,
ADD COLUMN "usageLimitPerUser" INTEGER,
ADD COLUMN "freeShipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "excludeSaleItems" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowedEmails" TEXT;

-- CreateTable
CREATE TABLE "CouponProductInclude" (
    "couponId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CouponProductInclude_pkey" PRIMARY KEY ("couponId","productId")
);

-- CreateTable
CREATE TABLE "CouponProductExclude" (
    "couponId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CouponProductExclude_pkey" PRIMARY KEY ("couponId","productId")
);

-- CreateTable
CREATE TABLE "CouponCategoryInclude" (
    "couponId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CouponCategoryInclude_pkey" PRIMARY KEY ("couponId","categoryId")
);

-- CreateTable
CREATE TABLE "CouponCategoryExclude" (
    "couponId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CouponCategoryExclude_pkey" PRIMARY KEY ("couponId","categoryId")
);

-- AddForeignKey
ALTER TABLE "CouponProductInclude" ADD CONSTRAINT "CouponProductInclude_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponProductInclude" ADD CONSTRAINT "CouponProductInclude_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponProductExclude" ADD CONSTRAINT "CouponProductExclude_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponProductExclude" ADD CONSTRAINT "CouponProductExclude_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponCategoryInclude" ADD CONSTRAINT "CouponCategoryInclude_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponCategoryInclude" ADD CONSTRAINT "CouponCategoryInclude_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponCategoryExclude" ADD CONSTRAINT "CouponCategoryExclude_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponCategoryExclude" ADD CONSTRAINT "CouponCategoryExclude_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
