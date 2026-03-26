-- 🧬 SYNDICATE PERSONA SANITIZATION (V1.3)
-- Ensures all 78 personas have correct metadata for the new Voice Engine.

-- 1. Correcting the Primary Roster (Direct IDs)
UPDATE public.personas 
SET syndicate_zone = 'ny_dominican', skin_tone = 'bronzed-latina', culture = 'Dominican-American'
WHERE id IN ('isabella', 'isabella-4411', 'xio-reyes-node', 'morena-d-node-v19');

UPDATE public.personas 
SET syndicate_zone = 'caribbean_hub', skin_tone = 'ebony', culture = 'Jamaican'
WHERE id IN ('tia-jamaica');

UPDATE public.personas 
SET syndicate_zone = 'uk_london_black', skin_tone = 'ebony', culture = 'Nigerian'
WHERE id IN ('zola-nigeria', 'imani-node-v21', 'zuri-node-v21', 'jada-v-node-v21', 'amara-j-node-v21');

UPDATE public.personas 
SET syndicate_zone = 'col_medallo', skin_tone = 'latina', culture = 'Colombian'
WHERE id IN ('valeria', 'elena', 'zara-node', 'elena-8710', 'elena-luxe-3138', 'catalina-v-node-v19');

UPDATE public.personas 
SET syndicate_zone = 'us_atlanta_black', skin_tone = 'ebony', culture = 'African-American'
WHERE id IN ('jade-atlanta-6604', 'jade-node');

UPDATE public.personas 
SET syndicate_zone = 'vibe_check', skin_tone = 'latina', culture = 'Mexican-American'
WHERE id IN ('valentina', 'valentina-6639', 'luna-node');

-- 2. Correcting Node-V21 Wave (Bulk pattern matching)
UPDATE public.personas 
SET syndicate_zone = 'uk_london_black', skin_tone = 'ebony'
WHERE id LIKE '%node-v21%' AND (name ILIKE '%zuri%' OR name ILIKE '%imani%' OR name ILIKE '%jada%' OR name ILIKE '%kiana%' OR name ILIKE '%zola%' OR name ILIKE '%indya%' OR name ILIKE '%malia%');

UPDATE public.personas 
SET syndicate_zone = 'ny_dominican', skin_tone = 'bronzed-latina'
WHERE id LIKE '%node-v21%' AND (name ILIKE '%isabella%' OR name ILIKE '%xiomara%' OR name ILIKE '%marisol%' OR name ILIKE '%noemi%');

-- 3. Correcting Dubai/Elite Wave (White/Global Elite)
UPDATE public.personas 
SET syndicate_zone = 'vibe_check', skin_tone = 'fair', personality = 'elite'
WHERE city ILIKE '%Dubai%' OR city ILIKE '%Paris%' OR city ILIKE '%Berlin%' OR city ILIKE '%London%';

-- 4. Cleanup: Ensure NO Jamaican has 'papi' or 'mi amor' in their system prompt
UPDATE public.personas 
SET base_dna = REPLACE(base_dna, 'papi', 'mi love'),
    base_dna = REPLACE(base_dna, 'mi amor', 'mi heartbeat')
WHERE syndicate_zone = 'caribbean_hub';

-- 5. Final Fallback: Set Neutral for all remaining
UPDATE public.personas SET syndicate_zone = 'vibe_check' WHERE syndicate_zone IS NULL;
UPDATE public.personas SET skin_tone = 'warm' WHERE skin_tone IS NULL;
