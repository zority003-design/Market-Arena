import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8')

test('3D avatar animation preserves the full-body vertical offset', async () => {
  const source = await read('src/BrokerAvatar3D.tsx')
  assert.match(source, /root\.current\.position\.y\s*=\s*-1\.05\s*\+/)
  assert.match(source, /export function BrokerModel/)
  assert.match(source, /pose === 'seated'/)
  assert.match(source, /camera=\{\{ position: \[0, compact \? 0\.25 : 0\.22, compact \? 5\.9 : 5\.35\]/)
})

test('hired staff use the same detailed model as the player', async () => {
  const room = await read('src/RoomScene.tsx')
  assert.match(room, /import \{ BrokerModel \} from '\.\/BrokerAvatar3D'/)
  assert.match(room, /<BrokerModel identity=\{employeeId\}[^>]*pose="seated"/)
  assert.doesNotMatch(room, /Seated employee: overlapping torso, pelvis, sleeves/)
})

test('every listed stock has its own negotiation scenario and follow-up questions', async () => {
  const source = await read('src/App.tsx')
  const scenarios = source.slice(source.indexOf('const scenarios:'), source.indexOf('const scenario = scenarios'))
  const followUps = source.slice(source.indexOf('const followUps:'), source.indexOf('const baseQuestions'))
  for (const ticker of ['KOTL', 'OGUR', 'TAPK', 'BTRAN', 'DUST', 'SBRX', 'NEFT', 'MEDX', 'GROV', 'GRID', 'BYTE', 'LOGI']) {
    assert.match(scenarios, new RegExp('\\n    ' + ticker + ': \\{'), ticker + ' needs its own scenario')
    assert.match(followUps, new RegExp('\\n    ' + ticker + ': \\['), ticker + ' needs follow-up questions')
  }
})
