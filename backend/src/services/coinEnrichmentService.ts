import { CoinData } from '../types/coin';
import { findCoinByBarcode } from '../utils/csvParser';

export async function enrichCoin(barcode: string): Promise<{
  coinId: string;
  description: string;
  grade: string;
}> {
  const coinData = findCoinByBarcode(barcode);
  
  if (!coinData) {
    throw new Error(`Coin with barcode ${barcode} not found in the product database. Please check the barcode and try again.`);
  }

  return {
    coinId: String(coinData.Coin_id),
    description: coinData.Description,
    grade: coinData.Grade === '**' ? 'Not Graded' : coinData.Grade
  };
} 