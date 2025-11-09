-- Add auto_top_up column to loan_positions table
ALTER TABLE loan_positions 
ADD COLUMN auto_top_up BOOLEAN DEFAULT false;

-- Add a comment to document the column
COMMENT ON COLUMN loan_positions.auto_top_up IS 
  'Indicates if automatic top-up is enabled to maintain health factor above 1.5';