import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8')

test('3D avatar uses a stable floor origin and frames the full body', async () => {
  const source = await read('src/BrokerAvatar3D.tsx')
  assert.match(source, /export function BrokerModel/)
  assert.match(source, /pose === 'seated'/)
  assert.match(source, /position=\{seated \? \[0, -0\.15, 0\] : \[0, 0, 0\]\}/)
  assert.match(source, /scale=\{seated \? 0\.72 : 1\}/)
  assert.doesNotMatch(source, /root\.current\.position\.y\s*=/)
  assert.match(source, /camera=\{\{ position: \[0, 1\.38, compact \? 6\.2 : 5\.9\]/)
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


test('free-text scoring and company replies cover jokes and all listed stocks', async () => {
  const source = await read('src/App.tsx')
  const answerHandler = source.slice(source.indexOf('function answerQuestion'), source.indexOf('function sendFreeAnswer'))
  const freeText = source.slice(source.indexOf('function sendFreeAnswer'), source.indexOf('function buyRoomItem'))
  assert.match(answerHandler, /const tickerReplies: Record<string, string\[\]> = \{/)
  assert.match(answerHandler, /if \(companyReplies\.length\)/)
  assert.match(answerHandler, /companyReplies\[questionIndex % companyReplies\.length\]/)
  assert.doesNotMatch(answerHandler, /companyReplies\[\(questionIndex \+ seed\)/)
  assert.match(freeText, /const joke =/)
  assert.match(freeText, /A joke is not automatically a bad answer/)
  assert.match(answerHandler, /rejectsGuarantee/)
})


test('honest rejection of guaranteed returns is not scored as a reckless promise', async () => {
  const source = await read('src/App.tsx')
  const answerHandler = source.slice(source.indexOf('function answerQuestion'), source.indexOf('function sendFreeAnswer'))
  const freeText = source.slice(source.indexOf('function sendFreeAnswer'), source.indexOf('function buyRoomItem'))
  assert.ok(answerHandler.includes('const rejectsGuarantee = /не\\s+'))
  assert.match(answerHandler, /const reckless = !rejectsGuarantee/)
  assert.match(freeText, /const rejectsGuarantee =/)
  assert.match(freeText, /const reckless = !rejectsGuarantee/)
  assert.match(answerHandler, /const safeDelta = reckless \? -15 : delta/)
})

test('business and employee income is credited to firm capital, not the broker wallet', async () => {
  const source = await read('src/App.tsx')
  const sleepStart = source.indexOf('function sleepNow')
  const sleepEnd = source.indexOf('  return (\n    <main', sleepStart)
  const sleep = source.slice(sleepStart, sleepEnd)
  assert.match(sleep, /setCash\(\(value\) => Math\.max\(0, value \+ DAILY_SALARY\)\)/)
  assert.match(sleep, /setFirmCapital\(\(value\) => Math\.max\(0, value \+ businessNetIncome \+ staffNetIncome\)\)/)
  assert.doesNotMatch(sleep, /const available = cash \+ DAILY_SALARY \+ businessNetIncome \+ staffNetIncome/)
})


test('firm upgrades, assets, and staff hires use firm capital rather than personal cash', async () => {
  const source = await read('src/ArenaOS.tsx')
  const upgradeHandler = source.slice(source.indexOf('const buyBusinessUpgrade'), source.indexOf('const buyBusinessAsset'))
  const assetHandler = source.slice(source.indexOf('const buyBusinessAsset'), source.indexOf('const hireBroker'))
  const hireHandler = source.slice(source.indexOf('const hireBroker'), source.indexOf('const buyGear'))
  assert.match(upgradeHandler, /props\.firmCapital < upgrade\.price/)
  assert.match(upgradeHandler, /props\.setFirmCapital/)
  assert.match(assetHandler, /props\.firmCapital < asset\.price/)
  assert.match(assetHandler, /props\.setFirmCapital/)
  assert.match(hireHandler, /props\.firmCapital < employee\.price/)
  assert.match(hireHandler, /props\.setFirmCapital/)
  assert.match(source, /КАПИТАЛ ФИРМЫ/)
})
