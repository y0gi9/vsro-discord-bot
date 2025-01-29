const { EmbedBuilder } = require('discord.js');
const { getMainRequest } = require('./utils/database');
const sql = require('mssql');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Constants - access environment variables through process.env
const NOTIFICATION_POLLING_INTERVAL = process.env.CHECK_NOTIFICATIONS_INTERVAL || 5000;
const PLAYER_COUNT_POLLING_INTERVAL = process.env.PLAYER_COUNT_POLLING_INTERVAL || 30000;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DISCORD_ONLINE_PLAYERS_CHANNEL_ID = process.env.DISCORD_ONLINE_PLAYERS_CHANNEL_ID;
const DISCORD_TOTAL_PLAYERS_CHANNEL_ID = process.env.DISCORD_TOTAL_PLAYERS_CHANNEL_ID;
const ENABLE_NOTIFICATION_LOGGING = process.env.CHECK_NOTIFICATIONS_LOGGING === 'true';

// Add debug logging at startup
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
           Made with ❤️ by @y0gi9 \x1b[0m
  `
);
  
  
console.log('Environment Variables Loaded:');
console.log('DISCORD_ONLINE_PLAYERS_CHANNEL_ID:', process.env.DISCORD_ONLINE_PLAYERS_CHANNEL_ID);
console.log('DISCORD_TOTAL_PLAYERS_CHANNEL_ID:', process.env.DISCORD_TOTAL_PLAYERS_CHANNEL_ID);
console.log('DISCORD_CHANNEL_ID:', process.env.DISCORD_CHANNEL_ID);
console.log('CHECK_NOTIFICATIONS_INTERVAL:', NOTIFICATION_POLLING_INTERVAL);

let notificationPollingInterval = null;
let playerCountPollingInterval = null;

const activeCountdowns = new Map();
const activeGiveaways = new Map();

function startNotificationPolling(client, logger) {
  if (notificationPollingInterval) {
    return;
  }

  logger.info('Starting notification polling service...');
  
  setTimeout(() => {
    checkForNewNotifications(client, logger);
    notificationPollingInterval = setInterval(() => {
      checkForNewNotifications(client, logger);
    }, NOTIFICATION_POLLING_INTERVAL);
  }, 5000);
}

// Function to start player count polling
function startPlayerCountPolling(client, logger) {
  if (playerCountPollingInterval) {
    return;
  }

  logger.info('Starting player count polling service...');
  
  setTimeout(() => {
    updatePlayerCountChannels(client, logger);
    playerCountPollingInterval = setInterval(() => {
      updatePlayerCountChannels(client, logger);
    }, PLAYER_COUNT_POLLING_INTERVAL);
  }, 5000);
}

// Function to check for new notifications
async function checkForNewNotifications(client, logger) {
  try {
    if (!client.isReady()) {
      return;
    }

    const request = await getMainRequest();
    
    // Use a single query with OUTPUT clause to atomically get and update notifications
    const result = await request.query(`
      UPDATE TOP (5) notifications
      SET sent = 1
      OUTPUT 
        deleted.id,
        deleted.type,
        deleted.title,
        deleted.description,
        deleted.image_url,
        deleted.yt_url,
        deleted.countdown_end,
        deleted.giveaway_end
      WHERE sent = 0;
    `);

    if (result.recordset.length > 0) {
      for (const notification of result.recordset) {
        try {
          await processNotification(notification, client, logger);
        } catch (processError) {
          logger.error(`Failed to process notification ${notification.id}: ${processError.message}`);
        }
      }
    }
  } catch (err) {
    logger.error(`Database query error in checkForNewNotifications: ${err.message}`);
  }
}

// Process a single notification based on its type
async function processNotification(notification, client, logger) {
  const { id, type, title, image_url, description, yt_url, countdown_end, giveaway_end } = notification;
  
  logger.info(`Starting to process notification:`, {
    id,
    type,
    title,
    countdown_end,
    description: description?.substring(0, 50)
  });

  try {
    switch(type) {
      case 'image':
        await sendImageNotification(title, description, image_url, id, client, logger);
        break;
      case 'thumbnail':
        await sendThumbnailNotification(title, description, image_url, id, client, logger);
        break;
      case 'youtube':
        await sendVideoNotification(title, description, yt_url, id, client, logger);
        break;
      case 'countdown':
        logger.info(`Processing countdown notification ${id}`);
        if (!countdown_end) {
          logger.error(`Countdown end time is missing for notification ${id}`);
          return;
        }
        
        // Convert SQL datetime to JavaScript Date and handle timezone
        const endDate = new Date(countdown_end);
        // Add 5 hours to match your timezone (adjust this number based on your timezone)
        const adjustedEndDate = new Date(endDate.getTime() + (5 * 60 * 60 * 1000));
        
        logger.info(`Original end date: ${endDate.toISOString()}`);
        logger.info(`Adjusted end date: ${adjustedEndDate.toISOString()}`);
        
        const timeLeft = adjustedEndDate.getTime() - Date.now();
        logger.info(`Time left for countdown: ${timeLeft}ms`);
        
        if (timeLeft <= 0) {
          logger.info(`Countdown ${id} has already ended`);
          return;
        }


        
        // Convert SQL datetime to JavaScript Date and handle timezone
        const giveawayEndDate = new Date(giveaway_end);
        // Add 5 hours to match your timezone (adjust this number based on your timezone)
        const adjustedGiveawayEnd = new Date(giveawayEndDate.getTime() + (5 * 60 * 60 * 1000));
        
        logger.info(`Original giveaway end date: ${giveawayEndDate.toISOString()}`);
        logger.info(`Adjusted giveaway end date: ${adjustedGiveawayEnd.toISOString()}`);
        
        const giveawayTimeLeft = adjustedGiveawayEnd.getTime() - Date.now();
        logger.info(`Time left for giveaway: ${giveawayTimeLeft}ms`);
        
        if (giveawayTimeLeft <= 0) {
          logger.info(`Giveaway ${id} has already ended`);
          return;
        }

        // Send the giveaway notification with adjusted time
        await sendGiveawayNotification(
          title?.replace('??', '🎉'),
          description,
          adjustedGiveawayEnd,
          id,
          client,
          logger
        );
        break;
      default:
        logger.error(`Unknown notification type: ${type}`);
    }
  } catch (err) {
    logger.error(`Error processing notification ${id}: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  }
}

