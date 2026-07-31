-- Indexes for the server side Browse Items search (GET /api/items).

-- Every browse query filters on archived and then orders by created_at or title.
CREATE INDEX IF NOT EXISTS idx_items_archived_created_at ON items (archived, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_archived_category ON items (archived, category_id);
CREATE INDEX IF NOT EXISTS idx_items_archived_condition ON items (archived, condition);

-- The distance filter narrows users by a bounding box before the haversine runs.
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON users (latitude, longitude);

-- Trigram indexes make the lower(...) LIKE '%term%' search indexable instead of a
-- full scan. pg_trgm needs privileges some managed databases withhold, so the whole
-- block is optional and the search stays correct without it, just slower.
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    CREATE INDEX IF NOT EXISTS idx_items_title_trgm
        ON items USING gin (lower(title) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_items_description_trgm
        ON items USING gin (lower(description) gin_trgm_ops);
EXCEPTION
    WHEN insufficient_privilege OR undefined_file OR feature_not_supported THEN
        RAISE NOTICE 'pg_trgm not available, skipping trigram indexes for item search';
END
$$;
