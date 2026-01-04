/**
 * Setup command - Configure ticket system for server
 * Only server owner can use this command
 * @module commands/setup
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from "discord.js"
import { saveTicketConfig } from "../utils/storage-supabase.js"
import { setupTicketPanel } from "../handlers/ticketHandler.js"
import log from "../utils/log.js"

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Setup the ticket system (Server Owner only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only admins/owners can see this command
  .setDMPermission(false) // Disable command in DMs - only works in servers
  .addChannelOption((option) =>
    option
      .setName("panel-channel")
      .setDescription("Channel where ticket panel will be posted")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  )
  .addChannelOption((option) =>
    option
      .setName("category")
      .setDescription("Category where ticket channels will be created")
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option.setName("staff-role").setDescription("Staff role that can manage tickets").setRequired(true),
  )
  .addChannelOption((option) =>
    option
      .setName("transcript-channel")
      .setDescription("Channel for ticket transcripts (optional)")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false),
  )
  .addStringOption((option) =>
    option.setName("embed-color").setDescription("Hex color for embeds (e.g., #5865F2)").setRequired(false),
  )

/**
 * Execute setup command
 * @param {ChatInputCommandInteraction} interaction - Command interaction
 */
export async function execute(interaction) {
  try {
    // Check if user is server owner
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: "Only the server owner can setup the ticket system.",
        flags: MessageFlags.Ephemeral,
      })
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const panelChannel = interaction.options.getChannel("panel-channel")
    const category = interaction.options.getChannel("category")
    const staffRole = interaction.options.getRole("staff-role")
    const transcriptChannel = interaction.options.getChannel("transcript-channel")
    const embedColor = interaction.options.getString("embed-color") || "#5865F2"

    // Validate hex color
    const hexColorRegex = /^#[0-9A-F]{6}$/i
    if (!hexColorRegex.test(embedColor)) {
      return interaction.editReply({
        content: "Invalid color format! Please use hex format like #5865F2",
      })
    }

    // Check panel channel permissions
    const panelPerms = panelChannel.permissionsFor(interaction.guild.members.me)
    if (
      !panelPerms?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
      ])
    ) {
      return interaction.editReply({
        content: `I need View Channel, Send Messages, and Embed Links permissions in ${panelChannel}`,
      })
    }

    // Check category permissions
    const categoryPerms = category.permissionsFor(interaction.guild.members.me)
    if (
      !categoryPerms?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
      ])
    ) {
      return interaction.editReply({
        content: `I need View Channel, Manage Channels, and Manage Roles permissions in the ${category.name} category`,
      })
    }

    // Create configuration
    const config = {
      panelChannelId: panelChannel.id,
      categoryId: category.id,
      staffRoleIds: [staffRole.id],
      transcriptChannelId: transcriptChannel?.id || null,
      embedColor: embedColor,
      enabled: true,
    }

    const saved = await saveTicketConfig(interaction.guild.id, config)

    if (!saved) {
      return interaction.editReply({
        content: "Failed to save configuration to database. Please try again or contact support.",
      })
    }

    // Setup ticket panel
    await setupTicketPanel(interaction.guild, panelChannel.id, category.id, [staffRole.id], embedColor)

    await interaction.editReply({
      content:
        `Ticket system configured successfully!\n\n` +
        `**Settings:**\n` +
        `- Panel Channel: ${panelChannel}\n` +
        `- Ticket Category: ${category.name}\n` +
        `- Staff Role: ${staffRole}\n` +
        `- Transcript Channel: ${transcriptChannel || "None"}\n` +
        `- Embed Color: ${embedColor}\n\n` +
        `Users can now create tickets in ${panelChannel}!`,
    })

    log.command(`Ticket system setup by ${interaction.user.tag} in ${interaction.guild.name}`)
  } catch (error) {
    log.error("Error in setup command", error)

    const errorMessage = `An error occurred during setup: ${error.message}`

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMessage })
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral })
    }
  }
}
