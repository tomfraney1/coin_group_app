import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import coinLocationRoutes from './routes/coinLocationRoutes';
import { initializeCaseRoutes } from './routes/caseRoutes';
import publicRoutes from './routes/publicRoutes';
import CaseNotificationService from './websocket/caseNotifications';
import { connectDB } from './config/database';
import stockTakeRoutes from './routes/stockTakeRoutes';

const app = express();
const port = Number(process.env.PORT) || 8080;
const server = createServer(app);

// Initialize WebSocket service
const caseNotificationService = new CaseNotificationService(server);

// Log environment variables
console.log("🔍 ENV DUMP START");
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✔️ set" : "❌ missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✔️ set" : "❌ missing");
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN ? "✔️ set" : "❌ missing");
console.log("🔍 ENV DUMP END");

// Initialize database connection
console.log('🔌 Initializing database connection...');
connectDB().catch(error => {
  console.error('❌ Failed to connect to database:', error);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coin-locations', coinLocationRoutes);
app.use('/api/cases', initializeCaseRoutes(caseNotificationService));
app.use('/api/public', publicRoutes);
app.use('/api/stock-take', stockTakeRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check endpoint called at:', new Date().toISOString());
  console.log('🔍 Request details:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    ip: req.ip,
    ips: req.ips,
    hostname: req.hostname,
    protocol: req.protocol,
    secure: req.secure
  });
  
  const response = { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: 'v31'
  };
  
  console.log('✅ Sending health check response:', response);
  res.status(200).json(response);
});

// Root route
app.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: 'v20'
  });
});

// Start HTTP server with a delay to ensure initialization
console.log('🚀 Starting server initialization...');

const startServer = async () => {
  try {
    // Add a small delay to ensure all initialization is complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    server.listen(port, '0.0.0.0', () => {
      console.log('✅ Server initialization complete');
      console.log('📝 Server details:', {
        port,
        environment: process.env.NODE_ENV || 'development',
        healthCheckUrl: `http://localhost:${port}/api/health`,
        startTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
      });
    });

    // Server error handling
    server.on('error', (err) => {
      console.error('❌ Server error:', {
        error: err,
        stack: err.stack,
        message: err.message,
        timestamp: new Date().toISOString()
      });
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed. Exiting process...');
        process.exit(0);
      });
    });

    // Error handling
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught exception:', {
        error: err,
        stack: err.stack,
        message: err.message,
        timestamp: new Date().toISOString()
      });
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection:', {
        reason,
        promise,
        timestamp: new Date().toISOString()
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('❌ Fatal error during server startup:', error);
  process.exit(1);
}); 