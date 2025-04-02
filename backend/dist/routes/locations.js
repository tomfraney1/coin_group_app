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
const Location_1 = __importDefault(require("../models/Location"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all locations
router.get('/', [auth_1.authenticateToken], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield Location_1.default.find().sort({ name: 1 });
        res.json(locations);
    }
    catch (error) {
        next(error);
    }
}));
// Create a new location
router.post('/', [auth_1.authenticateToken], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = new Location_1.default(req.body);
        yield location.save();
        res.status(201).json(location);
    }
    catch (error) {
        next(error);
    }
}));
// Get a single location
router.get('/:id', [auth_1.authenticateToken], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = yield Location_1.default.findById(req.params.id);
        if (!location) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.json(location);
    }
    catch (error) {
        next(error);
    }
}));
// Update a location
router.put('/:id', [auth_1.authenticateToken], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = yield Location_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!location) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.json(location);
    }
    catch (error) {
        next(error);
    }
}));
// Delete a location
router.delete('/:id', [auth_1.authenticateToken], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = yield Location_1.default.findByIdAndDelete(req.params.id);
        if (!location) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.json({ message: 'Location deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}));
// Seed test locations
router.post('/seed', [auth_1.authenticateToken], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Clear existing locations
        yield Location_1.default.deleteMany({});
        // Create test locations
        const testLocations = [
            {
                name: 'Main Vault',
                description: 'Primary storage location for valuable coins'
            },
            {
                name: 'Show Room',
                description: 'Display area for show coins'
            },
            {
                name: 'Processing Area',
                description: 'Area for coin processing and grading'
            },
            {
                name: 'Shipping Department',
                description: 'Location for outgoing shipments'
            },
            {
                name: 'Customer Service',
                description: 'Customer service area for coin transactions'
            }
        ];
        const locations = yield Location_1.default.insertMany(testLocations);
        res.status(201).json(locations);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
