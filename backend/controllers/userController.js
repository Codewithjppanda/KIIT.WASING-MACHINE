const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendPasswordResetEmail } = require('../utils/email');

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
            token,
            floor: user.floor,
            name: user.name
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ message: 'Email parameter is required' });
        }

        // Check if user exists with this email
        const user = await User.findOne({ where: { email } });
        
        if (user) {
            // User exists
            return res.status(200).json({ 
                exists: true,
                message: 'User with this email exists' 
            });
        } else {
            // User doesn't exist
            return res.status(200).json({ 
                exists: false,
                message: 'User with this email does not exist' 
            });
        }
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ message: 'Server error while checking email' });
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

exports.getCurrentUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user data excluding password
            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Return user data
            return res.status(200).json(user);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.verifyPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, floor: user.floor },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Password verified successfully',
            token,
            floor: user.floor,
            name: user.name
        });
    } catch (error) {
        console.error('Error in verifyPassword:', error);
        res.status(500).json({ message: 'Server error during password verification' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        // Find user by email
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Set token expiry (1 hour)
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        
        // Save token to user record
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();
        
        // Create reset link
        const resetLink = `http://localhost:3000/new-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        // Send email
        const emailSent = await sendPasswordResetEmail(email, resetLink);
        
        if (emailSent) {
            res.status(200).json({ message: 'Password reset email sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send reset email' });
        }
        
    } catch (error) {
        console.error('Error in requestPasswordReset:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;
        
        if (!token || !email || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Find user by email and valid token
        const user = await User.findOne({ 
            where: { 
                email,
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: new Date() } // Token must not be expired
            } 
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update user password and clear reset token
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        
        res.status(200).json({ message: 'Password reset successful' });
        
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};
