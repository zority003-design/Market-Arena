import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/game/negotiation.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const negotiation = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))

const cautious = { id: 'cautious', goal: 'Сохранить капитал и иметь резерв', quote: 'Не хочу потерять деньги', temperament: 'Осторожный', tier: 2, ticket: 15000, budget: 50000 }
const ambitious = { id: 'ambitious', goal: 'Увеличить доходность и капитал', quote: 'Готов к риску ради роста', temperament: 'Азартный', tier: 2, ticket: 15000, budget: 50000 }
const base = {
  sourceChoices: ['Проверим выручку и долг.', 'Компания точно вырастет.', 'Сравним сценарии и ограничим позицию.'],
  ticker: 'BYTE',
  companyName: 'Понедельник Labs',
  companyRisk: 'Высокий',
  hint: 'платящие клиенты и денежный запас',
  turn: 1,
  client: cautious,
  trust: 25,
  newsImpact: -2,
}

test('three choices represent different actions with explicit opportunity costs', () => {
  const choices = negotiation.createStrategicChoices(base)
  assert.deepEqual(choices.map(choice => choice.kind), ['pilot', 'staged', 'wait'])
  assert.equal(new Set(choices.map(choice => choice.label)).size, 3)
  assert.match(choices[0].label, /небольшую позицию/)
  assert.match(choices[1].label, /поэтапный вход|два транша/)
  assert.match(choices[2].label, /не покупать/)
  assert.match(choices[0].label, /рыночным риском/)
  assert.match(choices[1].label, /купить дороже/)
  assert.match(choices[2].label, /пропустить рост/)
})

test('the best response changes with the client mandate and current market signal', () => {
  const conservative = negotiation.createStrategicChoices(base)
  const aggressive = negotiation.createStrategicChoices({
    ...base,
    client: ambitious,
    trust: 70,
    newsImpact: 2,
    companyRisk: 'Средний',
  })
  const conservativeBest = conservative.reduce((best, choice) => choice.delta > best.delta ? choice : best)
  const aggressiveBest = aggressive.reduce((best, choice) => choice.delta > best.delta ? choice : best)
  assert.equal(conservativeBest.kind, 'wait')
  assert.equal(aggressiveBest.kind, 'pilot')
})

test('no strategy is a universal high-score answer', () => {
  const contexts = [
    base,
    { ...base, client: ambitious, trust: 80, newsImpact: 3, companyRisk: 'Низкий' },
    { ...base, client: cautious, trust: 20, newsImpact: -4, companyRisk: 'Очень высокий' },
  ]
  const winners = contexts.map(context => negotiation.createStrategicChoices(context).reduce((best, choice) => choice.delta > best.delta ? choice : best).kind)
  assert.ok(new Set(winners).size >= 2)
  for (const context of contexts) {
    for (const choice of negotiation.createStrategicChoices(context)) {
      assert.ok(choice.delta >= -8 && choice.delta <= 9)
    }
  }
})

test('the engine never labels an unsupported guaranteed return as a valid investment thesis', async () => {
  const dialogue = await readFile(new URL('../src/game/dialogue.ts', import.meta.url), 'utf8')
  assert.match(dialogue, /const promises = !rejectsGuarantee/)
})

test('client mandate and damaged trust change the actual dialogue question', () => {
  const prompt = 'The company has announced a new expansion plan. What do you need to know?'
  const cautiousPrompt = negotiation.contextualizeNegotiationPrompt(prompt, cautious, 60, 0)
  const ambitiousPrompt = negotiation.contextualizeNegotiationPrompt(prompt, ambitious, 60, 0)
  const distrustfulPrompt = negotiation.contextualizeNegotiationPrompt(prompt, ambitious, 20, 0)
  assert.notEqual(cautiousPrompt, ambitiousPrompt)
  assert.match(cautiousPrompt, /плохом сценарии/i)
  assert.match(ambitiousPrompt, /за какой именно риск/i)
  assert.match(distrustfulPrompt, /проверяемые факты/i)
})
