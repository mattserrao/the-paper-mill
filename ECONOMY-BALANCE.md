# The Paper Mill: economy balance (2026-10-10)

Goal: a hands-off player breaks even over a 30-day season (finishing balance ≈ the $2.0M start), within ±$100k
(±$500k also reported). Build tested: v4.0.1 (live game). No game code has been changed yet.

## Method

`tools/econ.py <index.html> <runs> [--price=D] [--outage=K] [--seed0=S]`: full seasons, sim only, ~20 s each.
- Hands-off player: declines every event card, approves the default outage budget (Standard in all three areas),
  buys no upgrades, closes report cards.
- `--price=D` adds D $/t to every grade. `--outage=K` lowers every outage budget level by $K (levels are per area,
  three areas, four outages per season, so −$10k per level = +$120k per season).
- Fixed seeds (`seed0 + k·7919`): every condition plays the same seasons. Base seeds 1000…; fresh validation seeds 500000….
- Crews arrive without walking in 3D (the game's non-3D path), so results are slightly optimistic for real play.
- The old `tools/balance.py` doesn't model play: nobody answers the first event card, which blocks every outage
  (no budgets paid), and in a tight loop 3D crews never reach a job, so the first sheet break never ends.

## Results

| Condition | Price ($/t) | Outage budget per area (low / std / high) | Seeds | Avg finish | Avg profit | SD | Within ±$100k | Within ±$500k |
|---|---|---|---|---|---|---|---|---|
| Base | list (714 / 734 / 754 / 814) | $50k / $100k / $200k | 10 base | $3,434,662 | +$1,434,662 | $741,691 | no | no |
| 1 | −$75 | −$10k (40 / 90 / 190) | 5 base | $2,176,155 | +$176,155 | $871,046 | no | yes |
| 2 | −$89 | −$20k (30 / 80 / 180) | 5 base | $2,001,455 | +$1,455 | $864,032 | yes | yes |
| 2 (check) | −$89 | −$20k | 10 fresh | $1,821,907 | −$178,093 | $1,074,576 | no | yes |
| **3** | **−$89** | **−$30k (20 / 70 / 170)** | 5 base | $2,121,455 | +$121,455 | $864,032 | no | yes |
| **3 (check)** | **−$89** | **−$30k** | 10 fresh | $1,941,907 | −$58,093 | $1,074,576 | yes | yes |
| **3, all 15** | | | 15 | **$2,001,756** | **+$1,756** | | **yes** | **yes** |

No condition had a bankruptcy. Worst single season in condition 3: finish −$650k (bankrupt is −$1.5M).

## Reading

- **Recommended setting: condition 3.** Sales prices −$89/t (23m $625, 26m $645, 30m $665, 33HT $725) and outage
  budgets $20k / $70k / $170k per area. Over 15 seasons a hands-off player finishes at $2.00M: break-even.
- Season-to-season luck is large (SD ≈ $0.9–1.1M per season), so a 5-run average carries about ±$400k of noise and a
  10-run average about ±$340k. ±$100k is only meaningful on the combined 15 runs; ±$500k is the realistic test for a
  5-run batch, and every adjusted condition passed it.
- Without changes, a player who does nothing earns +$1.43M a season; the ±$100k band needs prices about 12% lower.
- Outage budget cuts move profit exactly $120k per $10k step (they don't change the dice); price moves it about
  $21k per $1/t (≈ 21,000 t shipped).
- Not covered: an active player (upgrades, cards, crew calls), which should now be the way to profit; the
  $25M goal may need revisiting at these prices.
