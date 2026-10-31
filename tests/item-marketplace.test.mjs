import test from 'node:test';
import assert from 'node:assert/strict';
import { createEconomy } from '../src/game/economy-engine.mjs';
import { purchaseCatalogItem, toggleEquippedItem } from '../src/game/shop-engine.mjs';
import { ITEM_CATALOG, getEquippedAppearance, evaluateSocialAppearance, getEquipmentEffects } from '../src/game/item-catalog.mjs';

test('catalog has distinct purchasable fashion and workspace equipment with grounded prices',()=>{
  const ids=new Set(ITEM_CATALOG.map(item=>item.id));
  assert.equal(ids.size,ITEM_CATALOG.length);
  assert.ok(ITEM_CATALOG.some(item=>item.id==='style-oxford-shirt'&&item.price===1400));
  assert.ok(ITEM_CATALOG.some(item=>item.id==='gear-second-monitor'&&item.effect.marketAnalysis===8));
  assert.ok(ITEM_CATALOG.some(item=>item.id==='partner-desk'&&item.effect.workspaceCapacity===1));
});
test('catalog purchase is atomic, unique and uses the single cash ledger',()=>{
  const economy=createEconomy({cash:10000});
  const result=purchaseCatalogItem(economy,[],'style-oxford-shirt','buy-shirt');
  assert.equal(result.economy.cash,8600);
  assert.deepEqual(result.inventory,['style-oxford-shirt']);
  assert.throws(()=>purchaseCatalogItem(result.economy,result.inventory,'style-oxford-shirt','buy-shirt-again'),/уже есть/);
  assert.throws(()=>purchaseCatalogItem(createEconomy({cash:100}),[],'gear-workstation','poor-player'),/Недостаточно/);
  assert.equal(economy.cash,10000);
});
test('idempotency ledger prevents replay even if UI submits twice',()=>{
  const once=purchaseCatalogItem(createEconomy({cash:5000}),[],'style-hoodie','same-op');
  assert.throws(()=>purchaseCatalogItem(once.economy,[],'style-hoodie','same-op'),/уже обработана/);
});
test('equipped clothing is exclusive by slot and changes the 3D appearance profile',()=>{
  let equipped=toggleEquippedItem([],'style-oxford-shirt');
  equipped=toggleEquippedItem(equipped,'style-tailored-blazer');
  assert.deepEqual(equipped,['style-tailored-blazer']);
  equipped=toggleEquippedItem(equipped,'style-watch');
  const appearance=getEquippedAppearance(equipped);
  assert.equal(appearance.jacketColor,'#24394b');
  assert.equal(appearance.watch,true);
});
test('social appearance is context-sensitive and equipment exposes functional effects',()=>{
  const formal=evaluateSocialAppearance(['style-hoodie'],'formal','cautious');
  const business=evaluateSocialAppearance(['style-tailored-blazer'],'formal','cautious');
  assert.ok(business.score>formal.score);
  const effects=getEquipmentEffects(['gear-second-monitor','gear-headset-pro']);
  assert.equal(effects.marketAnalysis,8);
  assert.equal(effects.callQuality,8);
});

test('exclusive accessories respect day and reputation unlock gates',()=>{
  const poor= createEconomy({cash:40000});
  assert.throws(()=>purchaseCatalogItem(poor,[],'style-heritage-watch','early-watch',{day:4,reputation:20}),/условия/);
  const unlocked=purchaseCatalogItem(poor,[],'style-heritage-watch','late-watch',{day:20,reputation:75});
  assert.equal(unlocked.economy.cash,12000);
  assert.equal(unlocked.item.rarity,'exclusive');
});
