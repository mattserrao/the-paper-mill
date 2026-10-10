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

## Test build v10_econ_bal (2026-10-10)

`https://mattserrao.github.io/the-paper-mill/test/v10_econ_bal/`: condition 3 applied in the game (prices
625 / 645 / 665 / 725 $/t, outage budgets $20k / $70k / $170k; tutorial text updated), on top of v9's canvas labels.
Version tag `v4.0.1-eb`. `econ.py` on the built file reproduces condition 3 exactly (+$121,455 on the 5 base seeds).
New sim checksum **`810f617a`** (changed on purpose: cash is part of it). Smoke, determinism and id check pass.
Device autotest: `…/test/v10_econ_bal/?autotest&quick&expect=810f617a`.

## Released in v4.0.2 (2026-10-10)

Condition 3 is live in v4.0.2 (merge cebb966). Turbo speeds are off in the release. `econ.py` on the released file:
+$121,455 on the 5 base seeds, as tested.

## v4.1.0: bottleneck and environments (2026-10-10, test build `test/v11_env`)

Every run now starts with one area at 70–82% of what the machine needs, and the site's environment changes costs and
risks. `econ.py` gained `--env=` (site) and `--bn=` (force a bottleneck; `none` for no bottleneck).

| Step | Condition | Result (hands-off, 5 base seeds unless noted) |
|---|---|---|
| 1 | v4.0.2 prices, rural, no bottleneck | −$67k |
| 2 | every area at 78% | recv −$0.79M, screens −$1.45M, winder −$1.34M, pulper −$1.52M, ship −$1.97M |
| 3 | per-area shares (recv 0.68, pulper 0.82, screens 0.81, winder 0.79, ship 0.86) | ship −$0.64M, others −$1.28M to −$1.46M |
| 4 | recv 0.70, winder 0.80; prices +$83/t | pulper +$119k, recv +$115k, screens +$43k, winder +$100k, ship +$447k → ship 0.80 |
| 5 | environments with no bottleneck (+$83/t) | rural $1.67M, desert $1.74M, swamp $1.90M, urban $2.03M → urban OCC −$14 → −$5 and price +$8 → +$4; swamp OCC −$6 → −$3, overhead −$300 → −$190 |
| 6 | prices +$78/t, natural bottlenecks, 15 seeds per environment | rural −$266k, urban −$170k, desert −$337k, swamp −$126k → prices +$10/t |
| 7 | $713 / $733 / $753 / $813, 15 seeds per environment | rural −$94k, urban +$1k, desert −$116k (price −$10 → −$7), swamp +$42k; all 60 −$42k; no bankruptcies |
| 8 | + one upset per environment (iced intake, brownout, dust storm, flood), 15 seeds each | rural −$149k, urban +$13k, desert −$38k, swamp −$22k; SD up from ~$0.7M to ~$1.0M |
| **9** | **final: rural hydro energy −$5 → −$8/t** | **rural −$95k; urban +$13k, desert −$38k, swamp −$22k; no bankruptcies** |

- Prices end close to v4.0.1's list prices ($714–814): the bottleneck takes back roughly what v4.0.2's $89/t cut removed.
- Run-to-run spread is still large (SD ~$0.7–0.8M per season), so per-bottleneck averages over three or four seeds
  (−$0.7M to +$1.0M in step 7) are mostly seed luck; the forced-bottleneck runs (step 4) are the fair comparison.
- Fixing the bottleneck is the obvious first purchase: without it a hands-off season loses about $1.3–1.6M against a
  mill with no bottleneck, and the fix costs $190k–$450k after the 25% discount.
