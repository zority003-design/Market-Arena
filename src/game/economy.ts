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
export type RoomItem = {
  id: string; name: string; price: number; firstImpression: number; videoQuality: number
  suspicion: number; minDay: number; description: string
  category: 'comfort' | 'video' | 'background' | 'work'
}
export const DAILY_SALARY = 900
export const STARTING_CASH = 18500
export const STARTING_FIRM_CAPITAL = 25000
export const STARTING_HOUSING_ID = 'dorm'

export const CLIENTS: ClientProfile[] = [
 { id:'alex-vorontsov', name:'Алексей Воронцов', initials:'АВ', age:34, profession:'Владелец небольшой студии дизайна', tier:0, budget:50000, ticket:12000, maxAllocation:.25, baseTrust:43, patience:74, experience:'Новичок', temperament:'Осторожный', goal:'Сохранить накопления и разобраться в инвестициях', quote:'«Хочу попробовать инвестировать, но мне уже обещали золотые горы. Чем вы отличаетесь?»', source:'Входящий звонок', minDay:1, minReputation:0, commissionRate:.025, bonusRate:.008, statusSensitive:false },
 { id:'maria-sokolova', name:'Мария Соколова', initials:'МС', age:29, profession:'UX-дизайнер на удалёнке', tier:0, budget:85000, ticket:18000, maxAllocation:.3, baseTrust:39, patience:65, experience:'Небольшой опыт', temperament:'Любознательная', goal:'Начать инвестировать регулярно', quote:'«Объясните человеческим языком: почему эта компания должна расти?»', source:'Рекомендация знакомого', minDay:2, minReputation:0, commissionRate:.025, bonusRate:.008, statusSensitive:false },
 { id:'igor-melnikov', name:'Игорь Мельников', initials:'ИМ', age:41, profession:'Руководитель отдела продаж', tier:1, budget:240000, ticket:42000, maxAllocation:.25, baseTrust:35, patience:60, experience:'Средний', temperament:'Требовательный', goal:'Доходность выше вклада с резервом на непредвиденные расходы', quote:'«Покажите цифры и скажите, в каком сценарии я потеряю деньги»', source:'Каталог потенциальных клиентов', minDay:3, minReputation:20, commissionRate:.02, bonusRate:.007, statusSensitive:true },
 { id:'elena-borisova', name:'Елена Борисова', initials:'ЕБ', age:46, profession:'Совладелица сети кофеен', tier:2, budget:1200000, ticket:180000, maxAllocation:.2, baseTrust:31, patience:56, experience:'Продвинутый', temperament:'Деловая', goal:'Диверсифицировать капитал, не замораживая деньги бизнеса', quote:'«У меня нет времени на презентацию. Какие риски и как быстро выйти из позиции?»', source:'Профессиональное знакомство', minDay:6, minReputation:35, commissionRate:.018, bonusRate:.006, statusSensitive:true },
 { id:'sergey-romanov', name:'Сергей Романов', initials:'СР', age:52, profession:'Владелец региональной логистической компании', tier:3, budget:4500000, ticket:520000, maxAllocation:.16, baseTrust:27, patience:52, experience:'Опытный', temperament:'Скептичный', goal:'Разместить часть личного капитала и проверить компетентность брокера', quote:'«Я нанимаю людей, которые объясняют не только прибыль, но и провал»', source:'Рекомендация клиента', minDay:10, minReputation:50, commissionRate:.014, bonusRate:.005, statusSensitive:true },
 { id:'diana-volkova', name:'Диана Волкова', initials:'ДВ', age:38, profession:'Партнёр юридической фирмы', tier:4, budget:15000000, ticket:1200000, maxAllocation:.12, baseTrust:24, patience:48, experience:'Профессионал', temperament:'Очень требовательная', goal:'Проверить процесс принятия решений и качество контроля рисков', quote:'«Кто отвечает за ошибку в рекомендациях и где ваши допущения?»', source:'Закрытая рекомендация', minDay:16, minReputation:68, commissionRate:.01, bonusRate:.004, statusSensitive:true },
]

