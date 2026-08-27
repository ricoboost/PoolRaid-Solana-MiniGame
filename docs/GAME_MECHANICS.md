# Game mechanics

## Scratch cards

Scratch ticket prices are 0.001, 0.01, 0.1, 1, 5, and 10 SOL. Each ticket derives three rolls from the committed server seed and ticket ID.

### Zone 1: ticket multiplier

| Outcome | Probability | Nominal multiplier |
| --- | ---: | ---: |
| Nothing | 20% | 0× |
| Quarter | 25% | 0.25× |
| Half | 20% | 0.5× |
| Money back | 15% | 1× |
| Win | 10% | 1.5× |
| Big win | 5% | 2× |
| Mega win | 3% | 3× |
| Jackpot | 2% | 5× |

The nominal expected return is 0.7525 times the ticket price before pool caps. The allowed maximum is 2×, 3×, or 5× as the raidable pool reaches 0×, 5×, or 10× the ticket price. A payout is also capped by the raw virtual pool balance.

### Zone 2: pool raid

| Outcome | Probability | Share of remaining raidable balance |
| --- | ---: | ---: |
| No raid | 93% | 0% |
| Raid | 3% | 5% |
| Raid | 2% | 10% |
| Raid | 1.2% | 25% |
| Raid | 0.5% | 50% |
| Drain | 0.3% | 100% |

Zone 2 operates on the raidable balance left after Zone 1. Its expected payout is 1.2% of that balance, so its SOL-denominated expected value changes with pool size.

### Zone 3: free ticket

There is an 8% chance of the same tier and a 1% chance of the next tier. If the next-tier pool has no liquidity, the reward falls back to the current tier. Free tickets receive half the normal XP and do not add a new deposit to a pool.

### Pool phases

| Existing paid ticket count | Deposit to pool | House allocation | Protected floor |
| --- | ---: | ---: | ---: |
| 0–20 | 100% | 0% | 1× ticket price |
| 21–100 | 95% | 5% | 3× ticket price |
| 101+ | 90% | 10% | 5× ticket price |

Integer division rounds allocations and percentage payouts down to a whole lamport.

## Coin flips

Available deposits are 0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, and 100 SOL per player. Two equal deposits form the pot. The winner receives 97%; the other 3% is allocated to house profit. A first player who leaves within 60 seconds receives a 97% refund; leaving after 60 seconds is free. Expired unmatched rooms are refunded in full by maintenance.

The server rejects a new room reservation when its possible winner payout exceeds `MAX_PAYOUT_LAMPORTS`. With the example 50 SOL cap, the 50 and 100 SOL tiers are intentionally unavailable.

Probabilities and commitments make results reproducible, but they do not remove the need to trust the operator to run the published code and safeguard funds. See [FAIRNESS.md](FAIRNESS.md).
