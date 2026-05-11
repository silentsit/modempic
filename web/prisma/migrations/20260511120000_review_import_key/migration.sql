-- AlterTable
ALTER TABLE "Review" ADD COLUMN "importKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Review_importKey_key" ON "Review"("importKey");
