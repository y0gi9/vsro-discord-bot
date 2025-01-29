const sql = require('mssql');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Main database config (Y0GI)
const mainDbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || '', // Add default empty string
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

// Shard database config (SRO_VT_SHARD)
const shardDbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || '', // Add default empty string
    database: process.env.SHARD_DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

// Create pool for each database
const mainPool = new sql.ConnectionPool(mainDbConfig);
const shardPool = new sql.ConnectionPool(shardDbConfig);

let mainConnected = false;
let shardConnected = false;

async function getShardRequest() {
    if (!shardConnected) {
        await shardPool.connect();
        shardConnected = true;
    }
    return new sql.Request(shardPool);
}

async function getMainRequest() {
    if (!mainConnected) {
        await mainPool.connect();
        mainConnected = true;
    }
    return new sql.Request(mainPool);
}

module.exports = {
    getShardRequest,
    getMainRequest
}; 