-- Retire peptides storefront category (reassign products to modafinil when both rows exist).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'peptides')
     AND EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'modafinil') THEN
    INSERT INTO "ProductCategory" ("productId", "categoryId")
    SELECT pc."productId", cat_modafinil."id"
    FROM "ProductCategory" pc
    INNER JOIN "Category" cat_retired
      ON cat_retired."id" = pc."categoryId" AND cat_retired."slug" = 'peptides'
    INNER JOIN "Category" cat_modafinil ON cat_modafinil."slug" = 'modafinil'
    WHERE NOT EXISTS (
      SELECT 1 FROM "ProductCategory" existing
      WHERE existing."productId" = pc."productId"
        AND existing."categoryId" = cat_modafinil."id"
    );

    DELETE FROM "ProductCategory" pc
    USING "Category" c
    WHERE pc."categoryId" = c."id" AND c."slug" = 'peptides';

    DELETE FROM "CouponCategoryInclude" cci
    USING "Category" c
    WHERE cci."categoryId" = c."id" AND c."slug" = 'peptides';

    DELETE FROM "CouponCategoryExclude" cce
    USING "Category" c
    WHERE cce."categoryId" = c."id" AND c."slug" = 'peptides';

    DELETE FROM "Category" WHERE "slug" = 'peptides';
  END IF;
END $$;
