/**
 * SupportHub - A Discord Ticket System Bot
 * Multi-server support with modern slash commands and colorful logging
 * Automatically loads saved data on restart for crash recovery
 * Dynamic activity status updates to reflect ticket actions
 * Comprehensive error handling and logging for easy debugging
 * Modular command and event handling for scalability
 * Built with Discord.js v14 and Supabase for reliable data storage
 * Designed to enhance community support experiences on Discord
 * @author nayandas69
 * @version 1.0.0
 */

import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js"
import { readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import log from "./utils/log.js"
import { config } from "./config/config.js"
import { startHealthCheck } from "./utils/healthcheck.js"
import { testConnection, getDatabaseStats } from "./utils/supabase.js"
import { cancelActivityReset } from "./utils/activityManager.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  rest: { version: "10" }, // Suppress internal Discord.js deprecation warnings
})

// Initialize commands collection
client.commands = new Collection()

/**
 * Load all command files from commands directory
 * Automatically registers slash commands without manual deployment
 */
async function loadCommands() {
  try {
    const commandsPath = join(__dirname, "commands")
    const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

    log.info(`Loading ${commandFiles.length} command files...`)

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file)
      const command = await import(`file://${filePath}`)

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command)
        log.success(`Loaded command: ${command.data.name}`)
      } else {
        log.warn(`Command at ${file} is missing required "data" or "execute" property`)
      }
    }

    log.success(`Successfully loaded ${client.commands.size} commands`)
  } catch (error) {
    log.error("Failed to load commands", error)
    process.exit(1)
  }
}

/**
 * Load all event handlers from events directory
 * Handles bot lifecycle events and interactions
 */
async function loadEvents() {
  try {
    const eventsPath = join(__dirname, "events")
    const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith(".js"))

    log.info(`Loading ${eventFiles.length} event files...`)

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file)
      const event = await import(`file://${filePath}`)

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client))
      } else {
        client.on(event.name, (...args) => event.execute(...args, client))
      }

      log.success(`Loaded event: ${event.name}`)
    }

    log.success(`Successfully loaded ${eventFiles.length} events`)
  } catch (error) {
    log.error("Failed to load events", error)
    process.exit(1)
  }
}

/**
 * Auto-deploy slash commands to Discord API
 * Runs automatically on bot startup - no separate deploy command needed
 */
async function deployCommands() {
  try {
    const commands = []

    for (const command of client.commands.values()) {
      commands.push(command.data.toJSON())
    }

    log.system("Deploying slash commands to Discord API...")

    const rest = new REST({ version: "10" }).setToken(config.token)

    const data = await rest.put(Routes.applicationCommands(config.clientId), { body: commands })

    log.success(`Successfully deployed ${data.length} slash commands globally`)
  } catch (error) {
    log.error("Failed to deploy commands", error)
    throw error
  }
}

/**
 * Check for existing data and log recovery info
 * Ensures data persistence after crashes/restarts
 */
async function checkDataRecovery() {
  try {
    log.info("Checking database for existing guild configurations...")

    const stats = await getDatabaseStats()

    if (stats.guilds > 0) {
      log.info(`Found ${stats.guilds} server(s) with saved configurations`)
      log.info(`Total tickets in database: ${stats.tickets}`)
      log.success("Data will be automatically loaded from Supabase")
    } else {
      log.info("No existing configurations found - database is ready for new setups")
    }
  } catch (error) {
    log.warn("Could not check database stats (this is normal for first run)", error)
  }
}

/**
 * Initialize bot - load commands, events, and deploy slash commands
 */
async function initializeBot() {
  try {
    log.system("Starting SupportHub Bot...")
    log.info("Node.js version: " + process.version)

    process.removeAllListeners("warning")
    process.on("warning", (warning) => {
      // Ignore specific deprecation warnings from Discord.js
      if (warning.name === "DeprecationWarning" && warning.message.includes("ready event")) {
        return
      }
      log.warn(warning.message)
    })

    log.system("Connecting to Supabase database...")
    const connectionSuccess = await testConnection()

    if (!connectionSuccess) {
      log.error("Failed to connect to Supabase database")
      log.error("Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
      log.error("Bot cannot start without database connection")
      process.exit(1)
    }

    // Check for existing data (crash recovery)
    await checkDataRecovery()

    // Load commands and events
    await loadCommands()
    await loadEvents()

    // Login to Discord
    await client.login(config.token)

    // Deploy commands after successful login
    await deployCommands()

    startHealthCheck(client, config.healthCheckPort)
  } catch (error) {
    log.error("Failed to initialize bot", error)
    process.exit(1)
  }
}

// Start the bot
initializeBot()

// Handle process errors gracefully
process.on("unhandledRejection", (error) => {
  log.error("Unhandled promise rejection", error)
})

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception", error)
  process.exit(1)
})

process.on("SIGINT", () => {
  log.system("Received SIGINT signal - shutting down gracefully...")
  cancelActivityReset()
  client.destroy()
  process.exit(0)
})

process.on("SIGTERM", () => {
  log.system("Received SIGTERM signal - shutting down gracefully...")
  cancelActivityReset()
  client.destroy()
  process.exit(0)
})

export default client
