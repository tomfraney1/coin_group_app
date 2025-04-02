export interface CoinData {
  id: string;
  barcode: string;
  status: 'pending' | 'enriched' | 'error' | 'uploaded';
  errorMessage?: string;
  uploadHistory: Array<{
    timestamp: string;
    user: string;
  }>;
  enrichedData?: {
    year?: string;
    denomination?: string;
    grade?: string;
    description?: string;
    quantity?: number;
    certificationNumber?: string;
    gradingService?: string;
    mint?: string;
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
    type?: string;
    coinId?: string;
    auctionList?: Array<{
      Service: string;
      Date: string;
      Auctioneer: string;
      LotNo: number;
      LotNumV2: string;
      SaleName: string;
      CertNo: string | null;
      Price: number;
      IsCAC: boolean;
      AuctionLotUrl: string;
    }>;
  };
}

export interface UploadHistory {
  timestamp: string;
  status: 'success' | 'error';
  message?: string;
  location?: string;
}

export type SortField = 'id' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  status?: CoinData['status'];
  searchTerm?: string;
} 