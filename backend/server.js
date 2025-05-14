const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const userRoutes = require('./routes/userRoutes');  // Import routes
const jwt = require('jsonwebtoken');
const User = require('./models/User');  // Changed 'user' to 'User' to match actual file casing
const { DataTypes } = require('sequelize');

dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Use environment variable or default to localhost
    credentials: true
  }));
   
app.use(express.json());  // Body parser

// Connect Database
sequelize.authenticate()
    .then(() => console.log('Database connected ✅'))
    .catch((err) => console.error('Database connection error:', err));

sequelize.sync({ force: false }) // ALWAYS use force:false in production
    .then(async () => {
        try {
            // Safe way to add columns
            await sequelize.getQueryInterface().addColumn('Users', 'resetToken', {
                type: DataTypes.STRING,
                allowNull: true
            });
            await sequelize.getQueryInterface().addColumn('Users', 'resetTokenExpiry', {
                type: DataTypes.DATE,
                allowNull: true
            });
            console.log('Reset token columns added ✅');
        } catch (err) {
            // Column might already exist, ignore error
            console.log('Column update skipped:', err.message);
        }
        console.log('Tables synced ✅');
    })
    .catch((err) => console.error('Error syncing tables:', err));

// Routes
app.use('/api/users', userRoutes);  // Correctly use the routes

app.get('/', (req, res) => {
    res.send('Hello from Washing Machine App 🚀');
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running' });
});

exports.getRemainingWashes = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Token missing' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);

            if (!user) return res.status(404).json({ message: 'User not found' });

            return res.status(200).json({ washesLeft: user.washesLeft });
        } catch (error) {
            // Token expired or invalid
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired', 
                    code: 'TOKEN_EXPIRED'
                });
            } else {
                return res.status(401).json({ 
                    message: 'Invalid token', 
                    code: 'INVALID_TOKEN'
                });
            }
        }
    } catch (error) {
        console.error('Error in getRemainingWashes:', error);
        res.status(500).json({ message: 'Error retrieving wash count' });
    }
};

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = { app, sequelize };
