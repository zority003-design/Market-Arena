# Market Arena — World & Character Art Direction v1

## Visual target
Use a stylized grounded indie-game look inspired by the readability and material language of Schedule I / Scam With Your Friends, not photorealism and not toy-like primitives. Characters should have intentional silhouettes, readable faces, restrained hand-painted material variation, simple but expressive eyes, distinct hair masses, and believable everyday clothing. Prefer authored shape language over procedural noise.

## Character production rules
- Keep one shared character presentation component for both video calls and in-person NPCs.
- Give each named character a stable identity: face proportions, skin tone, hair silhouette, outfit palette, age impression, and accessory set must not change between the call and city meeting.
- Use a small stylized material palette: painted skin gradients, hair strand flow, fabric weave/seams; avoid heavy bump noise and plastic specular.
- Expressions should be controlled by explicit states (neutral, listening, interested, skeptical, happy, annoyed), not random mouth wobble alone.
- Reuse the same character definition/data for call portrait and world NPC. Different camera framing is allowed; identity and outfit remain consistent.
- Target browser-friendly geometry and textures. Use modular body/clothing meshes and shared materials; reserve high detail for close-up faces.

## Map layout
Coordinate system: X east/west, Z north/south, Y height; street level Y=0. Target footprint 240 x 240 m, X/Z bounds [-120, 120]. Walk-only for first release.
- North/south streets: X=-90, -30, +30, +90. Standard width 10 m; Arena Avenue at X=+30 width 14 m.
- East/west streets: Z=-90, -30, +30, +90. Standard width 10 m; Market Street at Z=-30 width 14 m.
- Sidewalks target 2 m; include crossings, curbs, lamps, signs, planters and street furniture.
- Residential west: player's home near (-60,-60), equipment store near (-43,-43), apartment building near (-60,0), park near (-60,60), grocery store near (-45,60).
- Commercial center: investor cafe near (0,0), news kiosk near (15,-18).
- Business east: exchange square near (60,-60), office center near (60,0), secondary business center near (60,60).
- Coordinates are the target map specification. Do not silently mix them with the legacy compact scene coordinates; migration must update world geometry, spawn, collision, interaction zones and all entrances together.

## Interiors and purpose
1. Home: bed/sleep, computer calls and CRM, wardrobe, storage and furniture upgrades.
2. Equipment store: inspect 3D products; same product model appears in shop, inventory and room placement.
3. Investor cafe: seated face-to-face conversations, social discovery and meeting-specific client reactions.
4. Office center: reception and one unlocked meeting room first; higher-status rooms unlock with reputation/contracts.
5. Exchange square: market information, news/events and contact discovery.
6. News kiosk: short information interactions and local business rumours.
7. Apartments/second office: exterior-only or locked for first slice; later housing and business expansion.

## Gameplay loop
Morning: wake, review inbox/calendar/expenses. Day: calls, preparation, travel and face-to-face meetings. Evening: deal results, purchases and daily costs. Sleep advances day and refreshes messages/events/leads. New clients require explicit gates: day, reputation, successful deals, equipment and/or visiting a location.

Money sinks must create meaningful choices: communication equipment, appearance, housing upkeep, meeting expenses, and later office rent. Purchases must have visible benefits and never be purely decorative without clear value.

## Implementation milestones
1. Stabilize wake-up/collision and keep movement available after bed animation.
2. Introduce a single world-layout data module for roads, building footprints, doors, labels and interaction zones.
3. Expand streets and spawn/collision/navigation to the 240 m plan; test every route and door.
4. Complete home + equipment shop vertical slice; unify product model data across shop/inventory/room.
5. Complete cafe interior and seated meeting flow.
6. Add office center and exchange-square interactions.
7. Unify character identity data and expressions across video-call and in-world appearances.
8. Add day/night lighting, NPC schedules, economy costs and client unlock gates.
9. Run production build and browser walkthrough; do not mark deploy-ready until verified.

## Current branch scope
This branch begins the stylized character-material pass and documents the target. The 240 m map is a migration target, not yet implemented in the existing compact CityScene. Do not describe the full map or all interiors as complete until the scene, collision and interaction systems are migrated and tested.
