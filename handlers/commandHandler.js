const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadCommands(client, logger) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            logger.info(`Loaded command: ${command.data.name}`);
        } else {
            logger.warn(`Invalid command file: ${file}`);
        }
    }
}

function handleCommands(client, logger) {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            logger.error(`Command not found: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction, logger);
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}: ${error.message}`);
            const reply = { content: 'There was an error executing this command!', ephemeral: true };
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    });
}

module.exports = {
    loadCommands,
    handleCommands
}; 