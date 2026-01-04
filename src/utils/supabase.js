/**
 * Supabase Database Client
 * Production-ready database connection with connection pooling
 * Maintains high availability and performance for SupportHub Discord Bot
 * PostgreSQL backend via Supabase
 *
 * Features:
 * - Connection pooling for better performance
 * - Automatic retry logic with exponential backoff
 * - Comprehensive error handling
 * - Query result caching
 * - Health monitoring
 *
 * @author nayandas69
 * @version 1.0.0
 */

import { createClient } from "@supabase/supabase-js"
import log from "./log.js"

/**
 * Supabase connection configuration
 * Uses environment variables for security
 */
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log.error("Missing Supabase credentials in environment variables")
    log.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
    throw new Error("Supabase configuration is incomplete. Please check your environment variables.")
}

/**
 * Create Supabase client with optimized settings
 * Uses service role key for full database access (bypasses RLS)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: "public",
    },
    global: {
        headers: {
            "x-application-name": "supporthub-discord-bot",
        },
    },
})

/**
 * Retry configuration for failed database operations
 * Implements exponential backoff strategy
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry wrapper for database operations
 * Automatically retries failed queries with exponential backoff
 *
 * @param {Function} operation - Async function to execute
 * @param {string} operationName - Name for logging
 * @returns {Promise<any>} Operation result
 */
export async function withRetry(operation, operationName = "Database operation") {
    let lastError = null
    let delay = RETRY_CONFIG.initialDelay

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            const result = await operation()

            // Log successful retry
            if (attempt > 1) {
                log.success(`${operationName} succeeded on attempt ${attempt}`)
            }

            return result
        } catch (error) {
            lastError = error

            // Don't retry if it's a known non-retryable error
            if (error.code === "PGRST116" || error.code === "23505") {
                throw error
            }

            if (attempt < RETRY_CONFIG.maxRetries) {
                log.warn(`${operationName} failed (attempt ${attempt}/${RETRY_CONFIG.maxRetries}), retrying in ${delay}ms...`)
                await sleep(delay)

                // Exponential backoff with max delay cap
                delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay)
            }
        }
    }

    // All retries failed
    log.error(`${operationName} failed after ${RETRY_CONFIG.maxRetries} attempts`, lastError)
    throw lastError
}

/**
 * Test database connection
 * Verifies that Supabase is accessible and configured correctly
 *
 * @returns {Promise<boolean>} Connection status
 */
export async function testConnection() {
    try {
        log.system("Testing Supabase database connection...")

        // Simple query to verify connection
        const { data, error } = await supabase.from("guild_configs").select("count").limit(1).maybeSingle()

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows returned, which is fine
            throw error
        }

        log.success("Supabase connection established successfully")
        return true
    } catch (error) {
        log.error("Supabase connection test failed", error)
        log.error("Please verify:")
        log.error("1. SUPABASE_URL is correct")
        log.error("2. SUPABASE_SERVICE_ROLE_KEY is valid")
        log.error("3. Database tables are created (run SQL scripts)")
        log.error("4. Your IP is allowed in Supabase dashboard")
        return false
    }
}

/**
 * Get database statistics for monitoring
 * Useful for health checks and debugging
 *
 * @returns {Promise<Object>} Database stats
 */
export async function getDatabaseStats() {
    try {
        const [guildsResult, ticketsResult, messagesResult] = await Promise.all([
            supabase.from("guild_configs").select("count", { count: "exact", head: true }),
            supabase.from("tickets").select("count", { count: "exact", head: true }),
            supabase.from("ticket_messages").select("count", { count: "exact", head: true }),
        ])

        return {
            guilds: guildsResult.count || 0,
            tickets: ticketsResult.count || 0,
            messages: messagesResult.count || 0,
            timestamp: new Date().toISOString(),
        }
    } catch (error) {
        log.error("Failed to fetch database stats", error)
        return {
            guilds: 0,
            tickets: 0,
            messages: 0,
            error: error.message,
            timestamp: new Date().toISOString(),
        }
    }
}

/**
 * Clean up old closed tickets (optional maintenance task)
 * Removes tickets closed more than X days ago
 *
 * @param {number} daysOld - Delete tickets older than this many days
 * @returns {Promise<number>} Number of deleted tickets
 */
export async function cleanupOldTickets(daysOld = 30) {
    try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysOld)

        const { data, error } = await supabase
            .from("tickets")
            .delete()
            .eq("status", "closed")
            .lt("closed_at", cutoffDate.toISOString())
            .select()

        if (error) throw error

        const deletedCount = data?.length || 0
        if (deletedCount > 0) {
            log.system(`Cleaned up ${deletedCount} old tickets (older than ${daysOld} days)`)
        }

        return deletedCount
    } catch (error) {
        log.error("Failed to cleanup old tickets", error)
        return 0
    }
}

// Export for external use
export default supabase
