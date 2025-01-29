Discord Bot for Notifications and Player Management

A robust, feature-packed Discord bot designed for managing notifications, tracking player counts, and executing dynamic commands. Built with modularity and scalability in mind, this bot integrates seamlessly with databases and leverages the Discord API to enhance community engagement. Perfect for gaming communities like Classic Silkroad Online.

---

🚀 Features

- Notification System:
  - Automatically fetches and sends image and video notifications from a database.
  - Marks notifications as sent after successful delivery.

- Player Count Tracking:
  - Updates Discord channel names with live online and total player counts from the database.

- Command System:
  - Fully customizable commands stored in the `commands` directory.
  - Simple deployment for guild-specific or global commands.

- Advanced Logging:
  - Comprehensive logs with Winston for debugging and monitoring.

- Environment Variable Support:
  - Configurable via a `.env` file for quick setup and management.

---

🛠️ Installation

Prerequisites

- Node.js (v16.6 or higher)
- npm (bundled with Node.js)
- Microsoft SQL Server (for database interactions)

Steps

1. Clone the Repository
```
   git clone <repository-url>
   cd <project-directory>
```
2. Install Dependencies
```
   npm install
```
3. Set Up Environment Variables
   Create a `.env` file in the root directory with the following keys:
```
   CLIENT_ID=**YOUR DISCORD BOT CLIENT ID**
   DISCORD_BOT_TOKEN=**YOUR DISCORD BOT TOKEN**
   DISCORD_CHANNEL_ID=**YOUR DISCORD CHANNEL ID FOR NOTIFICATIONS**
   DISCORD_ONLINE_PLAYERS_CHANNEL_ID=**READ ONLY TEXT CHANNEL FOR ONLINE PLAYERS**
   DISCORD_TOTAL_PLAYERS_CHANNEL_ID=**READ ONLY TEXT CHANNEL FOR TOTAL PLAYERS**
   DISCORD_LOG_CHANNEL_ID=**YOUR HIDDEN DISCORD LOG CHANNEL**
   DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=**NAME OF DB WITH NOTIFICATIONS TABLE**
   SHARD_DB_NAME=SRO_VT_SHARD
   NOTIFICATION_POLLING_INTERVAL=5000 #READING NOTIFICATIONS FROM DB
   PLAYER_COUNT_POLLING_INTERVAL=30000 #READING PLAYER STATUS FROM DB
   GUILD_IDS=**SERVER ID**
```
4. Load Commands
```
   node deploy-commands.js
``` 
5. Run the Bot
```
   node bot.js   
```
6. Install Notification Table
```
	USE DISCORD_BOT
GO

/****** Object:  Table [dbo].[notifications]    Script Date: 23/01/2025 11:31:59 pm ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[notifications](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[type] [varchar](50) NOT NULL,
	[description] [text] NULL,
	[image_url] [varchar](255) NULL,
	[countdown_end] [datetime] NULL,
	[giveaway_end] [datetime] NULL,
	[guild_id] [varchar](50) NULL,
	[sent] [bit] NULL,
	[created_at] [datetime] NULL,
	[yt_url] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [sent]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT (getdate()) FOR [created_at]
GO
```
7. Modify Online Char
function.js - line 292
```
const onlineQuery = 'SELECT COUNT(*) AS count FROM vPlus.._OnlinePlayers';  
```
8. Modify Total Char
function.js - line 307
```
const totalQuery = 'SELECT COUNT(*) AS count FROM SRO_VT_ACCOUNT..TB_User';  
```

9. ***If you need to edit or see the commands you can find them in the commands folder with the following names**
```addgold.js
checkgold.js
addsilk.js
checksilk.js```

---

⚙️ Deployment of Commands in Discord

/ADDGOLD [charname] [amount]
/CHECKGOLD [charname]
/ADDSILK [charname] [amount]
/CHECKSILK [charname]


🔔 Sending Notifications
Thumbnail Notification Example:
```
INSERT INTO notifications (type, title, description, image_url)
VALUES (
    'thumbnail',
    'New Server Features!',
    'Check out our latest updates...',
    'https://longwhitecloudqigong.com/wp-content/uploads/2017/06/board-361516_1920.jpg'
);
```
Image Notification Example:
```
INSERT INTO notifications (type, title, description, image_url)
VALUES (
    'image',
    'New Server Features!',
    'Check out our latest updates...',
    'https://longwhitecloudqigong.com/wp-content/uploads/2017/06/board-361516_1920.jpg'
);
```
Link Notification Example:
```
INSERT INTO notifications (type, title, description, yt_url)
VALUES (
    'youtube',
    'New Server Features!',
    'Check out our latest updates...',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
);
```

---

📂 Project Structure

📦project-directory
 ┣ 📂commands         # Custom commands directory
 ┣ 📂handlers         # Command handler and interaction logic
 ┣ 📂utils            # Database and helper utilities
 ┣ 📜bot.js           # Main bot script
 ┣ 📜functions.js     # Notification and player tracking logic
 ┣ 📜deploy-commands.js # Script to deploy commands to Discord
 ┣ 📜.env             # Environment configuration (not included in the repo)
 ┗ 📜package.json     # Project metadata and dependencies

---

🧩 Key Functionalities

Notification System
- Automatically retrieves unsent notifications from the database.
- Sends notifications (image or video) to a designated Discord channel.

Player Count Updates
- Periodically queries the database for online and total players.
- Updates designated channel names with the retrieved data.

Command Deployment
- Supports quick and efficient deployment of slash commands to Discord servers.

---

🔧 Customization

Adjust Polling Intervals
Modify the notification and player count polling intervals in the `.env` file:
```
NOTIFICATION_POLLING_INTERVAL=5000
PLAYER_COUNT_POLLING_INTERVAL=30000
```
Add New Commands
1. Create a new file in the `commands/` directory.
2. Export `data` (metadata) and `execute` (command logic).

SQL Queries
- Customize the SQL queries in `functions.js` to match your database schema.

---

🐛 Troubleshooting

- Database Errors:
  - Ensure database credentials are correct in the `.env` file.
  - Verify that required tables exist.

- Bot Not Responding:
  - Check the bot's permissions in Discord.
  - Confirm that commands are properly deployed.

- Command Deployment Fails:
  - Ensure CLIENT_ID and DISCORD_BOT_TOKEN are set in `.env`.

- Unhandled Errors:
  - Check the logs (`bot.log`) for detailed error messages and stack traces.

---

📜 License

This project is licensed under the MIT License.

---

✨ Credits

- Developed by: y0gi9
- Logging Powered by: Winston
- Inspired by: Silkroad Online community needs

---

💡 Contributing

Feel free to open issues or submit pull requests to improve the bot! Suggestions and contributions are always welcome.

---

🌐 Community

- Discord: [Discord Link](https://discord.gg/EvpsQpvjae)
- GitHub Issues: Use this repository's Issues tab to report bugs or suggest features.
