-- Structured catalog fields for comparison pages and Merchant listings.
ALTER TABLE "Product" ADD COLUMN "manufacturer" TEXT;
ALTER TABLE "Product" ADD COLUMN "activeIngredient" TEXT;
ALTER TABLE "Product" ADD COLUMN "strengthMg" INTEGER;

-- Strength is taken from the imported catalog name (the pack label), not invented.
UPDATE "Product" SET "strengthMg" = 300 WHERE slug = 'buy-modaxl-300-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modalert-200-mg';
UPDATE "Product" SET "strengthMg" = 400 WHERE slug = 'buy-modasmart-400-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modawake-200-mg';
UPDATE "Product" SET "strengthMg" = 150 WHERE slug = 'buy-artvigil-150-mg';
UPDATE "Product" SET "strengthMg" = 250 WHERE slug = 'buy-artvigil-250-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-vilafinil-200-mg';
UPDATE "Product" SET "strengthMg" = 150 WHERE slug = 'buy-waklert-150-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modavinil-200-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modafil-md-200-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modactive-200-mg';
UPDATE "Product" SET "strengthMg" = 250 WHERE slug = 'buy-armodaxl-250-mg';
UPDATE "Product" SET "strengthMg" = 150 WHERE slug = 'buy-armodaxl-150-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modvigil-200-mg';
UPDATE "Product" SET "strengthMg" = 200 WHERE slug = 'buy-modaheal-200-mg';

-- Manufacturer and molecule only where a public listing names them.
UPDATE "Product"
SET
  "manufacturer" = 'Sun Pharmaceutical Industries Ltd',
  "activeIngredient" = 'Modafinil'
WHERE slug = 'buy-modalert-200-mg';

UPDATE "Product"
SET
  "manufacturer" = 'Sun Pharmaceutical Industries Ltd',
  "activeIngredient" = 'Armodafinil'
WHERE slug = 'buy-waklert-150-mg';

UPDATE "Product"
SET
  "manufacturer" = 'Centurion Laboratories Private Limited',
  "activeIngredient" = 'Modafinil'
WHERE slug = 'buy-vilafinil-200-mg';

UPDATE "Product"
SET
  "manufacturer" = 'Healing Pharma India Pvt Ltd',
  "activeIngredient" = 'Modafinil'
WHERE slug = 'buy-modaheal-200-mg';

UPDATE "Product"
SET
  "manufacturer" = 'HAB Pharmaceuticals',
  "activeIngredient" = 'Armodafinil'
WHERE slug IN ('buy-artvigil-150-mg', 'buy-artvigil-250-mg');
