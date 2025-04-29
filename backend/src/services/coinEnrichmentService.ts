import { CoinData } from '../types/coin';
import { findCoinByBarcode } from '../utils/csvParser';

export async function enrichCoin(barcode: string): Promise<{
  coinId: string;
  description: string;
  grade: string;
}> {
  const coinData = findCoinByBarcode(barcode);
  
  if (!coinData) {
    // Return default values for coins not found in the database
    return {
      coinId: '', // Empty string for unknown coins
      description: 'Unknown Coin',
      grade: '' // Empty string for unknown grade
    };
  }

  return {
    coinId: String(coinData.Coin_id),
    description: coinData.Description,
    grade: coinData.Grade === '**' ? 'Not Graded' : coinData.Grade
  };
} 