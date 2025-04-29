import express from 'express';
import cors from 'cors';
import { initializeCaseRoutes } from './routes/caseRoutes';
import publicRoutes from './routes/publicRoutes';
import stockTakeRoutes from './routes/stockTakeRoutes';
import CaseNotificationService from './websocket/caseNotifications';

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

export default app; 