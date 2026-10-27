# Economy balance — 27 October 2026

## Changes
- Daily salary increased from 900 to 1,200 ₽.
- Daily housing costs are now 500 / 800 / 1,400 / 2,300 / 3,800 ₽.
- Housing move-in prices are now 0 / 14,000 / 45,000 / 125,000 / 320,000 ₽.
- Several early equipment items and paid outfits are cheaper.
- Failure penalty to firm capital reduced from 750 to 400 ₽; reputation penalty remains −3.
- Fixed lead cooldown: the old 3-day gap could leave a player with only two starter leads unable to call anyone for multiple days. Leads may return the following day, while deal-count and budget limits still apply.
- Extracted daily salary/expenses/debt calculation into a pure, testable settleDailyFinances function.

## Daily settlement
Salary is added at the day transition. Housing costs are paid first, then remaining cash repays debt. Any unpaid housing cost is added to debt, and cash cannot become negative.

Salary minus daily housing cost before deal bonuses:
- Dorm: +700 ₽/day.
- Shared flat: +400 ₽/day.
- Studio: −200 ₽/day.
- City apartment: −1,100 ₽/day.
- Premium apartment: −2,600 ₽/day.

This intentionally makes higher-tier housing require successful deals rather than allowing salary alone to pay for it.

## Validation scope
Automated tests cover housing price progression, debt settlement, client budget caps, commission splits, client unlocks, equipment modifiers, and lead cooldown. These tests do not replace browser QA. A 20-day playthrough is still required to validate the actual feel of the economy, saving/loading, repeated failures, purchases, moves, and debt recovery.
