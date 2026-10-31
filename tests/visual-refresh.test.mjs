import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ITEM_CATALOG, getEquippedAppearance } from '../src/game/item-catalog.mjs'

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8')

test('signature wardrobe collection contains wearable pieces mapped to real avatar slots', () => {
  const ids = ['style-midnight-blazer','style-sand-overshirt','style-ivory-shirt','style-graphite-trousers','style-burgundy-derby','style-snow-sneakers','style-chronograph-onyx','style-architect-frame']
  for (const id of ids) assert.ok(ITEM_CATALOG.some(item => item.id === id), id + ' is available in the catalog')
  const appearance = getEquippedAppearance(['style-midnight-blazer','style-graphite-trousers','style-burgundy-derby','style-chronograph-onyx','style-architect-frame'])
  assert.equal(appearance.jacketColor, '#172b45')
  assert.equal(appearance.trousersColor, '#343d49')
  assert.equal(appearance.shoeColor, '#542b32')
  assert.equal(appearance.watch, true)
  assert.equal(appearance.glasses, true)
})

test('dialogue scene exposes a live client portrait, mood, trust and persistent memory context', async () => {
  const source = await read('src/ArenaOS.tsx')
  assert.match(source, /arena-os-dialogue-header/)
  assert.match(source, /arena-os-mood-chip/)
  assert.match(source, /arena-os-dialogue-trust/)
  assert.match(source, /props\.clientMemory\[client\.id\]/)
  assert.match(source, /aria-live="polite"/)
})

test('wardrobe highlights the new signature collection and has responsive premium styling', async () => {
  const component = await read('src/ItemMarketplace.tsx')
  const styles = await read('src/ItemMarketplace.css')
  const arenaStyles = await read('src/ArenaOS.css')
  assert.match(component, /SIGNATURE COLLECTION/)
  assert.match(styles, /\.marketplace-drop/)
  assert.match(arenaStyles, /\.arena-os-dialogue-header/)
  assert.match(arenaStyles, /@media\(max-width:700px\)/)
})
