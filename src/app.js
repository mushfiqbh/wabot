const config = require('./utils/config');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./api/routes/authRoutes');
const messageRoutes = require('./api/routes/messageRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/', messageRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;
