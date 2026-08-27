# Operations

## Daily checks

- Confirm the health endpoint, application logs, PostgreSQL, and RPC are reachable.
- Review payouts in `pending`, `preparing`, `signed`, or `submitted` state.
- Compare the on-chain wallet balance with virtual pool balances, house profit, and unresolved liabilities.
- Check reservation expiry, stale-room refunds, rate-limit growth, and maintenance-job success.
- Review admin actions and unexpected authentication or regional-block events.

## Ledger reconciliation

The wallet balance should cover all virtual scratch pools, unsettled flip deposits, confirmed-but-unpaid player claims, refundable reservations, and an on-chain fee reserve. House profit is an allocation, not additional SOL. Investigate any drift before accepting new deposits.

Do not repair balances with ad hoc SQL. Pause play, back up the database, identify the exact chain transactions and affected business keys, write a reviewed migration or reconciliation tool, test it against a restored copy, then record the operator action.

## Backups and restore

Use encrypted PostgreSQL backups with tested point-in-time recovery. Store backup credentials separately from application secrets. A restore drill should verify migrations, seed idempotency, room recovery, payout retries, and chain reconciliation before reopening deposits.

## Key rotation

Pause deposits and flips, allow or reconcile outstanding payouts, mount the new key at a new path, update the secret configuration, restart the single replica, verify its public address, and explicitly reallocate only backed virtual balances. Changing the key without reconciling liabilities makes the ledger insolvent.

## Incident priorities

1. Prevent new loss: disable public traffic, pause tiers, and set `FLIP_ENABLED=false`.
2. Protect remaining funds and rotate exposed credentials.
3. Preserve logs, database snapshots, configuration metadata, and transaction IDs.
4. Reconcile every liability and communicate through the deployment operator's established channel.
5. Fix, review, and test before reopening.
