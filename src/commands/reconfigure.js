/**
 * Reconfigure command - Modify existing ticket system settings
 * @module commands/reconfigure
 */

import {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js"
import { getTicketConfig, saveTicketConfig } from "../utils/storage-supabase.js"
import log from "../utils/log.js"

export const data = new SlashCommandBuilder()
  .setName("reconfigure")
  .setDescription("Reconfigure existing ticket system (Server Owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only admins/owners can see this command
  .setDMPermission(false) // Disable command in DMs - only works in servers
  .addChannelOption((option) =>
    option
      .setName("category")
      .setDescription("New ticket category (optional)")
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(false),
  )
  .addRoleOption((option) =>
    option.setName("staff-role").setDescription("New staff role (optional)").setRequired(false),
  )
  .addChannelOption((option) =>
    option
      .setName("transcript-channel")
      .setDescription("New transcript channel (optional)")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false),
  )
  .addStringOption((option) =>
    option.setName("embed-color").setDescription("New hex color (e.g., #5865F2)").setRequired(false),
  )

/**
 * Execute reconfigure command
 * @param {ChatInputCommandInteraction} interaction - Command interaction
 */
export async function execute(interaction) {
  try {
    // Check if user is server owner
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: "Only the server owner can reconfigure the ticket system.",
        flags: 64,
      })
    }

    await interaction.deferReply({ flags: 64 })

    // Get existing configuration
    const existingConfig = await getTicketConfig(interaction.guild.id)

    if (!existingConfig) {
      return interaction.editReply({
        content: "Ticket system is not setup yet. Please use /setup first.",
      })
    }

    // Get new values or keep existing
    const category = interaction.options.getChannel("category")
    const staffRole = interaction.options.getRole("staff-role")
    const transcriptChannel = interaction.options.getChannel("transcript-channel")
    const embedColor = interaction.options.getString("embed-color")

    // Validate color if provided
    if (embedColor) {
      const hexColorRegex = /^#[0-9A-F]{6}$/i
      if (!hexColorRegex.test(embedColor)) {
        return interaction.editReply({
          content: "Invalid color format! Please use hex format like #5865F2",
        })
      }
    }

    // Update configuration
    const newConfig = {
      ...existingConfig,
      categoryId: category?.id || existingConfig.categoryId,
      staffRoleIds: staffRole ? [staffRole.id] : existingConfig.staffRoleIds,
      transcriptChannelId: transcriptChannel?.id || existingConfig.transcriptChannelId,
      embedColor: embedColor || existingConfig.embedColor,
    }

    const saved = await saveTicketConfig(interaction.guild.id, newConfig)

    if (!saved) {
      return interaction.editReply({
        content: "Failed to save configuration to database. Please try again.",
      })
    }

    if (existingConfig.panelChannelId && existingConfig.panelMessageId) {
      try {
        const panelChannel = await interaction.guild.channels.fetch(existingConfig.panelChannelId)
        const panelMessage = await panelChannel.messages.fetch(existingConfig.panelMessageId)

        // Create updated embed with new configuration
        const embed = new EmbedBuilder()
          .setTitle("Create Support Ticket")
          .setDescription(
            "Need help? Click the button below to create a support ticket.\n\n" +
            "Our staff team will assist you as soon as possible.",
          )
          .setColor(newConfig.embedColor)
          .setFooter({ text: "Support Ticket System" })
          .setTimestamp()

        const button = new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("Create Ticket")
          .setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder().addComponents(button)

        // Update the existing panel message
        await panelMessage.edit({
          embeds: [embed],
          components: [row],
        })

        log.success("Updated existing ticket panel message")
      } catch (error) {
        log.error("Failed to update panel message", error)
        return interaction.editReply({
          content: "Configuration saved, but failed to update panel message. The panel message may have been deleted.",
        })
      }
    }

    const changes = []
    if (category) changes.push(`Category: ${category.name}`)
    if (staffRole) changes.push(`Staff Role: ${staffRole}`)
    if (transcriptChannel) changes.push(`Transcript Channel: ${transcriptChannel}`)
    if (embedColor) changes.push(`Embed Color: ${embedColor}`)

    await interaction.editReply({
      content:
        `Ticket system reconfigured successfully!\n\n` +
        `**Changes Made:**\n${changes.join("\n") || "No changes"}\n\n` +
        `The existing ticket panel has been updated with new settings.`,
    })

    log.command(`Ticket system reconfigured by ${interaction.user.tag} in ${interaction.guild.name}`)
  } catch (error) {
    log.error("Error in reconfigure command", error)

    const errorMessage = `An error occurred during reconfiguration: ${error.message}`

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMessage })
    } else {
      await interaction.reply({ content: errorMessage, flags: 64 })
    }
  }
}
