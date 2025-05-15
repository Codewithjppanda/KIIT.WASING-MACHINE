const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

// Configure Sequelize with Aiven MySQL
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        dialectOptions: {
            ssl: process.env.DB_SSL === 'true' ? {
                rejectUnauthorized: true
            } : false
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    }
);

module.exports = sequelize;
