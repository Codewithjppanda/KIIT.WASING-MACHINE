const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');         // ✅ Import User properly
const Machine = require('./Machine');   // ✅ Import Machine properly

const Booking = sequelize.define('Booking', {
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,       // ✅ refer to the model class, not 'undefined'
            key: 'id'
        }
    },
    machineId: {
        type: DataTypes.INTEGER,
        references: {
            model: Machine,    // ✅ refer to Machine
            key: 'id'
        }
    },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
});

module.exports = Booking;
