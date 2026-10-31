/** Curated, gameplay-backed personal item catalog for Market Arena. Prices are one-time RUB purchases. */
export const ITEM_CATALOG = [
  {id:'style-oxford-shirt',name:'Рубашка Oxford',category:'clothing',slot:'top',price:1400,rarity:'common',material:'Хлопок Oxford',description:'Универсальная рубашка для встреч и рабочего дня.',tags:['business','classic'],effect:{professional:3},color:'#d8e2e2'},
  {id:'style-knitwear',name:'Трикотажный джемпер',category:'clothing',slot:'top',price:2200,rarity:'uncommon',material:'Мериносовая смесь',description:'Спокойный smart-casual образ для неформальных переговоров.',tags:['casual','modern'],effect:{approachable:3},color:'#738b83'},
  {id:'style-hoodie',name:'Городское худи',category:'clothing',slot:'top',price:1900,rarity:'common',material:'Плотный футер',description:'Повседневный вариант для встреч с молодыми основателями.',tags:['casual','modern'],effect:{approachable:2},color:'#647b91'},
  {id:'style-tailored-blazer',name:'Структурный пиджак',category:'clothing',slot:'top',price:5900,rarity:'rare',material:'Шерсть и вискоза',description:'Чёткий силуэт для официальных встреч и презентаций.',tags:['business','formal'],effect:{professional:6},color:'#24394b'},
  {id:'style-denim',name:'Прямые джинсы',category:'clothing',slot:'bottom',price:1800,rarity:'common',material:'Деним 12 oz',description:'Нейтральная база повседневного гардероба.',tags:['casual'],effect:{approachable:2},color:'#34495d'},
  {id:'style-trousers',name:'Брюки со стрелками',category:'clothing',slot:'bottom',price:3200,rarity:'uncommon',material:'Смесовая шерсть',description:'Собранный силуэт для делового контекста.',tags:['business','formal'],effect:{professional:3},color:'#303a43'},
  {id:'style-sneakers',name:'Минималистичные кроссовки',category:'clothing',slot:'shoes',price:3600,rarity:'uncommon',material:'Кожа и резина',description:'Комфортная обувь для города и повседневных встреч.',tags:['casual','modern'],effect:{approachable:2},color:'#e7e4dc'},
  {id:'style-oxfords',name:'Кожаные дерби',category:'clothing',slot:'shoes',price:6200,rarity:'rare',material:'Натуральная кожа',description:'Классическая обувь для консервативных деловых встреч.',tags:['business','formal'],effect:{professional:3},color:'#292522'},
  {id:'style-heritage-watch',name:'Часы Heritage Limited',category:'accessory',slot:'wrist',price:28000,rarity:'exclusive',material:'Титан, сапфировое стекло, лимитированная серия',description:'Коллекционная модель для опытного предпринимателя. Доступна после развития репутации.',tags:['status','business','exclusive'],effect:{status:7,professional:2},color:'#c6a76c',minDay:20,minReputation:75},
  {id:'style-watch',name:'Стальные часы Meridian',category:'accessory',slot:'wrist',price:7800,rarity:'rare',material:'Сталь 316L, сапфировое стекло',description:'Сдержанный аксессуар, который замечают внимательные собеседники.',tags:['status','business'],effect:{status:4},color:'#b5a16f'},
  {id:'style-glasses',name:'Оправа Atlas',category:'accessory',slot:'face',price:2400,rarity:'uncommon',material:'Ацетат',description:'Лаконичная оправа для интеллектуального делового образа.',tags:['business','modern'],effect:{professional:2},color:'#30363a'},
  {id:'style-backpack',name:'Городской рюкзак',category:'accessory',slot:'back',price:3100,rarity:'uncommon',material:'Технический текстиль',description:'Практичная вещь для поездок и работы вне офиса.',tags:['casual'],effect:{approachable:1},color:'#3c4d50'},
  {id:'style-leather-belt',name:'Кожаный ремень',category:'accessory',slot:'waist',price:1700,rarity:'common',material:'Кожа и матовая сталь',description:'Финальная деталь аккуратного комплекта.',tags:['business','classic'],effect:{professional:1},color:'#4a3429'},
  {id:'gear-second-monitor',name:'Монитор 27″ QHD',category:'equipment',slot:'desk',price:12500,rarity:'uncommon',material:'IPS, регулируемая стойка',description:'Ускоряет одновременный анализ котировок и отчётности.',tags:['analysis'],effect:{marketAnalysis:8},color:'#526a78'},
  {id:'gear-workstation',name:'Рабочая станция',category:'equipment',slot:'desk',price:28500,rarity:'rare',material:'8-ядерный CPU, 32 ГБ RAM',description:'Открывает продвинутые аналитические сценарии и тяжёлые отчёты.',tags:['analysis','premium'],effect:{marketAnalysis:16},color:'#59616b'},
  {id:'gear-headset-pro',name:'Гарнитура Studio',category:'equipment',slot:'audio',price:6800,rarity:'uncommon',material:'Закрытые драйверы, шумоподавление',description:'Снижает штраф качества связи на переговорах.',tags:['calls'],effect:{callQuality:8},color:'#394b59'},
  {id:'gear-ergonomic-chair',name:'Эргономичное кресло',category:'equipment',slot:'room',price:9400,rarity:'uncommon',material:'Сетка и алюминий',description:'Улучшает комфорт рабочего места и восстановление энергии.',tags:['comfort'],effect:{energyRecovery:5},color:'#4b5a60'},
  {id:'gear-desk-lamp',name:'Архитектурная лампа',category:'equipment',slot:'room',price:2800,rarity:'common',material:'Алюминий, LED',description:'Делает рабочую зону уютнее и улучшает визуальную атмосферу комнаты.',tags:['comfort'],effect:{roomComfort:2},color:'#b59a6d'},
  {id:'classic',name:'Деловой костюм',category:'clothing',slot:'fullset',price:4500,rarity:'uncommon',material:'Шерстяная смесь',description:'Базовый деловой комплект для официальных переговоров.',tags:['business','formal'],effect:{professional:4},color:'#344c58'},
  {id:'premium',name:'Партнёрский образ',category:'clothing',slot:'fullset',price:12500,rarity:'elite',material:'Итальянская шерсть, шёлк',description:'Премиальный комплект для встреч высокого уровня.',tags:['business','formal','status'],effect:{professional:6,status:4},color:'#17283f'},
  {id:'headset',name:'Гарнитура с микрофоном',category:'equipment',slot:'audio',price:4500,rarity:'common',material:'Закрытые акустические чаши',description:'Улучшает качество переговорной связи и снимает базовый штраф за звук.',tags:['calls'],effect:{callQuality:5},color:'#3b4d58'},
  {id:'hd-camera',name:'HD-веб-камера',category:'equipment',slot:'video',price:7500,rarity:'uncommon',material:'Full HD, автофокус',description:'Повышает качество видеосвязи с требовательными клиентами.',tags:['calls'],effect:{callQuality:5},color:'#536b77'},
  {id:'neutral-backdrop',name:'Нейтральный фон',category:'equipment',slot:'room',price:8000,rarity:'uncommon',material:'Акустический текстиль',description:'Создаёт аккуратный фон для видеопереговоров.',tags:['calls','comfort'],effect:{callQuality:3,roomComfort:1},color:'#8b9992'},
  {id:'desk-lamp',name:'Настольная лампа',category:'equipment',slot:'room',price:1200,rarity:'common',material:'Алюминий, LED',description:'Улучшает освещение рабочей зоны и атмосферу комнаты.',tags:['comfort'],effect:{roomComfort:2},color:'#b59a6d'},
  {id:'partner-desk',name:'Дополнительный рабочий стол',category:'equipment',slot:'desk',price:5800,rarity:'uncommon',material:'Массив и сталь',description:'Физически открывает второе рабочее место и найм первого сотрудника в квартире.',tags:['workspace'],effect:{workspaceCapacity:1},color:'#796b58'},
];
export const ITEM_CATEGORIES = [
  {id:'all',label:'Все предметы'},{id:'clothing',label:'Одежда'},{id:'accessory',label:'Аксессуары'},{id:'equipment',label:'Оборудование'}
];
export const RARITY_LABELS = {common:'Обычный',uncommon:'Необычный',rare:'Редкий',elite:'Элитный',exclusive:'Эксклюзивный'};
export function getItemById(id){ return ITEM_CATALOG.find(item=>item.id===id) ?? null; }
export function getEquippedAppearance(ids=[]){
  const equipped=ids.map(getItemById).filter(Boolean);
  const bySlot=Object.fromEntries(equipped.map(item=>[item.slot,item]));
  return {
    jacketColor:bySlot.top?.color ?? bySlot.fullset?.color, trousersColor:bySlot.bottom?.color, shoeColor:bySlot.shoes?.color,
    watch:!!bySlot.wrist, glasses:!!bySlot.face, backpack:!!bySlot.back, belt:!!bySlot.waist,
    equippedIds:equipped.map(item=>item.id)
  };
}
export function evaluateSocialAppearance(ids=[], context='business', personality='neutral'){
  const items=ids.map(getItemById).filter(Boolean);
  const tags=new Set(items.flatMap(item=>item.tags));
  const raw=items.reduce((sum,item)=>sum+Object.values(item.effect ?? {}).filter(Number.isFinite).reduce((a,b)=>a+b,0),0);
  const fit=context==='formal' ? (tags.has('formal')||tags.has('business')?1:tags.has('casual')?-1:0) : context==='casual' ? (tags.has('casual')?1:0) : 0;
  const status=context==='investor'&&tags.has('status')?2:0;
  const mismatch=context==='formal'&&tags.has('casual')&&!tags.has('business')?-2:0;
  const personalityFit=personality==='sociable'&&tags.has('casual')?1:personality==='cautious'&&tags.has('business')?1:0;
  return {score:Math.max(-4,Math.min(12,Math.round(raw*.18+fit+status+mismatch+personalityFit))),fit,mismatch,notes:fit>0?'Образ соответствует формату встречи':mismatch<0?'Слишком повседневный образ для официальной встречи':'Нейтральный образ без выраженного контекстного бонуса'};
}

export function getEquipmentEffects(ids=[]){
  return ids.map(getItemById).filter(item=>item?.category==='equipment').reduce((total,item)=>{for(const [key,value] of Object.entries(item.effect??{}))total[key]=(total[key]??0)+value;return total;},{});
}
