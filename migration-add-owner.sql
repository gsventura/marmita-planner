-- Migration to add owner column to recipes table
-- Run this in Supabase SQL Editor

-- Add owner column to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS owner TEXT NOT NULL DEFAULT 'Gustavo' CHECK (owner IN ('Luiza', 'Gustavo'));

-- Update any existing recipes to have the default owner
UPDATE recipes SET owner = 'Gustavo' WHERE owner IS NULL;

-- Verify the migration
SELECT id, name, owner FROM recipes LIMIT 10;
