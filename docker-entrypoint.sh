#!/bin/sh
set -e

# Run Prisma migrations/push to ensure DB schema is up to date
# This ensures the database is created and migrated on first run
# and on subsequent runs after updates
echo "Syncing database schema..."
npx prisma db push --skip-generate

# Start the Next.js server
echo "Starting Claros..."
exec node server.js

