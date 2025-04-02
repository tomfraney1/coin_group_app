import { CoinData } from '../types/coin';

class OMMNIUploaderService {
  private static instance: OMMNIUploaderService;
  private listeners: Set<(coins: CoinData[]) => void> = new Set();

  private constructor() {}

  static getInstance(): OMMNIUploaderService {
    if (!OMMNIUploaderService.instance) {
      OMMNIUploaderService.instance = new OMMNIUploaderService();
    }
    return OMMNIUploaderService.instance;
  }

  addListener(listener: (coins: CoinData[]) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (coins: CoinData[]) => void) {
    this.listeners.delete(listener);
  }

  async uploadCoins(coins: CoinData[]) {
    try {
      // TODO: Implement actual upload logic
      this.notifyListeners(coins);
      return true;
    } catch (error) {
      console.error('Error uploading coins:', error);
      return false;
    }
  }

  private notifyListeners(coins: CoinData[]) {
    this.listeners.forEach(listener => listener(coins));
  }
}

export const ommniUploaderService = OMMNIUploaderService.getInstance(); 