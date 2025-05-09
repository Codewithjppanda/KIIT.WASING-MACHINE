const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, floor, password, mobileNumber } = req.body; // ✅ Include mobileNumber

        if (!name || !email || !floor || !password || !mobileNumber) { // ✅ Check mobileNumber also
            return res.status(400).json({ message: 'Please provide all fields.' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            floor,
            password: hashedPassword,
            mobileNumber   // ✅ Save mobileNumber too
        });

        res.status(201).json({
            message: 'User registered successfully!',
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while registering user.' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, floor: user.floor },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
exports.getRemainingWashes = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Token missing' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.status(200).json({ washesLeft: user.washesLeft });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving wash count' });
    }
};
