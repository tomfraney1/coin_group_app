import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import coinScannerRoutes from './routes/coinScannerRoutes';
import caseRoutes from './routes/caseRoutes';
import stockTakeRoutes from './routes/stockTakeRoutes';
import spotPriceRoutes from './routes/spotPriceRoutes';
import { connectDB } from './config/database';
import { createSpotPriceTable } from './models/spotPrice';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coin-scanner', coinScannerRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/stock-take', stockTakeRoutes);
app.use('/api/spot-price', spotPriceRoutes);

// Database initialization
const initializeDatabase = async () => {
  try {
    await connectDB();
    await createSpotPriceTable();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase();

export default app; 