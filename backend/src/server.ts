import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// CORS configuration for production and development
const corsOptions = {
  origin: [
    'https://d30ph5p0cjfaop.cloudfront.net',
    'http://localhost:5173',  // Vite development server
    'http://localhost:5174',  // Alternative Vite port
    'http://localhost:5175',  // Current Vite port
    'http://localhost:3000'   // Alternative development port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection URI based on environment
const MONGODB_URI = isDevelopment
  ? 'mongodb://127.0.0.1:27017/coin_group_app'  // Use explicit IP instead of localhost
  : process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

// MongoDB connection options
const mongooseOptions = {
  serverApi: {
    version: '1' as const,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority' as const,
};

mongoose.connect(MONGODB_URI, mongooseOptions)
.then(() => {
  console.log('Connected to MongoDB');
  // Send a ping to confirm a successful connection
  mongoose.connection.db.admin().ping()
    .then(() => console.log('Successfully pinged MongoDB deployment'))
    .catch(err => console.error('Error pinging MongoDB:', err));
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  if (isDevelopment) {
    console.log('Development mode: Please ensure MongoDB is running locally');
  }
  process.exit(1); // Exit if cannot connect to database
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  if (dbState === 1) {
    res.status(200).json({ status: 'healthy', db: 'connected' });
  } else {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});

// Routes - handle both with and without /api prefix
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Coin Group App API' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 