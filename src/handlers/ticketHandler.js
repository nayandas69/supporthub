/**
 * Ticket system handler - manages ticket lifecycle
 * Creates, claims, and closes support tickets
 * Generates transcripts and notifies staff
 * @module handlers/ticketHandler
 */

import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js"
import {
  getTicketConfig,
  createTicket,
  getTicket,
  updateTicket,
  closeTicket as closeTicketStorage,
  getActiveTickets,
} from "../utils/storage-supabase.js"
import log from "../utils/log.js"
import {
  showTicketCreatingActivity,
  showTicketClaimActivity,
  showTicketClosingActivity,
} from "../utils/activityManager.js"

/**
 * Setup ticket panel with creation button
 * @param {Guild} guild - Discord guild
 * @param {string} channelId - Panel channel ID
 * @param {string} categoryId - Ticket category ID
 * @param {Array<string>} staffRoleIds - Staff role IDs
 * @param {string} embedColor - Hex color for embeds
 * @returns {Promise<Message>} Panel message
 */
export async function setupTicketPanel(guild, channelId, categoryId, staffRoleIds, embedColor) {
  try {
    const channel = await guild.channels.fetch(channelId)

    // Create panel embed
    const embed = new EmbedBuilder()
      .setTitle("Support Ticket System")
      .setDescription(
        "Need help? Click the button below to create a support ticket.\n\n" +
        "**What happens next:**\n" +
        "- A private channel will be created for you\n" +
        "- Staff members will be notified\n" +
        "- Discuss your issue privately with our team\n" +
        "- Ticket transcripts are saved when closed\n\n" +
        "**Please note:**\n" +
        "- Only create tickets for genuine support needs\n" +
        "- Be patient - staff will respond soon\n" +
        "- Language must be English only and respectful\n" +
        "- Abuse may result in warnings",
      )
      .setColor(embedColor)
      .setTimestamp()

    // Create ticket button
    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder().addComponents(button)

    // Send panel
    const message = await channel.send({
      embeds: [embed],
      components: [row],
    })

    log.success(`Ticket panel created in ${channel.name}`)
    return message
  } catch (error) {
    log.error("Failed to setup ticket panel", error)
    throw error
  }
}

/**
 * Handle ticket creation from button click
 * Creates private channel and notifies staff
 * @param {ButtonInteraction} interaction - Button interaction
 */
