import { CoinLocation } from '../types/coin';

interface LocationHistory {
  coinId: string;
  location: CoinLocation;
  userId: string;
  timestamp: Date;
}

class CoinLocationService {
  private locationHistory: LocationHistory[] = [];

  async assignCoinToLocation(coinId: string, location: CoinLocation, userId: string): Promise<void> {
    this.locationHistory.push({
      coinId,
      location,
      userId,
      timestamp: new Date()
    });
  }

  async getCoinLocation(coinId: string): Promise<CoinLocation | null> {
    const latestHistory = this.locationHistory
      .filter(h => h.coinId === coinId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    return latestHistory?.location || null;
  }

  async getLocationHistory(coinId: string): Promise<LocationHistory[]> {
    return this.locationHistory
      .filter(h => h.coinId === coinId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLocationCounts(): Promise<Record<CoinLocation, number>> {
    const counts: Record<CoinLocation, number> = {
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
  }

  async getCoinsByLocation(location: CoinLocation): Promise<string[]> {
    const latestHistory = new Map<string, LocationHistory>();
    
    this.locationHistory.forEach(h => {
      if (!latestHistory.has(h.coinId) || 
          h.timestamp > latestHistory.get(h.coinId)!.timestamp) {
        latestHistory.set(h.coinId, h);
      }
    });

    return Array.from(latestHistory.values())
      .filter(h => h.location === location)
      .map(h => h.coinId);
  }
}

export const coinLocationService = new CoinLocationService(); 