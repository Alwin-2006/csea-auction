import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import { initializeSocket } from './socket.js';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import bidRoutes from './routes/bids.js';
import { initAuctionCron } from './controller/sendEmail.js';


const app = express();
const server = createServer(app);
const PORT = process.env.PORT ;
// CORS configuration
const corsOptions = {
  origin:[ process.env.FRONTEND_URL , 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));

app.use(express.json());  
app.use(express.urlencoded({ extended: true }));

// Connect to database
 connectDB().then(() => {
  // 2. Initialize the Cron Job after DB is connected
  initAuctionCron()
});
// Initialize Socket.io
initializeSocket(server);

// Routes
console.log('Registering auth routes...');
app.use('/api/auth', authRoutes); 
app.use('/api/bid', bidRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});