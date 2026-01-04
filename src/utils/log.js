/**
 * Modern colorful logging utility for console output
 * Provides color-coded messages for different log levels
 */

/**
 * ANSI color codes for terminal output
 * Uses modern vibrant colors for better visibility
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Status colors
  success: "\x1b[38;5;46m", // Bright green
  error: "\x1b[38;5;196m", // Bright red
  warn: "\x1b[38;5;226m", // Bright yellow
  info: "\x1b[38;5;51m", // Bright cyan
  system: "\x1b[38;5;141m", // Bright purple/magenta
  command: "\x1b[38;5;33m", // Bright blue

  // Text colors
  gray: "\x1b[38;5;240m",
  white: "\x1b[37m",
}

/**
 * Format timestamp for log messages
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  const now = new Date()
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

/**
 * Create formatted log message with color and timestamp
 * @param {string} level - Log level name
 * @param {string} color - ANSI color code
 * @param {string} message - Log message
 * @returns {string} Formatted log string
 */
function formatLog(level, color, message) {
  const timestamp = `${colors.gray}[${getTimestamp()}]${colors.reset}`
  const levelTag = `${color}[${level}]${colors.reset}`
  return `${timestamp} ${levelTag} ${message}`
}

/**
 * Logger object with colored output methods
 */
const log = {
  /**
   * Success messages - everything working correctly
   * Color: Bright Green
   */
  success: (message) => {
    console.log(formatLog("SUCCESS", colors.success, `${colors.success}${message}${colors.reset}`))
  },

  /**
   * Error messages - something went wrong
   * Color: Bright Red
   */
  error: (message, error = null) => {
    console.error(formatLog("ERROR", colors.error, `${colors.error}${message}${colors.reset}`))
    if (error) {
      console.error(`${colors.error}${error.stack || error}${colors.reset}`)
    }
  },

  /**
   * Warning messages - potential issues
   * Color: Bright Yellow
   */
  warn: (message) => {
    console.warn(formatLog("WARNING", colors.warn, `${colors.warn}${message}${colors.reset}`))
  },

  /**
   * Info messages - general information
   * Color: Bright Cyan
   */
  info: (message) => {
    console.log(formatLog("INFO", colors.info, `${colors.info}${message}${colors.reset}`))
  },

  /**
   * System messages - bot operations and lifecycle events
   * Color: Bright Purple/Magenta
   */
  system: (message) => {
    console.log(formatLog("SYSTEM", colors.system, `${colors.system}${message}${colors.reset}`))
  },

  /**
   * Command execution messages
   * Color: Bright Blue
   */
  command: (message) => {
    console.log(formatLog("COMMAND", colors.command, `${colors.command}${message}${colors.reset}`))
  },
}

export default log
