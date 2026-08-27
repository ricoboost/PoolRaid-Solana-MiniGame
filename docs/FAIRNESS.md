# Fairness and verification

PoolRaid provides server-seed commitments. This makes completed outcomes reproducible and detects a changed seed; it is not a decentralized randomness oracle.

## Scratch cards

Before payment, the server generates 32 random bytes, stores the seed, and returns `SHA256(seed)` with the ticket intent. For zone `N`:

```text
digest = HMAC-SHA256(key = seed, message = ticketId + ":zone" + N)
roll = unsignedBigEndian(digest[0..4]) / 2^32
```

The roll is in `[0, 1)` and is mapped to the tables in `GAME_MECHANICS.md`. After scratching, the seed and zone results are public through the ticket verification endpoint and page. Verify that the seed hashes to the earlier commitment, recompute each roll, then apply the pool snapshot rules represented by the stored results.

## Coin flips

After the first deposit is confirmed:

```text
serverSeedHash = SHA256(serverSeed)
digest = SHA256(serverSeed + ":" + walletA + ":" + walletB + ":" + roomId)
result = heads if digest[0] < 128, otherwise tails
```

The commitment is visible while the room waits for the second player. The completed history reveals the seed, inputs, result, payout status, and transaction signature.

## Trust limitations

- The server chooses a seed before publishing each commitment; there is no player-provided entropy.
- The server controls the database, application deployment, RPC selection, and payout key.
- Observers cannot prove that a public deployment matches a particular source commit without independent attestation.
- A commitment proves that a revealed seed was not changed after commitment. It does not prove that the operator did not discard candidate seeds before publishing one.

A more trust-minimized design would use a reviewed on-chain program plus a verifiable randomness service or a multi-party commit/reveal scheme.
