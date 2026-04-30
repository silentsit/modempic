-- Remove seeded placeholder articles (not from external import)
DELETE FROM "BlogPost" WHERE slug IN ('how-to-read-a-supplement-label', 'building-a-simple-morning-routine');

-- Align stored support contact email with site-wide info address
UPDATE "StoreSetting"
SET value = '{"value": "info@modempic.com"}'::jsonb
WHERE key = 'store.supportEmail';

-- Admin display name (seed default account)
UPDATE "User"
SET name = 'Dale J. Shinju'
WHERE email = 'info@modempic.com';