export async function handleTicketCreate(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const guildId = interaction.guild.id
    const userId = interaction.user.id

    showTicketCreatingActivity(interaction.client, interaction.user.username)

    // Get ticket configuration
    const config = await getTicketConfig(guildId)

    if (!config || !config.enabled) {
      return interaction.editReply({
        content: "Ticket system is not configured or disabled. Please contact an administrator.",
      })
    }

    // Check for existing active tickets
    const activeTickets = await getActiveTickets(guildId, userId)
    if (activeTickets.length > 0) {
      const ticketChannel = await interaction.guild.channels.fetch(activeTickets[0].channelId).catch(() => null)
      if (ticketChannel) {
        return interaction.editReply({
          content: `You already have an active ticket: ${ticketChannel}\n\nPlease close it before creating a new one.`,
        })
      }
    }

    // Verify category exists
    const category = await interaction.guild.channels.fetch(config.categoryId).catch(() => null)
    if (!category) {
      return interaction.editReply({
        content: "Ticket category no longer exists. Please ask an administrator to run /setup again.",
      })
    }

    const botMember = interaction.guild.members.me
    const categoryPermissions = category.permissionsFor(botMember)

    if (!categoryPermissions) {
      return interaction.editReply({
        content: "Bot cannot access the ticket category. Please ensure the bot has proper permissions in the category.",
      })
    }

    const requiredPermissions = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
    ]

    const missingPermissions = []
    for (const permission of requiredPermissions) {
      if (!categoryPermissions.has(permission)) {
        missingPermissions.push(permission.toString())
      }
    }

    if (missingPermissions.length > 0) {
      return interaction.editReply({
        content:
          "Bot is missing required permissions in the ticket category.\n\n" +
          "**Required permissions:**\n" +
          "- View Channel\n" +
          "- Manage Channels\n" +
          "- Manage Permissions\n\n" +
          "Please contact an administrator to fix the bot permissions in the ticket category.",
      })
    }

    // Generate ticket number
    const ticketNumber = Math.floor(Math.random() * 9000) + 1000
    const ticketId = `ticket-${userId}-${Date.now()}`

    // Create permission overwrites
    const permissionOverwrites = [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: botMember.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ]

    // Add staff role permissions
    for (const staffRoleId of config.staffRoleIds) {
      permissionOverwrites.push({
        id: staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      })
    }

    let ticketChannel
    try {
      ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        topic: `Support ticket for ${interaction.user.tag} | Ticket ID: ${ticketId}`,
        permissionOverwrites,
      })
    } catch (channelError) {
      log.error("Failed to create ticket channel", channelError)
      return interaction.editReply({
        content:
          "Failed to create ticket channel. This usually means the bot is missing permissions.\n\n" +
          "**Please ensure the bot has these permissions in the ticket category:**\n" +
          "- View Channel\n" +
          "- Manage Channels\n" +
          "- Manage Permissions\n\n" +
          "Contact an administrator if this issue persists.",
      })
    }

    // Save ticket data
    const ticketData = {
      id: ticketId,
      ticketNumber: ticketNumber,
      guildId: guildId,
      channelId: ticketChannel.id,
      userId: userId,
      claimedBy: null,
      status: "open",
      createdAt: Date.now(),
      closedAt: null,
    }

    const created = await createTicket(guildId, ticketData)

    if (!created) {
      log.error("Failed to save ticket to database")
      await ticketChannel.delete().catch(() => { })
      return interaction.editReply({
        content: "Failed to save ticket data. Please try again.",
      })
    }

    // Create welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketNumber}`)
      .setDescription(
        `Welcome ${interaction.user}!\n\n` +
        "Thank you for creating a support ticket. A staff member will assist you shortly.\n\n" +
        "**While you wait:**\n" +
        "- Please describe your issue in detail\n" +
        "- Include any relevant screenshots or information\n" +
        "- Be patient - staff will respond soon\n\n" +
        `**Ticket Information:**\n` +
        `- Ticket ID: \`${ticketId}\`\n` +
        `- Created by: ${interaction.user.tag}\n` +
        `- Status: Open`,
      )
      .setColor(config.embedColor)
      .setTimestamp()

    // Create control buttons
    const claimButton = new ButtonBuilder()
      .setCustomId(`ticket_claim_${ticketId}`)
      .setLabel("Claim Ticket")
      .setStyle(ButtonStyle.Success)

    const closeButton = new ButtonBuilder()
      .setCustomId(`ticket_close_${ticketId}`)
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)

    const row = new ActionRowBuilder().addComponents(claimButton, closeButton)

    const staffMentions = config.staffRoleIds.map((id) => `<@&${id}>`).join(" ")

    // Send welcome message
    await ticketChannel.send({
      content: `${interaction.user} ${staffMentions}`,
      embeds: [welcomeEmbed],
      components: [row],
    })

    // Reply to user
    await interaction.editReply({
      content: `Ticket created successfully! Please check ${ticketChannel} to discuss your issue.`,
    })

    log.command(`Ticket #${ticketNumber} created by ${interaction.user.tag} in ${interaction.guild.name}`)
  } catch (error) {
    log.error("Error creating ticket", error)

    try {
      await interaction.editReply({
        content: "An error occurred while creating your ticket. Please contact an administrator.",
      })
    } catch (replyError) {
      log.error("Failed to send error message", replyError)
    }
  }
}

/**
 * Handle ticket claim by staff member
 * @param {ButtonInteraction} interaction - Button interaction
 */
