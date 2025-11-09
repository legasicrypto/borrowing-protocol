-- Rename borrowed_eur column to borrowed_usdc to reflect USDC-only borrowing
ALTER TABLE loan_positions 
RENAME COLUMN borrowed_eur TO borrowed_usdc;

-- Update the comment for clarity
COMMENT ON COLUMN loan_positions.borrowed_usdc IS 'Amount borrowed in USDC';