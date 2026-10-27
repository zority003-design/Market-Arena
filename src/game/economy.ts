export type ClientTier = 0 | 1 | 2 | 3 | 4
export type VideoBackground = 'real' | 'neutral' | 'luxury'
export type ClientProfile = {
  id: string; name: string; initials: string; age: number; profession: string
  tier: ClientTier; budget: number; ticket: number; maxAllocation: number
  baseTrust: number; patience: number; experience: string; temperament: string
  goal: string; quote: string; source: string; minDay: number; minReputation: number
  commissionRate: number; bonusRate: number; statusSensitive: boolean
}
export type HousingOption = {
  id: string; name: string; price: number; dailyCost: number; firstImpression: number
  comfort: number; minDay: number; minReputation: number; description: string
}
export type BusinessUpgrade = {
 id: string; name: string; price: number; minDay: number; minReputation: number
 payoutCap: number; trustBonus: number; description: string; effect: string
}
export type RoomItem = {
  id: string; name: string; price: number; firstImpression: number; videoQuality: number
  suspicion: number; minDay: number; minLevel?: number; description: string
  category: 'comfort' | 'video' | 'background' | 'work'
}
export const DAILY_SALARY = 1100
export const STARTING_CASH = 22000
export const STARTING_FIRM_CAPITAL = 25000
export const STARTING_HOUSING_ID = 'dorm'
export const BUSINESS_UPGRADES: BusinessUpgrade[] = [
 { id:'lead-network', name:'Сеть рекомендаций', price:7500, minDay:2, minReputation:10, payoutCap:1500, trustBonus:0, description:'Покупаешь доступ к небольшому каталогу новых лидов и отраслевым знакомствам.', effect:'+1 дополнительный звонок в день и более ранний доступ к нескольким клиентам.' },
 { id:'research-terminal', name:'Аналитический терминал', price:18000, minDay:5, minReputation:20, payoutCap:2300, trustBonus:2, description:'Сводки по компаниям, сравнительные таблицы и сценарии риска вместо презентаций на глаз.', effect:'До +2 к стартовому доверию и повышенный предел личного бонуса.' },
 { id:'client-crm', name:'CRM и рекомендации', price:38000, minDay:8, minReputation:35, payoutCap:3300, trustBonus:1, description:'Напоминания, история сделок и повторные обращения не теряются в блокноте.', effect:'+1 дополнительный звонок в день и доступ к части клиентов раньше обычного.' },
 { id:'partner-office', name:'Партнёрский стол', price:70000, minDay:12, minReputation:50, payoutCap:4500, trustBonus:3, description:'Первое серьёзное расширение бизнеса: стандарты переговоров, отчётность и рекомендации.', effect:'До +3 к стартовому доверию и максимальный предел бонуса среди улучшений.' },
]
export function getBusinessPayoutCap(ownedUpgradeIds: string[]): number {
 return Math.max(900, ...BUSINESS_UPGRADES.filter(upgrade => ownedUpgradeIds.includes(upgrade.id)).map(upgrade => upgrade.payoutCap))
}

