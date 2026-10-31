import test from 'node:test';
import assert from 'node:assert/strict';
import { createEconomy, transact, buyAsset, sellAsset, netWorth, migrateEconomySave, issueDebt, repayDebt } from '../src/game/economy-engine.mjs';
import { createCharacter, resolveDialogue, remember, detectIntent } from '../src/game/dialogue-engine.mjs';
import { createTimeState, consumeTime, nextDay } from '../src/game/time-engine.mjs';

test('one balance is the only spendable cash and all purchases use it', () => {
  let e = createEconomy({ cash: 100000 });
  e = buyAsset(e, { id: 'shares', name: 'Акции', price: 10000 }, 'buy-shares');
  e = buyAsset(e, { id: 'home', name: 'Жильё', price: 25000 }, 'buy-home');
  e = buyAsset(e, { id: 'desk', name: 'Оборудование', price: 5000 }, 'buy-desk');
  assert.equal(e.cash, 60000);
  assert.equal(netWorth(e).netWorth, 100000);
  assert.equal(Object.hasOwn(e, 'firmCapital'), false);
});
test('sales credit the same balance and absent assets cannot be sold', () => {
  let e = buyAsset(createEconomy({ cash: 20000 }), { id: 'share', name: 'Акция', price: 5000 }, 'buy');
  e = sellAsset(e, 'share', 6200, 'sell');
  assert.equal(e.cash, 21200);
  assert.throws(() => sellAsset(e, 'share', 1000, 'sell-again'), /отсутствующий/);
});
test('spending is atomic, cannot overdraw, and duplicate operation IDs are rejected', () => {
  const e = createEconomy({ cash: 100 });
  assert.throws(() => transact(e, { id: 'expensive', type: 'buy', amount: -101 }), /Недостаточно/);
  assert.equal(e.cash, 100);
  const once = transact(e, { id: 'reward', type: 'reward', amount: 50 });
  assert.throws(() => transact(once, { id: 'reward', type: 'reward', amount: 50 }), /уже обработана/);
  assert.equal(once.cash, 150);
});
test('debt is a liability, not another wallet; repayment uses common cash', () => {
  let e = issueDebt(createEconomy({ cash: 1000 }), { id: 'loan', amount: 500, label: 'Кредит', creditLimit: 1000 });
  assert.equal(e.cash, 1500);
  assert.equal(netWorth(e).netWorth, 1000);
  e = repayDebt(e, 'loan', 200, 'repay');
  assert.equal(e.cash, 1300);
  assert.equal(netWorth(e).debt, 300);
});
test('legacy saves merge personal and firm cash and preserve progress fields', () => {
  const migrated = migrateEconomySave({ cash: 6500, firmCapital: 25000, day: 4, ownedItems: ['headset'] });
  assert.equal(migrated.economy.cash, 31500);
  assert.equal(migrated.day, 4);
  assert.equal(Object.hasOwn(migrated, 'cash'), false);
  assert.equal(Object.hasOwn(migrated, 'firmCapital'), false);
  assert.deepEqual(migrated.ownedItems, ['headset']);
});
test('dialogue changes relationship and remembers promises/events', () => {
  const c = createCharacter({ id: 'm', name: 'Мария', archetype: 'cautious', trust: 40 });
  const result = resolveDialogue(c, 'Я обещаю прислать отчёт завтра', 2);
  assert.equal(result.intent, 'promise');
  assert.equal(result.character.promises.length, 1);
  assert.ok(result.character.trust > 40);
  assert.equal(remember(result.character, { key: 'helped', value: true, day: 2 }).memory[0].key, 'helped');
});
test('different archetypes react differently to the same joke', () => {
  const cautious = resolveDialogue(createCharacter({ id: 'a', name: 'А', archetype: 'cautious' }), 'Вот это шутка, ха-ха');
  const social = resolveDialogue(createCharacter({ id: 'b', name: 'Б', archetype: 'sociable' }), 'Вот это шутка, ха-ха');
  assert.ok(social.character.trust > cautious.character.trust);
  assert.notEqual(social.reaction, cautious.reaction);
});
test('local intent classifier recognizes multiple intents and asks when unclear', () => {
  assert.equal(detectIntent('Почему цена может упасть?').intent, 'question');
  assert.equal(detectIntent('Я сомневаюсь и не уверен').intent, 'doubt');
  assert.equal(detectIntent('Нет, спасибо, отказываюсь').intent, 'refusal');
  assert.equal(detectIntent('Простите, я ошибся').intent, 'apology');
  assert.equal(detectIntent('Я обещаю прислать документы').intent, 'promise');
  assert.equal(detectIntent('абракадабра').intent, 'unclear');
});
test('time budget limits actions and resets on the next day', () => {
  let time = createTimeState();
  for (let i = 0; i < 8; i++) time = consumeTime(time, { minutes: 30 });
  assert.throws(() => consumeTime(time, { minutes: 5 }), /Лимит действий/);
  time = nextDay(time);
  assert.equal(time.day, 2);
  assert.equal(time.actions, 0);
});
