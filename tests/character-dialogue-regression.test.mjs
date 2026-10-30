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
  assert.match(source, /camera=\{\{ position: \[0, compact \? 2\.05 : 1\.8, compact \? 3\.65 : 5\.9\]/)
  assert.match(source, /camera\.lookAt\(0, compact \? 1\.48 : 1\.28, 0\)/)
  assert.match(source, /rotation=\{\[0, 0, 0\]\}/)
  assert.doesNotMatch(source, /rotation=\{\[0, seated \? Math\.PI : 0, 0\]\}/)
  assert.match(source, /outfit === 'premium' \? '#17283f'/)
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
  for (const ticker of ['KOTL', 'OGUR', 'TAPK', 'BTRAN', 'DUST', 'VECT', 'NEFT', 'MEDX', 'GROV', 'GRID', 'BYTE', 'LOGI']) {
    assert.match(scenarios, new RegExp('\\n    ' + ticker + ': \\{'), ticker + ' needs its own scenario')
    assert.match(followUps, new RegExp('\\n    ' + ticker + ': \\['), ticker + ' needs follow-up questions')
  }
})


test('free-text scoring and company replies cover jokes and all listed stocks', async () => {
  const source = await read('src/App.tsx')
  const answerHandler = source.slice(source.indexOf('function answerQuestion'), source.indexOf('function sendFreeAnswer'))
  const freeText = source.slice(source.indexOf('function sendFreeAnswer'), source.indexOf('function buyRoomItem'))
  assert.match(answerHandler, /const tickerReplies: Record<string, string\[\]> = \{/)
  assert.match(answerHandler, /const companyAside = companyReplies\.length \?/)
  assert.match(answerHandler, /if \(companyAside\)/)
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
  assert.match(sleep, /setCash\(\(value\) => Math\.max\(0, value \+ DAILY_SALARY - personalHousingCost\)\)/)
  assert.match(sleep, /setFirmCapital\(\(value\) => Math\.max\(0, value \+ businessNetIncome \+ staffNetIncome - officeRent\)\)/)
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
  assert.doesNotMatch(source, /VECT: 'OGUR'|NEFT: 'BTRAN'|MEDX: 'DUST'|GROV: 'TAPK'/)
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

test('KOTL keeps its property-business role while the pitch uses the new comedy name', async () => {
  const arena = await read('src/ArenaOS.tsx')
  const app = await read('src/App.tsx')
  const economy = await read('src/game/economy.ts')
  assert.match(arena, /ticker:\"KOTL\", name:\"Котолёт\"/)
  assert.match(arena, /Строит жилые кварталы с балконами для котов/)
  assert.match(app, /name:\"Котолёт\", sector:\"Девелопмент\"/)
  assert.match(economy, /KOTL:\{label:'Кошачий девелопмент'/)
  assert.doesNotMatch(arena, /800 роботов|дронами/)
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


test('displayed stock risk labels match the suitability catalog', async () => {
  const arena = await read('src/ArenaOS.tsx')
  const economy = await read('src/game/economy.ts')
  assert.match(arena, /risk: 'Низкий' \| 'Средний' \| 'Высокий' \| 'Очень высокий'/)
  assert.match(arena, /ticker:\"TAPK\", name:\"Не Моя Смена\", price:64, risk:\"Высокий\"/)
  assert.match(economy, /OGUR:\{label:'Прибыль и повторные покупки',color:'#16a34a',description:'Производитель напитков; важны маржа, упаковка и дистрибуция.',risk:'Низкий'\}/)
})


test('the in-game day advances at a readable pace and clocks render whole minutes', async () => {
  const app = await read('src/App.tsx')
  const arena = await read('src/ArenaOS.tsx')
  assert.match(app, /setGameMinutes\(\(value\) => \(value \+ 1\.6\) % \(24 \* 60\)\), 1000\)/)
  assert.match(app, /Math\.floor\(gameMinutes % 60\)/)
  assert.match(arena, /const gameClockLabel = String\(Math\.floor\(props\.gameMinutes \/ 60\) % 24\)/)
})

test('OS taskbar remains outside the app window and can control sound at all times', async () => {
  const source = await read('src/ArenaOS.tsx')
  const desktop = source.slice(source.indexOf('<div className="arena-os-desktop">'), source.indexOf('{startMenuOpen && <div className="arena-os-start-menu"'))
  assert.match(desktop, /arena-os-workspace/)
  assert.match(desktop, /\{windowOpen && <main/)
  assert.match(desktop, /<footer className="arena-os-taskbar"/)
  assert.match(desktop, /setGameVolume\(Number\(e\.target\.value\)\)/)
  assert.match(desktop, /gameClockLabel/)
  assert.match(source, /onDragStart=.*dataTransfer\.setData/)
  assert.match(source, /windowDragRef\.current=/)
})

test('post-call results explain cash, firm commission, XP, reputation, referral, and next actions', async () => {
  const source = await read('src/ArenaOS.tsx')
  assert.match(source, /ТВОЙ ЛИЧНЫЙ ЗАРАБОТОК/)
  assert.match(source, /КОМИССИЯ ФИРМЫ/)
  assert.match(source, /КАПИТАЛ КЛИЕНТА/)
  assert.match(source, /XP нельзя потратить как деньги/)
  assert.match(source, /рекомендует тебя знакомым/)
  assert.match(source, /Открыть клиентскую базу/)
  assert.match(source, /Развивать фирму/)
})

test('housing progression starts in a small apartment and rents an office as level three', async () => {
  const economy = await read('src/game/economy.ts')
  const room = await read('src/RoomScene.tsx')
  const app = await read('src/App.tsx')
  assert.match(economy, /STARTING_HOUSING_ID = 'studio'/)
  assert.match(economy, /id:'studio', name:'Маленькая квартира', price:0/)
  assert.match(economy, /id:'city-apartment', name:'Хорошая квартира'/)
  assert.match(economy, /id:'office', name:'Небольшой брокерский офис', price:30000, dailyCost:1200/)
  assert.match(economy, /id:'premium-apartment', name:'Апартаменты с панорамным видом'/)
  assert.doesNotMatch(economy.slice(economy.indexOf('export const HOUSING'), economy.indexOf('export const ROOM_ITEMS')), /name:'Общежитие'/)
  assert.match(app, /data\.housingId === 'dorm' \? 'studio'/)
  assert.match(room, /const officeRoom = housingId === 'office'/)
  assert.match(room, /!dormRoom && !officeRoom/)
})

test('equipment has custom product illustrations and a desk affordable from starting cash', async () => {
  const arena = await read('src/ArenaOS.tsx')
  const economy = await read('src/game/economy.ts')
  assert.match(arena, /function GearIllustration/)
  assert.match(arena, /gear-art-'\+g\.icon/)
  assert.match(arena, /partner-desk',name:'Дополнительный рабочий стол',price:5800/)
  assert.match(economy, /id:'partner-desk', name:'Дополнительный рабочий стол', price:5800/)
})

test('client dialogue no longer appends the same generic plan-B suffix to every answer', async () => {
  const dialogue = await read('src/game/dialogue.ts')
  const arena = await read('src/ArenaOS.tsx')
  assert.doesNotMatch(dialogue, /На ближайшем отчёте сверю тезис/)
  assert.doesNotMatch(arena, /План Б: /)
  assert.match(arena, /function clientStockReaction/)
  assert.match(arena, /function clientHesitationLine/)
  assert.match(arena, /function clientClosingLine/)
  assert.match(arena, /const shift = \(turn \* 2 \+ client\.id\.length \+ stock\.ticker\.length\)/)
})


test('the broker can end the shift early after serving two clients and reach the sleep flow', async () => {
  const arena = await read('src/ArenaOS.tsx')
  const app = await read('src/App.tsx')
  assert.match(arena, /props\.callsToday>=2/)
  assert.match(arena, /onClick=\{props\.onEndDay\}/)
  assert.match(arena, /Можешь продолжить до дневного лимита/)
  assert.match(app, /onEndDay=\{endDay\}/)
  assert.match(app, /function endDay\(\)/)
})


test('seated broker portraits face the camera and use a closer upper-body frame', async () => {
  const source = await read('src/BrokerAvatar3D.tsx')
  assert.match(source, /rotation=\{\[0, 0, 0\]\}/)
  assert.match(source, /compact \? 3\.65 : 5\.9/)
  assert.match(source, /fov: compact \? 29 : 34/)
  assert.match(source, /camera\.lookAt\(0, compact \? 1\.48 : 1\.28, 0\)/)
})


test('market has exactly ten distinct fictional companies and each has a company-specific pitch', async () => {
 const arena = await read('src/ArenaOS.tsx')
 const app = await read('src/App.tsx')
 const tickers = ['KOTL','BTRAN','OGUR','VECT','DUST','TAPK','GROV','GRID','BYTE','LOGI']
 const block = arena.slice(arena.indexOf('const STOCKS: Stock[] = ['), arena.indexOf('const STOCK_DOSSIERS'))
 assert.equal((block.match(/ticker:/g)||[]).length,10)
 for (const ticker of tickers) assert.match(block,new RegExp("ticker:\\\""+ticker+"\\\""))
 assert.match(block,/Неловко Вышло/)
 assert.match(block,/Понедельник Labs/)
 assert.match(block,/Переоценка/)
 assert.match(app,/const COMPANY_BANTER/)
 assert.match(app,/Комитет по Комфорту/)
})