export const CLIENTS: ClientProfile[] = [
 { id:'alex-vorontsov', name:'Алексей Воронцов', initials:'АВ', age:34, profession:'Владелец небольшой студии дизайна', tier:0, budget:50000, ticket:12000, maxAllocation:.25, baseTrust:43, patience:74, experience:'Новичок', temperament:'Осторожный', goal:'Сохранить накопления и разобраться в инвестициях', quote:'«Хочу попробовать инвестировать, но мне уже обещали золотые горы. Чем вы отличаетесь?»', source:'Входящий звонок', minDay:1, minReputation:0, commissionRate:.03, bonusRate:.018, statusSensitive:false },
 { id:'maria-sokolova', name:'Мария Соколова', initials:'МС', age:29, profession:'UX-дизайнер на удалёнке', tier:0, budget:85000, ticket:18000, maxAllocation:.3, baseTrust:39, patience:65, experience:'Небольшой опыт', temperament:'Любознательная', goal:'Начать инвестировать регулярно', quote:'«Объясните человеческим языком: почему эта компания должна расти?»', source:'Рекомендация знакомого', minDay:1, minReputation:0, commissionRate:.03, bonusRate:.018, statusSensitive:false },
 { id:'igor-melnikov', name:'Игорь Мельников', initials:'ИМ', age:41, profession:'Руководитель отдела продаж', tier:1, budget:240000, ticket:42000, maxAllocation:.25, baseTrust:35, patience:60, experience:'Средний', temperament:'Требовательный', goal:'Доходность выше вклада с резервом на непредвиденные расходы', quote:'«Покажите цифры и скажите, в каком сценарии я потеряю деньги»', source:'Каталог потенциальных клиентов', minDay:3, minReputation:25, commissionRate:.027, bonusRate:.016, statusSensitive:true },
 { id:'elena-borisova', name:'Елена Борисова', initials:'ЕБ', age:46, profession:'Совладелица сети кофеен', tier:2, budget:1200000, ticket:180000, maxAllocation:.2, baseTrust:31, patience:56, experience:'Продвинутый', temperament:'Деловая', goal:'Диверсифицировать капитал, не замораживая деньги бизнеса', quote:'«У меня нет времени на презентацию. Какие риски и как быстро выйти из позиции?»', source:'Профессиональное знакомство', minDay:6, minReputation:40, commissionRate:.024, bonusRate:.014, statusSensitive:true },
 { id:'sergey-romanov', name:'Сергей Романов', initials:'СР', age:52, profession:'Владелец региональной логистической компании', tier:3, budget:4500000, ticket:520000, maxAllocation:.16, baseTrust:27, patience:52, experience:'Опытный', temperament:'Скептичный', goal:'Разместить часть личного капитала и проверить компетентность брокера', quote:'«Я нанимаю людей, которые объясняют не только прибыль, но и провал»', source:'Рекомендация клиента', minDay:10, minReputation:55, commissionRate:.02, bonusRate:.012, statusSensitive:true },
 { id:'diana-volkova', name:'Диана Волкова', initials:'ДВ', age:38, profession:'Партнёр юридической фирмы', tier:4, budget:15000000, ticket:1200000, maxAllocation:.12, baseTrust:24, patience:48, experience:'Профессионал', temperament:'Очень требовательная', goal:'Проверить процесс принятия решений и качество контроля рисков', quote:'«Кто отвечает за ошибку в рекомендациях и где ваши допущения?»', source:'Закрытая рекомендация', minDay:16, minReputation:70, commissionRate:.016, bonusRate:.01, statusSensitive:true },
 { id:'pavel-smirnov', name:'Павел Смирнов', initials:'ПС', age:31, profession:'Разработчик мобильных приложений', tier:0, budget:65000, ticket:14000, maxAllocation:.25, baseTrust:42, patience:70, experience:'Начинающий', temperament:'Любопытный', goal:'Начать с небольшой суммы и понимать каждое решение', quote:'«Я могу сам купить акции в приложении. За что тогда я вам плачу?»', source:'Входящий звонок', minDay:1, minReputation:0, commissionRate:.03, bonusRate:.018, statusSensitive:false },
 { id:'natalia-orlova', name:'Наталья Орлова', initials:'НО', age:36, profession:'Врач частной клиники', tier:0, budget:110000, ticket:22000, maxAllocation:.22, baseTrust:40, patience:62, experience:'Базовый', temperament:'Занятая и прямолинейная', goal:'Сформировать резерв и не тратить часы на новости рынка', quote:'«У меня десять минут. Сразу скажите, где риск и сколько времени это займёт».', source:'Рекомендация знакомой', minDay:1, minReputation:0, commissionRate:.03, bonusRate:.018, statusSensitive:false },
 { id:'timur-garipov', name:'Тимур Гарипов', initials:'ТГ', age:27, profession:'Владелец кофейни', tier:1, budget:180000, ticket:32000, maxAllocation:.24, baseTrust:36, patience:58, experience:'Небольшой опыт', temperament:'Импульсивный', goal:'Увеличить капитал, не заморозив деньги бизнеса', quote:'«Если акция упадёт завтра, вы будете со мной на связи или испаритесь?»', source:'Каталог клиентов', minDay:2, minReputation:12, commissionRate:.029, bonusRate:.017, statusSensitive:false },
 { id:'olga-belova', name:'Ольга Белова', initials:'ОБ', age:44, profession:'Главный бухгалтер производственной компании', tier:1, budget:300000, ticket:50000, maxAllocation:.2, baseTrust:34, patience:72, experience:'Средний', temperament:'Дотошная', goal:'Понять налоги, комиссии и худший реалистичный сценарий', quote:'«Покажите итог после комиссий. Слова “примерно” в таблицах я не люблю».', source:'Профессиональное знакомство', minDay:3, minReputation:18, commissionRate:.027, bonusRate:.016, statusSensitive:true },
 { id:'roman-kiselev', name:'Роман Киселёв', initials:'РК', age:39, profession:'Руководитель отдела закупок', tier:1, budget:420000, ticket:65000, maxAllocation:.22, baseTrust:33, patience:55, experience:'Средний', temperament:'Торгующийся', goal:'Получить внятную стратегию и не переплачивать за сопровождение', quote:'«Убедите меня цифрами. И да, комиссию я тоже собираюсь обсуждать».', source:'Повторный контакт', minDay:3, minReputation:20, commissionRate:.027, bonusRate:.016, statusSensitive:true },
 { id:'irina-zueva', name:'Ирина Зуева', initials:'ИЗ', age:33, profession:'Владелица онлайн-магазина', tier:2, budget:750000, ticket:110000, maxAllocation:.18, baseTrust:31, patience:57, experience:'Опытная', temperament:'Быстрая на решения', goal:'Разместить свободный денежный поток без ущерба оборотному капиталу', quote:'«Деньги могут понадобиться на закупку товара. Как быстро я смогу их вернуть?»', source:'Рекомендация клиента', minDay:5, minReputation:30, commissionRate:.025, bonusRate:.015, statusSensitive:true },
 { id:'andrey-morozov', name:'Андрей Морозов', initials:'АМ', age:48, profession:'Инженер и частный инвестор', tier:2, budget:900000, ticket:135000, maxAllocation:.17, baseTrust:30, patience:68, experience:'Опытный', temperament:'Скептичный аналитик', goal:'Сравнить инвестиционную идею с индексом и депозитом', quote:'«Какая у этой идеи причина обогнать рынок, кроме вашей уверенности?»', source:'Инвестиционный клуб', minDay:5, minReputation:32, commissionRate:.024, bonusRate:.014, statusSensitive:true },
 { id:'svetlana-krylova', name:'Светлана Крылова', initials:'СК', age:42, profession:'Директор сети салонов красоты', tier:2, budget:1400000, ticket:190000, maxAllocation:.16, baseTrust:29, patience:54, experience:'Опытная', temperament:'Статусная и требовательная', goal:'Диверсифицировать капитал и получать понятные отчёты', quote:'«Я привыкла к сервису. Почему должна доверить вам деньги, а не банку?»', source:'Закрытая рекомендация', minDay:7, minReputation:38, commissionRate:.023, bonusRate:.014, statusSensitive:true },
 { id:'viktor-lebedev', name:'Виктор Лебедев', initials:'ВЛ', age:57, profession:'Совладелец строительной фирмы', tier:3, budget:2800000, ticket:360000, maxAllocation:.15, baseTrust:27, patience:50, experience:'Опытный', temperament:'Недоверчивый прагматик', goal:'Сохранить капитал и не попасть в историю с неликвидными активами', quote:'«Я видел три кризиса. Расскажите, что произойдёт, когда ваш красивый прогноз сломается».', source:'Рекомендация партнёра', minDay:9, minReputation:48, commissionRate:.02, bonusRate:.012, statusSensitive:true },
 { id:'alina-fedorova', name:'Алина Фёдорова', initials:'АФ', age:30, profession:'Основательница маркетингового агентства', tier:2, budget:620000, ticket:90000, maxAllocation:.2, baseTrust:32, patience:52, experience:'Средний', temperament:'Соревновательная', goal:'Найти растущие компании и понимать, когда фиксировать убыток', quote:'«Мне нужна не лекция, а тезис: почему сейчас, что может пойти не так и когда вы признаете ошибку?»', source:'Деловое мероприятие', minDay:4, minReputation:26, commissionRate:.025, bonusRate:.015, statusSensitive:false },
 { id:'maksim-sobolev', name:'Максим Соболев', initials:'МС', age:35, profession:'Владелец автосервиса', tier:1, budget:260000, ticket:38000, maxAllocation:.23, baseTrust:35, patience:59, experience:'Базовый', temperament:'Прямой и эмоциональный', goal:'Заставить накопления работать, не рискуя деньгами на зарплаты', quote:'«Только не обещайте мне доходность. Мне уже один такой обещал — теперь он не берёт трубку».', source:'Входящий звонок', minDay:2, minReputation:10, commissionRate:.028, bonusRate:.016, statusSensitive:false },
 { id:'ekaterina-mironova', name:'Екатерина Миронова', initials:'ЕМ', age:40, profession:'Финансовый директор IT-компании', tier:3, budget:5200000, ticket:620000, maxAllocation:.14, baseTrust:25, patience:64, experience:'Профессионал', temperament:'Холодно-аналитическая', goal:'Оценить методологию отбора активов и контроль рисков', quote:'«Опишите процесс принятия решения и покажите, какие факты заставят вас отказаться от сделки».', source:'Профессиональная рекомендация', minDay:11, minReputation:58, commissionRate:.019, bonusRate:.011, statusSensitive:true },
 { id:'boris-zhukov', name:'Борис Жуков', initials:'БЖ', age:63, profession:'Пенсионер, бывший владелец типографии', tier:1, budget:210000, ticket:30000, maxAllocation:.2, baseTrust:31, patience:76, experience:'Небольшой опыт', temperament:'Осторожный и недоверчивый', goal:'Не потерять накопления и разобраться, какие деньги можно инвестировать', quote:'«Мне не нужны красивые графики. Объясните, сколько я реально могу потерять».', source:'Рекомендация родственника', minDay:2, minReputation:14, commissionRate:.028, bonusRate:.016, statusSensitive:false },
 { id:'yaroslav-nikitin', name:'Ярослав Никитин', initials:'ЯН', age:26, profession:'Киберспортсмен и стример', tier:1, budget:145000, ticket:26000, maxAllocation:.25, baseTrust:33, patience:45, experience:'Поверхностный', temperament:'Нетерпеливый и азартный', goal:'Быстро увеличить капитал и доказать, что умеет выбирать акции', quote:'«Если всё так рискованно, почему бы просто не поставить на самую волатильную?»', source:'Социальные сети', minDay:2, minReputation:8, commissionRate:.029, bonusRate:.017, statusSensitive:false },
]

