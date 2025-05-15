const express = require('express');
const router = express.Router();
const { registerUser, loginUser, checkEmail, getCurrentUser, verifyPassword, requestPasswordReset, resetPassword } = require('../controllers/userController');
const { bookMachine } = require('../controllers/bookingController');
const {
    getAllMachines,
    getMachinesWithStatus
} = require('../controllers/machineController');
const { startMachine } = require('../controllers/bookingController');
const { getRemainingWashes } = require('../controllers/userController');

router.get('/washes-left', getRemainingWashes);

router.post('/start/:machineId', startMachine);

// Route definitions
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/book', bookMachine);
router.get('/check-email', checkEmail);

router.get('/machines', getAllMachines); // All machines
router.get('/machines/status', getMachinesWithStatus); // Machines with booking status

router.get('/me', getCurrentUser);

router.post('/verify-password', verifyPassword);

router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// DEBUG: tell me which DB I'm using
router.get('/dbinfo', (req, res) => {
  res.json({ host: process.env.DB_HOST, database: process.env.DB_NAME });
});

module.exports = router;
