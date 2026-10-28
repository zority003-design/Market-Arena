import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/game/dialogue.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const dialogue = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
const stock = {
  name: 'Котолёт', ticker: 'KTLT',
  upside: 'Выручка растёт благодаря новым контрактам.',
  downside: 'Долг и гарантийные расходы могут ухудшить прибыль.',
  catalyst: 'подписание подтверждённого контракта',
  redFlags: 'рост долга и возвратов'
}
const message = 'Выручка выросла на 12%, но долг и убытки остаются риском. Если квартальный отчёт не подтвердит рост, сократим долю и пересмотрим позицию.'
const client = temperament => ({
  id: 'test-client', tier: 2, temperament,
  goal: 'Сохранить капитал и проверить качество решения',
  quote: 'Покажите мне факты, а не обещания.'
})

test('client temperament changes dialogue wording for the same factual answer', () => {
  const cautious = dialogue.evaluateFreeReply(message, client('Осторожный'), stock)
  const competitive = dialogue.evaluateFreeReply(message, client('Соревновательная'), stock)
  const analytical = dialogue.evaluateFreeReply(message, client('Холодно-аналитическая'), stock)
  assert.notEqual(cautious.reply, competitive.reply)
  assert.notEqual(competitive.reply, analytical.reply)
  assert.match(cautious.reply, /без обещаний/i)
  assert.match(competitive.reply, /Сравню результат с рынком/i)
  assert.match(analytical.reply, /Зафиксирую допущения/i)
  assert.ok(cautious.delta > 0)
})

test('same answer receives a distinct contextual follow-up on later dialogue turns', () => {
  const answer = 'Выручка растёт на 12%, но долг и возвраты остаются риском. Если квартальный отчёт не подтвердит рост, ограничим позицию и пересмотрим тезис.'
  const firstTurn = dialogue.evaluateFreeReply(answer, client('Осторожный'), stock, 0)
  const secondTurn = dialogue.evaluateFreeReply(answer, client('Осторожный'), stock, 1)
  assert.notEqual(firstTurn.reply, secondTurn.reply)
})

test('unsupported promises remain a strong negative regardless of client personality', () => {
  const result = dialogue.evaluateFreeReply('Гарантирую, что акция точно вырастет без риска на 100%.', client('Любознательная'), stock)
  assert.equal(result.delta, -16)
  assert.match(result.reply, /красный флаг/i)
})

test('empty message cannot be treated as a useful argument', () => {
  const result = dialogue.evaluateFreeReply('   ', client('Деловая'), stock)
  assert.equal(result.delta, -2)
  assert.match(result.reply, /аргумента пока нет/i)
})


test('missing microphone and camera create contextual opening complaints', () => {
  const cautious = { ...client('Осторожный'), name: 'Алексей Воронцов', tier: 0, statusSensitive: false }
  const lines = dialogue.getEquipmentOpening(cautious, [])
  assert.equal(lines.length, 1)
  assert.match(lines[0], /микрофон|размыты|прогноз/i)
  const executive = { ...client('Скептичный'), name: 'Сергей Романов', tier: 3, statusSensitive: true }
  const executiveLines = dialogue.getEquipmentOpening(executive, [])
  assert.equal(executiveLines.length, 2)
  assert.ok(executiveLines.some(line => /картинка|пиксел/i.test(line)))
})

test('better equipment removes communication penalties from later turns', () => {
  const cautious = { ...client('Осторожный'), name: 'Алексей Воронцов', tier: 0, statusSensitive: false }
  const answer = 'Выручка выросла на 12%, но долг и убытки остаются риском. Если квартальный отчёт не подтвердит рост, сократим долю и пересмотрим позицию.'
  const poorGear = dialogue.evaluateFreeReply(answer, cautious, stock, 2, [])
  const goodGear = dialogue.evaluateFreeReply(answer, cautious, stock, 2, ['headset', 'hd-camera', 'neutral-backdrop', 'desk-lamp'])
  assert.ok((poorGear.equipmentPenalty ?? 0) > (goodGear.equipmentPenalty ?? 0))
  assert.ok(goodGear.delta >= poorGear.delta)
})

test('jokes can build rapport without making financial promises', () => {
  const curious = { ...client('Любознательная'), name: 'Мария Соколова', tier: 0, statusSensitive: false }
  const result = dialogue.evaluateFreeReply('Можно сказать, что котолёт летит только на выручке, а приземляется на долгах?', curious, stock, 0, ['headset', 'hd-camera', 'neutral-backdrop'])
  assert.ok(result.delta > -5)
  assert.match(result.reply, /шут|креатив|ха|финансов|факт/i)
})



test('later turns add a restrained company-specific dark-humour aside without changing scoring rules', () => {
  const constructionStock = { ...stock, name: 'Каталёт', ticker: 'KOTL' }
  const answer = 'Выручка растёт на 12%, но долг и убытки остаются риском. Если квартальный отчёт не подтвердит рост, сократим долю и пересмотрим позицию.'
  const first = dialogue.evaluateFreeReply(answer, client('Осторожный'), constructionStock, 0, ['headset', 'hd-camera', 'neutral-backdrop'])
  const later = dialogue.evaluateFreeReply(answer, client('Осторожный'), constructionStock, 2, ['headset', 'hd-camera', 'neutral-backdrop'])
  assert.notEqual(first.reply, later.reply)
  assert.match(later.reply, /рендер|этаж|балкон|денежный поток/i)
  assert.ok(later.delta > 0)
})

test('dialogue memory varies by fictional company instead of repeating generic jokes', () => {
  const answer = 'Выручка растёт на 12%, но долг и убытки остаются риском. Если квартальный отчёт не подтвердит рост, сократим долю и пересмотрим позицию.'
  const construction = dialogue.evaluateFreeReply(answer, client('Осторожный'), { ...stock, name: 'Каталёт', ticker: 'KOTL' }, 2, ['headset', 'hd-camera', 'neutral-backdrop'])
  const software = dialogue.evaluateFreeReply(answer, client('Осторожный'), { ...stock, name: 'ВекторСофт', ticker: 'VECT' }, 2, ['headset', 'hd-camera', 'neutral-backdrop'])
  assert.notEqual(construction.reply, software.reply)
  assert.match(construction.reply, /рендер|этаж|балкон|денежный поток/i)
  assert.match(software.reply, /подписка|сервер|контракт|клиент/i)
})
