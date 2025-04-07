"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coinLocationService = void 0;
const db_1 = require("../utils/db");
class CoinLocationService {
    async assignCoinToLocation(coinId, location, userId) {
        await (0, db_1.query)(`INSERT INTO coin_locations (coin_id, location, user_id, timestamp)
       VALUES ($1, $2, $3, $4)`, [coinId, location, userId, new Date()]);
    }
    async getCoinLocation(coinId) {
        var _a;
        const result = await (0, db_1.query)(`SELECT location
       FROM coin_locations
       WHERE coin_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`, [coinId]);
        return ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.location) || null;
    }
    async getLocationHistory(coinId) {
        const result = await (0, db_1.query)(`SELECT id, coin_id as "coinId", location, user_id as "userId", timestamp
       FROM coin_locations
       WHERE coin_id = $1
       ORDER BY timestamp DESC`, [coinId]);
        return result.rows;
    }
    async getLocationCounts() {
        const result = await (0, db_1.query)(`WITH latest_locations AS (
         SELECT DISTINCT ON (coin_id)
           coin_id,
           location
         FROM coin_locations
         ORDER BY coin_id, timestamp DESC
       )
       SELECT 
         location,
         COUNT(*) as count
       FROM latest_locations
       GROUP BY location`);
        const counts = {
            UCB: 0,
            '1NAT': 0,
            AMER: 0,
            FID: 0,
            WMP: 0
        };
        result.rows.forEach(row => {
            counts[row.location] = parseInt(row.count);
        });
        return counts;
    }
    async getCoinsByLocation(location) {
        const result = await (0, db_1.query)(`WITH latest_locations AS (
         SELECT DISTINCT ON (coin_id)
           coin_id,
           location
         FROM coin_locations
         ORDER BY coin_id, timestamp DESC
       )
       SELECT coin_id
       FROM latest_locations
       WHERE location = $1`, [location]);
        return result.rows.map(row => row.coin_id);
    }
}
exports.coinLocationService = new CoinLocationService();
