-- Add template_type field to diaries table
-- This supports the reflection template selection feature (Issue #161)

-- Add the template_type column to the diaries table
ALTER TABLE diaries 
ADD COLUMN template_type varchar(50) DEFAULT 'free' NOT NULL;

-- Add check constraint to ensure only valid template types
ALTER TABLE diaries 
ADD CONSTRAINT check_template_type 
CHECK (template_type IN ('free', 'reflection', 'mood'));

-- Add comment for documentation
COMMENT ON COLUMN diaries.template_type IS 'Type of reflection template used: free (default), reflection (3 questions), mood (mood-focused)';

-- Create index for potential filtering by template type
CREATE INDEX idx_diaries_template_type ON diaries(template_type);

-- Update RLS policy if needed (ensuring users can only see their own diaries)
-- The existing RLS policies should automatically apply to the new column