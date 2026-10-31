# Global systems rebuild — implementation notes

This branch introduces independently testable foundations for the rebuild. It is intentionally not described as a completed integration: the existing application still stores and mutates legacy `cash` and `firmCapital` state in `src/App.tsx`, so UI-wide migration must be completed before claiming that every live gameplay payment uses the unified ledger.

## Added

- `src/game/economy-engine.mjs`: immutable single-cash-ledger operations, asset purchase/sale, liabilities, net-worth calculation, idempotency keys, overdraft protection, and legacy-save migration that consolidates `cash + firmCapital`.
- `src/game/dialogue-engine.mjs`: local intent classification, four distinct character archetypes, compact character memory, promise tracking, and relationship/patience consequences.
- `src/game/time-engine.mjs`: deterministic daily action/time budget and next-day reset.
- `tests/global-systems.test.mjs`: regression coverage for the new foundations. The existing `npm test` glob includes this file.

## Remaining integration work

1. Replace the parallel React cash states with a single persisted economy state and route every live purchase, commission, salary, expense, refund, reward and investment through the transaction service.
2. Migrate existing saves on load and persist the ledger/portfolio/character memory/time state atomically.
3. Connect dialogue engine to call UI and replace legacy keyword scoring; add contextual response content and follow-up events.
4. Connect time engine to analysis, calls, purchases, tasks and day-end flow.
5. Add market/company event simulation and connect company fundamentals, news, stock prices and client dialogue.
6. Run full browser playthroughs and validate old saves, responsive layout, TypeScript and production build.

The new services are pure local modules and do not require an external AI provider.
