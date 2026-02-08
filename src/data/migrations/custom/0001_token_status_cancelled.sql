-- Add 'cancelled' value to token_status enum
-- This status is used when an elevated user cancels an invitation

ALTER TYPE token_status ADD VALUE IF NOT EXISTS 'cancelled';
