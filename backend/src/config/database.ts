import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse the DATABASE_URL environment variable
export const parseDatabaseUrl = (url: string) => {
  // Handle Cloud SQL Unix socket format
  if (url.includes('/cloudsql/')) {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)\?host=\/cloudsql\/(.+)/);
    if (!match) {
      throw new Error('Invalid Cloud SQL connection string format');
    }
    const [, user, password, database, instance] = match;
    return {
      user,
      password,
      database,
      host: `/cloudsql/${instance}`,
    };
  }

  // Handle standard PostgreSQL URL format
  const parsed = new URL(url);
  return {
    user: parsed.username,
    password: parsed.password,
    host: parsed.hostname,
    database: parsed.pathname.slice(1),
    port: parseInt(parsed.port, 10),
  };
};

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

// Create the database pool
const pool = new Pool({
  ...dbConfig,
  ssl: process.env.NODE_ENV === 'production' && !dbConfig.host.includes('/cloudsql/') 
    ? { rejectUnauthorized: false } 
    : false
});

const connectDB = async () => {
  try {
    console.log('Attempting to connect to database with config:', {
      user: dbConfig.user,
      host: dbConfig.host,
      database: dbConfig.database,
      port: dbConfig.port,
      ssl: process.env.NODE_ENV === 'production' && !dbConfig.host.includes('/cloudsql/') 
        ? { rejectUnauthorized: false } 
        : false
    });
    
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Test the connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    
    client.release();
  } catch (error: any) {
    console.error('❌ Error connecting to PostgreSQL:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    console.error('Database Connection Config:', {
      user: dbConfig.user,
      host: dbConfig.host,
      database: dbConfig.database,
      port: dbConfig.port,
      ssl: process.env.NODE_ENV === 'production' && !dbConfig.host.includes('/cloudsql/') 
        ? { rejectUnauthorized: false } 
        : false
    });
    process.exit(1);
  }
};

export { pool, connectDB }; 