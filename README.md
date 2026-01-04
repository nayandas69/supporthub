# SupportHub - Discord Ticket System Bot

A Discord bot providing a complete ticketing system for customer support and help desk operations. Built with Discord.js v14 and Supabase PostgreSQL for enterprise-grade reliability, multi-server support, and persistent data storage.

[![Discord](https://img.shields.io/discord/1435329767149797461?label=Join%20Discord&logo=discord&color=5865F2)](https://discord.gg/u9XfHZN8K9)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Discord Bot Configuration](#discord-bot-configuration)
- [Supabase Database Setup](#supabase-database-setup)
- [Environment Variables](#environment-variables)
- [Running the Bot](#running-the-bot)
- [Commands](#commands)
- [Usage Guide](#usage-guide)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

- Modern slash commands with Discord.js v14
- Persistent PostgreSQL database storage via Supabase
- Multi-server support with isolated configurations
- Automatic ticket transcripts with full message history
- Role-based staff access control
- Ticket claiming system for staff management
- Customizable embed colors and styling
- Real-time bot activity status updates
- Health check endpoint for uptime monitoring
- Automatic command deployment on startup
- Comprehensive error handling and retry logic
- Docker support for containerized deployment
- Production-ready with colorful console logging

## Prerequisites

Before installing SupportHub, ensure you have:

- **Node.js 20.0.0 or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **pnpm**
- **Discord Account** - [Sign up here](https://discord.com)
- **Supabase Account** - [Sign up for free](https://supabase.com)
- **Git** - [Download here](https://git-scm.com/)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/nayandas69/supporthub.git
cd supporthub
```

### Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Using pnpm:
```bash
pnpm install
```

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials (see [Environment Variables](#environment-variables) section).

## Discord Bot Configuration

Follow these steps carefully to create and configure your Discord bot application.

### Create Discord Application

1. Navigate to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** in the top-right corner
3. Enter a name for your application (e.g., "SupportHub")
4. Read and accept the Discord Developer Terms of Service
5. Click **"Create"**

### Configure Bot Account

1. In your application page, click **"Bot"** in the left sidebar
2. Click **"Add Bot"** and confirm by clicking **"Yes, do it!"**
3. Under the bot's username section, click **"Reset Token"**
4. Click **"Yes, do it!"** to confirm
5. **Copy the token immediately** - this is your `DISCORD_TOKEN`
   - This token will only be shown once
   - Store it securely in your `.env` file
   - Never share this token publicly or commit it to version control

### Enable Required Gateway Intents

Scroll down to the **"Privileged Gateway Intents"** section and enable:

- **SERVER MEMBERS INTENT** - Required for role and member management
- **MESSAGE CONTENT INTENT** - Required for reading ticket messages

Click **"Save Changes"** at the bottom.

### Get Application Client ID

1. Click **"OAuth2"** in the left sidebar
2. Select **"General"** from the submenu
3. Under **"Client Information"**, copy the **Client ID**
4. This is your `CLIENT_ID` - save it in your `.env` file

### Installation Contexts (IMPORTANT)

When configuring your Discord bot application, you MUST set the correct installation contexts:

1. In the Discord Developer Portal, navigate to your application
2. Click **"Installation"** in the left sidebar
3. Under **"Installation Contexts"**, you will see two options:
   - **Guild Install** - Allows installation to Discord servers
   - **User Install** - Allows installation to user accounts

**IMPORTANT: Select ONLY "Guild Install"**

- CHECK: **Guild Install**
- UNCHECK: **User Install**

**Why Guild Install Only?**
- SupportHub is designed to work exclusively within Discord servers (guilds)
- The bot requires server-specific permissions, roles, categories, and channels
- User Install would not provide the necessary server context for ticket management
- Ticket systems are server-wide features, not user-specific features

**Do NOT enable User Install** - the bot will not function correctly if installed to user accounts.

### Configure Bot Permissions

1. Still in the **"Installation"** section
2. Under **"Default Install Settings"** for **Guild Install**
3. Set **"Scopes"**:
   - `bot`
   - `applications.commands`
4. Set **"Permissions"** (required for ticket system):
   - View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use External Emojis
   - Manage Channels
   - Manage Roles
   - Manage Messages

Alternatively, you can use permission integer: `8` (Administrator) for testing, but this is not recommended for production.

### Generate Bot Invite Link

1. Go to **"OAuth2"** in the left sidebar
2. Select **"URL Generator"**
3. Under **"Scopes"**, check:
   - `bot`
   - `applications.commands`
4. Under **"Bot Permissions"**, select the permissions listed above
5. Copy the generated URL at the bottom
6. Open the URL in your browser
7. Select your Discord server from the dropdown
8. Click **"Authorize"**
9. Complete the CAPTCHA if prompted

Your bot should now appear offline in your server's member list.

## Supabase Database Setup

SupportHub uses Supabase (PostgreSQL) for persistent data storage. Follow these steps to set up your database.

### Create Supabase Project

1. Visit [Supabase Dashboard](https://app.supabase.com)
2. Sign in or create a new account
3. Click **"New Project"**
4. Select or create an organization
5. Configure your project:
   - **Name**: `supporthub` (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the region closest to your users for best performance
   - **Pricing Plan**: Free tier is sufficient for most use cases
6. Click **"Create new project"**
7. Wait 2-3 minutes for Supabase to provision your database

### Get Supabase Credentials

Once your project is ready:

1. Click on **"Settings"** (gear icon) in the left sidebar
2. Select **"API"** from the settings menu
3. Find your credentials:

**Project URL:**
- Look for the **"Project URL"** section
- Copy the URL (format: `https://abcdefghijklmnop.supabase.co`)
- This is your `SUPABASE_URL`

**Service Role Key:**
- Scroll to **"Project API keys"** section
- Find the `service_role` key (NOT the `anon` key)
- Click the eye icon to reveal the key
- Copy the entire key
- This is your `SUPABASE_SERVICE_ROLE_KEY`

**IMPORTANT:**
- The service role key bypasses Row Level Security
- NEVER expose this key in client-side code
- Keep it secure in your `.env` file
- Do not commit it to version control

### Initialize Database Schema

1. In Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

**Run First Script:**
1. Open the file `db/init_supporthub_database.sql` from your project directory
2. Copy the entire contents
3. Paste into the SQL Editor in Supabase
4. Click **"Run"** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
5. You should see "Success. No rows returned" message
6. Verify tables were created by clicking **"Table Editor"** in the sidebar
   - You should see: `guild_configs`, `tickets`, `ticket_messages`

**Run Second Script:**
1. Click **"New Query"** again in SQL Editor
2. Open the file `db/setup_security_policies.sql` from your project
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **"Run"**
6. Verify Row Level Security is enabled

Your database is now fully configured and ready to use.

### Verify Database Setup

To confirm everything is set up correctly:

1. Go to **"Table Editor"** in Supabase
2. You should see three tables:
   - `guild_configs` - Stores server ticket configurations
   - `tickets` - Stores individual ticket data
   - `ticket_messages` - Stores ticket message history
3. Click on each table to verify the schema matches the SQL scripts

## Environment Variables

Create a `.env` file in the project root directory with the following variables:

```env
# ============================================
# Discord Bot Configuration
# ============================================

# Your Discord bot token from the Developer Portal
# Located in: Bot section > Token
DISCORD_TOKEN=your_discord_bot_token_here

# Your Discord application client ID
# Located in: OAuth2 > General > Client ID
CLIENT_ID=your_discord_client_id_here

# ============================================
# Supabase Database Configuration
# ============================================

# Your Supabase project URL
# Located in: Settings > API > Project URL
# Format: https://abcdefghijklmnop.supabase.co
SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase service role key (NOT the anon key)
# Located in: Settings > API > service_role key
# IMPORTANT: Keep this secret - it has full database access
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# Optional Configuration
# ============================================

# Application environment (development or production)
NODE_ENV=production

# Health check HTTP server port
# Used by uptime monitors to verify bot is running
# Default: 3000
PORT=3000

# Alternative health check port variable name
HEALTH_CHECK_PORT=3000
```

## Running the Bot

### Development Mode

Run with auto-restart on file changes (using Node.js built-in watch mode):

```bash
npm run dev
```

This is useful during development as the bot will automatically restart when you modify any source files.

### Production Mode

Run the bot normally:

```bash
npm start
```

### Expected Console Output

When the bot starts successfully, you should see:

```
[SYSTEM] Starting SupportHub Bot...
[INFO] Node.js version: v20.11.0
[SYSTEM] Connecting to Supabase database...
[SUCCESS] Supabase connection established successfully
[INFO] Loading 3 command files...
[SUCCESS] Loaded command: setup
[SUCCESS] Loaded command: reconfigure
[SUCCESS] Loaded command: remove-setup
[SUCCESS] Successfully loaded 3 commands
[INFO] Loading 2 event files...
[SUCCESS] Loaded event: ready
[SUCCESS] Loaded event: interactionCreate
[SUCCESS] Successfully loaded 2 events
[SUCCESS] Logged in as SupportHub#1234
[SYSTEM] Deploying slash commands to Discord API...
[SUCCESS] Successfully deployed 3 slash commands globally
[SUCCESS] Health check server running on port 3000
```

If you see these messages, your bot is running correctly!

### Process Management with PM2 (Production)

For production environments, use PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
pm2 start src/index.js --name supporthub

# View logs
pm2 logs supporthub

# Monitor bot status
pm2 status

# Restart bot
pm2 restart supporthub

# Stop bot
pm2 stop supporthub

# Remove from PM2
pm2 delete supporthub

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Commands

SupportHub provides three slash commands for server owners to manage the ticket system.

### `/setup`

**Description:** Initial configuration of the ticket system for your server.

**Permission Required:** Server Owner only

**Options:**
- `panel-channel` (required) - Text channel where the ticket creation panel will be posted
- `category` (required) - Category where individual ticket channels will be created
- `staff-role` (required) - Role that can view and manage tickets
- `transcript-channel` (optional) - Channel where ticket transcripts will be saved
- `embed-color` (optional) - Hex color code for embeds (default: #5865F2)

**Example:**
```
/setup
  panel-channel: #support
  category: Support Tickets
  staff-role: @Support Team
  transcript-channel: #ticket-logs
  embed-color: #5865F2
```

### `/reconfigure`

**Description:** Modify existing ticket system configuration.

**Permission Required:** Server Owner only

**Options:**
- Same options as `/setup`
- Updates existing configuration without deleting tickets
- Panel message is automatically updated

**Example:**
```
/reconfigure
  staff-role: @New Support Team
  transcript-channel: #new-logs
```

### `/remove-setup`

**Description:** Completely remove the ticket system from your server.

**Permission Required:** Server Owner only

**Warning:** This action:
- Deletes all active ticket channels immediately
- Removes the ticket panel message
- Deletes configuration from the database
- Cannot be undone

**Example:**
```
/remove-setup
```

## Usage Guide

### For Server Owners: Setting Up Tickets

1. Ensure bot is invited to your server with correct permissions
2. Create a category for tickets (e.g., "Support Tickets")
3. Create a text channel for the panel (e.g., "#support")
4. Create or identify a staff role (e.g., "@Support Team")
5. Create a channel for logs (e.g., "#ticket-logs")
6. Run the `/setup` command with your configuration
7. The ticket panel will appear in your chosen channel

### For Members: Creating Support Tickets

1. Navigate to the support channel
2. Find the ticket panel embed
3. Click the **"Create Ticket"** button
4. A private channel is created instantly (e.g., `#ticket-1234`)
5. Only you, staff members, and server admins can see this channel
6. Describe your issue or question
7. Wait for a staff member to respond

**Note:** You can only have one active ticket at a time.

### For Staff: Managing Tickets

**Claim a Ticket:**
- Click the **"Claim Ticket"** button in the ticket channel
- Your name will be recorded as the handler
- Other staff will see the ticket is being handled

**Close a Ticket:**
- Click the **"Close Ticket"** button when the issue is resolved
- A full transcript is automatically generated
- The transcript is sent to the logs channel
- The ticket channel is deleted after 5 seconds
- The ticket is marked as closed in the database

**Transcript Format:**
- Ticket number and ID
- User who created the ticket
- Staff member who claimed the ticket
- Creation and closure timestamps
- Full message history in readable format
- Copyable text for record keeping

## Deployment

### Deploy to Railway (Recommended for Free Hosting)

Railway provides free hosting with automatic deployments from Git.

1. Create an account at [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your SupportHub repository (fork it first if needed)
6. Railway will automatically detect the Node.js project
7. Add environment variables:
   - Go to project settings
   - Click **"Variables"** tab
   - Add each variable from your `.env` file
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
8. Railway will automatically build and deploy your bot
9. Copy your Railway deployment URL for health checks

**Railway Features:**
- Free $5 monthly credit (sufficient for small bots)
- Automatic deployments on git push
- Built-in PostgreSQL if you don't want to use Supabase
- Easy environment variable management
- Automatic HTTPS and domain assignment

### Deploy to Render

Render provides free hosting for web services.

1. Create an account at [Render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub or GitLab account
4. Select your SupportHub repository
5. Configure the service:
   - **Name:** `supporthub`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. Add environment variables in the dashboard
7. Click **"Create Web Service"**
8. Wait for the initial deployment to complete

**Render Features:**
- Free tier with 750 hours/month
- Automatic SSL certificates
- Automatic deploys from Git
- Built-in health checks
- Custom domains supported

### Deploy with Docker

Build and run the bot using Docker containers.

**Using Docker directly:**

```bash
# Build the Docker image
docker build -t supporthub:latest .

# Run the container
docker run -d \
  --name supporthub \
  --restart unless-stopped \
  --env-file .env \
  -p 3000:3000 \
  supporthub:latest

# View logs
docker logs -f supporthub

# Stop container
docker stop supporthub

# Remove container
docker rm supporthub
```

**Using Docker Compose:**

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Deploy to VPS (Ubuntu/Debian)

Manual deployment on your own Virtual Private Server.

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install Git (if not installed)
sudo apt install git -y

# Clone the repository
git clone https://github.com/nayandas69/supporthub.git
cd supporthub

# Install dependencies
npm install

# Configure environment
nano .env  # Add your credentials

# Install PM2 for process management
sudo npm install -g pm2

# Start the bot
pm2 start src/index.js --name supporthub

# View logs
pm2 logs supporthub

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually requires running a command with sudo)

# Monitor bot status
pm2 monit
```

## Project Structure

```
supporthub/
├── src/
│   ├── index.js                      # Bot entry point and initialization
│   ├── commands/
│   │   ├── setup.js                  # /setup command - initial configuration
│   │   ├── reconfigure.js            # /reconfigure command - update settings
│   │   └── remove-setup.js           # /remove-setup command - remove system
│   ├── events/
│   │   ├── ready.js                  # Bot ready event handler
│   │   └── interactionCreate.js      # Slash commands and button interactions
│   ├── handlers/
│   │   └── ticketHandler.js          # Core ticket creation/management logic
│   ├── utils/
│   │   ├── log.js                    # Colorful console logging utility
│   │   ├── supabase.js               # Supabase client and connection pooling
│   │   ├── storage-supabase.js       # Database CRUD operations
│   │   ├── activityManager.js        # Dynamic bot activity status
│   │   └── healthcheck.js            # HTTP health check server
│   └── config/
│       └── config.js                 # Environment variable configuration
├── db/
│   ├── init_supporthub_database.sql  # Database table creation script
│   └── setup_security_policies.sql   # Row Level Security setup
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── package.json                      # Node.js dependencies and scripts
├── package-lock.json                 # Locked dependency versions
├── Dockerfile                        # Docker container configuration
├── docker-compose.yml                # Docker Compose orchestration
├── railway.json                      # Railway deployment configuration
└── README.md                         # This documentation file
```

## Database Schema

### Table: `guild_configs`

Stores per-server ticket system configuration.

| Column | Type | Description |
|--------|------|-------------|
| `guild_id` | TEXT | Discord server ID (Primary Key) |
| `panel_channel_id` | TEXT | Channel ID where ticket panel is posted |
| `panel_message_id` | TEXT | Message ID of the ticket panel |
| `category_id` | TEXT | Category ID where tickets are created |
| `staff_role_ids` | TEXT[] | Array of staff role IDs |
| `transcript_channel_id` | TEXT | Channel ID for ticket transcripts (nullable) |
| `embed_color` | TEXT | Hex color code for embeds (default: #5865F2) |
| `enabled` | BOOLEAN | Whether ticket system is active |
| `created_at` | TIMESTAMPTZ | Configuration creation timestamp |
| `last_updated` | TIMESTAMPTZ | Last update timestamp |

### Table: `tickets`

Stores information about all created tickets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Ticket ID (format: `ticket-{userId}-{timestamp}`) Primary Key |
| `ticket_number` | INTEGER | 4-digit display number (e.g., 1234) |
| `guild_id` | TEXT | Discord server ID |
| `channel_id` | TEXT | Ticket channel ID |
| `user_id` | TEXT | User ID who created the ticket |
| `claimed_by` | TEXT | Staff user ID who claimed (nullable) |
| `status` | TEXT | Ticket status: `open`, `claimed`, or `closed` |
| `created_at` | TIMESTAMPTZ | Ticket creation timestamp |
| `closed_at` | TIMESTAMPTZ | Ticket closure timestamp (nullable) |

### Table: `ticket_messages`

Stores message history for ticket transcripts (optional logging).

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Auto-incrementing message ID (Primary Key) |
| `ticket_id` | TEXT | References `tickets.id` |
| `message_id` | TEXT | Discord message ID |
| `user_id` | TEXT | User who sent the message |
| `username` | TEXT | Username at time of message |
| `content` | TEXT | Message content |
| `created_at` | TIMESTAMPTZ | Message timestamp |

### Indexes

Optimized indexes for common queries:

- `idx_guild_configs_enabled` - Active guild configurations
- `idx_tickets_guild_id` - Tickets by server
- `idx_tickets_user_id` - Tickets by user
- `idx_tickets_status` - Tickets by status
- `idx_tickets_channel_id` - Tickets by channel
- `idx_tickets_user_active` - Active tickets by user in a server
- `idx_ticket_messages_ticket_id` - Messages by ticket

## Troubleshooting

### Bot Not Responding to Commands

**Symptoms:** Slash commands don't appear in the command menu or don't execute.

**Solutions:**

1. **Verify Bot Invite Scopes:**
   - Ensure bot was invited with both `bot` and `applications.commands` scopes
   - Re-generate invite link and re-invite if needed

2. **Check Bot Permissions:**
   - Bot needs Administrator permission or all required permissions listed above
   - Verify bot role is not below restricted roles in server settings

3. **Wait for Command Sync:**
   - Discord can take up to 1 hour to sync global commands
   - Restart your Discord client (Ctrl+R or Cmd+R)
   - Try in incognito/private browsing mode

4. **Verify Bot is Online:**
   - Check bot shows as online in server member list
   - Review console logs for connection errors

5. **Check Console for Errors:**
   - Look for "Failed to deploy commands" errors
   - Verify `CLIENT_ID` matches your application ID

### Database Connection Failures

**Symptoms:** "Failed to connect to Supabase" or "Database operation failed" errors.

**Solutions:**

1. **Verify Credentials:**
   - Double-check `SUPABASE_URL` has no trailing slash
   - Ensure you're using `service_role` key, NOT `anon` key
   - Check for extra spaces or quotes in `.env` file

2. **Check Supabase Project Status:**
   - Free tier projects may pause after inactivity
   - Visit Supabase dashboard to wake the project
   - Set up uptime monitoring to prevent pausing

3. **Verify Database Schema:**
   - Run both SQL scripts in correct order
   - Check Table Editor to confirm tables exist
   - Verify Row Level Security is configured

4. **Network Issues:**
   - Check firewall allows connections to Supabase
   - Verify your IP is not blocked in Supabase settings
   - Test connection using Supabase SQL Editor

5. **Connection Pooling:**
   - If seeing "too many connections" errors
   - Restart the bot to reset connection pool
   - Check if multiple bot instances are running

### Permission Errors When Creating Tickets

**Symptoms:** "Missing permissions" or "Failed to create ticket channel" errors.

**Solutions:**

1. **Check Role Hierarchy:**
   - Bot's role must be ABOVE the ticket category in role hierarchy
   - Go to Server Settings > Roles
   - Drag bot role above all staff roles

2. **Verify Category Permissions:**
   - Bot needs these permissions in the category:
     - View Channels
     - Manage Channels
     - Manage Roles
     - Send Messages
     - Embed Links

3. **Check Category Limit:**
   - Discord categories have a 50 channel maximum
   - Create a new category if limit is reached
   - Run `/reconfigure` to switch categories

4. **Verify Category Exists:**
   - Ensure the category wasn't deleted
   - Run `/reconfigure` to select a new category if needed

### Ticket Panel Not Working

**Symptoms:** Users click button but nothing happens.

**Solutions:**

1. **Check User Has Only One Ticket:**
   - Users can only have one active ticket at a time
   - Close existing ticket before creating a new one
   - Check for orphaned ticket channels

2. **Verify Bot Can See Category:**
   - Bot must have View Channels permission
   - Check category permissions explicitly allow the bot

3. **Review Console Logs:**
   - Look for specific error messages
   - Errors will indicate exact permission or configuration issues

4. **Panel Message Deleted:**
   - If panel message was deleted, run `/reconfigure`
   - Panel will be recreated automatically

### Health Check Endpoint Not Responding

**Symptoms:** Uptime monitor shows bot as down, 503 errors.

**Solutions:**

1. **Check Bot Process:**
   - Verify bot is actually running: `pm2 status`
   - Check for crash errors: `pm2 logs supporthub --err`

2. **Port Configuration:**
   - Verify `PORT` environment variable is set correctly
   - Check firewall allows traffic on the port
   - Ensure port is not already in use

3. **Test Locally:**
   ```bash
   curl http://localhost:3000/health
   ```
   - Should return JSON with bot status
   - If timeout, health check server didn't start

4. **Deployment Platform:**
   - Railway/Render may assign a different port
   - Check platform documentation for PORT variable
   - Some platforms require binding to `0.0.0.0`

### Transcripts Not Saving

**Symptoms:** Closed tickets don't generate transcripts.

**Solutions:**

1. **Check Transcript Channel:**
   - Verify transcript channel still exists
   - Ensure bot has Send Messages and Embed Links permissions
   - Run `/reconfigure` to set a new transcript channel

2. **Verify Database Write:**
   - Check console for database write errors
   - Confirm Supabase connection is active

3. **Message History Permissions:**
   - Bot needs Read Message History permission
   - Without it, bot cannot fetch messages for transcript

## Security

### Best Practices

1. **Environment Variables:**
   - Use different credentials for development and production
   - Rotate tokens if exposed

2. **Discord Token Security:**
   - Treat bot token like a password
   - If leaked, reset immediately in Developer Portal
   - Monitor bot activity for unauthorized usage

3. **Supabase Security:**
   - Use service role key only in backend code
   - Never expose service key in client-side code
   - Enable Row Level Security on all tables
   - Regularly review Supabase API logs

4. **Bot Permissions:**
   - Grant only required permissions
   - Avoid using Administrator permission in production
   - Regularly audit bot's server access

5. **Server Security:**
   - Keep Node.js and dependencies updated
   - Use `npm audit` to check for vulnerabilities
   - Run bot with limited system user (not root)
   - Configure firewall to allow only necessary ports

6. **Database Security:**
   - Regularly backup Supabase database
   - Monitor database queries for unusual activity
   - Use parameterized queries (already implemented)
   - Enable audit logging in Supabase

### Vulnerability Reporting

If you discover a security vulnerability, please email: nayanchandradas@hotmail.com

Do not open public GitHub issues for security vulnerabilities.

## Contributing

Contributions are welcome! Here's how you can help improve SupportHub.

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Open a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Console logs/error messages
   - Node.js version and OS

### Suggesting Features

1. Open an issue with the "enhancement" label
2. Describe the feature and use case
3. Explain how it would benefit users
4. Consider implementation complexity

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes following code style
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request with detailed description

### Development Guidelines

- Follow existing code structure and style
- Add comments for complex logic
- Test with multiple Discord servers
- Verify database operations work correctly
- Update documentation for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

Need help? Have questions? Here are your options:

- **Discord Community:** [Join our Discord](https://discord.gg/u9XfHZN8K9)
- **GitHub Issues:** [Report bugs or request features](https://github.com/nayandas69/supporthub/issues)
- **Documentation:** You're reading it!
- **Email Support:** nayanchandradas@hotmail.com

## Credits

- **Author:** [nayandas69](https://github.com/nayandas69)
- **Built with:**
  - [Discord.js v14](https://discord.js.org/) - Discord API wrapper
  - [Supabase](https://supabase.com/) - PostgreSQL database hosting
  - [Node.js](https://nodejs.org/) - JavaScript runtime
  - [Chalk](https://www.npmjs.com/package/chalk) - Terminal styling
  - [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable management

## Changelog

### Version 1.0.0 (Current)

- Initial release
- Modern slash commands with Discord.js v14
- Supabase PostgreSQL integration
- Multi-server support
- Ticket claiming system
- Automatic transcripts
- Health check endpoint
- Docker support
- Comprehensive documentation

---

Made with dedication by [nayandas69](https://github.com/nayandas69)

Star this repository if you find it useful!
