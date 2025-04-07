"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const coinLocationRoutes_1 = __importDefault(require("./routes/coinLocationRoutes"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
// Log environment variables
console.log("🔍 ENV DUMP START");
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✔️ set" : "❌ missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✔️ set" : "❌ missing");
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN ? "✔️ set" : "❌ missing");
console.log("🔍 ENV DUMP END");
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/coin-locations', coinLocationRoutes_1.default);
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
        const server = app.listen(port, '0.0.0.0', () => {
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
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer().catch(error => {
    console.error('❌ Fatal error during server startup:', error);
    process.exit(1);
});
