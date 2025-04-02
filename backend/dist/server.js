"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// CORS configuration for production
const corsOptions = {
    origin: ['https://d30ph5p0cjfaop.cloudfront.net'],
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// MongoDB connection with production URI
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
}
mongoose_1.default.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if cannot connect to database
});
// Health check endpoint
app.get('/health', (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    if (dbState === 1) {
        res.status(200).json({ status: 'healthy', db: 'connected' });
    }
    else {
        res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
    }
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Coin Group App API' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
