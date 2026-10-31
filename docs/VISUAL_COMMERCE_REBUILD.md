# Visual commerce rebuild — implementation status

This is the first integrated visual-commerce slice on top of the existing Market Arena branch. It does **not** claim that every screen has been redesigned or that the character is now an AAA scanned/rigged asset.

## Audit findings

- The project already used React Three Fiber / Three.js and had a procedural broker avatar, room scene, city scene, webcam scene and an existing three-look wardrobe.
- The previous wardrobe and equipment purchase handlers directly mutated React cash state. The game still has legacy personal cash and firm capital state elsewhere; full economy consolidation remains a separate migration.
- Existing equipment IDs such as `headset`, `hd-camera`, `neutral-backdrop` and `partner-desk` unlock or affect legacy gameplay. They were retained in the catalog so the new shop does not remove those progression paths.

## Implemented in this slice

- `src/game/item-catalog.mjs`: curated catalog for clothing, shoes, accessories, base suit sets and workspace equipment. Items have unique IDs, RUB prices, rarity, materials, descriptions, contextual tags and effect metadata.
- `src/game/shop-engine.mjs`: pure atomic purchase operation built on `transact()`, duplicate ownership checks and per-operation idempotency; slot-exclusive equipment logic.
- `src/ItemMarketplace.tsx` / `src/ItemMarketplace.css`: redesigned shop and inventory view with live 3D preview, search, categories, owned-items filter, sorting, balance, item details, materials, rarity, price and effect description.
- `src/BrokerAvatar3D.tsx`: the existing procedural Three.js model now reads saved equipped clothing/accessories and appearance customization. Jacket, trousers and shoe colors, watch, glasses, backpack, belt, skin tone, hair color and hairstyle can change the rendered model.
- `src/ArenaOS.tsx`: wardrobe and equipment screens use the new catalog; appearance context contributes to the negotiation chance; call-quality, market-analysis and room-comfort effects are connected to the existing negotiation calculation.
- `src/App.tsx`: catalog purchases and base suit purchases go through the atomic economy transaction function; processed operation IDs are persisted with the save and guarded synchronously against rapid duplicate clicks. Ergonomic-chair recovery changes next-day start time.
- `tests/item-marketplace.test.mjs`: catalog, atomic purchase, duplicate prevention, slot exclusivity, appearance and equipment effect regression tests.

## Deliberate limitations / next phase

1. The character remains a procedural stylized mesh assembled from Three.js primitives. It is interactive 3D, not a production photorealistic human scan, skinned clothing asset pack, facial rig or motion-capture animation set. A true AAA character requires authored/licensed GLB assets, UVs, PBR texture maps, a compatible skeleton and animation clips.
2. Current garment rendering uses compatible model color/material overlays and simple accessory geometry. Full garment meshes, cloth simulation, collision/skin weights, body-shape morphs and per-item GLB asset loading remain to be authored.
3. The new shop is integrated into the existing wardrobe/equipment apps. A dedicated global inventory screen in the desktop navigation, full item resale/returns, full character creator for facial features/body proportions, and complete responsive redesign of every other app remain.
4. The whole game still has legacy `cash` / `firmCapital` mutations outside this shop. This slice routes its own purchases through Economy Engine but does not claim to finish the global single-wallet migration.
5. Full browser playthrough, visual regression and production build must pass before this work can be called complete.

## Verification

The branch adds Node tests and uses the repository's existing GitHub Actions workflows for `npm test` and `npm run build`. CI status is authoritative; do not treat source edits or a created PR as proof that tests/build passed.