/**
 * Interaction handler - processes slash commands and button interactions
 * Routes interactions to appropriate handlers
 * @module events/interactionCreate
 */

import log from "../utils/log.js"
import { handleTicketCreate, handleTicketClaim, handleTicketClose } from "../handlers/ticketHandler.js"
import { MessageFlags } from "discord.js"

export const name = "interactionCreate"

/**
 * Execute interaction event
 * @param {Interaction} interaction - Discord interaction
 * @param {Client} client - Discord client instance
 */
export async function execute(interaction, client) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName)

    if (!command) {
      log.warn(`Command not found: ${interaction.commandName}`)
      return
    }

    try {
      log.command(`${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild.name}`)
      await command.execute(interaction)
    } catch (error) {
      log.error(`Error executing command ${interaction.commandName}`, error)

      const errorMessage = {
        content: "There was an error executing this command. Please try again later.",
        flags: MessageFlags.Ephemeral,
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage)
      } else {
        await interaction.reply(errorMessage)
      }
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    try {
      const customId = interaction.customId

      if (customId === "create_ticket") {
        await handleTicketCreate(interaction)
      } else if (customId.startsWith("ticket_claim_")) {
        await handleTicketClaim(interaction)
      } else if (customId.startsWith("ticket_close_")) {
        await handleTicketClose(interaction)
      }
    } catch (error) {
      log.error("Error handling button interaction", error)

      const errorMessage = {
        content: "An error occurred while processing your request.",
        flags: MessageFlags.Ephemeral,
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage)
      } else {
        await interaction.reply(errorMessage)
      }
    }
  }
}
