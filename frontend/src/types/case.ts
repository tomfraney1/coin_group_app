export interface CaseCoin {
  id: string;
  barcode: string;
  name: string;
  quantity: number;
  description?: string;
  grade?: string;
  coinId: string;
}

export interface CaseHistory {
  timestamp: string;
  action: 'created' | 'closed' | 'opened' | 'coin_added' | 'coin_removed' | 'coin_moved' | 'coin_updated';
  userId: string;
  details: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  createdBy: string;
  coins: CaseCoin[];
  history: CaseHistory[];
}

export interface StockTakeResult {
  id: string;
  caseId: string;
  performedAt: string;
  performedBy: string;
  discrepancies: {
    coinId: string;
    expected: number;
    actual: number;
  }[];
  notes?: string;
}

export interface StockTakeReport {
  id: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  results: StockTakeResult[];
} 