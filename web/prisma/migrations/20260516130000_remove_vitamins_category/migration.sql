-- Remove legacy `vitamins` category: reassign products to `peptides` when both rows exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'vitamins')
     AND EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'peptides') THEN
    INSERT INTO "ProductCategory" ("productId", "categoryId")
    SELECT pc."productId", cat_peptides."id"
    FROM "ProductCategory" pc
    INNER JOIN "Category" cat_vitamins
      ON cat_vitamins."id" = pc."categoryId" AND cat_vitamins."slug" = 'vitamins'
    INNER JOIN "Category" cat_peptides ON cat_peptides."slug" = 'peptides'
    WHERE NOT EXISTS (
      SELECT 1 FROM "ProductCategory" existing
      WHERE existing."productId" = pc."productId"
        AND existing."categoryId" = cat_peptides."id"
    );

    DELETE FROM "ProductCategory" pc
    USING "Category" c
    WHERE pc."categoryId" = c."id" AND c."slug" = 'vitamins';

    DELETE FROM "CouponCategoryInclude" cci
    USING "Category" c
    WHERE cci."categoryId" = c."id" AND c."slug" = 'vitamins';

    DELETE FROM "CouponCategoryExclude" cce
    USING "Category" c
    WHERE cce."categoryId" = c."id" AND c."slug" = 'vitamins';

    DELETE FROM "Category" WHERE "slug" = 'vitamins';
  END IF;
END $$;
