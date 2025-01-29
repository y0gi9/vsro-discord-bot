const dotenv = require('dotenv');
dotenv.config();

// Convert comma-separated string to array of user IDs
const authorizedUsers = process.env.AUTHORIZED_USERS ? 
    process.env.AUTHORIZED_USERS.split(',').map(id => id.trim()) : 
    [];

function isAuthorized(userId) {
    return authorizedUsers.includes(userId);
}

function checkPermission(interaction) {
    const authorizedUsers = process.env.AUTHORIZED_USERS?.split(',') || [];
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