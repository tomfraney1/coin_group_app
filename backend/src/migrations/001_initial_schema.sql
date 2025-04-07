-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coin_locations table
CREATE TYPE coin_location AS ENUM ('UCB', '1NAT', 'AMER', 'FID', 'WMP');

CREATE TABLE IF NOT EXISTS coin_locations (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(255) NOT NULL,
  location coin_location NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coin_locations_coin_id ON coin_locations(coin_id);
CREATE INDEX IF NOT EXISTS idx_coin_locations_location ON coin_locations(location);
CREATE INDEX IF NOT EXISTS idx_coin_locations_timestamp ON coin_locations(timestamp);

-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 