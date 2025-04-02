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
Object.defineProperty(exports, "__esModule", { value: true });
exports.coinLocationService = void 0;
class CoinLocationService {
    constructor() {
        this.locationHistory = [];
    }
    assignCoinToLocation(coinId, location, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.locationHistory.push({
                coinId,
                location,
                userId,
                timestamp: new Date()
            });
        });
    }
    getCoinLocation(coinId) {
        return __awaiter(this, void 0, void 0, function* () {
            const latestHistory = this.locationHistory
                .filter(h => h.coinId === coinId)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
            return (latestHistory === null || latestHistory === void 0 ? void 0 : latestHistory.location) || null;
        });
    }
    getLocationHistory(coinId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.locationHistory
                .filter(h => h.coinId === coinId)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
    }
    getLocationCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const counts = {
                UCB: 0,
                '1NAT': 0,
                AMER: 0,
                FID: 0,
                WMP: 0
            };
            this.locationHistory.forEach(h => {
                counts[h.location]++;
            });
            return counts;
        });
    }
    getCoinsByLocation(location) {
        return __awaiter(this, void 0, void 0, function* () {
            const latestHistory = new Map();
            this.locationHistory.forEach(h => {
                if (!latestHistory.has(h.coinId) ||
                    h.timestamp > latestHistory.get(h.coinId).timestamp) {
                    latestHistory.set(h.coinId, h);
                }
            });
            return Array.from(latestHistory.values())
                .filter(h => h.location === location)
                .map(h => h.coinId);
        });
    }
}
exports.coinLocationService = new CoinLocationService();
