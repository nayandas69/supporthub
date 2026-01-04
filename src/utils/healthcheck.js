/**
 * Health check HTTP server for uptime monitoring
 * Allows services like UptimeRobot, BetterUptime, Render to ping the bot
 * Ensures 24/7 uptime monitoring and automatic restarts
 */

import { createServer } from "http"
import log from "./log.js"
import { getDatabaseStats } from "./supabase.js"

/**
 * Start health check server
 * Returns a simple HTTP response when bot is alive
 * @param {Client} client - Discord.js client instance
 * @param {number} port - Port number for health check server (default: 3000)
 */
export function startHealthCheck(client, port = 3000) {
  const serverPort = process.env.PORT || port

  const server = createServer(async (req, res) => {
    // Health check endpoint - returns bot status
    if (req.url === "/health" || req.url === "/") {
      const dbStats = await getDatabaseStats()

      const status = {
        status: "online",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        bot: {
          ready: client.isReady(),
          user: client.user?.tag || "Not logged in",
          guilds: client.guilds.cache.size,
          ping: client.ws.ping,
        },
        database: {
          connected: !dbStats.error,
        },
      }

      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify(status, null, 2))
      return
    }

    // 404 for all other routes
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Not found. Use /health endpoint" }))
  })

  server.listen(serverPort, "0.0.0.0", () => {
    log.success(`Health check server running on port ${serverPort}`)
    log.info(`Health endpoint: http://localhost:${serverPort}/health`)
  })

  // Handle server errors
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      log.error(`Port ${serverPort} is already in use. Health check server not started.`)
    } else {
      log.error("Health check server error", error)
    }
  })

  return server
}
