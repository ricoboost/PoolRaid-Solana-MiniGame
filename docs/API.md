# API reference

All request and response bodies are JSON unless noted. Lamport values are decimal strings. Authenticated routes use the `poolraid_session` cookie issued after a wallet-signature challenge. Mutating authenticated routes also enforce the configured origin.

## Authentication

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/nonce` | Create a player or admin wallet-signature challenge |
| POST | `/api/auth/verify` | Consume a challenge and set the session cookie |
| GET | `/api/auth/session` | Read the current session |
| DELETE | `/api/auth/session` | Clear the current session |

## Scratch cards

| Method | Route | Auth | Purpose |
| --- | --- | ---: | --- |
| POST | `/api/tickets/buy` | Player | Create a ten-minute deposit intent and seed commitment |
| POST | `/api/tickets/confirm` | Player | Verify the finalized exact deposit and fund the ticket |
| POST | `/api/tickets/scratch` | Owner | Atomically resolve a funded ticket |
| POST | `/api/tickets/claim` | Owner | Create or resume an idempotent payout |
| GET | `/api/tickets/available` | Player | List the session wallet's free tickets |
| GET | `/api/tickets/verify/[ticketId]` | Public | Return commitment and revealed results when available |

The buy response contains `ticketId`, `seedHash`, `depositAddress`, `amountLamports`, `memo`, and `expiresAt`. The client must send one System Program transfer plus one Memo Program instruction in the same transaction.

## Coin flips

| Method | Route | Auth | Purpose |
| --- | --- | ---: | --- |
| GET | `/api/flip/rooms/[tier]` | Public | List rooms for a numeric SOL tier |
| GET | `/api/flip/stream/[tier]` | Public | Subscribe to process-local SSE room updates |
| POST | `/api/flip/reserve` | Player | Reserve an available seat and receive a deposit intent |
| POST | `/api/flip/confirm` | Player | Verify deposit and occupy the reserved seat |
| POST | `/api/flip/leave` | Player | Leave the session wallet's waiting room and queue refund |
| GET | `/api/flip/history` | Public | List recent completed flips |
| GET | `/api/flip/verify/[id]` | Public | Return a completed flip's verification inputs |
| POST | `/api/flip/cleanup` | Bearer | Recover stale rooms and payouts |

## Players and public data

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET/PATCH | `/api/player/profile` | Public read subject to privacy / owner write | Profile settings and summary |
| GET | `/api/player/history` | Owner or public profile | Scratch and flip history |
| GET | `/api/player/stats` | Owner or public profile | Aggregated statistics |
| GET | `/api/referral/code` | Player | Get or create the session wallet's code |
| POST | `/api/referral/update` | Player | Change the session wallet's code |
| POST | `/api/self-exclude` | Player | Create a temporary or permanent exclusion |
| POST | `/api/declaration` | Player | Record the proxy country for the session wallet |
| GET | `/api/pools` | Public | Virtual pool balances and phase data |
| GET | `/api/feed` | Public | Recent winners |
| GET | `/api/health` | Public | Liveness only; does not verify dependencies |

## Admin

Admin routes require an admin-purpose session signed by `ADMIN_WALLET`: `/api/admin/dashboard`, `/payouts`, `/pause`, `/giveaway`, `/seed-pool`, and `/withdraw`. `ADMIN_PATH` hides the UI route but is not an authorization control.

Typical errors use 400 for invalid input, 401/403 for session or role failures, 404 for hidden resources, 409 for state or replay conflicts, 410 for expired intents, 429 for rate limits, 451 for regional restrictions, and 500/503 for operator failures.
