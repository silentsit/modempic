-- Retire skin-care and antiparasitic storefront categories (reassign products to modafinil when both rows exist).
DO $$
DECLARE
  retired_slug TEXT;
BEGIN
  FOREACH retired_slug IN ARRAY ARRAY['skin-care', 'antiparasitic']
  LOOP
    IF EXISTS (SELECT 1 FROM "Category" WHERE "slug" = retired_slug)
       AND EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'modafinil') THEN
      INSERT INTO "ProductCategory" ("productId", "categoryId")
      SELECT pc."productId", cat_modafinil."id"
      FROM "ProductCategory" pc
      INNER JOIN "Category" cat_retired
        ON cat_retired."id" = pc."categoryId" AND cat_retired."slug" = retired_slug
      INNER JOIN "Category" cat_modafinil ON cat_modafinil."slug" = 'modafinil'
      WHERE NOT EXISTS (
        SELECT 1 FROM "ProductCategory" existing
        WHERE existing."productId" = pc."productId"
          AND existing."categoryId" = cat_modafinil."id"
      );

      DELETE FROM "ProductCategory" pc
      USING "Category" c
      WHERE pc."categoryId" = c."id" AND c."slug" = retired_slug;

      DELETE FROM "CouponCategoryInclude" cci
      USING "Category" c
      WHERE cci."categoryId" = c."id" AND c."slug" = retired_slug;

      DELETE FROM "CouponCategoryExclude" cce
      USING "Category" c
      WHERE cce."categoryId" = c."id" AND c."slug" = retired_slug;

      DELETE FROM "Category" WHERE "slug" = retired_slug;
    END IF;
  END LOOP;
END $$;
