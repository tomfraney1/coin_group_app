import express from 'express';
import cors from 'cors';
import { initializeCaseRoutes } from './routes/caseRoutes';
import publicRoutes from './routes/publicRoutes';
import stockTakeRoutes from './routes/stockTakeRoutes';
import spotPriceRoutes from './routes/spotPriceRoutes';
import CaseNotificationService from './websocket/caseNotifications';
import { connectDB } from './config/database';
import { createSpotPriceTable } from './models/spotPrice';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create server
const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Create notification service
const notificationService = new CaseNotificationService(server);

// Routes
app.use('/api/cases', initializeCaseRoutes(notificationService));
app.use('/api/public', publicRoutes);
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