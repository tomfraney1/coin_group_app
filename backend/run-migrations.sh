#!/bin/bash

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="coingroup"
DB_USER="coingroup"
DB_PASSWORD="coingroup123"

# Run migrations
for migration in migrations/*.sql; do
    echo "Running migration: $migration"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration
done

echo "Migrations completed successfully!" 