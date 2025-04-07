import { Case as CaseType, CaseCoin, CaseHistory, StockTakeResult, StockTakeReport } from '../types/case';
import { v4 as uuidv4 } from 'uuid';

interface CaseHistoryEntry {
  timestamp: string;
  action: 'created' | 'closed' | 'opened' | 'coin_added' | 'coin_removed' | 'coin_moved' | 'coin_updated';
  userId: string;
  details: string;
}

export interface Case extends CaseType {
  history: CaseHistoryEntry[];
}

class CaseService {
  private cases: Case[] = [];
  private subscribers: ((cases: Case[]) => void)[] = [];
  private stockTakeResults: StockTakeResult[] = [];
  private stockTakeReports: StockTakeReport[] = [];

  constructor() {
    // Load data from localStorage on initialization
    this.loadData();
  }

  private loadData() {
    const savedCases = localStorage.getItem('cases');
    if (savedCases) {
      this.cases = JSON.parse(savedCases);
    }

    const savedResults = localStorage.getItem('stockTakeResults');
    if (savedResults) {
      this.stockTakeResults = JSON.parse(savedResults);
    }

    const savedReports = localStorage.getItem('stockTakeReports');
    if (savedReports) {
      this.stockTakeReports = JSON.parse(savedReports);
    }
  }

