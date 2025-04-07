import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5433,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}); 