import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'coingroup',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coingroup',
  password: process.env.DB_PASSWORD || 'coingroup123',
  port: Number(process.env.DB_PORT) || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Read migrations from directory
const migrations = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.sql'))
  .sort((a, b) => {
    const numA = parseInt(a.split('_')[0]);
    const numB = parseInt(b.split('_')[0]);
    return numA - numB;
  });

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    console.log('Database config:', {
      user: process.env.DB_USER || 'coingroup',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'coingroup',
      port: Number(process.env.DB_PORT) || 5433
    });

    // Create migrations table if it doesn't exist
    console.log('Creating migrations table if it doesn\'t exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    console.log('Getting executed migrations...');
    const { rows } = await pool.query('SELECT name FROM migrations');
    console.log('Already executed migrations:', rows.map(row => row.name));
    const executedMigrations = new Set(rows.map(row => row.name));

    // Run pending migrations
    console.log('Migrations to run:', migrations);
    for (const migration of migrations) {
      if (!executedMigrations.has(migration)) {
        console.log(`Running migration: ${migration}`);
        try {
          const sql = fs.readFileSync(path.join(__dirname, migration), 'utf8');
          console.log(`Migration SQL for ${migration}:`, sql);
          await pool.query(sql);
          await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration]);
          console.log(`Migration completed: ${migration}`);
        } catch (error: any) {
          console.error(`Error running migration ${migration}:`, error);
          if (error.code === '42710' || error.code === '42P07') { // Type or table already exists
            console.log(`Skipping migration ${migration} as type/table already exists`);
            await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration]);
          } else {
            throw error;
          }
        }
      } else {
        console.log(`Skipping already executed migration: ${migration}`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations(); 