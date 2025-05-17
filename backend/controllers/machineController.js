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
        // Return each machine with its current DB-stored status
        const machines = await Machine.findAll();
        const machinesWithStatus = machines.map(machine => ({
            id: machine.id,
            machineNumber: machine.machineNumber,
            status: machine.status
        }));
        res.json({ machines: machinesWithStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching machines' });
    }
};