export const HOUSING: HousingOption[] = [
 { id:'dorm', name:'Общежитие', price:0, dailyCost:650, firstImpression:-2, comfort:0, minDay:1, minReputation:0, description:'Тесно и шумно, зато можно начать без депозита.' },
 { id:'shared-flat', name:'Комната в общей квартире', price:12000, dailyCost:900, firstImpression:0, comfort:1, minDay:3, minReputation:0, description:'Больше тишины и места для оборудования.' },
 { id:'studio', name:'Небольшая студия', price:45000, dailyCost:1600, firstImpression:2, comfort:3, minDay:6, minReputation:20, description:'Приватность для видеозвонков и рабочее место.' },
 { id:'city-apartment', name:'Хорошая квартира', price:135000, dailyCost:3000, firstImpression:4, comfort:5, minDay:10, minReputation:40, description:'Солидный вид, но ежедневные расходы заметны.' },
 { id:'premium-apartment', name:'Премиальные апартаменты', price:480000, dailyCost:7000, firstImpression:5, comfort:6, minDay:16, minReputation:65, description:'Статус помогает в части встреч, содержание дорого.' },
]
export const ROOM_ITEMS: RoomItem[] = [
 { id:'desk-lamp', name:'Настольная лампа', price:1200, firstImpression:1, videoQuality:1, suspicion:0, minDay:1, category:'comfort', description:'Ровнее свет на лице и меньше усталости вечером.' },
 { id:'used-chair', name:'Б/у офисный стул', price:3500, firstImpression:0, videoQuality:0, suspicion:0, minDay:1, category:'comfort', description:'Комфортнее работать весь день.' },
 { id:'headset', name:'Гарнитура с микрофоном', price:4500, firstImpression:1, videoQuality:2, suspicion:0, minDay:1, category:'video', description:'Чётче звук и меньше недопонимания.' },
 { id:'ring-light', name:'Кольцевая лампа', price:5500, firstImpression:1, videoQuality:2, suspicion:0, minDay:2, category:'video', description:'Ровный свет помогает выглядеть собраннее.' },
 { id:'hd-camera', name:'HD-веб-камера', price:7500, firstImpression:1, videoQuality:3, suspicion:0, minDay:2, category:'video', description:'Более чёткая картинка на видеозвонке.' },
 { id:'neutral-backdrop', name:'Нейтральный фон', price:8000, firstImpression:2, videoQuality:1, suspicion:0, minDay:3, category:'background', description:'Аккуратная обстановка без показной роскоши.' },
 { id:'second-monitor', name:'Второй монитор', price:12000, firstImpression:0, videoQuality:0, suspicion:0, minDay:4, category:'work', description:'Удобнее сравнивать отчёт, новости и условия.' },
 { id:'chromakey-kit', name:'Хромакей-комплект', price:18000, firstImpression:2, videoQuality:2, suspicion:10, minDay:5, category:'background', description:'Открывает виртуальные фоны; неправдоподобная маска может насторожить.' },
 { id:'pro-mic', name:'Микрофон и акустика', price:28000, firstImpression:1, videoQuality:4, suspicion:0, minDay:8, category:'video', description:'Профессиональный звук для сложных переговоров.' },
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
export function calculateDeal(client:ClientProfile, trust:number) {
 const ticket=Math.min(client.ticket,Math.floor(client.budget*client.maxAllocation))
 const qualityMultiplier=trust>=75?1.25:trust>=62?1.1:1
 return {ticket,firmRevenue:Math.round(ticket*client.commissionRate),playerBonus:Math.round(ticket*client.bonusRate*qualityMultiplier),qualityMultiplier}
}
export function getBackgroundModifier(mode:VideoBackground, ownedItems:string[], client:ClientProfile):number {
 if(mode==='real') return 0
 const hasNeutral=ownedItems.includes('neutral-backdrop')
 const hasChromakey=ownedItems.includes('chromakey-kit')
 if(mode==='neutral') return hasNeutral || hasChromakey ? 2 : -3
 if(!hasChromakey) return -6
 return client.statusSensitive ? 4 : 1
}
