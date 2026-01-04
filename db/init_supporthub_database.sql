/**
 * SupportHub Database Schema - Initial Setup
 * Creates all necessary tables for Supabase storage
 * Run this script first to initialize your database
 * 
 * @author nayandas69
 * @version 1.0.0
 */

-- ============================================
-- TABLE: guild_configs
-- Stores per-server ticket system configuration
-- ============================================
CREATE TABLE IF NOT EXISTS guild_configs (
  -- Primary identifier
  guild_id TEXT PRIMARY KEY,
  
  -- Ticket panel configuration
  panel_channel_id TEXT,
  panel_message_id TEXT,
  category_id TEXT NOT NULL,
  
  -- Staff configuration
  staff_role_ids TEXT[] DEFAULT '{}',
  
  -- Optional features
  transcript_channel_id TEXT,
  embed_color TEXT DEFAULT '#5865F2',
  
  -- System status
  enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guild_configs_enabled 
  ON guild_configs(enabled) 
  WHERE enabled = true;

-- ============================================
-- TABLE: tickets
-- Stores all ticket records with full history
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  -- Primary identifier (format: ticket-{userId}-{timestamp})
  id TEXT PRIMARY KEY,
  
  -- Ticket number (4-digit random number for display)
  ticket_number INTEGER NOT NULL,
  
  -- Guild and channel information
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  
  -- User information
  user_id TEXT NOT NULL,
  claimed_by TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'closed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Foreign key to guild configuration
  CONSTRAINT fk_guild
    FOREIGN KEY (guild_id) 
    REFERENCES guild_configs(guild_id)
    ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_guild_id 
  ON tickets(guild_id);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id 
  ON tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status 
  ON tickets(status) 
  WHERE status != 'closed';

CREATE INDEX IF NOT EXISTS idx_tickets_channel_id 
  ON tickets(channel_id);

-- Composite index for active tickets by user
CREATE INDEX IF NOT EXISTS idx_tickets_user_active 
  ON tickets(guild_id, user_id, status) 
  WHERE status != 'closed';

-- ============================================
-- TABLE: ticket_messages
-- Stores ticket message history for transcripts
-- Optional: Enable if you want full message logging
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  -- Auto-incrementing ID
  id BIGSERIAL PRIMARY KEY,
  
  -- Ticket reference
  ticket_id TEXT NOT NULL,
  
  -- Message data
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  content TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to ticket
  CONSTRAINT fk_ticket
    FOREIGN KEY (ticket_id) 
    REFERENCES tickets(id)
    ON DELETE CASCADE
);

-- Index for fetching messages by ticket
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id 
  ON ticket_messages(ticket_id, created_at);

-- ============================================
-- FUNCTION: update_last_updated_timestamp
-- Automatically updates last_updated field
-- ============================================
CREATE OR REPLACE FUNCTION update_last_updated_timestamp()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for guild_configs table
DROP TRIGGER IF EXISTS trigger_update_guild_configs_timestamp ON guild_configs;
CREATE TRIGGER trigger_update_guild_configs_timestamp
  BEFORE UPDATE ON guild_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_timestamp();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'SupportHub database schema created successfully!';
  RAISE NOTICE 'Tables created: guild_configs, tickets, ticket_messages';
  RAISE NOTICE 'Ready to use with Discord bot';
END $$;
