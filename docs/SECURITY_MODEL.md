# Security model

## Trust boundaries

Players trust the operator to run the published application, protect the payout key, keep database accounting consistent with the shared wallet, operate within applicable law, and honor retryable payouts. The application never requests a user's secret key. Wallets sign login messages and ordinary SOL transfers.

## Implemented controls

- One-time, five-minute authentication nonces bound to wallet, purpose, origin, issue time, and expiry
- Ed25519 message verification followed by `HttpOnly`, `Secure` in production, `SameSite=Strict` JWT cookies
- Same-origin enforcement on authenticated mutations
- Five-minute player/admin challenge separation; 24-hour player and 15-minute admin sessions
- Finalized deposit parsing with exact sender, recipient, lamports, and Memo Program content
- Global uniqueness for deposit signatures and purpose/reference pairs
- Serializable database transactions for pool, room, referral, and scratch mutations
- Integer lamport arithmetic and basis-point fee calculations
- Payout business keys, persisted signed bytes, signature tracking, expiry checks, and interrupted-preparation recovery
- Self-exclusion checks on new scratch and flip deposits
- Database rate limits and a configurable maximum scratch payout
- Production keypair files mounted outside the repository; environment private keys are development-only
- Coarse country blocking for pages and state-changing APIs when a trusted `cf-ipcountry` header is present

## Known limitations

- This is a custodial hot-wallet design during gameplay; it is not a smart contract or escrow program.
- One shared wallet backs multiple virtual pools and house profit. Solvency requires operator reconciliation.
- No automated chain-to-ledger reconciliation or external signing service is included.
- Geo headers are meaningful only when a trusted reverse proxy strips client-supplied values.
- Process-local SSE and timers require a single application replica.
- Rate-limit rows need periodic cleanup and are not a substitute for edge rate limiting.
- The v1 Solana SDK dependency currently inherits advisories for transitive RPC packages; follow dependency audit output and upstream releases.
- Legal pages are templates, not legal advice.

## Production recommendations

Use a dedicated low-balance wallet, encrypted or secret-manager-backed read-only key mounts, separate RPC credentials for server and browser, database TLS, encrypted backups, an edge WAF, centralized logs with secret redaction, alerts for pending payouts and ledger drift, and independent code review. Restrict the maintenance endpoint at the network layer in addition to its bearer secret.
