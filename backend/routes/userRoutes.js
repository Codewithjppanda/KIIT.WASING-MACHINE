const express = require('express');
const router = express.Router();
const { registerUser, loginUser, checkEmail, getCurrentUser, verifyPassword, requestPasswordReset, resetPassword } = require('../controllers/userController');
const { bookMachine, getActiveBookings } = require('../controllers/bookingController');
const {
    getAllMachines,
    getMachinesWithStatus
} = require('../controllers/machineController');
const { startMachine } = require('../controllers/bookingController');
const { getRemainingWashes } = require('../controllers/userController');

router.get('/washes-left', getRemainingWashes);

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/check-email', checkEmail);
router.get('/check-email', checkEmail);

// Booking
router.post('/book', bookMachine);
router.get('/bookings/active', getActiveBookings);
router.post('/start/:machineId', startMachine);

// Machines with booking status
router.get('/machines/status', getMachinesWithStatus);

router.get('/me', getCurrentUser);

// DEBUG: tell me which DB I'm using
router.get('/dbinfo', (req, res) => {
  res.json({ host: process.env.DB_HOST, database: process.env.DB_NAME });
});

module.exports = router;
