// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// CORS: allow Vercel frontend(s). Comma-separate for multiple (e.g. production + preview)
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: frontendOrigins.length ? frontendOrigins : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/members', require('./routes/members'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/stats', require('./routes/stats'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'aXess Backend API is running' });
});

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Connect to DB first, then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend expected at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });