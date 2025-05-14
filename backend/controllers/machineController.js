const Machine = require('../models/Machine');
const Booking = require('../models/Booking');
const { Op } = require('sequelize');

// ✅ Get all machines
exports.getAllMachines = async (req, res) => {
    try {
        const machines = await Machine.findAll();
        res.json({ machines });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching all machines' });
    }
};

// ✅ Get machines with current booking status
exports.getMachinesWithStatus = async (req, res) => {
    try {
        const machines = await Machine.findAll();
        const now = new Date();

        const activeBookings = await Booking.findAll({
            where: {
                startTime: { [Op.lte]: now },
                endTime: { [Op.gte]: now }
            }
        });

        const bookingMap = {};
        activeBookings.forEach(booking => {
            bookingMap[booking.machineId] = {
                startTime: new Date(booking.startTime),
                endTime: new Date(booking.endTime)
            };
        });

        const machinesWithStatus = machines.map(machine => {
            const booking = bookingMap[machine.id];
            let status = 'Available';
            let bookingInfo = null;

            if (booking) {
                const washEndTime = new Date(booking.startTime.getTime() + 45 * 60000); // 45 mins wash

                if (now < washEndTime) {
                    status = 'Washing';
                } else if (now >= washEndTime && now <= booking.endTime) {
                    status = 'Ready to Collect';
                }

                bookingInfo = {
                    startTime: booking.startTime,
                    endTime: booking.endTime
                };
            }

            return {
                id: machine.id,
                machineNumber: machine.machineNumber,
                status,
                booking: bookingInfo
            };
        });

        res.json({ machines: machinesWithStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching machines' });
    }
};
