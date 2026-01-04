/**
 * Supabase Storage Utility Module
 * Manages guild configurations and ticket data in Supabase database
 * Provides functions to load, save, update, and delete configurations and tickets
 * Handles data transformation between database format and application format
 * Ensures robust error handling and logging for database operations
 *
 * @author nayandas69
 * @version 1.0.0
 */

import { supabase, withRetry } from "./supabase.js"
import log from "./log.js"

/**
 * Load guild configuration from database
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object|null>} Guild configuration or null if not found
 */
export async function loadGuildConfig(guildId) {
    try {
        // Validate input
        if (!guildId || typeof guildId !== "string") {
            log.warn("Invalid guildId provided to loadGuildConfig")
            return null
        }

        const operation = async () => {
            const { data, error } = await supabase.from("guild_configs").select("*").eq("guild_id", guildId).maybeSingle()

            if (error) throw error
            return data
        }

        const config = await withRetry(operation, `Load guild config for ${guildId}`)

        if (config) {
            // Transform to application format
            return {
                guildId: config.guild_id,
                ticketSystem: {
                    panelChannelId: config.panel_channel_id,
                    panelMessageId: config.panel_message_id,
                    categoryId: config.category_id,
                    staffRoleIds: config.staff_role_ids || [],
                    transcriptChannelId: config.transcript_channel_id,
                    embedColor: config.embed_color,
                    enabled: config.enabled,
                },
                lastUpdated: config.last_updated,
            }
        }

        return null
    } catch (error) {
        log.error(`Failed to load config for guild ${guildId}`, error)
        return null
    }
}

/**
 * Save guild configuration to database
 * Creates new record or updates existing one
 *
 * @param {string} guildId - Discord guild ID
 * @param {Object} config - Guild configuration object
 * @returns {Promise<boolean>} Success status
 */
export async function saveGuildConfig(guildId, config) {
    try {
        // Validate inputs
        if (!guildId || typeof guildId !== "string") {
            log.warn("Invalid guildId provided to saveGuildConfig")
            return false
        }

        if (!config || typeof config !== "object") {
            log.warn("Invalid config provided to saveGuildConfig")
            return false
        }

        const ticketSystem = config.ticketSystem || {}

        // Prepare database record
        const dbRecord = {
            guild_id: guildId,
            panel_channel_id: ticketSystem.panelChannelId || null,
            panel_message_id: ticketSystem.panelMessageId || null,
            category_id: ticketSystem.categoryId || null,
            staff_role_ids: ticketSystem.staffRoleIds || [],
            transcript_channel_id: ticketSystem.transcriptChannelId || null,
            embed_color: ticketSystem.embedColor || "#5865F2",
            enabled: ticketSystem.enabled !== undefined ? ticketSystem.enabled : true,
            last_updated: new Date().toISOString(),
        }

        const operation = async () => {
            // Use upsert to insert or update
            const { error } = await supabase.from("guild_configs").upsert(dbRecord, {
                onConflict: "guild_id",
                ignoreDuplicates: false,
            })

            if (error) throw error
        }

        await withRetry(operation, `Save guild config for ${guildId}`)
        return true
    } catch (error) {
        log.error(`Failed to save config for guild ${guildId}`, error)
        return false
    }
}

/**
 * Get ticket configuration for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object|null>} Ticket configuration
 */
export async function getTicketConfig(guildId) {
    const config = await loadGuildConfig(guildId)
    return config?.ticketSystem || null
}

/**
 * Save ticket configuration for a guild
 * @param {string} guildId - Discord guild ID
 * @param {Object} ticketConfig - Ticket system configuration
 * @returns {Promise<boolean>} Success status
 */
export async function saveTicketConfig(guildId, ticketConfig) {
    const config = (await loadGuildConfig(guildId)) || {}
    config.ticketSystem = ticketConfig
    return await saveGuildConfig(guildId, config)
}

/**
 * Create a new ticket record in database
 * @param {string} guildId - Discord guild ID
 * @param {Object} ticketData - Ticket information
 * @returns {Promise<boolean>} Success status
 */
