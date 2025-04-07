import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const sourceUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const targetUri = process.env.DATABASE_URL;

async function runSqlMigrations(pool: Pool) {
  // Create migrations table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get executed migrations
  const { rows } = await pool.query('SELECT name FROM migrations');
  const executedMigrations = new Set(rows.map(row => row.name));

  // Define migrations
  const migrations = [
    '001_create_users.sql',
    '002_add_user_active.sql',
    '003_add_user_last_login.sql',
    '004_create_coin_locations.sql'
  ];

  // Run pending migrations
  for (const migration of migrations) {
    if (!executedMigrations.has(migration)) {
      console.log(`Running migration: ${migration}`);
      const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'migrations', migration), 'utf8');
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration]);
      console.log(`Migration completed: ${migration}`);
    }
  }
}

async function migrateToPostgres() {
  if (!targetUri) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sourceClient = new MongoClient(sourceUri);
  const adminPool = new Pool({
    connectionString: targetUri,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Create database
    console.log('Creating database...');
    try {
      await adminPool.query('CREATE DATABASE coingroup');
      console.log('Database created successfully');
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('Database already exists');
      } else {
        throw error;
      }
    }

    // Close admin connection
    await adminPool.end();

    // Connect to the new database
    const dbPool = new Pool({
      connectionString: targetUri.replace('/postgres', '/coingroup'),
      ssl: {
        rejectUnauthorized: false
      }
    });

    await sourceClient.connect();
    console.log('Connected to MongoDB');

    // Run SQL migrations
    console.log('Running SQL migrations...');
    await runSqlMigrations(dbPool);
    console.log('SQL migrations completed');

    const sourceDb = sourceClient.db();
    
    // Migrate users
    console.log('Migrating users...');
    const users = await sourceDb.collection('users').find({}).toArray();
    for (const user of users) {
      try {
        await dbPool.query(
          `INSERT INTO users (username, email, password, role, is_active, created_at, last_login)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO NOTHING`,
          [
            user.username,
            user.email,
            user.password,
            user.role || 'user',
            user.isActive || true,
            user.createdAt || new Date(),
            user.lastLogin
          ]
        );
      } catch (error) {
        console.error(`Failed to migrate user ${user.email}:`, error);
      }
    }
    console.log(`Migrated ${users.length} users`);

    // Migrate coin locations
    console.log('Migrating coin locations...');
    const coinLocations = await sourceDb.collection('coinlocations').find({}).toArray();
    for (const location of coinLocations) {
      try {
        await dbPool.query(
          `INSERT INTO coin_locations (coin_id, location, user_id, timestamp)
           VALUES ($1, $2, $3, $4)`,
          [
            location.coinId,
            location.location,
            location.userId,
            location.timestamp || new Date()
          ]
        );
      } catch (error) {
        console.error(`Failed to migrate coin location ${location.coinId}:`, error);
      }
    }
    console.log(`Migrated ${coinLocations.length} coin locations`);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sourceClient.close();
  }
}

migrateToPostgres().catch(console.error); 