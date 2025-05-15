/**
 * Database initialization script for Aiven MySQL
 * 
 * This script will:
 * 1. Connect to your Aiven MySQL database
 * 2. Create all required tables
 * 3. Add initial data if needed
 * 
 * Run with: node scripts/init-db.js
 */

const sequelize = require('../config/db');
const User = require('../models/User');
const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const bcrypt = require('bcryptjs');

// Define relationships between models
User.hasMany(Booking);
Booking.belongsTo(User);
Machine.hasMany(Booking);
Booking.belongsTo(Machine);

async function initDatabase() {
  try {
    console.log('Connecting to Aiven MySQL database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    
    console.log('Syncing database models...');
    await sequelize.sync({ force: false });
    console.log('Database models synchronized.');
    
    // Check if we need to create initial machines
    const machineCount = await Machine.count();
    if (machineCount === 0) {
      console.log('Creating initial washing machines...');
      
      // Create 2 machines per floor
      const floors = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];
      
      for (const floor of floors) {
        for (let i = 1; i <= 2; i++) {
          await Machine.create({
            machineNumber: i,
            floorNumber: floor,
            status: 'Available'
          });
        }
      }
      
      console.log('Created 10 washing machines (2 per floor).');
    } else {
      console.log(`Found ${machineCount} existing machines. Skipping creation.`);
    }
    
    // Check if we need to create an admin user
    const adminEmail = 'admin@kiit.ac.in';
    const adminExists = await User.findOne({ where: { email: adminEmail } });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        floor: '4th Floor',
        password: hashedPassword,
        washesLeft: 999,
        mobileNumber: '1234567890'
      });
      
      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists. Skipping creation.');
    }
    
    console.log('Database initialization complete!');
    
  } catch (error) {
    console.error('Database initialization failed:');
    console.error(error);
  } finally {
    process.exit();
  }
}

initDatabase(); 