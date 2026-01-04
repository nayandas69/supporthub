/**
 * Configuration module for SupportHub bot
 * Handles environment variables and bot settings
 * @module config/config
 */

import { config as dotenvConfig } from "dotenv"

// Load environment variables from .env file silently without debug output
dotenvConfig({ debug: false, silent: true })

/**
 * Bot configuration object
 * All sensitive data comes from environment variables
 */
export const config = {
  // Bot token from Discord Developer Portal
  token: process.env.DISCORD_TOKEN,

  // Bot client ID (application ID)
  clientId: process.env.CLIENT_ID,

  // Environment mode (development or production)
  environment: process.env.NODE_ENV || "production",

  // Health check server port (for uptime monitoring services)
  healthCheckPort: process.env.PORT || process.env.HEALTH_CHECK_PORT || 3000,

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
}

/**
 * Validate required configuration
 * Ensures all necessary environment variables are present
 */
export function validateConfig() {
  const required = ["DISCORD_TOKEN", "CLIENT_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
  const missing = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Please create a .env file with these variables.\n\n" +
      "Required variables:\n" +
      "- DISCORD_TOKEN: Your Discord bot token\n" +
      "- CLIENT_ID: Your Discord application ID\n" +
      "- SUPABASE_URL: Your Supabase project URL\n" +
      "- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key\n" +
      "- PORT: (optional) Health check server port",
    )
  }

  return true
}

// Validate on module load
validateConfig()
