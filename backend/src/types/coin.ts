export type CoinLocation = 'UCB' | '1NAT' | 'AMER' | 'FID' | 'WMP'; 

export interface CoinData {
  id: string;
  caseId: number;
  barcode: string;
  name: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  enrichedData?: {
    grade?: string;
    description?: string;
    mint?: string;
    year?: string;
    denomination?: string;
    composition?: string;
    designer?: string;
    diameter?: string;
    weight?: string;
    edge?: string;
    mintage?: string;
    metalContent?: string;
    mintLocation?: string;
    priceGuideValue?: string;
    population?: string;
    varieties?: string[];
    pcgsNumber?: string;
    certNumber?: string;
    seriesName?: string;
    category?: string;
    coinFactsLink?: string;
    coinFactsNotes?: string;
    auctionList?: any[];
  };
} 