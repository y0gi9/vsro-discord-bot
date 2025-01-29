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
        try {
            const charName = interaction.options.getString('charname');

            // Defer reply since SQL query might take time
            await interaction.deferReply();

            const request = await getShardRequest();
            request.input('charName', sql.NVarChar, charName);

            const query = `
            DECLARE @CharName16 VARCHAR(64);
            DECLARE @UserID INT;
            SET @CharName16 = @charName; -- CharName here
            SET @UserID = (
                SELECT UserJID 
                FROM _User 
                WHERE CharID = (
                    SELECT CharID 
                    FROM _Char 
                    WHERE CharName16 = @CharName16
                )
            );
            SELECT silk_own 
            FROM SRO_VT_ACCOUNT.dbo.SK_Silk 
            WHERE JID = @UserID;`;

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const silkAmount = result.recordset[0].silk_own;
                await interaction.editReply(`Character ${charName} has ${silkAmount} silk.`);
                logger.info(`Retrieved silk amount for ${charName}: ${silkAmount}`);
            } else {
                await interaction.editReply(`Character ${charName} not found.`);
            }
        } catch (error) {
            logger.error(`Error in checksilk command: ${error.message}`);
            await interaction.editReply('An error occurred while processing your request.');
        }
    },
};
