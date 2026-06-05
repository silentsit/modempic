-- Add structured catalog fields for research-use product detail pages.
ALTER TABLE "Product"
ADD COLUMN "purity" TEXT,
ADD COLUMN "testingStatus" TEXT,
ADD COLUMN "coaUrl" TEXT,
ADD COLUMN "storageNotes" TEXT,
ADD COLUMN "specifications" JSONB,
ADD COLUMN "shippingRestrictions" TEXT;

-- Catalog and storefront query paths.
CREATE INDEX "Product_status_isBestSeller_name_idx" ON "Product"("status", "isBestSeller", "name");
CREATE INDEX "Product_updatedAt_idx" ON "Product"("updatedAt");
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
CREATE INDEX "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

-- Order, payment, and webhook operations.
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt" DESC);
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");
CREATE INDEX "OrderLine_productId_idx" ON "OrderLine"("productId");
CREATE INDEX "Payment_orderId_status_idx" ON "Payment"("orderId", "status");
CREATE INDEX "Payment_provider_externalId_idx" ON "Payment"("provider", "externalId");
CREATE INDEX "Payment_status_updatedAt_idx" ON "Payment"("status", "updatedAt");
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "PaymentEvent"("paymentId", "createdAt");
CREATE INDEX "WebhookEvent_provider_bodyHash_idx" ON "WebhookEvent"("provider", "bodyHash");
CREATE INDEX "WebhookEvent_provider_processed_createdAt_idx" ON "WebhookEvent"("provider", "processed", "createdAt");

-- SEO/content and social proof read paths.
CREATE INDEX "Review_status_productId_createdAt_idx" ON "Review"("status", "productId", "createdAt" DESC);
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt" DESC);
