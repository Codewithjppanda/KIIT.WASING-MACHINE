// Import models
const User = require('./User');
const Machine = require('./Machine');
const Booking = require('./Booking');

// Define relationships
// User <-> Booking: One-to-Many
User.hasMany(Booking, {
  foreignKey: 'userId',
  as: 'bookings'
});

Booking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Machine <-> Booking: One-to-Many
Machine.hasMany(Booking, {
  foreignKey: 'machineId',
  as: 'bookings'
});

Booking.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'Machine' // This matches the alias in our getActiveBookings query
});

module.exports = { User, Machine, Booking }; 