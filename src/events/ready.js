/**
 * Ready event - fires when bot successfully connects to Discord
 * Sets up bot status and confirms all systems operational
 * @module events/ready
 */

import log from "../utils/log.js"
import { setDefaultActivity } from "../utils/activityManager.js"

export const name = "ready"
export const once = true

/**
 * Execute ready event
 * @param {Client} client - Discord client instance
 */
export async function execute(client) {
  log.success(`Bot logged in as ${client.user.tag}`)
  log.info(`Connected to ${client.guilds.cache.size} servers`)
  log.info(`Serving ${client.users.cache.size} users`)

  setDefaultActivity(client)

  log.system("SupportHub is ready and operational")
  log.system("Slash commands have been deployed globally")
}
