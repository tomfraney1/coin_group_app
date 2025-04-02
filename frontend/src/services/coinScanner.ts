import { CoinData } from '../types/coin';

const STORAGE_KEY = 'scanned_coins';

class CoinScannerService {
  private coins: CoinData[] = [];
  private listeners: Set<(coins: CoinData[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.coins = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading scanned coins from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.coins));
    } catch (error) {
      console.error('Error saving scanned coins to storage:', error);
    }
  }

  // Add a new scanned coin or update quantity if it exists
  addCoin(coin: CoinData, quantity: number = 1): void {
    const existingCoinIndex = this.coins.findIndex(c => c.barcode === coin.barcode);
    
    if (existingCoinIndex >= 0) {
      // Update quantity of existing coin
      const existingCoin = this.coins[existingCoinIndex];
      if (existingCoin.enrichedData) {
        existingCoin.enrichedData.quantity = (existingCoin.enrichedData.quantity || 0) + quantity;
      } else {
        existingCoin.enrichedData = { quantity };
      }
    } else {
      // Add new coin with quantity
      this.coins.push({
        ...coin,
        enrichedData: {
          ...coin.enrichedData,
          quantity: quantity
        }
      });
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }

  // Update an existing coin
  updateCoin(coinId: string, updates: Partial<CoinData>): void {
    this.coins = this.coins.map(coin => 
      coin.id === coinId ? { ...coin, ...updates } : coin
    );
    this.saveToStorage();
    this.notifyListeners();
  }

  // Get all scanned coins
  getCoins(): CoinData[] {
    return this.coins;
  }

  // Clear all scanned coins
  clearCoins(): void {
    this.coins = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Delete all scanned coins
  deleteAllCoins(): void {
    this.coins = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Subscribe to coin changes
  subscribe(listener: (coins: CoinData[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.coins));
  }
}

export const coinScannerService = new CoinScannerService(); 