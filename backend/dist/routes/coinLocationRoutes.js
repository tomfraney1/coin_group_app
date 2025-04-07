"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const coinLocationService_1 = require("../services/coinLocationService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
// Assign coin to location
router.post('/assign', (async (req, res, next) => {
    var _a;
    try {
        const { coinId, location } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!coinId || !location || !userId) {
            console.error('Missing required fields:', { coinId, location, userId });
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        if (!['UCB', '1NAT', 'AMER', 'FID', 'WMP'].includes(location)) {
            res.status(400).json({ error: 'Invalid location' });
            return;
        }
        await coinLocationService_1.coinLocationService.assignCoinToLocation(coinId, location, userId);
        res.json({ message: 'Coin location updated successfully' });
    }
    catch (error) {
        console.error('Error in assign route:', error);
        next(error);
    }
}));
// Get coin location
router.get('/:coinId', (async (req, res, next) => {
    try {
        const location = await coinLocationService_1.coinLocationService.getCoinLocation(req.params.coinId);
        if (!location) {
            res.status(404).json({ error: 'Coin location not found' });
            return;
        }
        res.json(location);
    }
    catch (error) {
        next(error);
    }
}));
// Get location history for a coin
router.get('/:coinId/history', (async (req, res, next) => {
    try {
        const history = await coinLocationService_1.coinLocationService.getLocationHistory(req.params.coinId);
        res.json(history);
    }
    catch (error) {
        next(error);
    }
}));
// Get counts for all locations
router.get('/counts', (async (req, res, next) => {
    try {
        const counts = await coinLocationService_1.coinLocationService.getLocationCounts();
        res.json(counts);
    }
    catch (error) {
        next(error);
    }
}));
// Get all coins in a location
router.get('/location/:location', (async (req, res, next) => {
    try {
        const location = req.params.location;
        if (!['UCB', '1NAT', 'AMER', 'FID', 'WMP'].includes(location)) {
            res.status(400).json({ error: 'Invalid location' });
            return;
        }
        const coins = await coinLocationService_1.coinLocationService.getCoinsByLocation(location);
        res.json(coins);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
