import { CoinLocation } from '../types/coin';
import { query } from '../utils/db';

interface LocationHistory {
  id?: number;
  coinId: string;
  location: CoinLocation;
  userId: string;
  timestamp: Date;
}

class CoinLocationService {
  async assignCoinToLocation(coinId: string, location: CoinLocation, userId: string): Promise<void> {
    await query(
      `INSERT INTO coin_locations (coin_id, location, user_id, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [coinId, location, userId, new Date()]
    );
  }

  async getCoinLocation(coinId: string): Promise<CoinLocation | null> {
    const result = await query(
      `SELECT location
       FROM coin_locations
       WHERE coin_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [coinId]
    );
    
    return result.rows[0]?.location || null;
  }

  async getLocationHistory(coinId: string): Promise<LocationHistory[]> {
    const result = await query(
      `SELECT id, coin_id as "coinId", location, user_id as "userId", timestamp
       FROM coin_locations
       WHERE coin_id = $1
       ORDER BY timestamp DESC`,
      [coinId]
    );

    return result.rows;
  }

  async getLocationCounts(): Promise<Record<CoinLocation, number>> {
    const result = await query(
      `WITH latest_locations AS (
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
       GROUP BY location`
    );

    const counts: Record<CoinLocation, number> = {
      UCB: 0,
      '1NAT': 0,
      AMER: 0,
      FID: 0,
      WMP: 0
    };

    result.rows.forEach(row => {
      counts[row.location as CoinLocation] = parseInt(row.count);
    });

    return counts;
  }

  async getCoinsByLocation(location: CoinLocation): Promise<string[]> {
    const result = await query(
      `WITH latest_locations AS (
         SELECT DISTINCT ON (coin_id)
           coin_id,
           location
         FROM coin_locations
         ORDER BY coin_id, timestamp DESC
       )
       SELECT coin_id
       FROM latest_locations
       WHERE location = $1`,
      [location]
    );

    return result.rows.map(row => row.coin_id);
  }
}

export const coinLocationService = new CoinLocationService(); 