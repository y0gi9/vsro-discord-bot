const { SlashCommandBuilder } = require('discord.js');
const sql = require('mssql');
const { getShardRequest } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checksilk')
        .setDescription('Check silk of a character')
        .addStringOption(option =>
            option.setName('charname')
                .setDescription('Character name')
                .setRequired(true)),

    async execute(interaction, logger) {
        // Remove permission check or implement it properly
        try {
            const charName = interaction.options.getString('charname');

            // Defer reply since SQL query might take time
            await interaction.deferReply();

            const request = await getShardRequest();
            request.input('charName', sql.NVarChar, charName);

            const query = `
                SELECT s.silk_own
                FROM SRO_VT_ACCOUNT.dbo.SK_Silk s
                JOIN SRO_VT_SHARD.dbo._User u ON s.JID = u.UserJID
                JOIN SRO_VT_SHARD.dbo._Char c ON u.CharID = c.CharID
                WHERE c.CharName16 = @charName`;

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const silkAmount = result.recordset[0].silk_own;
                await interaction.editReply(`Character ${charName} has ${silkAmount} silk.`);
                logger.info(`Retrieved silk amount for ${charName}: ${silkAmount}`);
            } else {
                await interaction.editReply(`Character ${charName} not found or has no silk record.`);
            }
        } catch (error) {
            logger.error(`Error in checksilk command: ${error.message}\nStack: ${error.stack}`);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('An error occurred while processing your request.');
            } else {
                await interaction.reply('An error occurred while processing your request.');
            }
        }
    },
};