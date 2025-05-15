const Booking = require('../models/Booking');
const Machine = require('../models/Machine');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');  
const { Op } = require('sequelize');
const moment = require('moment-timezone');

exports.bookMachine = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing' });
      }
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.washesLeft <= 0) {
        return res.status(403).json({ message: 'No washes left. Please contact admin.' });
      }
  
      const { machineId, startTime, endTime } = req.body;
      if (!machineId || !startTime || !endTime) {
        return res.status(400).json({ message: 'Please provide machine ID and time slots.' });
      }
  
      const machine = await Machine.findOne({ where: { id: machineId } });
      if (!machine) {
        return res.status(400).json({ message: 'Machine not found' });
      }
  
      // Validate booking window: only 10 AM – 6 PM IST
      const startIST = moment.tz(startTime, 'Asia/Kolkata');
      const endIST = moment.tz(endTime, 'Asia/Kolkata');
  
      if (startIST.hour() < 10 || endIST.hour() > 18 || endIST.isBefore(startIST)) {
        return res.status(400).json({ message: 'Booking must be between 10 AM and 6 PM IST.' });
      }
  
      // Validate floor-based allowed booking days
      const allowedDays = {
        '4th Floor': ['Monday', 'Friday'],
        '3rd Floor': ['Thursday', 'Sunday'],
        '2nd Floor': ['Wednesday', 'Saturday'],
        '1st Floor': ['Sunday', 'Wednesday'],
        'Ground Floor': ['Sunday', 'Wednesday']
      };
  
      const bookingDay = startIST.format('dddd');
      const currentIST = moment().tz('Asia/Kolkata');
      const currentDay = currentIST.format('dddd');
  
      // Allow only from previous day 6 PM
      const allowedBookingStart = startIST.clone().subtract(1, 'days').hour(18).minute(0).second(0);
      if (currentIST.isBefore(allowedBookingStart)) {
        return res.status(403).json({ message: 'You can only book from 6 PM the previous day.' });
      }
  
      if (!allowedDays[user.floor] || !allowedDays[user.floor].includes(bookingDay)) {
        return res.status(403).json({ message: `Your floor can only book on ${allowedDays[user.floor]?.join(', ') || 'restricted days'}` });
      }
  
      const existingBooking = await Booking.findOne({
        where: {
          machineId,
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime }
        }
      });
  
      if (existingBooking) {
        return res.status(400).json({ message: 'Machine already booked at that time.' });
      }
  
      const bookingEndLimit = new Date(startTime);
      bookingEndLimit.setHours(18, 0, 0, 0); // 6 PM on booking day
      if (endTime > bookingEndLimit) {
        return res.status(400).json({ message: 'Booking must end by 6 PM on the same day.' });
      }
  
      // Check if booking starts at the beginning of an hour
      if (startTime.getMinutes() !== 0 || startTime.getSeconds() !== 0) {
        return res.status(400).json({ message: 'Booking must start at the beginning of an hour.' });
      }
  
      // Check if booking is for exactly 1 hour
      const bookingDuration = (endTime - startTime) / (60 * 60 * 1000); // in hours
      if (bookingDuration !== 1) {
        return res.status(400).json({ message: 'Booking must be for exactly 1 hour.' });
      }
  
      // Check if booking starts between 10 AM and 5 PM
      const hour = startTime.getHours();
      if (hour < 10 || hour > 17) {
        return res.status(400).json({ message: 'Booking must start between 10 AM and 5 PM.' });
      }
  
      const booking = await Booking.create({
        userId,
        machineId,
        startTime,
        endTime
      });
  
      await machine.update({ status: 'Occupied' });
  
      // Reduce washes
      user.washesLeft -= 1;
      await user.save();
  
      res.status(201).json({
        message: 'Booking successful!',
        booking,
        washesLeft: user.washesLeft,
        note: `Please scan the QR code on Machine ${machine.machineNumber} to start the session.`
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during booking' });
    }
  };
  



exports.startMachine = async (req, res) => {
    try {
        const { machineId } = req.params;

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token missing' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const now = new Date();

        // Find ANY booking for this user on this machine for today
        const booking = await Booking.findOne({
            where: {
                userId,
                machineId,
                // Allow scanning 10 min before booking starts
                startTime: { 
                    [Op.between]: [
                        new Date(now.getTime() - 10 * 60 * 1000), // 10 min before now
                        new Date(now.getTime() + 60 * 60 * 1000)  // 1 hour after now
                    ]
                }
            },
            order: [['startTime', 'ASC']] // Get the soonest booking
        });

        if (!booking) {
            return res.status(403).json({ 
                message: 'No upcoming booking found for this machine. Please make a booking first.' 
            });
        }

        // Update the booking status
        booking.status = 'In Progress';
        await booking.save();

        // Update machine status to "Washing"
        await Machine.update(
            { status: 'Washing' },
            { where: { id: machineId } }
        );

        // Calculate when washing ends
        const washEndTime = new Date(booking.startTime.getTime() + 45 * 60 * 1000); // 45 min wash
        
        res.status(200).json({ 
            message: 'Machine started successfully!',
            booking: {
                startTime: booking.startTime,
                washEndTime: washEndTime,
                endTime: booking.endTime
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error starting machine' });
    }
};
