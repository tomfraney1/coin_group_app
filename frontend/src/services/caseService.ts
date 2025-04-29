import { Case, CaseCoin, CaseHistory, StockTakeResult } from '../types/case';
import { API_URL, WS_URL } from '../config';

class CaseService {
  private ws: WebSocket | null = null;
  private subscribers: ((cases: Case[]) => void)[] = [];
  private cases: Case[] = [];

  constructor() {
    this.connectWebSocket();
  }

  private async getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private connectWebSocket() {
    const token = localStorage.getItem('token');
    console.log('Connecting to WebSocket with token:', token);
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('Connected to WebSocket');
      // Send authentication token
      this.ws?.send(JSON.stringify({ type: 'auth', token }));
    };

    this.ws.onmessage = async (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'case_created':
          console.log('Case created:', data.data);
          this.cases.push(data.data);
          this.notifySubscribers();
          break;
        case 'case_updated':
          console.log('Case updated:', data.data);
          const index = this.cases.findIndex(c => c.id === data.data.id);
          if (index !== -1) {
            this.cases[index] = data.data;
            this.notifySubscribers();
          }
          break;
        case 'coin_added':
          console.log('Coin added:', data.data);
          const caseData = this.cases.find(c => c.id === data.data.caseId);
          if (caseData) {
            console.log('Found case for coin:', caseData);
            // Map the coin data to match the CaseCoin interface
            const mappedCoin = {
              id: data.data.coin.id,
              barcode: data.data.coin.barcode,
              name: data.data.coin.name,
              quantity: data.data.coin.quantity,
              description: data.data.coin.description,
              grade: data.data.coin.grade,
              coinId: data.data.coin.coin_id || data.data.coin.coinId || '' // Try both possible field names
            };
            console.log('Mapped coin:', mappedCoin);
            caseData.coins.push(mappedCoin);
            this.notifySubscribers();
          }
          break;
        case 'coin_removed':
          console.log('Coin removed:', data.data);
          const caseToUpdate = this.cases.find(c => c.id === data.data.caseId);
          if (caseToUpdate) {
            caseToUpdate.coins = caseToUpdate.coins.filter(c => c.barcode !== data.data.barcode);
            this.notifySubscribers();
          }
          break;
        case 'coin_moved':
          console.log('Coin moved:', data.data);
          const fromCase = this.cases.find(c => c.id === data.data.fromCaseId);
          const toCase = this.cases.find(c => c.id === data.data.toCaseId);
          if (fromCase) {
            fromCase.coins = fromCase.coins.filter(c => c.id !== data.data.coin.id);
          }
          if (toCase) {
            toCase.coins.push(data.data.coin);
          }
          this.notifySubscribers();
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after a delay
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.cases));
  }

  public subscribe(callback: (cases: Case[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.cases);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public async getCases(): Promise<Case[]> {
    try {
      const response = await fetch(`${API_URL}/cases`, {
        headers: await this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }

      this.cases = await response.json();
      this.notifySubscribers();
      return this.cases;
    } catch (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }
  }

  public async getCase(id: string): Promise<Case> {
    try {
      const response = await fetch(`${API_URL}/cases/${id}`, {
        headers: await this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch case');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching case:', error);
      throw error;
    }
  }

  public async createCase(caseNumber: string): Promise<Case> {
    try {
      const response = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ caseNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to create case');
      }

      const newCase = await response.json();
      return newCase;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  }

  public async updateCaseStatus(id: string, status: 'open' | 'closed'): Promise<Case> {
    try {
      const response = await fetch(`${API_URL}/cases/${id}/status`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update case status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  }

  public async addCoinToCase(caseId: string, coin: { barcode: string; quantity?: number }): Promise<CaseCoin> {
    try {
      const response = await fetch(`${API_URL}/cases/${caseId}/coins`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(coin)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add coin to case');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding coin to case:', error);
      throw error;
    }
  }

  public async removeCoinFromCase(caseId: string, barcode: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/cases/${caseId}/coins/${barcode}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to remove coin from case');
      }
    } catch (error) {
      console.error('Error removing coin from case:', error);
      throw error;
    }
  }

  public async getCaseHistory(caseId: string): Promise<CaseHistory[]> {
    try {
      const response = await fetch(`${API_URL}/cases/${caseId}/history`, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch case history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching case history:', error);
      throw error;
    }
  }

  public async deleteCase(caseId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/cases/${caseId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete case');
      }

      // Update local cases list
      this.cases = this.cases.filter(case_ => case_.id !== caseId);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error deleting case:', error);
      throw error;
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public async getStockTakeResults(): Promise<StockTakeResult[]> {
    try {
      console.log('Fetching stock take results...');
      const response = await fetch(`${API_URL}/stock-take`, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(errorData.message || 'Failed to fetch stock take results');
      }

      const results = await response.json();
      console.log('Stock take results:', results);
      return results;
    } catch (error) {
      console.error('Error fetching stock take results:', error);
      throw error;
    }
  }

  public async addStockTakeResult(result: StockTakeResult): Promise<StockTakeResult> {
    try {
      console.log('Adding stock take result:', result);
      const response = await fetch(`${API_URL}/stock-take`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(result)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(errorData.message || 'Failed to add stock take result');
      }

      const newResult = await response.json();
      console.log('Added stock take result:', newResult);
      return newResult;
    } catch (error) {
      console.error('Error adding stock take result:', error);
      throw error;
    }
  }
}

export const caseService = new CaseService(); 