// Function to send an image notification
async function sendImageNotification(title, description, imageUrl, id, client, logger) {
  try {
    logger.info(`Attempting to send image notification ${id}`);
    
    const channel = await fetchChannel(client, DISCORD_CHANNEL_ID);
    if (!channel) {
      throw new Error(`Could not find channel with ID ${DISCORD_CHANNEL_ID}`);
    }

    const embed = new EmbedBuilder()
      .setTitle(title || '📷 Image Notification')
      .setDescription(description)
      .setImage(imageUrl)
      .setColor('#00ff99')
      .setFooter({ text: 'Silkroad Bot - by y0gi9' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await markAsSent(id, logger);
  } catch (err) {
    logger.error(`Error sending image notification ${id}: ${err.message}`);
    throw err;
  }
}
// Function to send an thumbnail notification
async function sendThumbnailNotification(title, description, imageUrl, id, client, logger) {
  try {
    logger.info(`Attempting to send thumbnail notification ${id}`);
    
    const channel = await fetchChannel(client, DISCORD_CHANNEL_ID);
    if (!channel) {
      throw new Error(`Could not find channel with ID ${DISCORD_CHANNEL_ID}`);
    }

    const embed = new EmbedBuilder()
      .setTitle(title || '📷 Image Notification')
      .setDescription(description)
      .setThumbnail(imageUrl)
      .setColor('#00ff99')
      .setFooter({ text: 'Silkroad Bot - by y0gi9' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await markAsSent(id, logger);
  } catch (err) {
    logger.error(`Error sending image notification ${id}: ${err.message}`);
    throw err;
  }
}
// Function to send a video notification
async function sendVideoNotification(title, description, videoUrl, id, client, logger) {
  try {
    const channel = await fetchChannel(client, DISCORD_CHANNEL_ID);
    const embed = new EmbedBuilder()
      .setTitle(title || '🎥 Video Notification')
      .setDescription(description)
      .setColor('#ff0000')
      .setFooter({ text: 'Silkroad Bot - by y0gi9' })
      .setTimestamp();

    await channel.send({ content: videoUrl, embeds: [embed] });
    await markAsSent(id, logger);
  } catch (err) {
    logger.error(`Error sending video notification: ${err.message}`);
  }
}



// Function to update player count channels
async function updatePlayerCountChannels(client, logger) {
  try {
    if (!process.env.DISCORD_ONLINE_PLAYERS_CHANNEL_ID || !process.env.DISCORD_TOTAL_PLAYERS_CHANNEL_ID) {
      logger.warn('Channel IDs are missing in environment variables.');
      return;
    }

    // Get online players count
    try {
      const onlineQuery = 'SELECT COUNT(*) AS count FROM vPlus.._OnlinePlayers';
      const onlinePlayers = await getPlayerCount(onlineQuery, 'Online');

      await updateChannelName(
        process.env.DISCORD_ONLINE_PLAYERS_CHANNEL_ID,
        onlinePlayers > 0 ? `Online Players: ${onlinePlayers}` : 'Offline',
        client,
        logger
      );
    } catch (onlineError) {
      logger.error(`Error updating online players: ${onlineError.message}`);
    }

    // Get total players count
    try {
      const totalQuery = 'SELECT COUNT(*) AS count FROM SRO_VT_ACCOUNT..TB_User';
      const totalPlayers = await getPlayerCount(totalQuery, 'Total');

      await updateChannelName(
        process.env.DISCORD_TOTAL_PLAYERS_CHANNEL_ID,
        `Total Players: ${totalPlayers}`,
        client,
        logger
      );
    } catch (totalError) {
      logger.error(`Error updating total players: ${totalError.message}`);
    }

  } catch (err) {
    logger.error(`Error in updatePlayerCountChannels: ${err.message}`);
    logger.error(err.stack);
  }
}

// Updated getPlayerCount function to handle both types of counts
async function getPlayerCount(query, type) {
  try {
    const request = await getMainRequest();
    const result = await request.query(query);
    
    // Log the raw result for debugging
    console.log(`[DEBUG] ${type} query result:`, result.recordset[0]);
    
    // Get the first column of the first row, regardless of its name
    const count = Object.values(result.recordset[0])[0];
    
    if (typeof count !== 'number') {
      throw new Error(`Invalid count returned for ${type}: ${count}`);
    }
    
    return count;
  } catch (err) {
    throw new Error(`Database query error for ${type} count: ${err.message}`);
  }
}

// Utility function to fetch a Discord channel by ID
async function fetchChannel(client, channelId) {
  try {
    if (!channelId || !client) {
      throw new Error('Missing required parameters: client or channelId');
    }
    
    // Try getting from cache first
    let channel = client.channels.cache.get(channelId);
    if (channel) {
      return channel;
    }
    
    // If not in cache, try fetching
    channel = await client.channels.fetch(channelId);
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    return channel;
  } catch (error) {
    throw new Error(`Error fetching channel: ${error.message}`);
  }
}

// Utility function to mark a notification as sent
async function markAsSent(id, logger) {
  try {
    logger.info(`Notification ${id} has been marked as sent`);
  } catch (err) {
    logger.error(`Error with notification ${id} status: ${err.message}`);
    throw err;
  }
}

// Utility function to update a channel name
async function updateChannelName(channelId, name, client, logger) {
  try {
    if (!channelId) {
      throw new Error(`Invalid channel ID: ${channelId}`);
    }

    const channel = await fetchChannel(client, channelId);
    if (!channel) {
      throw new Error(`Channel not found for ID: ${channelId}`);
    }

    const updated = await channel.setName(name);
    logger.info(`Updated channel name to ${updated.name}`);
    return updated;
  } catch (err) {
    logger.error(`Error updating channel name for ID ${channelId}: ${err.message}`);
    throw err;
  }
}

// Add cleanup function for bot shutdown
function cleanupCountdowns() {
  // Clear countdown intervals
  for (const interval of activeCountdowns.values()) {
    clearInterval(interval);
  }
  activeCountdowns.clear();

  // Clear giveaway timeouts
  for (const timeout of activeGiveaways.values()) {
    clearTimeout(timeout);
  }
  activeGiveaways.clear();
}



// Add this utility function for debugging time
function debugTimeInfo(date, logger) {
    logger.info('Time Debug Info:', {
        originalDate: date,
        currentTime: new Date(),
        timeLeft: date.getTime() - Date.now(),
        localTime: new Date().toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset()
    });
}

module.exports = {
  startNotificationPolling,
  startPlayerCountPolling,
  updatePlayerCountChannels,
  sendImageNotification,
  sendVideoNotification,
  cleanupCountdowns,
  sendThumbnailNotification
};
