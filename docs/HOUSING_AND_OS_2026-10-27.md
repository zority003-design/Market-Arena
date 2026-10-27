# Housing and desktop OS update — 2026-10-27

## Housing loop
- The store now contains both room equipment and the five housing tiers.
- Each home card shows move-in price, daily upkeep, first-impression modifier, and comfort.
- Buying an available home charges the move-in price, updates the saved housing ID, closes desktop app windows, and returns the player to the 3D room.
- Room equipment remains owned after moving.
- The home tier changes the room's furnishing palette and decor set; the dorm, shared flat, studio, city apartment, and premium apartment each have a different accent setup.
- Housing comfort contributes to the first-impression modifier used when a client call starts. The existing trust calculation still caps the final modifier, so better housing is an advantage, not an automatic deal win.

## Desktop OS
- The desktop store shortcut now clearly advertises housing, equipment, and wardrobe.
- The system-time widget includes a comfort meter for the current home.
- The separate real-estate app remains available as a direct shortcut; housing can also be bought from the main store.

## Validation still required
- Run `npm test` and `npm run build` in CI.
- Visually inspect all five interiors at desktop and mobile sizes.
- Verify the move action from both the store window and the standalone real-estate app.
- Play through multiple days to confirm that comfort bonuses do not overwhelm negotiation decisions.
