#!/bin/sh
set -e

echo "[PoolRaid] Applying database migrations..."
npx prisma migrate deploy --config prisma/prisma.config.ts

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "[PoolRaid] Seeding database..."
  npx prisma db seed --config prisma/prisma.config.ts
fi

echo "[PoolRaid] Starting server on port ${PORT:-3000}..."
exec node server.js
