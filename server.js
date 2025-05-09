const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const userRoutes = require('./routes/userRoutes');  // Import routes

dotenv.config();

const app = express();
app.use(express.json());  // Body parser

// Connect Database
sequelize.authenticate()
    .then(() => console.log('Database connected ✅'))
    .catch((err) => console.error('Database connection error:', err));

sequelize.sync({ force: false })
    .then(() => console.log('Tables synced ✅'))
    .catch((err) => console.error('Error syncing tables:', err));

// Routes
app.use('/api/users', userRoutes);  // Correctly use the routes

app.get('/', (req, res) => {
    res.send('Hello from Washing Machine App 🚀');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = { app, sequelize };
