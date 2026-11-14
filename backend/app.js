const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const profileRoutes = require('./routes/profile');

const app = express();
app.use(cors({ origin: process.env.PROFILE_CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 5001;
const mongoUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/career_guidance';

if (require.main === module) {
  mongoose.connect(mongoUrl)
    .then(() => {
      app.listen(PORT, '127.0.0.1', () => console.log(`Profile API listening locally on ${PORT}`));
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      process.exitCode = 1;
    });
}

module.exports = app;
