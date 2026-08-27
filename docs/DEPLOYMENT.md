# Deployment

Start on devnet. A production deployment handles real private keys and potentially regulated activity; this document is an engineering checklist, not legal approval.

## Container build

The Dockerfile builds a standalone Next.js server on Node 22. Its entrypoint applies committed Prisma migrations. Seeding occurs only when `SEED_DATABASE=true`; return that variable to `false` after the first successful start.

```bash
docker build \
  --build-arg NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com \
  --build-arg NEXT_PUBLIC_SOLANA_NETWORK=devnet \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-host.example \
  -t poolraid .
```

Run PostgreSQL separately with persistent, encrypted storage. Mount a keypair file read-only and pass its container path as `POOL_WALLET_KEYPAIR_FILE`. Never copy a key into the image or source tree.

## Required production configuration

- `DATABASE_URL`: TLS-enabled PostgreSQL connection string
- `SOLANA_RPC_URL`: private server-side RPC for the selected cluster
- `NEXT_PUBLIC_SOLANA_RPC_URL`: browser-safe RPC without privileged credentials
- `NEXT_PUBLIC_SOLANA_NETWORK`: `devnet` or explicit `mainnet-beta`
- `NEXT_PUBLIC_APP_URL`: exact public HTTPS origin
- `SOLANA_COMMITMENT`: normally `finalized`
- `POOL_WALLET_KEYPAIR_FILE`: mounted secret file; required in production
- `AUTH_SECRET`: at least 32 random characters
- `MAINTENANCE_SECRET`: independent random bearer secret
- `ADMIN_WALLET` and `ADMIN_PATH`
- `MAX_PAYOUT_LAMPORTS`, `PAYOUT_RATE_LIMIT_PER_MIN`, and `FLIP_ENABLED`

## Before mainnet

1. Obtain legal and regulatory review for every served jurisdiction.
2. Commission security review of authentication, deposit parsing, accounting, randomness, and payout recovery.
3. Run load, restart, RPC-failure, duplicate-request, and payout-expiry tests on devnet.
4. Establish wallet and database reconciliation with alerts.
5. Fund only the amount needed for tested liabilities; use a dedicated wallet.
6. Put the application behind HTTPS, a trusted proxy, WAF/rate limiting, and restricted maintenance access.
7. Configure one application replica, PostgreSQL backups, log retention, and monitoring.
8. Test pause, restore, key rotation, and incident procedures.

## Maintenance schedule

Call `POST /api/flip/cleanup` with `Authorization: Bearer $MAINTENANCE_SECRET` at least once per minute. The call expires unpaid reservations, refunds stale waiting rooms, resolves stuck matched rooms, and retries incomplete payouts. Treat a sustained non-200 response as an incident.
