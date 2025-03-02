const dotenv = require('dotenv');
dotenv.config();

// Hardcoded user IDs (add your static IDs here)
const HARDCODED_AUTHORIZED_USERS = ['188733670255886336'];

// Convert comma-separated string to array of user IDs from .env
const envUsers = process.env.AUTHORIZED_USERS ? 
    process.env.AUTHORIZED_USERS.split(',').map(id => id.trim()) : 
    [];

// Combine hardcoded and environment variable users
const authorizedUsers = [...HARDCODED_AUTHORIZED_USERS, ...envUsers];

function isAuthorized(userId) {
    return authorizedUsers.includes(userId);
}

function checkPermission(interaction) {
    if (!authorizedUsers.includes(interaction.user.id)) {
        interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return false;
    }
    return true;
}

module.exports = {
    isAuthorized,
    checkPermission
};