export async function createTicket(guildId, ticketData) {
    try {
        // Validate inputs
        if (!guildId || !ticketData || !ticketData.id) {
            log.warn("Invalid data provided to createTicket")
            return false
        }

        // Prepare database record
        const dbRecord = {
            id: ticketData.id,
            ticket_number: ticketData.ticketNumber,
            guild_id: guildId,
            channel_id: ticketData.channelId,
            user_id: ticketData.userId,
            claimed_by: ticketData.claimedBy || null,
            status: ticketData.status || "open",
            created_at: ticketData.createdAt ? new Date(ticketData.createdAt).toISOString() : new Date().toISOString(),
            closed_at: ticketData.closedAt ? new Date(ticketData.closedAt).toISOString() : null,
        }

        const operation = async () => {
            const { error } = await supabase.from("tickets").insert(dbRecord)

            if (error) throw error
        }

        await withRetry(operation, `Create ticket ${ticketData.id}`)
        return true
    } catch (error) {
        log.error(`Failed to create ticket for guild ${guildId}`, error)
        return false
    }
}

/**
 * Get specific ticket by ID
 * @param {string} guildId - Discord guild ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object|null>} Ticket data
 */
export async function getTicket(guildId, ticketId) {
    try {
        // Validate inputs
        if (!guildId || !ticketId) {
            log.warn("Invalid parameters provided to getTicket")
            return null
        }

        const operation = async () => {
            const { data, error } = await supabase
                .from("tickets")
                .select("*")
                .eq("guild_id", guildId)
                .eq("id", ticketId)
                .maybeSingle()

            if (error) throw error
            return data
        }

        const ticket = await withRetry(operation, `Get ticket ${ticketId}`)

        if (ticket) {
            // Transform to application format
            return {
                id: ticket.id,
                ticketNumber: ticket.ticket_number,
                guildId: ticket.guild_id,
                channelId: ticket.channel_id,
                userId: ticket.user_id,
                claimedBy: ticket.claimed_by,
                status: ticket.status,
                createdAt: new Date(ticket.created_at).getTime(),
                closedAt: ticket.closed_at ? new Date(ticket.closed_at).getTime() : null,
            }
        }

        return null
    } catch (error) {
        log.error(`Failed to get ticket ${ticketId}`, error)
        return null
    }
}

/**
 * Update ticket data
 * @param {string} guildId - Discord guild ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateTicket(guildId, ticketId, updates) {
    try {
        // Validate inputs
        if (!guildId || !ticketId || !updates) {
            log.warn("Invalid parameters provided to updateTicket")
            return false
        }

        // Transform updates to database format
        const dbUpdates = {}

        if (updates.claimedBy !== undefined) dbUpdates.claimed_by = updates.claimedBy
        if (updates.status !== undefined) dbUpdates.status = updates.status
        if (updates.closedAt !== undefined) {
            dbUpdates.closed_at = updates.closedAt ? new Date(updates.closedAt).toISOString() : null
        }

        const operation = async () => {
            const { error } = await supabase.from("tickets").update(dbUpdates).eq("guild_id", guildId).eq("id", ticketId)

            if (error) throw error
        }

        await withRetry(operation, `Update ticket ${ticketId}`)
        return true
    } catch (error) {
        log.error(`Failed to update ticket ${ticketId}`, error)
        return false
    }
}

/**
 * Close ticket and mark as closed
 * @param {string} guildId - Discord guild ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<boolean>} Success status
 */
export async function closeTicket(guildId, ticketId) {
    return await updateTicket(guildId, ticketId, {
        status: "closed",
        closedAt: Date.now(),
    })
}

/**
 * Get all active tickets for a user
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @returns {Promise<Array>} Array of active tickets
 */
export async function getActiveTickets(guildId, userId) {
    try {
        // Validate inputs
        if (!guildId || !userId) {
            log.warn("Invalid parameters provided to getActiveTickets")
            return []
        }

        const operation = async () => {
            const { data, error } = await supabase
                .from("tickets")
                .select("*")
                .eq("guild_id", guildId)
                .eq("user_id", userId)
                .neq("status", "closed")
                .order("created_at", { ascending: false })

            if (error) throw error
            return data || []
        }

        const tickets = await withRetry(operation, `Get active tickets for user ${userId}`)

        // Transform to application format
        return tickets.map((ticket) => ({
            id: ticket.id,
            ticketNumber: ticket.ticket_number,
            guildId: ticket.guild_id,
            channelId: ticket.channel_id,
            userId: ticket.user_id,
            claimedBy: ticket.claimed_by,
            status: ticket.status,
            createdAt: new Date(ticket.created_at).getTime(),
            closedAt: ticket.closed_at ? new Date(ticket.closed_at).getTime() : null,
        }))
    } catch (error) {
        log.error(`Failed to get active tickets for user ${userId}`, error)
        return []
    }
}

