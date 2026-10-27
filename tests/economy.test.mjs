import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Test the real TypeScript module without adding a runtime test dependency.
const source = await readFile(new URL('../src/game/economy.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const economy = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
const {
  CLIENTS, HOUSING, ROOM_ITEMS, calculateDeal, getAvailableClients, getBackgroundModifier,
  getDailyLeadIds, getFirstImpression, getOutfitModifier, getVideoQuality, STOCK_PROFILES, getClientStockFit, getClientTrustRequirement, BUSINESS_ASSETS, getBusinessDailyNetIncome, BROKER_HIRES, getStaffDailyNetIncome,
} = economy

test('career starts with a viable, known baseline', () => {
  assert.equal(economy.STARTING_CASH, 6500)
  assert.ok(economy.STARTING_CASH < BROKER_HIRES[0].price, 'a new career cannot hire staff immediately')
  assert.equal(economy.STARTING_FIRM_CAPITAL, 25000)
  assert.equal(economy.STARTING_HOUSING_ID, 'studio')
  assert.equal(HOUSING.find(home => home.id === economy.STARTING_HOUSING_ID)?.id, 'studio')
  // New careers begin in a small private apartment; dailyCost remains legacy metadata and is not charged.
})

test('brokerage empire assets create a clear staged income progression', () => {
  assert.equal(getBusinessDailyNetIncome([]), 0)
  assert.deepEqual(BUSINESS_ASSETS.map(asset => asset.dailyRevenue - asset.dailyCost), [1200, 3000, 9000, 27000])
  assert.equal(getBusinessDailyNetIncome(['referral-desk']), 1200)
  assert.equal(getBusinessDailyNetIncome(['referral-desk', 'broker-team']), 4200)
  assert.equal(getBusinessDailyNetIncome(['referral-desk', 'broker-team', 'city-agency', 'national-network']), 40200)
  assert.equal(BUSINESS_ASSETS[1].prerequisite, 'referral-desk')
  assert.equal(BUSINESS_ASSETS[2].prerequisite, 'broker-team')
  assert.equal(BUSINESS_ASSETS[3].prerequisite, 'city-agency')
})

test('client unlocks respect both day and reputation gates', () => {
  assert.deepEqual(getAvailableClients(1, 0).map(c => c.id), ['alex-vorontsov', 'maria-sokolova', 'pavel-smirnov', 'natalia-orlova'])
  assert.ok(!getAvailableClients(5, 24).some(c => c.id === 'igor-melnikov'))
  assert.ok(getAvailableClients(5, 25).some(c => c.id === 'igor-melnikov'))
  assert.ok(!getAvailableClients(15, 70).some(c => c.id === 'diana-volkova'))
  assert.ok(getAvailableClients(16, 70).some(c => c.id === 'diana-volkova'))
})

test('every client has an explicit trust threshold and at least one suitable stock', () => {
  for (const client of CLIENTS) {
    const required = getClientTrustRequirement(client)
    assert.ok(required >= 48 && required <= 76, client.id + ' trust threshold')
    assert.ok(Object.keys(STOCK_PROFILES).some(ticker => getClientStockFit(client.id, ticker).suitable), client.id + ' must have a viable product')
  }
  assert.equal(getClientTrustRequirement(CLIENTS.find(c => c.id === 'diana-volkova')), 76)
  assert.equal(getClientStockFit('alex-vorontsov', 'KOTL').suitable, true)
  assert.equal(getClientStockFit('boris-zhukov', 'TAPK').suitable, false)
  assert.equal(getClientStockFit('alina-fedorova', 'TAPK').suitable, true)
})

test('purchasable desk is a real work item with first-impression and call-quality effects', () => {
  const desk = ROOM_ITEMS.find(item => item.id === 'partner-desk')
  assert.ok(desk)
  assert.equal(desk.category, 'work')
  assert.equal(desk.price, 9500)
  assert.ok(desk.firstImpression > 0)
  assert.ok(desk.videoQuality > 0)
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
  const home = HOUSING.find(h => h.id === 'dorm')
  assert.ok(sensitive && home)
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

test('daily lead list respects cooldown, deal limit, exhausted budget and reputation', () => {
  const lastContact = { 'alex-vorontsov': 9, 'maria-sokolova': 8 }
  const dealCounts = { 'igor-melnikov': 3 }
  const invested = { 'maria-sokolova': 85000 }
  const leads = getDailyLeadIds(10, 25, lastContact, dealCounts, invested)
  assert.ok(leads.length <= 2)
  assert.ok(!leads.includes('alex-vorontsov')) // only one day since contact
  assert.ok(!leads.includes('igor-melnikov')) // deal limit reached
  assert.ok(!leads.includes('maria-sokolova')) // client budget exhausted
  assert.equal(new Set(leads).size, leads.length)
})

test('lead count expands only at the intended reputation thresholds', () => {
  assert.ok(getDailyLeadIds(1, 0).length <= 2)
  assert.ok(getDailyLeadIds(10, 35).length <= 3)
  assert.ok(getDailyLeadIds(20, 60).length <= 4)
})

test('staff hiring has transparent net daily income and supports five office roles', () => {
  assert.equal(getStaffDailyNetIncome([]), 0)
  assert.deepEqual(BROKER_HIRES.map(employee => employee.dailyRevenue - employee.dailySalary), [700, 1500, 2500, 4500, 6000])
  assert.equal(getStaffDailyNetIncome(['junior-broker']), 700)
  assert.equal(getStaffDailyNetIncome(['junior-broker', 'broker-specialist']), 2200)
  assert.equal(BROKER_HIRES.length, 5)
})
