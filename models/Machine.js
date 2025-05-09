const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Sequelize instance

const Machine = sequelize.define('Machine', {
    machineNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    floorNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Available'
    }
});

module.exports = Machine;