export const HOUSING: HousingOption[] = [
 { id:'dorm', name:'Общежитие', price:0, dailyCost:350, firstImpression:-2, comfort:0, minDay:1, minReputation:0, description:'Тесно и шумно, зато можно начать без депозита.' },
 { id:'shared-flat', name:'Комната в общей квартире', price:12000, dailyCost:500, firstImpression:0, comfort:1, minDay:3, minReputation:0, description:'Больше тишины и места для оборудования.' },
 { id:'studio', name:'Небольшая студия', price:45000, dailyCost:800, firstImpression:2, comfort:3, minDay:6, minReputation:20, description:'Приватность для видеозвонков и рабочее место.' },
 { id:'city-apartment', name:'Хорошая квартира', price:135000, dailyCost:1400, firstImpression:4, comfort:5, minDay:10, minReputation:40, description:'Солидный вид, но ежедневные расходы заметны.' },
 { id:'premium-apartment', name:'Премиальные апартаменты', price:480000, dailyCost:3200, firstImpression:5, comfort:6, minDay:16, minReputation:65, description:'Статус помогает в части встреч, содержание дорого.' },
]
export const ROOM_ITEMS: RoomItem[] = [
 { id:'desk-lamp', name:'Настольная лампа', price:1200, firstImpression:1, videoQuality:1, suspicion:0, minDay:1, category:'comfort', description:'Ровнее свет на лице и меньше усталости вечером.' },
 { id:'used-chair', name:'Б/у офисный стул', price:3500, firstImpression:0, videoQuality:0, suspicion:0, minDay:1, category:'comfort', description:'Комфортнее работать весь день.' },
 { id:'headset', name:'Гарнитура с микрофоном', price:4500, firstImpression:1, videoQuality:2, suspicion:0, minDay:1, category:'video', description:'Чётче звук и меньше недопонимания.' },
 { id:'ring-light', name:'Кольцевая лампа', price:5500, firstImpression:1, videoQuality:2, suspicion:0, minDay:2, minLevel:2, category:'video', description:'Ровный свет помогает выглядеть собраннее.' },
 { id:'hd-camera', name:'HD-веб-камера', price:7500, firstImpression:1, videoQuality:3, suspicion:0, minDay:2, minLevel:2, category:'video', description:'Более чёткая картинка на видеозвонке.' },
 { id:'neutral-backdrop', name:'Нейтральный фон', price:8000, firstImpression:2, videoQuality:1, suspicion:0, minDay:3, category:'background', description:'Аккуратная обстановка без показной роскоши.' },
 { id:'chromakey-kit', name:'Хромакей-комплект', price:18000, firstImpression:2, videoQuality:2, suspicion:10, minDay:5, minLevel:3, category:'background', description:'Открывает виртуальные фоны; неправдоподобная маска может насторожить.' },
 { id:'pro-mic', name:'Микрофон и акустика', price:28000, firstImpression:1, videoQuality:4, suspicion:0, minDay:8, minLevel:4, category:'video', description:'Профессиональный звук для сложных переговоров.' },
]
export function getAvailableClients(day:number, reputation:number):ClientProfile[] {
 return CLIENTS.filter(client => day>=client.minDay && reputation>=client.minReputation)
}
export function getFirstImpression(housingId:string, ownedItems:string[], client:ClientProfile):number {
 const home=HOUSING.find(option=>option.id===housingId) ?? HOUSING[0]
 const itemScore=ownedItems.reduce((sum,id)=>sum+(ROOM_ITEMS.find(item=>item.id===id)?.firstImpression ?? 0),0)
 const statusMismatch=client.statusSensitive && home.firstImpression<2 ? -2 : 0
 return Math.max(-5,Math.min(8,home.firstImpression+Math.min(5,itemScore)+statusMismatch))
}
export function getVideoQuality(ownedItems:string[]):number {
 return Math.min(8,ownedItems.reduce((sum,id)=>sum+(ROOM_ITEMS.find(item=>item.id===id)?.videoQuality ?? 0),0))
}
export function getOutfitModifier(outfit:'intern'|'classic'|'premium', client:ClientProfile):number {
 const base={intern:0,classic:2,premium:5}[outfit]
 // Status-conscious clients notice polished clothing more, but everyone responds to a more professional appearance.
 return base+(client.statusSensitive && outfit!=='intern' ? 1 : 0)
}
export function calculateDeal(client:ClientProfile, trust:number, previousDeals=0, previouslyInvested=0, businessTier=0) {
 const remainingBudget=Math.max(0,client.budget-previouslyInvested)
 const allocationRate=Math.min(.45,client.maxAllocation+previousDeals*.05)
 const ticket=Math.min(Math.round(client.ticket*(1+previousDeals*.25)),Math.floor(client.budget*allocationRate),remainingBudget)
 const qualityMultiplier=trust>=75?1.25:trust>=62?1.1:1
 const bonusCaps=[900,1500,2300,3300,4500]
 const playerBonus=Math.min(bonusCaps[Math.min(bonusCaps.length-1,Math.max(0,businessTier))],Math.round(ticket*client.bonusRate*qualityMultiplier))
 return {ticket,firmRevenue:Math.round(ticket*client.commissionRate),playerBonus,qualityMultiplier}
}
export function getBackgroundModifier(mode:VideoBackground, ownedItems:string[], client:ClientProfile):number {
 if(mode==='real') return 0
 const hasNeutral=ownedItems.includes('neutral-backdrop')
 const hasChromakey=ownedItems.includes('chromakey-kit')
 if(mode==='neutral') return hasNeutral || hasChromakey ? 2 : -3
 if(!hasChromakey) return -6
 return client.statusSensitive ? 4 : 1
}

export function getDailyLeadIds(
 day:number,
 reputation:number,
 lastContact:Record<string,number>={},
 dealCounts:Record<string,number>={},
 invested:Record<string,number>={}
):string[] {
 const eligible=getAvailableClients(day,reputation).filter(client =>
   day-(lastContact[client.id] ?? -100)>=3 &&
   (dealCounts[client.id] ?? 0)<3 &&
   (invested[client.id] ?? 0)<client.budget
 )
 if(eligible.length===0) return []
 const limit=reputation>=60?4:reputation>=35?3:2
 if(day<=2) return eligible.slice(0,limit).map(client=>client.id)
 const offset=(day*3+Math.floor(reputation/10))%eligible.length
 const rotated=[...eligible.slice(offset),...eligible.slice(0,offset)]
 return rotated.slice(0,limit).map(client=>client.id)
}
