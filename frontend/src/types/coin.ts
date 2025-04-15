export interface CoinData {
  id: string;
  barcode: string;
  status: 'pending' | 'enriched' | 'uploaded' | 'error';
  uploadHistory: any[];
  enrichedData?: {
    coinId?: string;
    description?: string;
    grade?: string;
    quantity?: number;
    certificationNumber?: string;
    gradingService?: string;
    type?: string;
    year?: string;
    denomination?: string;
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
    seriesName?: string;
    category?: string;
    coinFactsLink?: string;
    coinFactsNotes?: string;
  };
  errorMessage?: string;
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