CREATE TYPE coin_location AS ENUM ('UCB', '1NAT', 'AMER', 'FID', 'WMP');

CREATE TABLE IF NOT EXISTS coin_locations (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(255) NOT NULL,
  location coin_location NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coin_locations_coin_id ON coin_locations(coin_id);
CREATE INDEX IF NOT EXISTS idx_coin_locations_location ON coin_locations(location);
CREATE INDEX IF NOT EXISTS idx_coin_locations_timestamp ON coin_locations(timestamp); 