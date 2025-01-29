const { SlashCommandBuilder } = require('discord.js');
const sql = require('mssql');
const { getShardRequest } = require('../utils/database');
const { checkPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsilk')
        .setDescription('Add silk to a character')
        .addStringOption(option =>
            option.setName('charname')
                .setDescription('Character name')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of silk to add')
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
            DECLARE @CharName16 varchar(64)
            DECLARE @UserID INT
            DECLARE @silk int
            SET @silk = @amount --Silk Here
            SET @CharName16 = @Charname --CharName here
            SET @UserID = (select UserJID from _User where CharID = (SELECT CharID FROM _Char where CharName16 = @CharName16))
            UPDATE SRO_VT_ACCOUNT.dbo.SK_Silk set silk_own = silk_own + @silk where JID = @UserID`;

            const result = await request.query(query);

            if (result.rowsAffected[0] > 0) {
                await interaction.editReply(`Successfully added ${amount} silk to ${charName}`);
                logger.info(`Added ${amount} silk to ${charName} by ${interaction.user.tag}`);
            } else {
                await interaction.editReply(`Character ${charName} not found`);
            }
        } catch (error) {
            logger.error(`Error in addsilk command: ${error.message}`);
            await interaction.editReply('An error occurred while processing your request.');
        }
    },
}; 