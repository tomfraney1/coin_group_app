import WebSocket from 'ws';
import { Server } from 'http';
import { Case, CaseCoin } from '../services/caseService';

interface CaseUpdate {
  type: 'case_created' | 'case_updated' | 'case_deleted' | 'coin_added' | 'coin_removed' | 'coin_moved';
  data: any;
}

class CaseNotificationService {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  public notifyCaseCreated(caseData: Case) {
    this.broadcast({
      type: 'case_created',
      data: caseData
    });
  }

  public notifyCaseUpdated(caseData: Case) {
    this.broadcast({
      type: 'case_updated',
      data: caseData
    });
  }

  public notifyCaseDeleted(caseId: string) {
    this.broadcast({
      type: 'case_deleted',
      data: { caseId }
    });
  }

  public notifyCoinAdded(caseId: string, coin: CaseCoin) {
    this.broadcast({
      type: 'coin_added',
      data: { caseId, coin }
    });
  }

  public notifyCoinRemoved(caseId: string, barcode: string) {
    this.broadcast({
      type: 'coin_removed',
      data: { caseId, barcode }
    });
  }

  public notifyCoinMoved(fromCaseId: string, toCaseId: string, coin: CaseCoin) {
    this.broadcast({
      type: 'coin_moved',
      data: { fromCaseId, toCaseId, coin }
    });
  }

  private broadcast(update: CaseUpdate) {
    const message = JSON.stringify(update);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export default CaseNotificationService; 