import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Cloud SQL Proxy connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'coingroup',
  password: process.env.DB_PASSWORD || 'postgres',
  port: Number(process.env.DB_PORT) || 5433,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL through Cloud SQL Proxy');
    
    // Test the connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    
    client.release();
  } catch (error: any) {
    console.error('❌ Error connecting to PostgreSQL:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Please ensure Cloud SQL Proxy is running on port 5433');
    }
    process.exit(1);
  }
};

export { pool, connectDB }; 