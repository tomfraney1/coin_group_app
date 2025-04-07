import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// AWS RDS connection
const sourcePool = new Pool({
  user: 'coingroup',
  host: 'coingroup-db.c0f4ay4sop87.us-east-1.rds.amazonaws.com',
  database: 'coingroup',
  password: '3KpFHS9mhap3Asur5XYt',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Google Cloud SQL connection (through proxy)
const targetPool = new Pool({
  user: 'coingroup',
  host: 'localhost',
  database: 'coingroup',
  password: '3KpFHS9mhap3Asur5XYt',
  port: 5433
});

async function migrateData() {
  try {
    // Connect to both databases
    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();

    // Migrate users
    console.log('Migrating users...');
    const usersResult = await sourceClient.query('SELECT * FROM users');
    for (const user of usersResult.rows) {
      await targetClient.query(
        `INSERT INTO users (username, email, password, role, is_active, last_login, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.username,
          user.email,
          user.password,
          user.role,
          user.is_active,
          user.last_login,
          user.created_at
        ]
      );
    }

    // Migrate coin_locations
    console.log('Migrating coin locations...');
    const locationsResult = await sourceClient.query('SELECT * FROM coin_locations');
    for (const location of locationsResult.rows) {
      await targetClient.query(
        `INSERT INTO coin_locations (coin_id, location, user_id, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          location.coin_id,
          location.location,
          location.user_id,
          location.timestamp,
          location.created_at
        ]
      );
    }

    // Migrate migrations
    console.log('Migrating migrations...');
    const migrationsResult = await sourceClient.query('SELECT * FROM migrations');
    for (const migration of migrationsResult.rows) {
      await targetClient.query(
        `INSERT INTO migrations (name, executed_at)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [migration.name, migration.executed_at]
      );
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

migrateData(); 