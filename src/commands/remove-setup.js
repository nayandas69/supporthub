/**
 * Remove Setup command - Delete ticket system configuration
 * @module commands/remove-setup
 */

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { getTicketConfig, removeTicketConfig, getAllTickets } from "../utils/storage-supabase.js"
import log from "../utils/log.js"

export const data = new SlashCommandBuilder()
  .setName("remove-setup")
  .setDescription("Remove ticket system configuration (Server Owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only admins/owners can see this command
  .setDMPermission(false) // Disable command in DMs - only works in servers

/**
 * Execute remove-setup command
 * @param {ChatInputCommandInteraction} interaction - Command interaction
 */
export async function execute(interaction) {
  try {
    // Check if user is server owner
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: "Only the server owner can remove the ticket system.",
        flags: 64,
      })
    }

    await interaction.deferReply({ flags: 64 })

    // Get existing configuration
    const config = await getTicketConfig(interaction.guild.id)

    if (!config) {
      return interaction.editReply({
        content: "Ticket system is not setup in this server.",
      })
    }

    const tickets = await getAllTickets(interaction.guild.id)
    let deletedChannels = 0

    if (tickets && tickets.length > 0) {
      log.system(`Deleting ${tickets.length} ticket channels for ${interaction.guild.name}`)

      for (const ticket of tickets) {
        try {
          const channel = await interaction.guild.channels.fetch(ticket.channelId).catch(() => null)
          if (channel) {
            await channel.delete("Ticket system removed")
            deletedChannels++
          }
        } catch (error) {
          log.warn(`Could not delete ticket channel ${ticket.channelId}`, error)
        }
      }
    }

    // Delete ticket panel if exists
    if (config.panelChannelId && config.panelMessageId) {
      try {
        const panelChannel = await interaction.guild.channels.fetch(config.panelChannelId)
        const panelMessage = await panelChannel.messages.fetch(config.panelMessageId)
        await panelMessage.delete()
        log.success("Deleted ticket panel message")
      } catch (error) {
        log.warn("Could not delete panel message", error)
      }
    }

    const removed = await removeTicketConfig(interaction.guild.id)

    if (!removed) {
      return interaction.editReply({
        content: "Failed to remove configuration from database. Some data may remain.",
      })
    }

    if (interaction.client.guilds.cache.has(interaction.guild.id)) {
      const guild = interaction.client.guilds.cache.get(interaction.guild.id)
      await guild.channels.fetch(null, { force: true })
      log.system(`Cleared cache for guild ${interaction.guild.name}`)
    }

    await interaction.editReply({
      content:
        "Ticket system has been removed successfully!\n\n" +
        `- Configuration deleted\n` +
        `- Panel message removed\n` +
        `- ${deletedChannels} ticket channel(s) deleted\n` +
        `- All settings and cache cleared\n\n` +
        "You can setup the system again anytime using /setup",
    })

    log.command(
      `Ticket system removed by ${interaction.user.tag} in ${interaction.guild.name} (${deletedChannels} channels deleted)`,
    )
  } catch (error) {
    log.error("Error in remove-setup command", error)

    const errorMessage = `An error occurred while removing setup: ${error.message}`

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMessage })
    } else {
      await interaction.reply({ content: errorMessage, flags: 64 })
    }
  }
}
