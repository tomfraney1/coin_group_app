import { Pool } from 'pg';

const pool = new Pool({
  user: 'coingroup',
  host: 'localhost',
  database: 'coingroup',
  password: '3KpFHS9mhap3Asur5XYt',
  port: 5433
});

const products = [
  ["000039", "Silver", 10, 1.5],
  ["000048", "Silver", 1, 1.5],
  ["000252", "Silver", 1, 1.60],
  ["000270", "Silver", 5, 3],
  ["BULL25", "Silver", 25, 7],
  ["BULLT1", "Silver", 1, 7],
  ["BULLT2", "Silver", 2, 7],
  ["BULLT5", "Silver", 5, 7],
  ["DTFSR1", "Silver", 1, 1.50],
  ["DTMSB1", "Silver", 1, 3],
  ["HHNY24", "Silver", 1, 1.5],
  ["HOHO24", "Silver", 1, 1.5],
  ["SFTF01", "Silver", 1, 2.5],
  ["SNOW24", "Silver", 1, 1.5],
  ["GAE025-N-70", "Gold", 1, 175],
  ["SAE025-N-70", "Silver", 1, 25],
  ["SAE025-N-69", "Silver", 1, 17],
  ["NRA024", "Silver", 1, 2.50],
  ["SRDT24", "Silver", 1, 2.50],
  ["TFCSB1", "Silver", 1, 1.50],
  ["000915", "Silver", 1, 4],
  ["SAE025", "Silver", 1, 4.20],
  ["SEKO25", "Silver", 1, 21]
];

async function insertProducts() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [coinId, metal, ounces, amount] of products) {
      await client.query(
        `INSERT INTO fixed_dollar_over_spot (coin_id, metal, ounces, amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (coin_id) DO UPDATE
         SET metal = $2, ounces = $3, amount = $4, updated_at = CURRENT_TIMESTAMP`,
        [coinId, metal, ounces, amount]
      );
    }

    await client.query('COMMIT');
    console.log('Successfully inserted fixed dollar over spot products');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting products:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertProducts().catch(console.error); 