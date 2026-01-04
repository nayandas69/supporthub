/**
 * Activity Manager - Handles dynamic bot presence/status updates
 * Temporarily changes bot activity when tickets are created, claimed, or closed
 * Automatically reverts to default status after a timeout
 * This module helps enhance user engagement by reflecting real-time actions
 * taken within the support ticket system.
 * @author nayandas69
 * @version 1.0.0
 */

import { ActivityType } from "discord.js"
import log from "./log.js"

// Store default activity configuration
const DEFAULT_ACTIVITY = {
    name: "Support Hub | /setup",
    type: ActivityType.Playing,
}

// Store timeout reference for activity reset
let activityResetTimeout = null

/**
 * Set bot presence to default activity
 * @param {Client} client - Discord client instance
 */
export function setDefaultActivity(client) {
    try {
        if (!client || !client.user) {
            log.warn("Cannot set default activity - client or user not available")
            return
        }

        client.user.setPresence({
            activities: [DEFAULT_ACTIVITY],
            status: "online",
        })

        log.info("Bot activity reset to default")
    } catch (error) {
        log.error("Failed to set default activity", error)
    }
}

/**
 * Set temporary activity status with automatic reset
 * @param {Client} client - Discord client instance
 * @param {string} activityName - Activity text to display
 * @param {ActivityType} activityType - Type of activity (Playing, Watching, etc.)
 * @param {number} duration - How long to show temporary status (milliseconds)
 */
export function setTemporaryActivity(client, activityName, activityType = ActivityType.Playing, duration = 10000) {
    try {
        if (!client || !client.user) {
            log.warn("Cannot set temporary activity - client or user not available")
            return
        }

        // Clear any existing timeout to prevent multiple resets
        if (activityResetTimeout) {
            clearTimeout(activityResetTimeout)
            activityResetTimeout = null
        }

        // Set temporary activity
        client.user.setPresence({
            activities: [
                {
                    name: activityName,
                    type: activityType,
                },
            ],
            status: "online",
        })

        log.info(`Temporary activity set: ${activityName}`)

        // Schedule reset to default activity
        activityResetTimeout = setTimeout(() => {
            setDefaultActivity(client)
            activityResetTimeout = null
        }, duration)
    } catch (error) {
        log.error("Failed to set temporary activity", error)
    }
}

/**
 * Show activity when user creates a ticket
 * @param {Client} client - Discord client instance
 * @param {string} username - Username of ticket creator
 */
export function showTicketCreatingActivity(client, username) {
    const activityName = `Creating ticket for ${username}`
    setTemporaryActivity(client, activityName, ActivityType.Playing, 8000)
}

/**
 * Show activity when staff claims a ticket
 * @param {Client} client - Discord client instance
 * @param {string} staffUsername - Username of staff member
 * @param {number} ticketNumber - Ticket number being claimed
 */
export function showTicketClaimActivity(client, staffUsername, ticketNumber) {
    const activityName = `${staffUsername} claimed ticket #${ticketNumber}`
    setTemporaryActivity(client, activityName, ActivityType.Watching, 8000)
}

/**
 * Show activity when ticket is closed
 * @param {Client} client - Discord client instance
 * @param {string} closerUsername - Username who closed the ticket
 * @param {number} ticketNumber - Ticket number being closed
 */
export function showTicketClosingActivity(client, closerUsername, ticketNumber) {
    const activityName = `${closerUsername} closed ticket #${ticketNumber}`
    setTemporaryActivity(client, activityName, ActivityType.Watching, 8000)
}

/**
 * Cancel any pending activity reset
 * Useful when bot is shutting down
 */
export function cancelActivityReset() {
    if (activityResetTimeout) {
        clearTimeout(activityResetTimeout)
        activityResetTimeout = null
        log.info("Activity reset cancelled")
    }
}
