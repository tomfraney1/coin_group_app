import { pool } from './config/database';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to database');
    
    // Test querying users table
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Found ${usersResult.rows[0].count} users in the database`);
    
    // Test querying coin_locations table
    const locationsResult = await client.query('SELECT COUNT(*) FROM coin_locations');
    console.log(`✅ Found ${locationsResult.rows[0].count} coin locations in the database`);
    
    // Test querying migrations table
    const migrationsResult = await client.query('SELECT COUNT(*) FROM migrations');
    console.log(`✅ Found ${migrationsResult.rows[0].count} migrations in the database`);
    
    client.release();
    console.log('✅ All tests completed successfully');
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection(); 