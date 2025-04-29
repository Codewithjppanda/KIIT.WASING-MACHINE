const Booking = require('../models/Booking');
const Machine = require('../models/Machine');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');  
const { Op } = require('sequelize');

exports.bookMachine = async (req, res) => {
    try {
        // Check if Authorization header exists
        if (!req.headers.authorization) {
            return res.status(400).json({ message: 'Authorization header is missing' });
        }

        // Extract the token from the Authorization header
        const token = req.headers.authorization.split(' ')[1];  // Bearer <token>

        if (!token) {
            return res.status(400).json({ message: 'Token is missing in Authorization header' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { machineId, startTime, endTime } = req.body;

        if (!machineId || !startTime || !endTime) {
            return res.status(400).json({ message: 'Please provide machine ID and time slots.' });
        }

        const machine = await Machine.findOne({ where: { id: machineId } });
        console.log('Machine from DB:', machine?.status);  // See what value is really being matched
        
        console.log('Machine:', machine); 
        if (!machine) {
            return res.status(400).json({ message: 'Machine not available' });
        }

        const existingBooking = await Booking.findOne({
            where: {
                machineId,
                startTime: { [Op.lt]: endTime },  // Check for time overlap
                endTime: { [Op.gt]: startTime }
            }
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Machine already booked at that time.' });
        }

        const booking = await Booking.create({
            userId,
            machineId,
            startTime,
            endTime
        });

        // Update the machine status to 'Occupied'
        await machine.update({ status: 'Occupied' });

        // Generate QR Code for the booking
        const qrCodeData = `http://localhost:5000/api/qr/${booking.id}`; // URL for booking confirmation
        const qrCode = await qrcode.toDataURL(qrCodeData);  // Generate QR code in base64

        // Respond with the booking details and QR code
        res.status(201).json({
            message: 'Booking successful!',
            booking,
            qrCode  // Send the QR code image as base64 data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during booking' });
    }
};
