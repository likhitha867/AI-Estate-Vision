const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with credentials support (for HTTP cookies)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Serve uploads folder as a static route
const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadPath));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/architect_ai')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const authRoute = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const ollamaRoute = require('./routes/ollama');
const pullModelRoute = require('./routes/pullModel');

app.use('/api/auth', authRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/ai', ollamaRoute);
app.use('/api/ai/pull', pullModelRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
