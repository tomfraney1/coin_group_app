"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const migrations = [
    '001_create_users.sql',
    '002_add_user_active.sql',
    '003_add_user_last_login.sql',
    '004_create_coin_locations.sql'
];
async function runMigrations() {
    try {
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
        // Run pending migrations
        for (const migration of migrations) {
            if (!executedMigrations.has(migration)) {
                console.log(`Running migration: ${migration}`);
                const sql = fs_1.default.readFileSync(path_1.default.join(__dirname, migration), 'utf8');
                await pool.query(sql);
                await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration]);
                console.log(`Migration completed: ${migration}`);
            }
        }
        console.log('All migrations completed successfully');
    }
    catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
runMigrations();
