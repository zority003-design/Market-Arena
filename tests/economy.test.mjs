import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/game/economy.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const economy = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
const {
  CLIENTS, HOUSING, ROOM_ITEMS, calculateDeal, getAvailableClients, getBackgroundModifier,
  getDailyLeadIds, getDailyQuota, getFirstImpression, getOutfitModifier, getVideoQuality, settleDailyFinances,
} = economy

test('career starts with a viable baseline and housing tiers have sustainable cost progression', () => {
  assert.equal(economy.STARTING_CASH, 18500)
  assert.equal(economy.STARTING_FIRM_CAPITAL, 25000)
  assert.equal(economy.DAILY_SALARY, 1200)
  assert.equal(HOUSING[0].id, economy.STARTING_HOUSING_ID)
  assert.equal(HOUSING[0].dailyCost, 500)
  assert.equal(economy.DAILY_SALARY - HOUSING[0].dailyCost, 700)
  assert.deepEqual(HOUSING.map(h => h.dailyCost), [500, 800, 1400, 2300, 3800])
  assert.deepEqual(HOUSING.map(h => h.price), [0, 14000, 45000, 125000, 320000])
  assert.ok(HOUSING.every((h, i, all) => i === 0 || (h.price > all[i-1].price && h.dailyCost > all[i-1].dailyCost)))
})

test('housing comfort improves first impression, especially when moving up tiers', () => {
  const cautious = CLIENTS.find(client => client.id === 'alex-vorontsov')
  const demanding = CLIENTS.find(client => client.id === 'igor-melnikov')
  assert.ok(cautious && demanding)
  const dormTrust = getFirstImpression('dorm', [], cautious)
  const studioTrust = getFirstImpression('studio', [], cautious)
  const premiumTrust = getFirstImpression('premium-apartment', [], cautious)
  assert.ok(studioTrust > dormTrust)
  assert.ok(premiumTrust > studioTrust)
  assert.ok(getFirstImpression('premium-apartment', [], demanding) >= getFirstImpression('dorm', [], demanding))
})

test('daily settlement pays costs, then debt, and never creates negative cash', () => {
  assert.deepEqual(settleDailyFinances(1000, 500, 500), {cash:1200,debt:0,salaryPaid:1200,costsPaid:500,debtPaid:500,shortfall:0})
  assert.deepEqual(settleDailyFinances(0, 0, 3800), {cash:0,debt:2600,salaryPaid:1200,costsPaid:1200,debtPaid:0,shortfall:2600})
  assert.deepEqual(settleDailyFinances(-500, -20, -10), {cash:1200,debt:0,salaryPaid:1200,costsPaid:0,debtPaid:0,shortfall:0})
  assert.deepEqual(settleDailyFinances(1000, 3000, 500), {cash:0,debt:1300,salaryPaid:1200,costsPaid:500,debtPaid:1700,shortfall:0})
})

test('client unlocks respect both day and reputation gates', () => {
  assert.deepEqual(getAvailableClients(1, 0).map(c => c.id), ['alex-vorontsov', 'maria-sokolova'])
  assert.ok(!getAvailableClients(5, 24).some(c => c.id === 'igor-melnikov'))
  assert.ok(getAvailableClients(5, 25).some(c => c.id === 'igor-melnikov'))
  assert.ok(!getAvailableClients(15, 70).some(c => c.id === 'diana-volkova'))
  assert.ok(getAvailableClients(16, 70).some(c => c.id === 'diana-volkova'))
})

test('deal amount never exceeds remaining client budget or allocation cap', () => {
  for (const client of CLIENTS) {
    for (let previousDeals = 0; previousDeals <= 4; previousDeals++) {
      for (const previouslyInvested of [0, client.budget * 0.2, client.budget * 0.8, client.budget]) {
        const result = calculateDeal(client, 70, previousDeals, previouslyInvested)
        assert.ok(result.ticket >= 0, client.id)
        assert.ok(result.ticket <= Math.max(0, client.budget - previouslyInvested), client.id)
        assert.ok(result.ticket <= Math.floor(client.budget * Math.min(.45, client.maxAllocation + previousDeals * .05)), client.id)
        assert.ok(result.firmRevenue >= 0 && result.playerBonus >= 0, client.id)
        assert.ok(result.firmRevenue >= result.playerBonus, client.id + ' must not lose money on the commission split')
      }
    }
  }
})