  private saveData() {
    localStorage.setItem('cases', JSON.stringify(this.cases));
    localStorage.setItem('stockTakeResults', JSON.stringify(this.stockTakeResults));
    localStorage.setItem('stockTakeReports', JSON.stringify(this.stockTakeReports));
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.cases));
  }

  subscribe(callback: (cases: Case[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  createCase(caseNumber: string, createdBy: string): Case {
    const newCase: Case = {
      id: uuidv4(),
      caseNumber,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      coins: [],
      history: [{
        timestamp: new Date().toISOString(),
        action: 'created' as CaseHistory['action'],
        userId: createdBy,
        details: 'Case created'
      }]
    };

    this.cases.push(newCase);
    this.saveData();
    return newCase;
  }

  getCases(): Case[] {
    return this.cases;
  }

  getCase(id: string): Case | undefined {
    return this.cases.find(c => c.id === id);
  }

  updateCaseStatus(id: string, status: 'open' | 'closed', userId: string): Case | undefined {
    const case_ = this.cases.find(c => c.id === id);
    if (!case_) return undefined;

    case_.status = status;
    case_.updatedAt = new Date().toISOString();
    if (status === 'closed') {
      case_.closedAt = new Date().toISOString();
    }

    case_.history.push({
      timestamp: new Date().toISOString(),
      action: status === 'closed' ? 'closed' as CaseHistory['action'] : 'opened' as CaseHistory['action'],
      userId,
      details: `Case ${status}`
    });

    this.saveData();
    return case_;
  }

  addCoinToCase(caseId: string, coin: CaseCoin, userId: string, quantity: number = 1): Case | undefined {
    const case_ = this.cases.find(c => c.id === caseId);
    if (!case_) return undefined;

    // Check if coin already exists in the case
    const existingCoinIndex = case_.coins.findIndex(c => c.barcode === coin.barcode);
    
    if (existingCoinIndex >= 0) {
      // Update quantity of existing coin
      case_.coins[existingCoinIndex].quantity += quantity;
    } else {
      // Add new coin with quantity
      case_.coins.push({ ...coin, quantity });
    }

    case_.updatedAt = new Date().toISOString();
    case_.history.push({
      timestamp: new Date().toISOString(),
      action: 'coin_added' as CaseHistory['action'],
      userId,
      details: `Added ${quantity} ${coin.name} (${coin.barcode})`
    });

    this.saveData();
    return case_;
  }

  removeCoinFromCase(caseId: string, coinId: string, userId: string, quantity: number = 1): Case | undefined {
    const case_ = this.cases.find(c => c.id === caseId);
    if (!case_) return undefined;

    const coinIndex = case_.coins.findIndex(c => c.id === coinId);
    if (coinIndex === -1) return undefined;

    const coin = case_.coins[coinIndex];
    
    if (coin.quantity <= quantity) {
      // Remove the coin entirely if quantity is 0 or less
      case_.coins.splice(coinIndex, 1);
    } else {
      // Update quantity if there are still coins remaining
      case_.coins[coinIndex].quantity -= quantity;
    }

    case_.updatedAt = new Date().toISOString();
    case_.history.push({
      timestamp: new Date().toISOString(),
      action: 'coin_removed' as CaseHistory['action'],
      userId,
      details: `Removed ${quantity} ${coin.name} (${coin.barcode})`
    });

    this.saveData();
    return case_;
  }

  moveCoinBetweenCases(fromCaseId: string, toCaseId: string, coinId: string, userId: string, quantity: number = 1): boolean {
    const fromCase = this.cases.find(c => c.id === fromCaseId);
    const toCase = this.cases.find(c => c.id === toCaseId);
    if (!fromCase || !toCase) return false;

    const coinIndex = fromCase.coins.findIndex(c => c.id === coinId);
    if (coinIndex === -1) return false;

    const coin = fromCase.coins[coinIndex];
    if (coin.quantity < quantity) return false;

    // Remove from source case
    if (coin.quantity <= quantity) {
      fromCase.coins.splice(coinIndex, 1);
    } else {
      fromCase.coins[coinIndex].quantity -= quantity;
    }

    // Add to target case
    const existingCoinIndex = toCase.coins.findIndex(c => c.barcode === coin.barcode);
    if (existingCoinIndex >= 0) {
      toCase.coins[existingCoinIndex].quantity += quantity;
    } else {
      toCase.coins.push({ ...coin, quantity });
    }

    // Update timestamps and history
    fromCase.updatedAt = new Date().toISOString();
    toCase.updatedAt = new Date().toISOString();

    fromCase.history.push({
      timestamp: new Date().toISOString(),
      action: 'coin_moved' as CaseHistory['action'],
      userId,
      details: `Moved ${quantity} ${coin.name} (${coin.barcode}) to Case ${toCase.caseNumber}`
    });

    toCase.history.push({
      timestamp: new Date().toISOString(),
      action: 'coin_moved' as CaseHistory['action'],
      userId,
      details: `Received ${quantity} ${coin.name} (${coin.barcode}) from Case ${fromCase.caseNumber}`
    });

    this.saveData();
    return true;
  }

  addStockTakeResult(result: StockTakeResult): void {
    this.stockTakeResults.push(result);
    this.saveData();
  }

  getStockTakeResults(): StockTakeResult[] {
    return this.stockTakeResults;
  }

  generateStockTakeReport(startDate: string, endDate: string, generatedBy: string): StockTakeReport {
    const report: StockTakeReport = {
      id: Date.now().toString(),
      startDate,
      endDate,
      generatedAt: new Date().toISOString(),
      generatedBy,
      results: this.stockTakeResults.filter(result => 
        result.performedAt >= startDate && result.performedAt <= endDate
      )
    };

    this.stockTakeReports.push(report);
    this.saveData();
    return report;
  }

  getStockTakeReports(): StockTakeReport[] {
    return this.stockTakeReports;
  }

  updateCoinInCase(caseId: string, coin: CaseCoin, userId: string): Case | null {
    const cases = this.cases.find(c => c.id === caseId);
    if (!cases) return null;

    const coinIndex = cases.coins.findIndex(c => c.barcode === coin.barcode);
    if (coinIndex === -1) return null;

    cases.coins[coinIndex] = coin;
    this.saveData();

    cases.history.push({
      timestamp: new Date().toISOString(),
      action: 'coin_updated' as CaseHistory['action'],
      userId,
      details: `Updated coin ${coin.id} (${coin.name}) with barcode ${coin.barcode}`
    });

    return cases;
  }
}

export const caseService = new CaseService(); 