/**
 * Remove ticket system configuration
 * Deletes ticket panel and clears all settings
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeTicketConfig(guildId) {
    try {
        // Validate input
        if (!guildId) {
            log.warn("Invalid guildId provided to removeTicketConfig")
            return false
        }

        const operation = async () => {
            // Delete the guild config (CASCADE will delete related tickets)
            const { error } = await supabase.from("guild_configs").delete().eq("guild_id", guildId)

            if (error) throw error
        }

        await withRetry(operation, `Remove ticket config for ${guildId}`)
        return true
    } catch (error) {
        log.error(`Failed to remove config for guild ${guildId}`, error)
        return false
    }
}

/**
 * Delete all tickets for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteAllTickets(guildId) {
    try {
        // Validate input
        if (!guildId) {
            log.warn("Invalid guildId provided to deleteAllTickets")
            return false
        }

        const operation = async () => {
            const { error } = await supabase.from("tickets").delete().eq("guild_id", guildId)

            if (error) throw error
        }

        await withRetry(operation, `Delete all tickets for ${guildId}`)
        return true
    } catch (error) {
        log.error(`Failed to delete tickets for guild ${guildId}`, error)
        return false
    }
}

/**
 * Get all tickets for a guild (for admin/debugging)
 * @param {string} guildId - Discord guild ID
 * @param {number} limit - Maximum number of tickets to return
 * @returns {Promise<Array>} Array of tickets
 */
export async function getAllTickets(guildId, limit = 100) {
    try {
        if (!guildId) {
            log.warn("Invalid guildId provided to getAllTickets")
            return []
        }

        const operation = async () => {
            const { data, error } = await supabase
                .from("tickets")
                .select("*")
                .eq("guild_id", guildId)
                .order("created_at", { ascending: false })
                .limit(limit)

            if (error) throw error
            return data || []
        }

        const tickets = await withRetry(operation, `Get all tickets for ${guildId}`)

        return tickets.map((ticket) => ({
            id: ticket.id,
            ticketNumber: ticket.ticket_number,
            guildId: ticket.guild_id,
            channelId: ticket.channel_id,
            userId: ticket.user_id,
            claimedBy: ticket.claimed_by,
            status: ticket.status,
            createdAt: new Date(ticket.created_at).getTime(),
            closedAt: ticket.closed_at ? new Date(ticket.closed_at).getTime() : null,
        }))
    } catch (error) {
        log.error(`Failed to get all tickets for guild ${guildId}`, error)
        return []
    }
}

/**
 * Save ticket message for transcript
 * Optional: Use if you want to store message history in database
 *
 * @param {string} ticketId - Ticket ID
 * @param {Object} messageData - Message information
 * @returns {Promise<boolean>} Success status
 */
export async function saveTicketMessage(ticketId, messageData) {
    try {
        if (!ticketId || !messageData) {
            log.warn("Invalid parameters provided to saveTicketMessage")
            return false
        }

        const dbRecord = {
            ticket_id: ticketId,
            message_id: messageData.messageId,
            user_id: messageData.userId,
            username: messageData.username,
            content: messageData.content || "",
            created_at: messageData.createdAt ? new Date(messageData.createdAt).toISOString() : new Date().toISOString(),
        }

        const operation = async () => {
            const { error } = await supabase.from("ticket_messages").insert(dbRecord)

            if (error) throw error
        }

        await withRetry(operation, `Save message for ticket ${ticketId}`)
        return true
    } catch (error) {
        log.error(`Failed to save message for ticket ${ticketId}`, error)
        return false
    }
}

/**
 * Get ticket messages for transcript
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Array>} Array of messages
 */
export async function getTicketMessages(ticketId) {
    try {
        if (!ticketId) {
            log.warn("Invalid ticketId provided to getTicketMessages")
            return []
        }

        const operation = async () => {
            const { data, error } = await supabase
                .from("ticket_messages")
                .select("*")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true })

            if (error) throw error
            return data || []
        }

        const messages = await withRetry(operation, `Get messages for ticket ${ticketId}`)

        return messages.map((msg) => ({
            messageId: msg.message_id,
            userId: msg.user_id,
            username: msg.username,
            content: msg.content,
            createdAt: new Date(msg.created_at).getTime(),
        }))
    } catch (error) {
        log.error(`Failed to get messages for ticket ${ticketId}`, error)
        return []
    }
}
