# Contributing

Thank you for helping improve PoolRaid. Changes involving funds, authentication, randomness, migrations, or operator keys receive extra scrutiny.

## Development workflow

1. Fork the repository and create a focused branch.
2. Use devnet and disposable test keys only.
3. Copy `.env.example` to `.env`; never commit that file or a keypair.
4. Start PostgreSQL with `docker compose up -d postgres`.
5. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed`.
6. Add tests for behavioral changes.
7. Run `npm run check` before opening a pull request.

## Pull requests

Explain the user-visible behavior, trust or accounting impact, test evidence, schema changes, and rollback considerations. Keep generated output and unrelated formatting out of the change. New monetary fields must use lamports and `bigint`; JSON responses must serialize them as decimal strings.

Never weaken finalized deposit checks, memo binding, wallet ownership checks, payout idempotency, self-exclusion, or admin authentication for convenience. Report suspected vulnerabilities privately according to `SECURITY.md`.
