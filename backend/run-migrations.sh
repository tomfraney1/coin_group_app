#!/bin/bash

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="coingroup"
DB_USER="coingroup"
DB_PASSWORD="3KpFHS9mhap3Asur5XYt"

# Run migrations
for migration in migrations/*.sql; do
    echo "Running migration: $migration"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration
done

echo "Migrations completed successfully!" 