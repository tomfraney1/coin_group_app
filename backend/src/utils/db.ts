import { Pool, PoolClient, QueryConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

// Log database connection details
console.log('Database Connection Config:', {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1', // Cloud SQL Proxy listens on localhost
  database: process.env.DB_NAME || 'coingroup',
  port: Number(process.env.DB_PORT) || 5432, // Default PostgreSQL port
  ssl: undefined
});

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1', // Cloud SQL Proxy listens on localhost
  database: process.env.DB_NAME || 'coingroup',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT) || 5432, // Default PostgreSQL port
  ssl: undefined
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

interface ExtendedPoolClient extends PoolClient {
  lastQuery?: string;
}

export const getClient = async (): Promise<ExtendedPoolClient> => {
  const client = await pool.connect() as ExtendedPoolClient;
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  // Monkey patch the query method to keep track of queries
  client.query = (queryConfig: QueryConfig | string, ...args: any[]) => {
    client.lastQuery = typeof queryConfig === 'string' ? queryConfig : queryConfig.text;
    return originalQuery(queryConfig, ...args);
  };

  client.release = () => {
    client.query = originalQuery;
    client.release = release;
    return release();
  };

  return client;
};

export const transaction = async <T>(callback: (client: ExtendedPoolClient) => Promise<T>): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool; 