test('an exhausted client cannot generate another order', () => {
  for (const client of CLIENTS) {
    assert.equal(calculateDeal(client, 100, 2, client.budget).ticket, 0)
    assert.equal(calculateDeal(client, 100, 2, client.budget + 1).ticket, 0)
  }
})

test('high trust improves only the player bonus multiplier', () => {
  const client = CLIENTS[0]
  const low = calculateDeal(client, 61)
  const good = calculateDeal(client, 62)
  const excellent = calculateDeal(client, 75)
  assert.equal(low.qualityMultiplier, 1)
  assert.equal(good.qualityMultiplier, 1.1)
  assert.equal(excellent.qualityMultiplier, 1.25)
  assert.equal(low.firmRevenue, good.firmRevenue)
  assert.equal(good.firmRevenue, excellent.firmRevenue)
  assert.ok(low.playerBonus <= good.playerBonus && good.playerBonus <= excellent.playerBonus)
})

test('room impression is bounded and ignores unknown item IDs', () => {
  const sensitive = CLIENTS.find(c => c.statusSensitive)
  assert.ok(sensitive)
  assert.equal(getFirstImpression('dorm', [], sensitive), -4)
  assert.equal(getFirstImpression('not-a-home', ['unknown-item'], CLIENTS[0]), -2)
  assert.ok(getFirstImpression('premium-apartment', ROOM_ITEMS.map(i => i.id), CLIENTS[0]) <= 8)
  assert.ok(getFirstImpression('dorm', ROOM_ITEMS.map(i => i.id), CLIENTS[0]) >= -5)
})

test('video quality has a hard cap and ignores unknown items', () => {
  assert.equal(getVideoQuality(['unknown-item']), 0)
  assert.equal(getVideoQuality(ROOM_ITEMS.map(i => i.id)), 8)
  assert.ok(getVideoQuality(ROOM_ITEMS.map(i => i.id)) <= 8)
})

test('outfit bonuses are ordered and status-sensitive clients notice polished outfits', () => {
  const regular = CLIENTS[0]
  const sensitive = CLIENTS.find(c => c.statusSensitive)
  assert.ok(sensitive)
  assert.equal(getOutfitModifier('intern', regular), 0)
  assert.equal(getOutfitModifier('classic', regular), 2)
  assert.equal(getOutfitModifier('premium', regular), 5)
  assert.equal(getOutfitModifier('classic', sensitive), 3)
  assert.equal(getOutfitModifier('premium', sensitive), 6)
})

test('background choices cannot grant a virtual-office bonus without chromakey', () => {
  const regular = CLIENTS[0]
  const sensitive = CLIENTS.find(c => c.statusSensitive)
  assert.ok(sensitive)
  assert.equal(getBackgroundModifier('real', [], regular), 0)
  assert.equal(getBackgroundModifier('neutral', [], regular), -3)
  assert.equal(getBackgroundModifier('neutral', ['neutral-backdrop'], regular), 2)
  assert.equal(getBackgroundModifier('luxury', [], sensitive), -6)
  assert.equal(getBackgroundModifier('luxury', ['chromakey-kit'], regular), 1)
  assert.equal(getBackgroundModifier('luxury', ['chromakey-kit'], sensitive), 4)
})

test('daily leads return after one day and respect deal limit and exhausted budget', () => {
  const lastContact = { 'alex-vorontsov': 9, 'maria-sokolova': 8 }
  const dealCounts = { 'igor-melnikov': 3 }
  const invested = { 'maria-sokolova': 85000 }
  const leads = getDailyLeadIds(10, 25, lastContact, dealCounts, invested)
  assert.ok(leads.includes('alex-vorontsov'))
  assert.ok(!leads.includes('igor-melnikov'))
  assert.ok(!leads.includes('maria-sokolova'))
  assert.equal(new Set(leads).size, leads.length)
})

test('lead count expands only at the intended reputation thresholds', () => {
  assert.ok(getDailyLeadIds(1, 0).length <= 2)
  assert.ok(getDailyLeadIds(10, 35).length <= 3)
  assert.ok(getDailyLeadIds(20, 60).length <= 4)
})

test('daily quota ramps gradually and uses the same helper for UI and shift settlement', () => {
  assert.deepEqual(getDailyQuota(1), {targetShares:28,targetAmount:14000})
  assert.deepEqual(getDailyQuota(2), {targetShares:36,targetAmount:20000})
  assert.deepEqual(getDailyQuota(16), {targetShares:148,targetAmount:104000})
  assert.deepEqual(getDailyQuota(0), getDailyQuota(1))
})