export async function handleTicketClaim(interaction) {
  try {
    const ticketId = interaction.customId.replace("ticket_claim_", "")
    const guildId = interaction.guild.id

    // Get ticket data
    const ticket = await getTicket(guildId, ticketId)
    if (!ticket) {
      return interaction.reply({
        content: "This ticket no longer exists.",
        flags: MessageFlags.Ephemeral,
      })
    }

    // Check if already claimed
    if (ticket.claimedBy) {
      const claimedUser = await interaction.guild.members.fetch(ticket.claimedBy)
      return interaction.reply({
        content: `This ticket is already claimed by ${claimedUser.user.tag}.`,
        flags: MessageFlags.Ephemeral,
      })
    }

    // Verify staff permissions
    const config = await getTicketConfig(guildId)
    const member = interaction.member
    const hasStaffRole = member.roles.cache.some((role) => config.staffRoleIds.includes(role.id))
    const isOwner = interaction.guild.ownerId === member.id

    if (!hasStaffRole && !isOwner) {
      return interaction.reply({
        content: "Only staff members or the server owner can claim tickets.",
        flags: MessageFlags.Ephemeral,
      })
    }

    // Update ticket
    const updated = await updateTicket(guildId, ticketId, {
      claimedBy: interaction.user.id,
      status: "claimed",
    })

    if (!updated) {
      return interaction.reply({
        content: "Failed to update ticket. Please try again.",
        flags: MessageFlags.Ephemeral,
      })
    }

    showTicketClaimActivity(interaction.client, interaction.user.username, ticket.ticketNumber)

    // Send claim notification
    const claimEmbed = new EmbedBuilder()
      .setTitle("Ticket Claimed")
      .setDescription(`${interaction.user} has claimed this ticket and will assist you.`)
      .setColor("#57F287")
      .setTimestamp()

    await interaction.reply({
      embeds: [claimEmbed],
    })

    log.command(`Ticket #${ticket.ticketNumber} claimed by ${interaction.user.tag}`)
  } catch (error) {
    log.error("Error claiming ticket", error)
    await interaction.reply({
      content: "An error occurred while claiming this ticket.",
      flags: MessageFlags.Ephemeral,
    })
  }
}

/**
 * Handle ticket close
 * Generates transcript and deletes channel
 * @param {ButtonInteraction} interaction - Button interaction
 */
