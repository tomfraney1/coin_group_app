import { Pool } from 'pg';
import { parseDatabaseUrl } from '../config/database';

// Get database configuration from environment
const dbConfig = process.env.DATABASE_URL 
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'coingroup',
      password: process.env.DB_PASSWORD || 'postgres',
      port: Number(process.env.DB_PORT) || 5432,
    };

// Create the database pool
const pool = new Pool({
  ...dbConfig,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export { pool }; 