import { query, transaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { findCoinByBarcode } from '../utils/csvParser';
import { Pool } from 'pg';
import { enrichCoin } from '../services/coinEnrichmentService';

export interface Case {
  id: string;
  caseNumber: string;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  createdBy: string;
}

export interface CaseCoin {
  id: string;
  caseId: string;
  barcode: string;
  name: string;
  coinId: string;
  grade: string;
  description: string;
  quantity: number;
  createdAt: Date;
}

export interface CaseHistory {
  id: string;
  caseId: string;
  action: 'created' | 'closed' | 'opened' | 'coin_added' | 'coin_removed' | 'coin_moved' | 'coin_updated';
  userId: string;
  details: string;
  timestamp: Date;
}

export class CaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }

  async createCase(caseNumber: string, userId: string): Promise<Case> {
    return transaction(async (client) => {
      // Handle development user
      const actualUserId = userId === 'development-user' ? 1 : parseInt(userId, 10);

      // Create case
      const caseResult = await client.query(
        `INSERT INTO cases (case_number, created_by)
         VALUES ($1, $2)
         RETURNING *`,
        [caseNumber, actualUserId]
      );

      const newCase = caseResult.rows[0];

      // Add history entry
      await client.query(
        `INSERT INTO case_history (case_id, action, user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [newCase.id, 'created', actualUserId, `Case ${caseNumber} created`]
      );

      return this.transformCase(newCase);
    });
  }

  async getCase(caseId: string): Promise<Case & { coins: CaseCoin[] }> {
    const caseResult = await query(
      `SELECT c.*, 
              COALESCE(json_agg(
                json_build_object(
                  'id', cc.id,
                  'case_id', cc.case_id,
                  'barcode', cc.barcode,
                  'name', cc.name,
                  'coin_id', cc.coin_id,
                  'grade', cc.grade,
                  'description', cc.description,
                  'quantity', cc.quantity,
                  'created_at', cc.created_at
                ) ORDER BY cc.created_at
              ) FILTER (WHERE cc.id IS NOT NULL), '[]') as coins
       FROM cases c
       LEFT JOIN case_coins cc ON c.id = cc.case_id
       WHERE c.id = $1
       GROUP BY c.id, c.case_number, c.status, c.created_at, c.updated_at, c.closed_at, c.created_by`,
      [caseId]
    );

    if (caseResult.rows.length === 0) {
      throw new Error('Case not found');
    }

    return this.transformCaseWithCoins(caseResult.rows[0]);
  }

  async getAllCases(): Promise<Case[]> {
    const result = await query(
      `SELECT c.*, 
              COALESCE(json_agg(
                json_build_object(
                  'id', cc.id,
                  'case_id', cc.case_id,
                  'barcode', cc.barcode,
                  'name', cc.name,
                  'coin_id', cc.coin_id,
                  'grade', cc.grade,
                  'description', cc.description,
                  'quantity', cc.quantity,
                  'created_at', cc.created_at
                ) ORDER BY cc.created_at
              ) FILTER (WHERE cc.id IS NOT NULL), '[]') as coins
       FROM cases c
       LEFT JOIN case_coins cc ON c.id = cc.case_id
       GROUP BY c.id, c.case_number, c.status, c.created_at, c.updated_at, c.closed_at, c.created_by
       ORDER BY c.created_at DESC`
    );
    return result.rows.map((row) => this.transformCaseWithCoins(row));
  }

  async updateCaseStatus(caseId: string, status: 'open' | 'closed', userId: string): Promise<Case> {
    return transaction(async (client) => {
      // Handle development user
      const actualUserId = userId === 'development-user' ? 1 : parseInt(userId, 10);

      const result = await client.query(
        `UPDATE cases
         SET status = $1, closed_at = $2
         WHERE id = $3
         RETURNING *`,
        [status, status === 'closed' ? new Date() : null, caseId]
      );

      if (result.rows.length === 0) {
        throw new Error('Case not found');
      }

      await client.query(
        `INSERT INTO case_history (case_id, action, user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [caseId, status === 'closed' ? 'closed' : 'opened', actualUserId, `Case ${status}`]
      );

      return this.transformCase(result.rows[0]);
    });
  }

  async addCoinToCase(caseId: string, coinData: { barcode: string; quantity: number }): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const enrichedCoin = await enrichCoin(coinData.barcode);
      
      const result = await client.query(
        `INSERT INTO case_coins (
          case_id, 
          barcode, 
          quantity, 
          coin_id, 
          grade, 
          description,
          name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          caseId,
          coinData.barcode,
          coinData.quantity,
          enrichedCoin.coinId,
          enrichedCoin.grade,
          enrichedCoin.description,
          enrichedCoin.description // Use description as name
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  async removeCoinFromCase(caseId: string, barcode: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if case is open
      const caseResult = await client.query(
        `SELECT status FROM cases WHERE id = $1`,
        [caseId]
      );

      if (caseResult.rows.length === 0) {
        throw new Error('Case not found');
      }

      if (caseResult.rows[0].status !== 'open') {
        throw new Error('Cannot remove coins from a closed case');
      }

      // Get coin details before removal
      const coinResult = await client.query(
        `SELECT * FROM case_coins WHERE barcode = $1 AND case_id = $2`,
        [barcode, caseId]
      );

      if (coinResult.rows.length === 0) {
        throw new Error('Coin not found in case');
      }

      const coin = coinResult.rows[0];

      // Remove coin
      await client.query(
        `DELETE FROM case_coins WHERE barcode = $1 AND case_id = $2`,
        [barcode, caseId]
      );

      // Handle development user case
      const actualUserId = userId === 'development-user' ? 1 : parseInt(userId, 10);

      // Add history entry
      await client.query(
        `INSERT INTO case_history (case_id, action, user_id, details)
         VALUES ($1, $2, $3, $4)`,
        [caseId, 'coin_removed', actualUserId, `Removed ${coin.name} (${coin.barcode})`]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error removing coin from case:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getCaseHistory(caseId: string): Promise<CaseHistory[]> {
    const result = await query(
      `SELECT * FROM case_history
       WHERE case_id = $1
       ORDER BY timestamp DESC`,
      [caseId]
    );
    return result.rows.map(this.transformHistory);
  }

  async getCases(): Promise<Case[]> {
    const result = await query(
      `SELECT c.*, 
              COALESCE(json_agg(
                json_build_object(
                  'id', cc.id,
                  'case_id', cc.case_id,
                  'barcode', cc.barcode,
                  'name', cc.name,
                  'coin_id', cc.coin_id,
                  'grade', cc.grade,
                  'description', cc.description,
                  'quantity', cc.quantity,
                  'created_at', cc.created_at
                ) ORDER BY cc.created_at
              ) FILTER (WHERE cc.id IS NOT NULL), '[]') as coins,
              COUNT(cc.id) as coin_count
       FROM cases c
       LEFT JOIN case_coins cc ON c.id = cc.case_id
       GROUP BY c.id, c.case_number, c.status, c.created_at, c.updated_at, c.closed_at, c.created_by
       ORDER BY c.created_at DESC`
    );

    return result.rows.map((row) => this.transformCase(row));
  }

  private transformCase(dbCase: any): Case {
    return {
      id: dbCase.id,
      caseNumber: dbCase.case_number,
      status: dbCase.status,
      createdAt: new Date(dbCase.created_at),
      updatedAt: new Date(dbCase.updated_at),
      closedAt: dbCase.closed_at ? new Date(dbCase.closed_at) : undefined,
      createdBy: dbCase.created_by_email || dbCase.created_by
    };
  }

  private transformCoin(dbCoin: any): CaseCoin {
    return {
      id: dbCoin.id,
      caseId: dbCoin.case_id,
      barcode: dbCoin.barcode,
      name: dbCoin.name,
      coinId: dbCoin.coin_id || '',  // Ensure coinId is always a string, default to empty string if null
      grade: dbCoin.grade,
      description: dbCoin.description,
      quantity: dbCoin.quantity,
      createdAt: new Date(dbCoin.created_at)
    };
  }

  private transformHistory(dbHistory: any): CaseHistory {
    return {
      id: dbHistory.id,
      caseId: dbHistory.case_id,
      action: dbHistory.action,
      userId: dbHistory.user_id,
      details: dbHistory.details,
      timestamp: new Date(dbHistory.timestamp)
    };
  }

  private transformCaseWithCoins(dbCase: any): Case & { coins: CaseCoin[] } {
    return {
      ...this.transformCase(dbCase),
      coins: Array.isArray(dbCase.coins) ? dbCase.coins.map(this.transformCoin) : []
    };
  }

  async deleteCase(caseId: string, userId: string): Promise<void> {
    return transaction(async (client) => {
      // Handle development user
      const actualUserId = userId === 'development-user' ? 1 : parseInt(userId, 10);

      // Check if case exists
      const caseResult = await client.query(
        `SELECT * FROM cases WHERE id = $1`,
        [caseId]
      );

      if (caseResult.rows.length === 0) {
        throw new Error('Case not found');
      }

      // Delete case coins first (due to foreign key constraints)
      await client.query(
        `DELETE FROM case_coins WHERE case_id = $1`,
        [caseId]
      );

      // Delete case history
      await client.query(
        `DELETE FROM case_history WHERE case_id = $1`,
        [caseId]
      );

      // Finally delete the case
      await client.query(
        `DELETE FROM cases WHERE id = $1`,
        [caseId]
      );
    });
  }
} 