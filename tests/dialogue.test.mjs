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
