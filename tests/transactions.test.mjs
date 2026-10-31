import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8')

test('the transaction service validates debits, credits, duplicate ids, and finite amounts', async () => {
  const source = await read('src/game/transactions.ts')
  assert.match(source, /export function postMoneyTransaction/)
  assert.match(source, /Number\.isFinite\(transaction\.amount\)/)
  assert.match(source, /history\.some\(\(entry\) => entry\.id === transaction\.id\)/)
  assert.match(source, /nextBalance < 0/)
  assert.match(source, /history: \[\.\.\.history, entry\]\.slice\(-200\)/)
})

test('all App and ArenaOS money mutations use the same idempotent transaction gateway', async () => {
  const app = await read('src/App.tsx')
  const arena = await read('src/ArenaOS.tsx')
  assert.match(app, /postMoneyTransaction\(cashRef\.current, transactionHistoryRef\.current/)
  assert.match(app, /transactionHistoryRef\.current = result\.history/)
  assert.match(app, /transactionHistory, xp, debt/)
  assert.match(app, /transactionHistory\?: MoneyTransaction\[\]/)
  assert.match(app, /transactMoney\(payout\.firmRevenue/)
  assert.match(app, /transactMoney\(-item\.price/)
  assert.match(app, /transactMoney\(-home\.price/)
  assert.match(arena, /transactMoney: \(amount: number, reason: string, onceKey\?: string\) => boolean/)
  assert.match(arena, /props\.transactMoney\(firmCommission/)
  assert.match(arena, /props\.transactMoney\(-upgrade\.price/)
  assert.match(arena, /props\.transactMoney\(-asset\.price/)
  assert.match(arena, /props\.transactMoney\(-employee\.price/)
  assert.doesNotMatch(arena, /props\.setCash/)
})
