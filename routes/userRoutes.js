const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const { bookMachine } = require('../controllers/bookingController');
const {
    getAllMachines,
    getMachinesWithStatus
} = require('../controllers/machineController');

// Route definitions
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/book', bookMachine);

router.get('/machines', getAllMachines); // All machines
router.get('/machines/status', getMachinesWithStatus); // Machines with booking status

module.exports = router;
