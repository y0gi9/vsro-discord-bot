const { SlashCommandBuilder } = require('discord.js');
const sql = require('mssql');
const { getShardRequest } = require('../utils/database');
const { checkPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addgold')
        .setDescription('Add gold to a character')
        .addStringOption(option =>
            option.setName('charname')
                .setDescription('Character name')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of gold to add')
                .setRequired(true)),

    async execute(interaction, logger) {
        if (!checkPermission(interaction)) return;
        try {
            const charName = interaction.options.getString('charname');
            const amount = interaction.options.getInteger('amount');

            // Defer reply since SQL query might take time
            await interaction.deferReply();

            const request = await getShardRequest();
            request.input('charName', sql.NVarChar, charName);
            request.input('amount', sql.BigInt, amount);

            const query = `
                UPDATE _Char 
                SET RemainGold = RemainGold + @amount 
                WHERE CharName16 = @charName`;

            const result = await request.query(query);

            if (result.rowsAffected[0] > 0) {
                await interaction.editReply(`Successfully added ${amount} gold to ${charName}`);
                logger.info(`Added ${amount} gold to ${charName} by ${interaction.user.tag}`);
            } else {
                await interaction.editReply(`Character ${charName} not found`);
            }
        } catch (error) {
            logger.error(`Error in addgold command: ${error.message}`);
            await interaction.editReply('An error occurred while processing your request.');
        }
    },
}; 