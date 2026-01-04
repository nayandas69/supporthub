/**
 * Row Level Security (RLS) Configuration
 * Protects your data from unauthorized access
 * Recommended for production deployments
 * 
 * @author nayandas69
 * @version 1.0.0
 */

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE guild_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES
-- Bot service role has full access to all tables
-- ============================================

-- Policy for guild_configs
DROP POLICY IF EXISTS "Service role has full access to guild_configs" ON guild_configs;
CREATE POLICY "Service role has full access to guild_configs"
  ON guild_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for tickets
DROP POLICY IF EXISTS "Service role has full access to tickets" ON tickets;
CREATE POLICY "Service role has full access to tickets"
  ON tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for ticket_messages
DROP POLICY IF EXISTS "Service role has full access to ticket_messages" ON ticket_messages;
CREATE POLICY "Service role has full access to ticket_messages"
  ON ticket_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Row Level Security enabled successfully!';
  RAISE NOTICE 'All tables are now protected with RLS policies';
  RAISE NOTICE 'Service role has full access to perform bot operations';
END $$;
