const { SlashCommandBuilder } = require('discord.js');
const sql = require('mssql');
const { getShardRequest } = require('../utils/database');
const { checkPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkgold')
        .setDescription('Check character gold')
        .addStringOption(option =>
            option.setName('charname')
                .setDescription('Character name')
                .setRequired(true)),

    async execute(interaction, logger) {
        if (!checkPermission(interaction)) return;
        try {
            const charName = interaction.options.getString('charname');
            await interaction.deferReply();

            const request = await getShardRequest();
            request.input('charName', sql.NVarChar, charName);

            const query = `
                SELECT TOP 1 CharName16, RemainGold 
                FROM _Char 
                WHERE CharName16 = @charName`;

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const { CharName16, RemainGold } = result.recordset[0];
                const formattedGold = Number(RemainGold).toLocaleString(); // Ensure RemainGold is a number and format it with commas
                await interaction.editReply(`Character **${CharName16}** has **${formattedGold}** gold <:coins:1332192440538628097>`);
                logger.info(`Gold check for ${CharName16} by ${interaction.user.tag}: ${RemainGold} gold`);
            } else {
                await interaction.editReply(`Character **${charName}** not found`);
                logger.warn(`Failed gold check for ${charName} by ${interaction.user.tag}: character not found`);
            }
        } catch (error) {
            logger.error(`Error in checkgold command: ${error.message}`);
            await interaction.editReply('An error occurred while processing your request.');
        }
    },
}; 