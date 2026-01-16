-- Migration: Add user_invitation to token_type enum
-- This enables invitation tokens for admin and enterprise user invitations

ALTER TYPE token_type ADD VALUE IF NOT EXISTS 'user_invitation';