export async function handleTicketClose(interaction) {
  try {
    await interaction.deferReply()

    const ticketId = interaction.customId.replace("ticket_close_", "")
    const guildId = interaction.guild.id

    // Get ticket data
    const ticket = await getTicket(guildId, ticketId)
    if (!ticket) {
      return interaction.editReply({
        content: "This ticket no longer exists.",
      })
    }

    // Verify permissions
    const config = await getTicketConfig(guildId)
    const member = interaction.member
    const hasStaffRole = member.roles.cache.some((role) => config.staffRoleIds.includes(role.id))
    const isOwner = interaction.guild.ownerId === member.id

    if (!hasStaffRole && !isOwner) {
      return interaction.editReply({
        content: "Only staff members or the server owner can close tickets.",
      })
    }

    showTicketClosingActivity(interaction.client, interaction.user.username, ticket.ticketNumber)

    const messages = await interaction.channel.messages.fetch({ limit: 100 })
    const sortedMessages = Array.from(messages.values()).reverse()

    let copyableMessages = ""

    for (const msg of sortedMessages) {
      const timestamp = new Date(msg.createdTimestamp).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })

      // Skip system messages and empty content
      if (msg.author.bot && msg.embeds.length > 0) continue
      if (!msg.content) continue

      copyableMessages += `[${timestamp}] ${msg.author.tag}: ${msg.content}\n`
    }

    if (config.transcriptChannelId) {
      try {
        const transcriptChannel = await interaction.guild.channels.fetch(config.transcriptChannelId)

        const createdByUser = await interaction.guild.members.fetch(ticket.userId).catch(() => null)
        const createdByDisplay = createdByUser
          ? `${createdByUser.user.tag} (${ticket.userId})`
          : `${ticket.userId} (${ticket.userId})`

        let claimedByDisplay = "Unclaimed"
        if (ticket.claimedBy) {
          const claimedByUser = await interaction.guild.members.fetch(ticket.claimedBy).catch(() => null)
          claimedByDisplay = claimedByUser
            ? `${claimedByUser.user.tag} (${ticket.claimedBy})`
            : `${ticket.claimedBy} (${ticket.claimedBy})`
        }

        const transcriptEmbed = new EmbedBuilder()
          .setTitle(`TICKET TRANSCRIPT #${ticket.ticketNumber}`)
          .setDescription(
            `**Ticket Information:**\n` +
            `• Ticket ID: \`${ticket.id}\`\n` +
            `• Ticket Number: #${ticket.ticketNumber}\n` +
            `• Created by: ${createdByDisplay}\n` +
            `• Claimed by: ${claimedByDisplay}\n` +
            `• Created: ${new Date(ticket.createdAt).toLocaleString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}\n` +
            `• Closed: ${new Date().toLocaleString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}\n` +
            `• Closed by: ${interaction.user.tag} (${interaction.user.id})\n\n` +
            `───────────────────────────────────\n` +
            `**MESSAGES**\n` +
            `───────────────────────────────────\n` +
            `\`\`\`\n${copyableMessages.slice(0, 3500)}\`\`\``,
          )
          .setColor(config.embedColor)
          .setTimestamp()
          .setFooter({ text: `END OF TRANSCRIPT - TICKET #${ticket.ticketNumber}` })

        await transcriptChannel.send({
          embeds: [transcriptEmbed],
        })

        if (copyableMessages.length > 3500) {
          const remainingMessages = copyableMessages.slice(3500)
          const maxLength = 1900

          const chunks = []
          let currentChunk = ""
          const lines = remainingMessages.split("\n")

          for (const line of lines) {
            if ((currentChunk + line + "\n").length > maxLength) {
              chunks.push(currentChunk)
              currentChunk = line + "\n"
            } else {
              currentChunk += line + "\n"
            }
          }

          if (currentChunk) {
            chunks.push(currentChunk)
          }

          for (let i = 0; i < chunks.length; i++) {
            await transcriptChannel.send({
              content: `\`\`\`\n${chunks[i]}\`\`\``,
            })
          }
        }

        log.success(`Transcript for ticket #${ticket.ticketNumber} sent with copyable messages in embed`)
      } catch (error) {
        log.error("Failed to send transcript", error)
      }
    }

    const closed = await closeTicketStorage(guildId, ticketId)

    if (!closed) {
      log.warn("Failed to mark ticket as closed in database")
    }

    const closeEmbed = new EmbedBuilder()
      .setTitle("Ticket Closing")
      .setDescription(
        "This ticket is being closed. The channel will be deleted in 5 seconds.\n\nThank you for using our support system!",
      )
      .setColor("#ED4245")
      .setTimestamp()

    await interaction.editReply({
      embeds: [closeEmbed],
    })

    log.command(`Ticket #${ticket.ticketNumber} closed by ${interaction.user.tag}`)

    setTimeout(async () => {
      try {
        await interaction.channel.delete()
      } catch (error) {
        log.error("Failed to delete ticket channel", error)
      }
    }, 5000)
  } catch (error) {
    log.error("Error closing ticket", error)
    await interaction.editReply({
      content: "An error occurred while closing this ticket.",
    })
  }
}

/**
 * Get ticket statistics for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object>} Ticket statistics
 */
export async function getTicketStats(guildId) {
  try {
    const config = await getTicketConfig(guildId)
    if (!config) return null

    const activeTickets = await getActiveTickets(guildId)

    return {
      totalTickets: config.ticketCount || 0,
      activeTickets: activeTickets.length,
      closedTickets: (config.ticketCount || 0) - activeTickets.length,
    }
  } catch (error) {
    log.error("Error getting ticket stats", error)
    return null
  }
}
