import { pool } from '../config/database';

export interface SpotPriceProduct {
  id?: number;
  coinId: string;
  metal: 'Gold' | 'Silver';
  ounces: number;
  amount: number;
  type: 'fixed' | 'percentage';
  created_at?: Date;
  updated_at?: Date;
}

export const createSpotPriceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS spot_price_products (
      id SERIAL PRIMARY KEY,
      coin_id VARCHAR(255) NOT NULL,
      metal VARCHAR(50) NOT NULL CHECK (metal IN ('Gold', 'Silver')),
      ounces FLOAT NOT NULL,
      amount FLOAT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('fixed', 'percentage')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};

export const getAllProducts = async (type?: 'fixed' | 'percentage'): Promise<SpotPriceProduct[]> => {
  const query = type 
    ? 'SELECT * FROM spot_price_products WHERE type = $1'
    : 'SELECT * FROM spot_price_products';
  const values = type ? [type] : [];
  const result = await pool.query(query, values);
  return result.rows;
};

export const getProductById = async (id: number): Promise<SpotPriceProduct | null> => {
  const result = await pool.query('SELECT * FROM spot_price_products WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createProduct = async (product: Omit<SpotPriceProduct, 'id' | 'created_at' | 'updated_at'>): Promise<SpotPriceProduct> => {
  const query = `
    INSERT INTO spot_price_products (coin_id, metal, ounces, amount, type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [product.coinId, product.metal, product.ounces, product.amount, product.type];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateProduct = async (id: number, product: Partial<SpotPriceProduct>): Promise<SpotPriceProduct | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (product.coinId) {
    updates.push(`coin_id = $${paramCount}`);
    values.push(product.coinId);
    paramCount++;
  }
  if (product.metal) {
    updates.push(`metal = $${paramCount}`);
    values.push(product.metal);
    paramCount++;
  }
  if (product.ounces) {
    updates.push(`ounces = $${paramCount}`);
    values.push(product.ounces);
    paramCount++;
  }
  if (product.amount) {
    updates.push(`amount = $${paramCount}`);
    values.push(product.amount);
    paramCount++;
  }
  if (product.type) {
    updates.push(`type = $${paramCount}`);
    values.push(product.type);
    paramCount++;
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE spot_price_products
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM spot_price_products WHERE id = $1', [id]);
};

export const getProductsByCoinId = async (coinId: string): Promise<SpotPriceProduct[]> => {
  const result = await pool.query('SELECT * FROM spot_price_products WHERE coin_id = $1', [coinId]);
  return result.rows;
};

export const getProductsByMetal = async (metal: 'Gold' | 'Silver'): Promise<SpotPriceProduct[]> => {
  const result = await pool.query('SELECT * FROM spot_price_products WHERE metal = $1', [metal]);
  return result.rows;
};

export const getProductsByTypeAndMetal = async (type: 'fixed' | 'percentage', metal: 'Gold' | 'Silver'): Promise<SpotPriceProduct[]> => {
  const result = await pool.query(
    'SELECT * FROM spot_price_products WHERE type = $1 AND metal = $2',
    [type, metal]
  );
  return result.rows;
}; 