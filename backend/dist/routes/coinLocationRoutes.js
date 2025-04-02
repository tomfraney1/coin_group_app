"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
router.post('/assign', ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield coinLocationService_1.coinLocationService.assignCoinToLocation(coinId, location, userId);
        res.json({ message: 'Coin location updated successfully' });
    }
    catch (error) {
        console.error('Error in assign route:', error);
        next(error);
    }
})));
// Get coin location
router.get('/:coinId', ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = yield coinLocationService_1.coinLocationService.getCoinLocation(req.params.coinId);
        if (!location) {
            res.status(404).json({ error: 'Coin location not found' });
            return;
        }
        res.json(location);
    }
    catch (error) {
        next(error);
    }
})));
// Get location history for a coin
router.get('/:coinId/history', ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield coinLocationService_1.coinLocationService.getLocationHistory(req.params.coinId);
        res.json(history);
    }
    catch (error) {
        next(error);
    }
})));
// Get counts for all locations
router.get('/counts', ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const counts = yield coinLocationService_1.coinLocationService.getLocationCounts();
        res.json(counts);
    }
    catch (error) {
        next(error);
    }
})));
// Get all coins in a location
router.get('/location/:location', ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = req.params.location;
        if (!['UCB', '1NAT', 'AMER', 'FID', 'WMP'].includes(location)) {
            res.status(400).json({ error: 'Invalid location' });
            return;
        }
        const coins = yield coinLocationService_1.coinLocationService.getCoinsByLocation(location);
        res.json(coins);
    }
    catch (error) {
        next(error);
    }
})));
exports.default = router;
