import { transact } from './economy-engine.mjs';
import { getItemById } from './item-catalog.mjs';
/** Purchase is pure and atomic. Callers persist the returned economy and inventory together. */
export function purchaseCatalogItem(economy, inventory, itemId, operationId, {day=1,reputation=0}={}){
  const item=getItemById(itemId);
  if(!item) throw new Error('Предмет не найден в каталоге');
  if(inventory.includes(itemId)) throw new Error('Этот предмет уже есть в инвентаре');
  if(day<(item.minDay??1)||reputation<(item.minReputation??0)) throw new Error('Пока не выполнены условия разблокировки');
  const nextEconomy=transact(economy,{id:operationId,type:'shop_purchase',amount:-item.price,description:'Покупка: '+item.name,metadata:{itemId,category:item.category,rarity:item.rarity}});
  return {economy:nextEconomy,inventory:[...inventory,itemId],item};
}
export function toggleEquippedItem(equipped,itemId){
  const item=getItemById(itemId);
  if(!item||item.category==='equipment') throw new Error('Этот предмет нельзя экипировать на персонажа');
  const next=equipped.filter(id=>getItemById(id)?.slot!==item.slot);
  return equipped.includes(itemId)?next:[...next,itemId];
}
