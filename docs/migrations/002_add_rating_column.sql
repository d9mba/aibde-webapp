-- Migration: Rename premium to back_links and add rating column
-- Description: 
--   1. Renames 'premium' column to 'back_links' for clarity
--   2. Adds 'rating' column (0-5 scale) for admin-set tool ratings
-- Run this in Supabase SQL Editor

-- Step 1: Rename premium column to back_links
ALTER TABLE public.tools 
RENAME COLUMN premium TO back_links;

-- Step 2: Update column comment
COMMENT ON COLUMN public.tools.back_links IS 'Enable dofollow SEO backlinks and direct website links (no UTM params)';

-- Step 3: Add rating column (nullable, decimal for partial ratings like 4.5)
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS rating numeric(2,1) NULL DEFAULT NULL;

-- Step 4: Add check constraint for valid rating range (0 to 5)
ALTER TABLE public.tools 
ADD CONSTRAINT chk_rating_range CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Step 5: Create index for rating-based queries
CREATE INDEX IF NOT EXISTS idx_tools_rating ON public.tools USING btree (rating DESC NULLS LAST) TABLESPACE pg_default;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN public.tools.rating IS 'Admin-set tool rating (0-5 scale, e.g., 4.5). Displayed on tool pages.';
