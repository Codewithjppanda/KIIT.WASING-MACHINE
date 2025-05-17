const Booking = require('../models/Booking');
const Machine = require('../models/Machine');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');  
const { Op } = require('sequelize');
const moment = require('moment-timezone');

exports.bookMachine = async (req, res) => {
    try {
      console.log('Booking request received:', req.body);
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Authorization header missing or invalid');
        return res.status(401).json({ message: 'Authorization token missing' });
      }
  
      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.log('JWT verification failed:', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      const userId = decoded.id;
  
      const user = await User.findByPk(userId);
      if (!user) {
        console.log('User not found for ID:', userId);
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.washesLeft <= 0) {
        console.log('User has no washes left:', userId);
        return res.status(403).json({ message: 'No washes left. Please contact admin.' });
      }
  
      const { machineId, startTime: startStr, endTime: endStr } = req.body;
      console.log('Parsed request data:', { machineId, startStr, endStr });
      
      // Parse start/end times
      const startTime = new Date(startStr);
      const endTime = new Date(endStr);
      if (!machineId || !startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.log('Invalid time format or missing data:', { machineId, startTime, endTime });
        return res.status(400).json({ 
          message: 'Please provide valid machine ID and time slots.',
          details: { machineId, startTime: startStr, endTime: endStr }
        });
      }
  
      const machine = await Machine.findOne({ where: { id: machineId } });
      if (!machine) {
        console.log('Machine not found:', machineId);
        return res.status(400).json({ message: 'Machine not found' });
      }
  
      // Validate booking window: only 10 AM – 6 PM IST
      const startIST = moment.tz(startTime, 'Asia/Kolkata');
      const endIST = moment.tz(endTime, 'Asia/Kolkata');
      console.log('Time validation:', { 
        startIST: startIST.format(), 
        endIST: endIST.format(),
        startHour: startIST.hour(),
        endHour: endIST.hour()
      });
  
      if (startIST.hour() < 10 || endIST.hour() > 18 || endIST.isBefore(startIST)) {
        console.log('Invalid booking window:', { startHour: startIST.hour(), endHour: endIST.hour() });
        return res.status(400).json({ 
          message: 'Booking must be between 10 AM and 6 PM IST.',
          details: {
            startTime: startIST.format(),
            endTime: endIST.format()
          }
        });
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
      console.log('Day validation:', {
        userFloor: user.floor,
        bookingDay,
        allowedDays: allowedDays[user.floor]
      });
  
      // Allow only from previous day 6 PM
      const allowedBookingStart = startIST.clone().subtract(1, 'days').hour(18).minute(0).second(0);
      if (currentIST.isBefore(allowedBookingStart)) {
        console.log('Booking too early:', {
          current: currentIST.format(),
          allowedStart: allowedBookingStart.format()
        });
        return res.status(403).json({ 
          message: 'You can only book from 6 PM the previous day.',
          details: {
            currentTime: currentIST.format(),
            allowedStartTime: allowedBookingStart.format()
          }
        });
      }
  
      if (!allowedDays[user.floor] || !allowedDays[user.floor].includes(bookingDay)) {
        console.log('Invalid booking day for floor:', {
          floor: user.floor,
          bookingDay,
          allowedDays: allowedDays[user.floor]
        });
        return res.status(403).json({ 
          message: `Your floor can only book on ${allowedDays[user.floor]?.join(' and ') || 'restricted days'}`,
          details: {
            floor: user.floor,
            bookingDay,
            allowedDays: allowedDays[user.floor]
          }
        });
      }
  
      const existingBooking = await Booking.findOne({
        where: {
          machineId,
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime }
        }
      });
  
      if (existingBooking) {
        console.log('Conflicting booking found:', existingBooking.id);
        return res.status(400).json({ 
          message: 'Machine already booked at that time.',
          details: {
            existingBooking: {
              startTime: existingBooking.startTime,
              endTime: existingBooking.endTime
            }
          }
        });
      }
  
      const bookingEndLimit = new Date(startTime);
      bookingEndLimit.setHours(18, 0, 0, 0); // 6 PM on booking day
      if (endTime > bookingEndLimit) {
        console.log('Booking ends after limit:', {
          endTime: endTime.toISOString(),
          limit: bookingEndLimit.toISOString()
        });
        return res.status(400).json({ 
          message: 'Booking must end by 6 PM on the same day.',
          details: {
            endTime: endTime.toISOString(),
            limit: bookingEndLimit.toISOString()
          }
        });
      }
  
      // Enforce wash + buffer durations: total 55 minutes (45 min wash + 10 min buffer)
      const washMs = 45 * 60 * 1000;
      const bufferMs = 10 * 60 * 1000;
      const totalBookingMs = washMs + bufferMs;
      const actualDuration = endTime.getTime() - startTime.getTime();
      console.log('Duration validation:', {
        expected: totalBookingMs,
        actual: actualDuration,
        difference: Math.abs(totalBookingMs - actualDuration)
      });
      
      if (Math.abs(endTime.getTime() - startTime.getTime() - totalBookingMs) > 1000) { // 1 second tolerance
        return res.status(400).json({ 
          message: 'Booking must be exactly 55 minutes (45 min wash + 10 min buffer).',
          details: {
            expectedDuration: '55 minutes',
            actualDuration: `${Math.round(actualDuration / (60 * 1000))} minutes`
          }
        });
      }
  
      // Use a transaction to ensure consistency
      const result = await Booking.sequelize.transaction(async (t) => {
        const booking = await Booking.create({ userId, machineId, startTime, endTime }, { transaction: t });
        await machine.update({ status: 'Occupied' }, { transaction: t });
        // Reduce washes
        user.washesLeft -= 1;
        await user.save({ transaction: t });
        return booking;
      });
  
      const booking = result;
      console.log('Booking created successfully:', booking.id);
  
      res.status(201).json({
        message: 'Booking successful!',
        booking,
        washesLeft: user.washesLeft,
        note: `Please scan the QR code on Machine ${machine.machineNumber} to start the session.`
      });
  
    } catch (error) {
      console.error('Server error during booking:', error);
      res.status(500).json({ 
        message: 'Server error during booking',
        details: error.message
      });
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
