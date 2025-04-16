import { Pool, PoolClient, QueryConfig } from 'pg';
import dotenv from 'dotenv';
import { parseDatabaseUrl } from '../config/database';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

// Get database configuration from environment
const dbConfig = process.env.DATABASE_URL 
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      user: process.env.DB_USER || 'coingroup',
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'coingroup',
      password: process.env.DB_PASSWORD || 'coingroup123',
      port: Number(process.env.DB_PORT) || 5432,
    };

// Log database connection details
console.log('Database Connection Config:', dbConfig);

// Don't use SSL for Unix socket connections
const isUnixSocket = dbConfig.host?.startsWith('/cloudsql/');

const pool = new Pool({
  ...dbConfig,
  ssl: !isUnixSocket && process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
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