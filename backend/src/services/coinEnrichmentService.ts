import { CoinData } from '../types/coin';
import { findCoinByBarcode } from '../utils/csvParser';

export async function enrichCoin(barcode: string): Promise<{
  coinId: string;
  description: string;
  grade: string;
}> {
  const coinData = findCoinByBarcode(barcode);
  
  if (!coinData) {
    throw new Error('Coin not found in database');
  }

  return {
    coinId: String(coinData.Coin_id),
    description: coinData.Description,
    grade: coinData.Grade === '**' ? 'Not Graded' : coinData.Grade
  };
} 