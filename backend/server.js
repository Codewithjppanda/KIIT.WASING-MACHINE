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
    origin: process.env.FRONTEND_URL,    // now matches Vercel exactly
    credentials: true
  }));
   
app.use(express.json());  // Body parser

// Connect Database
sequelize.authenticate()
    .then(() => console.log('Database connected to Aiven MySQL ✅'))
    .catch((err) => {
        console.error('Database connection error:');
        console.error('Error details:', err.message);
        
        if (err.message.includes('Access denied')) {
            console.error('❌ Authentication failed. Check your DB_USER and DB_PASSWORD in .env file');
        } else if (err.message.includes('ECONNREFUSED')) {
            console.error('❌ Connection refused. Check your DB_HOST and DB_PORT in .env file');
        } else if (err.message.includes('SSL')) {
            console.error('❌ SSL connection error. Make sure DB_SSL is set to "true" for Aiven');
        } else if (err.message.includes('Unknown database')) {
            console.error('❌ Database does not exist. Check your DB_NAME in .env file');
        }
    });

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
