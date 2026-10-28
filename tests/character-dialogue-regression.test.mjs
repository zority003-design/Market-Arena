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
  assert.match(sleep, /businessNetIncome \+ staffNetIncome/)
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


test('negated guarantees are not treated as reckless promises by the dialogue evaluator', async () => {
  const source = await read('src/game/dialogue.ts')
  assert.match(source, /const rejectsGuarantee =/)
  assert.match(source, /const promises = !rejectsGuarantee/)
})

test('stock suitability does not alias unrelated companies into one another', async () => {
  const source = await read('src/game/economy.ts')
  assert.match(source, /const canonicalTicker = ticker === 'KTLT' \? 'KOTL' : ticker/)
  assert.doesNotMatch(source, /SBRX: 'OGUR'|NEFT: 'BTRAN'|MEDX: 'DUST'|GROV: 'TAPK'/)
  assert.match(source, /const riskScore: Record<string, number>/)
  assert.match(source, /getClientInvestmentPreference\(clientId\)/)
  assert.match(source, /score > preference\.riskLevel/)
})


test('successful negotiation credits firm commission and personal bonus separately', async () => {
  const source = await read('src/ArenaOS.tsx')
  assert.match(source, /const firmCommission = Math\.round\(client\.ticket \* client\.commissionRate\)/)
  assert.match(source, /const playerBonus = Math\.min\(getBusinessPayoutCap/)
  assert.match(source, /props\.setCash\(v=>v\+playerBonus\); props\.setFirmCapital\(v=>v\+firmCommission\)/)
  assert.match(source, /Комиссия фирмы:/)
})


test('clients have explicit individual risk preferences and stock fit explains mismatches', async () => {
  const source = await read('src/game/economy.ts')
  assert.match(source, /export const CLIENT_INVESTMENT_PREFERENCES/)
  for (const id of ['alex-vorontsov', 'yaroslav-nikitin', 'diana-volkova', 'andrey-morozov']) {
    assert.match(source, new RegExp("'" + id + "': \\{ riskLevel:"))
  }
  assert.match(source, /riskLabel:/)
  assert.match(source, /priorities:/)
  assert.match(source, /avoids:/)
  assert.match(source, /Риск .* выше профиля/)
})

test('Catalot is a fictional real-estate developer, not a drone company', async () => {
  const arena = await read('src/ArenaOS.tsx')
  const app = await read('src/App.tsx')
  const economy = await read('src/game/economy.ts')
  assert.match(arena, /ticker:'KOTL', name:'Каталёт'/)
  assert.match(arena, /застройщик жилых кварталов/)
  assert.match(app, /name: 'Каталёт', sector: 'Девелопмент'/)
  assert.match(economy, /KOTL: \{ label:'Рост и девелопмент'/)
  assert.doesNotMatch(arena.slice(arena.indexOf('const RESPONSE_BANK'), arena.indexOf('const STOCK_DOSSIERS')), /Котолёт|800 роботов|дронами/)
  assert.doesNotMatch(app.slice(app.indexOf('const scenarios:'), app.indexOf('const scenario = scenarios')), /Котолёт|800 роботов|дронами/)
})

test('company negotiation dossiers contain business models, pros, cons, valuation checks, and argumentation', async () => {
  const source = await read('src/ArenaOS.tsx')
  assert.match(source, /const STOCK_DOSSIERS: Record/)
  assert.match(source, /advantages: string\[\]/)
  assert.match(source, /disadvantages: string\[\]/)
  assert.match(source, /valuation: string/)
  assert.match(source, /argument: string/)
  assert.match(source, /Что проверить в оценке:/)
  assert.match(source, /Аргумент для переговоров:/)
  assert.match(source, /fit\.reason/)
})
