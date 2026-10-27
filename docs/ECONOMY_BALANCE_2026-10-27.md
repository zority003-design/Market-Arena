# Economy balance — 27 October 2026

## Changes
- Daily salary increased from 900 to 1,200 ₽.
- Daily housing costs are 500 / 800 / 1,400 / 2,300 / 3,800 ₽.
- Housing move-in prices are 0 / 14,000 / 45,000 / 125,000 / 320,000 ₽.
- Several early equipment items and paid outfits are cheaper.
- Failed-shift penalty to firm capital reduced from 750 to 400 ₽; reputation penalty remains −3.
- Fixed lead cooldown: starter leads may return the following day instead of leaving the player unable to make calls for multiple days.
- Daily quota targets now ramp at 28 shares / 14,000 ₽ on day 1 to 148 shares / 104,000 ₽ on day 16. One shared helper feeds both the on-screen plan and shift settlement, preventing the two calculations from drifting apart.
- Shift reward reduced to 700 + 100 × day (800 ₽ on day 1, 2,300 ₽ on day 16) so it rewards performance without overpowering deal bonuses and housing costs.
- Daily salary, housing-cost, and debt calculation extracted into a pure, testable settleDailyFinances function.

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
Automated tests cover housing prices, debt settlement, client budget caps, commission splits, quota progression, client unlocks, equipment modifiers, and lead cooldown. These tests do not replace browser QA. A 20-day playthrough is still required to validate the actual feel of the economy, save/load, repeated failures, purchases, moves, and debt recovery.
