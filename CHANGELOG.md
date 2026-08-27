# Changelog

This project uses a simple, release-oriented changelog. Until the first tagged release, noteworthy changes are collected under `Unreleased`.

## Unreleased

- Prepared the PoolRaid codebase for an initial public release.
- Added wallet-signature sessions, exact deposit intents, global replay protection, and durable payouts.
- Migrated monetary persistence to lamport `BigInt` fields and added a clean baseline migration.
- Made devnet the default and production keypair files mandatory.
- Added tests, CI, Docker/PostgreSQL setup, security guidance, and project documentation.
