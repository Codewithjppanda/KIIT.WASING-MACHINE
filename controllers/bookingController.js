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

        const booking = await Booking.create({
            userId,
            machineId,
            startTime,
            endTime
        });

        await machine.update({ status: 'Occupied' });

        // 🔻 Reduce washes left by 1
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

        const booking = await Booking.findOne({
            where: {
                userId,
                machineId,
                startTime: { [Op.lte]: now },
                endTime: { [Op.gte]: now }
            }
        });

        if (!booking) {
            return res.status(403).json({ message: 'No valid booking found for this machine and time' });
        }

        // Optional: Update booking to "started" if needed
        // booking.status = 'In Progress';
        // await booking.save();

        res.status(200).json({ message: 'Machine timer started successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error starting machine' });
    }
};
