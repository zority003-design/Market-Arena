import './ArenaOS.css'
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Activity, TrendingUp, Check, ChevronRight, Clock3, House, Laptop, Mic, Building2,
  PhoneCall, Search, ShieldCheck, ShoppingBag, Sparkles, Users,
  Video, Wallet, X
} from 'lucide-react'
import { BROKER_HIRES, BUSINESS_ASSETS, BUSINESS_UPGRADES, CLIENTS, HOUSING, getBusinessDailyNetIncome, getBusinessPayoutCap, getFirstImpression, getStaffDailyNetIncome, type ClientProfile } from './game/economy'
import ClientAvatar2D from './ClientAvatar2D'
import BrokerAvatar3D from './BrokerAvatar3D'
import { playSound } from './audio'
import { evaluateFreeReply } from './game/dialogue'

type OutfitId = 'intern' | 'classic' | 'premium'
type SpeechResultLike = { transcript: string }
type SpeechEventLike = { results: ArrayLike<ArrayLike<SpeechResultLike>> }
type SpeechRecognizerLike = {
  lang: string; interimResults: boolean; maxAlternatives: number
  onresult: ((event: SpeechEventLike) => void) | null
  onerror: (() => void) | null; onend: (() => void) | null
  start: () => void
}
type AppId = 'home' | 'calls' | 'market' | 'clients' | 'wardrobe' | 'equipment' | 'tasks' | 'housing' | 'business'
type Stock = { ticker: string; name: string; price: number; risk: 'Низкий' | 'Средний' | 'Высокий'; upside: string; downside: string; fit: string; financials: string; catalyst: string; redFlags: string; horizon: string }
type Props = {
  cash: number; setCash: Dispatch<SetStateAction<number>>
  masterVolume: number; setMasterVolume: Dispatch<SetStateAction<number>>
  reputation: number; setReputation: Dispatch<SetStateAction<number>>
  xp: number; setXp: Dispatch<SetStateAction<number>>
  day: number
  callsToday: number; setCallsToday: Dispatch<SetStateAction<number>>
  businessUpgrades: string[]; setBusinessUpgrades: Dispatch<SetStateAction<string[]>>
  ownedBusinessAssets: string[]; setOwnedBusinessAssets: Dispatch<SetStateAction<string[]>>
  ownedEmployees: string[]; setOwnedEmployees: Dispatch<SetStateAction<string[]>>
  companyName: string; setCompanyName: Dispatch<SetStateAction<string>>
  housingId: string; setHousingId: Dispatch<SetStateAction<string>>
  selectedOutfit: OutfitId; setSelectedOutfit: (v: OutfitId) => void
  ownedOutfits: OutfitId[]; setOwnedOutfits: Dispatch<SetStateAction<OutfitId[]>>
  ownedItems: string[]; setOwnedItems: Dispatch<SetStateAction<string[]>>
  onClose: () => void
  initialApp?: AppId
  sessionId?: number
  introCallReceived: boolean
  setIntroCallReceived: (value: boolean) => void
}

const STOCKS: Stock[] = [
  { ticker:'KTLT', name:'Котолёт', price:184, risk:'Высокий', upside:'Растущий рынок доставки товаров дронами и сильный спрос на автоматизацию.', downside:'Компания тратит деньги быстрее, чем превращает обещания в прибыль; регулятор может остановить часть полётов.', fit:'Подходит тем, кто готов к резким колебаниям и долгому горизонту.', financials:'Выручка растёт, но операционный денежный поток пока отрицательный; запас денег сокращается из-за разработки и запуска.', catalyst:'Подписание контракта на 800 роботов, повторные заказы и подтверждённая маржа на поставках.', redFlags:'Пилотный тест могут не превратить в заказ; регуляторные ограничения и гарантийные расходы способны сорвать план.', horizon:'От 2–4 лет; короткий горизонт плохо сочетается с высокой неопределённостью.' },
  { ticker:'SBRX', name:'СберТехно', price:312, risk:'Средний', upside:'Стабильная клиентская база, регулярная выручка и инвестиции в цифровые сервисы.', downside:'Рост замедляется, а конкуренты давят на маржу.', fit:'Понятный компромисс между ростом и устойчивостью.', financials:'Регулярная выручка и положительная прибыль; следить за темпом роста маржи и затратами на цифровые сервисы.', catalyst:'Новые корпоративные контракты, рост повторных продаж и повышение дохода на одного клиента.', redFlags:'Ускорение конкуренции, ценовая война и замедление роста могут снизить оценку.', horizon:'От 1–3 лет с проверкой квартальных результатов.' },
  { ticker:'NEFT', name:'СеверНефть', price:728, risk:'Средний', upside:'Денежный поток поддерживают экспорт и действующие производственные активы.', downside:'Зависимость от сырьевых цен, курса и ограничений на поставки.', fit:'Может подойти инвестору, который принимает цикличность сырьевого сектора.', financials:'Денежный поток зависит от цены сырья, валютного курса, налоговой нагрузки и капитальных затрат.', catalyst:'Рост мировых цен, снижение затрат на добычу и улучшение логистики экспорта.', redFlags:'Санкции, ограничения поставок, укрепление рубля и падение сырьевых цен могут резко ухудшить результат.', horizon:'От 1–3 лет; важно учитывать весь сырьевой цикл.' },
  { ticker:'MEDX', name:'МедЭкспресс', price:496, risk:'Низкий', upside:'Спрос на медицинские услуги устойчив, компания расширяет сеть клиник.', downside:'Открытие новых центров дорого, а долги ограничивают скорость расширения.', fit:'Более защитный вариант, но низкий риск не означает отсутствие потерь.', financials:'Услуги формируют повторяющийся спрос, но открытие клиник требует капитальных вложений и финансирования.', catalyst:'Рост загрузки клиник, увеличение среднего чека и повышение эффективности новых филиалов.', redFlags:'Долговая нагрузка, нехватка врачей и медленный выход новых центров на плановую загрузку.', horizon:'От 2–3 лет, пока сеть масштабируется.' },
  { ticker:'GROV', name:'ГроуМаркет', price:92, risk:'Высокий', upside:'Онлайн-торговля растёт, компания быстро привлекает новых покупателей.', downside:'Большие расходы на логистику и скидки съедают прибыль.', fit:'Для готовых следить за отчётностью и переносить волатильность.', financials:'Продажи растут, однако логистика, возвраты и скидки забирают большую часть валовой прибыли.', catalyst:'Улучшение экономики заказа, снижение стоимости привлечения покупателя и рост повторных покупок.', redFlags:'Погоня за выручкой без положительного денежного потока может привести к дополнительному долгу и размытию долей.', horizon:'От 2–4 лет, если бизнес докажет путь к устойчивой прибыли.' },
  { ticker:'GRID', name:'Городские сети', price:67, risk:'Низкий', upside:'Регулируемая инфраструктура и предсказуемый спрос.', downside:'Тарифные решения и крупные капитальные затраты ограничивают рост.', fit:'Скорее история стабильности, чем быстрого удорожания.', financials:'Выручка относительно предсказуема, но прибыль зависит от регулируемых тарифов и инвестиционной программы.', catalyst:'Утверждение экономически обоснованных тарифов и завершение ключевых инфраструктурных проектов.', redFlags:'Рост капитальных затрат, регуляторные решения и задержки расчётов могут ухудшить денежный поток.', horizon:'От 1–3 лет; не стоит рассчитывать на быстрый рост котировки.' },
  { ticker:'BYTE', name:'БайтСофт', price:251, risk:'Высокий', upside:'Новый продукт может резко увеличить продажи при успешном запуске.', downside:'Запуск ещё не доказал коммерческий успех; высокая оценка уже учитывает оптимизм.', fit:'Спекулятивная ставка на исполнение плана.', financials:'Текущая оценка предполагает коммерческий успех продукта, который ещё не подтверждён продажами.', catalyst:'Успешный запуск, платящие корпоративные клиенты и повторяющаяся выручка от подписок.', redFlags:'Задержка релиза, рост расходов на разработку и слабый спрос могут вызвать сильную переоценку вниз.', horizon:'От 2–5 лет; позиция должна быть небольшой из-за высокой неопределённости.' },
  { ticker:'LOGI', name:'ЛогистикПро', price:438, risk:'Средний', upside:'Контракты с крупными сетями и растущий объём доставки.', downside:'Топливо, зарплаты и простой транспорта могут снизить прибыль.', fit:'Умеренный вариант для инвестора, понимающего операционный бизнес.', financials:'Контракты дают видимость выручки, но топливо, зарплаты и простой транспорта давят на операционную маржу.', catalyst:'Продление крупных контрактов, оптимизация маршрутов и увеличение плотности доставок.', redFlags:'Потеря ключевого заказчика или рост расходов быстрее тарифов может быстро сократить прибыль.', horizon:'От 1–3 лет; регулярно проверять удержание клиентов и маржу.' },
  { ticker:'OGUR', name:'Огурец Капитал', price:92, risk:'Низкий', upside:'Прибыльный производитель напитков с повторными покупками и региональной дистрибуцией.', downside:'Подорожание сырья и упаковки может съесть маржу, а конкуренты борются за полку.', fit:'Для осторожного клиента, который предпочитает понятный бизнес гонке за иксами.', financials:'Положительная прибыль и регулярные продажи; критично отслеживать валовую маржу.', catalyst:'Новые контракты с магазинами и расширение линейки напитков.', redFlags:'Потеря дистрибьютора и рост себестоимости без возможности поднять цены.', horizon:'1–3 года с проверкой маржи и продаж.' },
  { ticker:'TAPK', name:'ТапокТех', price:64, risk:'Высокий', upside:'Низкая цена акции и возможность восстановления после выпуска исправленной версии умных тапочек.', downside:'Возвраты товара растут, новая версия не доказала качество, компания несёт убытки.', fit:'Только для готового к высокой волатильности клиента, понимающего риск потери капитала.', financials:'Убыток растёт из-за возвратов, гарантии и расходов на доработку устройства.', catalyst:'Снижение возвратов после обновления и подтверждённые повторные заказы.', redFlags:'Провал обновления может исчерпать денежный запас и вызвать новое падение.', horizon:'Спекулятивный горизонт 1–3 года; без подтверждения качества тезис не работает.' },
  { ticker:'DUST', name:'Пыль и прибыль', price:211, risk:'Низкий', upside:'Долгосрочные контракты на обслуживание зданий и уже положительная прибыль.', downside:'Умеренный рост и давление зарплат на себестоимость ограничивают потенциал.', fit:'Для клиента, которому важнее устойчивость бизнеса, чем стремительный рост котировки.', financials:'Повторяющаяся выручка и положительная прибыль, но маржа зависит от трудовых затрат.', catalyst:'Продление контрактов и автоматизация части уборочных процессов.', redFlags:'Потеря крупного договора и рост зарплат выше индексации тарифов.', horizon:'1–3 года; следить за маржой и продлением контрактов.' },
  { ticker:'BTRAN', name:'Банан Транс', price:176, risk:'Средний', upside:'Сеть АЗС с повторным спросом на топливо, магазинами у кассы и дополнительными сервисами.', downside:'Колебания оптовых цен, содержание станций и переход части клиентов на электромобили.', fit:'Для клиента, который понимает операционные риски и сезонность транспортного бизнеса.', financials:'Выручка диверсифицирована по топливу и сервисам; маржа чувствительна к закупочным ценам.', catalyst:'Рост трафика, расширение зарядных станций и улучшение продаж сопутствующих товаров.', redFlags:'Снижение маржи на топливе и дорогая модернизация сети.', horizon:'1–3 года с оценкой денежного потока и капитальных затрат.' }
]
const OUTFITS: {id:OutfitId;name:string;price:number;desc:string;bonus:number}[] = [
  {id:'intern',name:'Стажёр',price:0,desc:'Стартовый образ. Честно, но пока без статуса.',bonus:0},
  {id:'classic',name:'Деловой костюм',price:8500,desc:'Аккуратный образ для деловых переговоров.',bonus:5},
  {id:'premium',name:'Партнёрский образ',price:28000,desc:'Дорогой вид. Требовательные клиенты всё равно попросят доказать компетентность.',bonus:8}
]
const GEAR = [
  {id:'mic',name:'USB-микрофон',price:4200,desc:'Чёткая речь вместо звука из вентиляционной шахты.',bonus:5,icon:'mic'},
  {id:'camera',name:'HD-веб-камера',price:6900,desc:'Лучшее изображение и меньше жалоб на картинку.',bonus:5,icon:'camera'},
  {id:'backdrop',name:'Нейтральный фон',price:3200,desc:'Убирает визуальный хаос за спиной брокера.',bonus:3,icon:'background'},
  {id:'lamp',name:'Настольный свет',price:1800,desc:'Лицо видно, даже если переговоры затянулись до ночи.',bonus:2,icon:'light'},
  {id:'second-desk',name:'Второй рабочий стол',price:4500,desc:'Оборудуй место в квартире для первого нанятого брокера. В большом офисе рабочие места уже входят в помещение.',bonus:0,icon:'desk'}
]
const money = (n:number) => Math.round(n).toLocaleString('ru-RU') + ' ₽'

export default function ArenaOS(props: Props) {
  const [activeApp,setActiveApp] = useState<AppId>(props.initialApp ?? 'home')
  const [windowOpen,setWindowOpen] = useState(props.initialApp === 'wardrobe')
  const [windowMinimized,setWindowMinimized] = useState(false)
  const [windowMaximized,setWindowMaximized] = useState(true)
  const [startMenuOpen,setStartMenuOpen] = useState(false)
  const [incoming,setIncoming] = useState(false)
  const [lastPayout,setLastPayout] = useState(0)
  const [lastContactName,setLastContactName] = useState('')
  const [newContacts,setNewContacts] = useState<string[]>(() => { try { const saved = JSON.parse(localStorage.getItem('arena-os-v2-contacts') || 'null'); return Array.isArray(saved) ? Array.from(new Set(['alex-vorontsov','maria-sokolova',...saved.filter((id: unknown): id is string => typeof id === 'string')])) : ['alex-vorontsov','maria-sokolova'] } catch { return ['alex-vorontsov','maria-sokolova'] } })
  const [clientId,setClientId] = useState('alex-vorontsov')
  const [callState,setCallState] = useState<'idle'|'active'|'won'|'lost'>('idle')
  const [trust,setTrust] = useState(40)
  const [patience,setPatience] = useState(72)
  const [activeStock,setActiveStock] = useState<Stock|null>(null)
  const [stockPicker,setStockPicker] = useState(false)
  const [callLog,setCallLog] = useState<string[]>([])
  const [message,setMessage] = useState('')
  const [companyNameDraft,setCompanyNameDraft] = useState('')
  const dialogueLogRef = useRef<HTMLDivElement | null>(null)
  const [soundPanelOpen, setSoundPanelOpen] = useState(false)
  const [clockNow, setClockNow] = useState(() => new Date())
  const gameVolume = props.masterVolume
  const setGameVolume = (value: number) => props.setMasterVolume(value)
  const [notice,setNotice] = useState('')
  const [query,setQuery] = useState('')
  const [lastChance,setLastChance] = useState(0)
  const [completed,setCompleted] = useState(0)
  const client = useMemo(() => (CLIENTS.find(c => c.id === clientId) ?? CLIENTS[0]) as ClientProfile,[clientId])
  const unlockedClients = useMemo(() => CLIENTS.filter(c => newContacts.includes(c.id) || (props.day >= 3 && c.minDay <= props.day && c.minReputation <= props.reputation) || (props.businessUpgrades.includes('lead-network') && c.minDay <= props.day + 2 && c.minReputation <= props.reputation + 10) || (props.businessUpgrades.includes('client-crm') && c.minDay <= props.day + 3 && c.minReputation <= props.reputation + 15)),[props.day,props.reputation,newContacts,props.businessUpgrades])
  const equipmentBonus = GEAR.filter(g => props.ownedItems.includes(g.id)).reduce((n,g)=>n+g.bonus,0)
  const currentHousing = HOUSING.find(home => home.id === props.housingId) ?? HOUSING[0]
  const housingBonus = getFirstImpression(props.housingId, props.ownedItems, client)
  const businessTrustBonus = BUSINESS_UPGRADES.filter(upgrade => props.businessUpgrades.includes(upgrade.id)).reduce((sum, upgrade) => sum + upgrade.trustBonus, 0)
  const dailyCallLimit = (props.reputation >= 60 ? 4 : props.reputation >= 35 ? 3 : 2) + (props.businessUpgrades.includes('lead-network') ? 1 : 0) + (props.businessUpgrades.includes('client-crm') ? 1 : 0)
  const outfitBonus = OUTFITS.find(o=>o.id===props.selectedOutfit)?.bonus ?? 0
  const qualityPenalty = (props.ownedItems.includes('mic')?0:8) + (props.ownedItems.includes('camera')?0:5) + (props.ownedItems.includes('backdrop')?0:3)
  const chance = Math.max(5,Math.min(92,Math.round(30 + trust*.48 + props.reputation*.12 + equipmentBonus + outfitBonus - qualityPenalty + housingBonus + businessTrustBonus + (activeStock && activeStock.risk === 'Низкий' && client.tier >= 2 ? 4 : 0) - Math.max(0,client.tier-1)*9)))
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-last-app',activeApp) } catch {} },[activeApp])
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-contacts',JSON.stringify(newContacts)) } catch {} },[newContacts])
  useEffect(()=>{ setWindowMinimized(false) },[activeApp])
  useEffect(()=>{
    if (props.initialApp === 'wardrobe' || props.introCallReceived) return
    setIncoming(false)
    setCallState('idle')
    setActiveApp('home')
    setWindowOpen(false)
    setWindowMinimized(false)
    setWindowMaximized(true)
    setCallLog([])
    setMessage('')
    const timer = window.setTimeout(() => {
      setIncoming(true)
      props.setIntroCallReceived(true)
    }, 3000)
    return () => window.clearTimeout(timer)
  },[props.initialApp, props.sessionId, props.introCallReceived, props.setIntroCallReceived])
  useEffect(()=>{ if(incoming) playSound('ring') },[incoming])
  useEffect(()=>{ const el=dialogueLogRef.current; if(el) el.scrollTop=el.scrollHeight },[callLog,callState,activeApp])
  useEffect(()=>{ const timer=window.setInterval(()=>setClockNow(new Date()),15000); return ()=>window.clearInterval(timer) },[])
  const startCall = (id=clientId) => {
    if (props.callsToday >= dailyCallLimit) { setNotice('Лимит звонков на сегодня исчерпан (' + dailyCallLimit + '). Развивай сеть клиентов или возвращайся завтра.'); return }
    const selected = (CLIENTS.find(c=>c.id===id) ?? CLIENTS[0]) as ClientProfile
    props.setCallsToday(value => value + 1)
    setClientId(selected.id); setActiveStock(null); setStockPicker(true); setCallState('active')
    const homeBonus = getFirstImpression(props.housingId, props.ownedItems, selected)
    const starterTrust = Math.max(12,Math.min(72,selected.baseTrust - Math.max(0,selected.tier-1)*5 - Math.round(qualityPenalty*.45) + Math.round(props.reputation*.08) + Math.round(homeBonus*.5) + businessTrustBonus))
    setTrust(starterTrust); setPatience(Math.min(95, selected.patience + Math.round(currentHousing.comfort*.8))); setLastChance(0)
    const lines = [selected.name + ' подключился к звонку.']
    if (!props.ownedItems.includes('mic') && (selected.tier >= 2 || Math.random() < 0.45)) lines.push('Клиент: «Звук немного глухой. Надеюсь, финансовые расчёты у вас звучат убедительнее микрофона».')
    if (!props.ownedItems.includes('camera') && (selected.tier >= 1 || Math.random() < 0.4)) lines.push('Клиент: «Картинка мыльная. Для небольшой суммы переживу, но с крупным капиталом хотелось бы видеть, с кем обсуждаю деньги».')
    if (!props.ownedItems.includes('backdrop') && (selected.tier >= 2 || Math.random() < 0.25)) lines.push('Клиент оглядывает комнату: «Обстановка домашняя. Для первого разговора сойдёт, но для серьёзной суммы я ожидал бы офис посолиднее».')
    lines.push(selected.quote)
    setCallLog(lines); setMessage(''); setActiveApp('calls'); setWindowOpen(true); setWindowMinimized(false)
  }
  const chooseStock = (stock:Stock) => {
    setActiveStock(stock); setStockPicker(false)
    const suitable = (client.tier <= 1 && stock.risk === 'Низкий') || (client.tier >= 3 && stock.risk === 'Высокий') || (client.tier === 2 && stock.risk === 'Средний')
    setCallLog(prev=>[...prev, 'Ты: «Я предлагаю рассмотреть акцию '+stock.name+' ('+stock.ticker+'). '+stock.upside+' При этом важно учитывать и обратную сторону: '+stock.downside+'»', client.name+': «'+(suitable?'Хорошо, расскажите, почему вы считаете эту компанию подходящей именно мне.':'Почему вы решили, что эта акция подходит под мои цели и отношение к риску? Объясните свой выбор.')+'»'])
    setTrust(v=>Math.max(0,Math.min(100,v+(suitable?4:-3))))
  }
  const respond = (kind:'benefit'|'risk'|'absurd'|'free', custom='') => {
    if(callState!=='active') return
    const text = custom.trim()
    let delta = 0; let reply = ''
    if(kind==='free') {
      const evaluation = evaluateFreeReply(text, client, activeStock)
      delta = evaluation.delta
      reply = evaluation.reply
    } else if(kind==='benefit') {
      delta = activeStock && (client.tier<=1 ? activeStock.risk==='Низкий' : client.tier>=3 ? activeStock.risk==='Высокий' : activeStock.risk==='Средний') ? 8 : 3
      reply = '«Потенциал услышал. Не путайте возможность роста с гарантией доходности».'
    } else if(kind==='risk') {
      delta = 7; reply = '«Наконец-то брокер, который не обещает мне золотой унитаз без единой царапины».'
    } else {
      delta = -12; reply = '«Я позвонил за инвестиционной идеей, а не на кастинг в цирк. Вернёмся к делу».'
    }
    const newTrust = Math.max(0,Math.min(100,trust+delta))
    const newPatience = Math.max(0,patience-(kind==='risk'?3:kind==='free'?4:5))
    setTrust(newTrust); setPatience(newPatience); setCallLog(prev=>[...prev,'Ты: '+(kind==='free'?text:kind==='benefit'?'Объясняешь потенциальную выгоду':kind==='risk'?'Честно раскрываешь риски':'Отвечаешь невпопад'),client.name+': '+reply])
    setMessage('')
    const newChance = Math.max(5,Math.min(92,Math.round(30+newTrust*.48+props.reputation*.12+equipmentBonus+outfitBonus-qualityPenalty+housingBonus+businessTrustBonus-Math.max(0,client.tier-1)*9)))
    setLastChance(newChance)
    if(newTrust>=72 && Math.random()*100<newChance) {
      const payout = Math.min(getBusinessPayoutCap(props.businessUpgrades),Math.max(350,Math.round(client.ticket*(client.commissionRate+client.bonusRate*.25))))
      props.setCash(v=>v+payout); props.setReputation(v=>Math.min(100,v+2)); props.setXp(v=>v+45)
      setLastPayout(payout); setLastContactName(client.name)
      setNewContacts(prev=>Array.from(new Set([...prev,client.id,...(client.id==='alex-vorontsov'?['pavel-smirnov']:client.id==='maria-sokolova'?['natalia-orlova']:client.id==='pavel-smirnov'?['maksim-sobolev']:['igor-melnikov'])])))
      setCallState('won'); setCompleted(v=>v+1)
      setCallLog(prev=>[...prev,'СДЕЛКА ЗАКРЫТА. Комиссия: '+money(payout)+'. Клиент: «Ой, это здорово! Мне понравилось, как вы работали: вы не только рассказали о перспективах, но и не стали скрывать риски. Как мне теперь к вам обращаться — как называется ваша брокерская фирма? Я сохраню контакт и порекомендую вас знакомым».'])
    } else if(newTrust>=72 && newChance<100) {
      setCallLog(prev=>[...prev,client.name+': «Аргументы звучат убедительно, но я пока не готов принять решение. Мне нужно проверить детали».'])
    } else if(newTrust<=8 || newPatience<=8) {
      setCallState('lost'); props.setReputation(v=>Math.max(0,v-2)); props.setXp(v=>v+5)
      setCallLog(prev=>[...prev,'Клиент завершил звонок. Сделки нет; репутация просела.'])
    }
  }
  const startDictation = () => {
    const speechWindow = window as unknown as { SpeechRecognition?: new () => SpeechRecognizerLike; webkitSpeechRecognition?: new () => SpeechRecognizerLike }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) { setNotice('Распознавание речи не поддерживается этим браузером. Введи ответ текстом.'); return }
    const recognition = new Recognition()
    recognition.lang = 'ru-RU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
      if (transcript) setMessage(previous => previous ? previous + ' ' + transcript : transcript)
    }
    recognition.onerror = () => setNotice('Не удалось распознать речь. Проверь разрешение на микрофон или введи ответ текстом.')
    recognition.onend = () => setNotice('Распознавание речи завершено.')
    try { recognition.start(); setNotice('Слушаю… Говори ответ клиенту.') }
    catch { setNotice('Не удалось запустить микрофон. Попробуй ещё раз или введи ответ текстом.') }
  }
  const buyOutfit = (id:OutfitId,price:number) => {
    if(props.ownedOutfits.includes(id)) { props.setSelectedOutfit(id); setNotice('Образ изменён.'); return }
    if(props.cash<price) { setNotice('Не хватает денег. Сначала заработай на переговорах.'); return }
    props.setCash(v=>v-price); props.setOwnedOutfits(v=>[...v,id]); props.setSelectedOutfit(id); setNotice('Покупка разовая. Ежедневной аренды жилья в игре нет.')
  }
  const buyBusinessUpgrade = (id:string) => {
    const upgrade = BUSINESS_UPGRADES.find(item => item.id === id)
    if (!upgrade || props.businessUpgrades.includes(id)) return
    if (props.day < upgrade.minDay || props.reputation < upgrade.minReputation) { setNotice('Требуется день ' + upgrade.minDay + ' и репутация ' + upgrade.minReputation + '.'); return }
    if (props.cash < upgrade.price) { setNotice('Не хватает ' + money(upgrade.price - props.cash) + '.'); return }
    props.setCash(value => value - upgrade.price)
    props.setBusinessUpgrades(value => [...value, id])
    setNotice('Бизнес улучшен: ' + upgrade.name + '. Изменения действуют со следующего звонка.')
  }
  const buyBusinessAsset = (id:string) => {
    const asset = BUSINESS_ASSETS.find(item => item.id === id)
    if (!asset || props.ownedBusinessAssets.includes(id)) return
    if (props.day < asset.minDay || props.reputation < asset.minReputation) {
      setNotice('Для покупки нужны день ' + asset.minDay + ' и репутация ' + asset.minReputation + '.')
      return
    }
    if (asset.prerequisite && !props.ownedBusinessAssets.includes(asset.prerequisite)) {
      const previous = BUSINESS_ASSETS.find(item => item.id === asset.prerequisite)
      setNotice('Сначала открой предыдущий этап: ' + (previous?.name ?? 'предыдущий актив') + '.')
      return
    }
    if (props.cash < asset.price) {
      setNotice('Не хватает ' + money(asset.price - props.cash) + '. Не трать резерв — накопи на актив.')
      return
    }
    props.setCash(value => value - asset.price)
    props.setOwnedBusinessAssets(value => [...value, id])
    setNotice('Приобретено: ' + asset.name + '. Чистый доход ' + money(asset.dailyRevenue - asset.dailyCost) + ' начислится после следующего сна.')
  }
  const hireBroker = (id:string) => {
    const employee = BROKER_HIRES.find(item => item.id === id)
    if (!employee || props.ownedEmployees.includes(id)) return
    const officeOpen = props.ownedBusinessAssets.some(assetId => ['broker-team','city-agency','national-network'].includes(assetId))
    const capacity = officeOpen ? 5 : 1
    if (!officeOpen && !props.ownedItems.includes('second-desk')) { setNotice('Сначала купи второй рабочий стол для квартиры.'); return }
    if (props.ownedEmployees.length >= capacity) { setNotice(officeOpen ? 'В этом офисе уже заняты все 5 рабочих мест.' : 'В квартире помещается только один дополнительный брокер. Купи офис, чтобы расширить команду до пяти сотрудников.'); return }
    if (props.day < employee.minDay || props.reputation < employee.minReputation) { setNotice('Для найма нужны день ' + employee.minDay + ' и репутация ' + employee.minReputation + '.'); return }
    if (props.cash < employee.price) { setNotice('Не хватает ' + money(employee.price - props.cash) + ' на найм.'); return }
    props.setCash(value => value - employee.price)
    props.setOwnedEmployees(value => [...value, id])
    setNotice('В команду принят сотрудник: ' + employee.name + '. Зарплата автоматически вычитается из его выручки; фирме начисляется только чистый остаток +' + money(employee.dailyRevenue - employee.dailySalary) + '.')
  }
  const buyGear = (id:string,price:number) => {
    if(props.ownedItems.includes(id)) { setNotice('Уже куплено.'); return }
    if(props.cash<price) { setNotice('Не хватает денег.'); return }
    props.setCash(v=>v-price); props.setOwnedItems(v=>[...v,id]); setNotice('Куплено навсегда. Ежедневной аренды жилья в игре нет.')
  }
  const nav: {id:AppId;label:string;icon:typeof Laptop}[] = [
    {id:'home',label:'Рабочий стол',icon:Laptop},{id:'calls',label:'Брокерская линия',icon:PhoneCall},{id:'market',label:'Биржа',icon:TrendingUp},{id:'business',label:'Развитие бизнеса',icon:Building2},
    {id:'clients',label:'Клиентская база',icon:Users},{id:'wardrobe',label:'Гардероб',icon:ShoppingBag},{id:'equipment',label:'Оборудование',icon:Video},{id:'tasks',label:'Задачи',icon:Check},{id:'housing',label:'Жильё',icon:House}
  ]
  const careerStages = [
    {name:'Стажёр',min:0,next:100,goal:'Закрой первые сделки и собери базовый комплект связи.'},
    {name:'Младший брокер',min:100,next:300,goal:'Открой больше контактов и научись объяснять риск с планом выхода.'},
    {name:'Самостоятельный брокер',min:300,next:700,goal:'Работай с более крупными клиентами; репутация важнее дорогого костюма.'},
    {name:'Старший брокер',min:700,next:1500,goal:'Поддерживай качество переговоров и расширяй сеть рекомендаций.'},
    {name:'Партнёр',min:1500,next:1500,goal:'Ты достиг верхнего карьерного ранга. Теперь цель — стабильно закрывать сложные сделки.'}
  ]
  const career = [...careerStages].reverse().find(stage=>props.xp>=stage.min) ?? careerStages[0]
  const nextCareer = careerStages[careerStages.indexOf(career)+1]
  const careerProgress = nextCareer ? Math.max(0,Math.min(100,Math.round((props.xp-career.min)/(nextCareer.min-career.min)*100))) : 100
  const nextBusinessAsset = BUSINESS_ASSETS.find(asset => !props.ownedBusinessAssets.includes(asset.id))
  const currentBusinessNetIncome = getBusinessDailyNetIncome(props.ownedBusinessAssets)
  const currentStaffNetIncome = getStaffDailyNetIncome(props.ownedEmployees)
  const staffCapacity = props.ownedBusinessAssets.some(id => ['broker-team','city-agency','national-network'].includes(id)) ? 5 : 1
  const nextUpgrade = GEAR.find(item=>!props.ownedItems.includes(item.id))
  const title = nav.find(n=>n.id===activeApp)?.label ?? 'Рабочий стол'
  return <div className="arena-os-v2">
    <header className="arena-os-topbar"><button className="arena-os-back" onClick={props.onClose}>‹ В комнату</button><div className="arena-os-brand"><span className="arena-os-mark">A</span><span><b>ARENA OS</b><small>Персональная рабочая станция</small></span></div><div className="arena-os-system-status"><i/> Система готова <span>·</span> <Clock3 size={14}/> День {props.day}</div><button className="arena-os-close" onClick={props.onClose} aria-label="Закрыть ОС"><X size={17}/></button></header>
    <div className="arena-os-desktop">
      <div className="arena-os-desktop-icons">
        {nav.map(item=>{const Icon=item.icon;return <button key={item.id} className={'arena-os-desktop-icon '+(activeApp===item.id?'selected':'')} onDoubleClick={()=>{setActiveApp(item.id);setWindowOpen(true);setWindowMinimized(false)}} onClick={()=>setActiveApp(item.id)}><span className={'arena-os-app-icon '+item.id}><Icon size={23}/></span><span>{item.label}</span></button>})}
      </div>
      {windowOpen && <main className={'arena-os-window '+(windowMaximized?'maximized':'restored')+(windowMinimized?' minimized':'')}>
        <div className="arena-os-window-title"><div><span className={'arena-os-app-icon mini '+activeApp}>{(()=>{const I=nav.find(n=>n.id===activeApp)?.icon??Laptop;return <I size={15}/>})()}</span><b>{title}</b></div><div className="arena-os-window-controls"><button title="Свернуть" onClick={()=>setWindowMinimized(true)}>−</button><button title={windowMaximized?"Восстановить":"Развернуть"} onClick={()=>setWindowMaximized(v=>!v)}>{windowMaximized?"❐":"□"}</button><button title="Закрыть окно" onClick={()=>{setWindowOpen(false);setWindowMinimized(false)}}>×</button></div></div>
        <div className="arena-os-window-content">
          {activeApp==='home' && <section className="arena-os-home"><div className="arena-os-welcome"><div><span className="arena-os-kicker">БРОКЕРСКИЙ ПУЛЬТ · СМЕНА {props.day}</span><h1>Добро пожаловать в Arena.</h1><p>Звони клиентам, разбирай компании, зарабатывай комиссию и вкладывай её в образ и качество связи. Зарабатывай на переговорах, а затем вкладывай прибыль в активы фирмы. Жильё покупается один раз; главная цель — построить брокерскую сеть.</p><button className="arena-os-primary" onClick={()=>{setActiveApp('calls');if(callState!=='active'){setIncoming(false);try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{}}}}><PhoneCall size={17}/> Открыть линию <ChevronRight size={16}/></button></div><div className="arena-os-home-avatar"><BrokerAvatar3D identity="player" outfit={props.selectedOutfit}/><span className="arena-os-avatar-caption">ТВОЙ ОБРАЗ · {OUTFITS.find(o=>o.id===props.selectedOutfit)?.name}</span></div></div><div className="arena-os-stat-grid"><article><Wallet/><small>Личные средства</small><strong>{money(props.cash)}</strong></article><article><ShieldCheck/><small>Репутация</small><strong>{props.reputation}/100</strong></article><article><Sparkles/><small>Опыт</small><strong>{props.xp} XP</strong></article><article><Activity/><small>Сделки в этой сессии</small><strong>{completed}</strong></article></div><div className="arena-os-section-heading"><div><span className="arena-os-kicker">БЫСТРЫЙ ДОСТУП</span><h2>Что делаем сегодня?</h2></div></div><div className="arena-os-quick-grid"><button onClick={()=>setActiveApp('market')}><TrendingUp/><b>Изучить акции</b><small>Плюсы, риски и подходящие клиенты</small></button><button onClick={()=>setActiveApp('clients')}><Users/><b>Найти клиента</b><small>{unlockedClients.length} доступно сейчас</small></button><button onClick={()=>setActiveApp('wardrobe')}><ShoppingBag/><b>Обновить образ</b><small>Внешний вид влияет на первое впечатление</small></button></div><section className="arena-os-economy-roadmap"><div className="arena-os-economy-main"><span className="arena-os-kicker">КАРЬЕРА И ЭКОНОМИКА</span><h2>{career.name}</h2><p>{career.goal}</p><div className="arena-os-career-track"><div><span>Прогресс по опыту</span><b>{props.xp} XP{nextCareer? ' / '+nextCareer.min+' XP':' · максимум'}</b></div><div className="arena-os-progress"><i style={{width:careerProgress+'%'}}/></div></div><small>{nextCareer?'Следующий ранг: '+nextCareer.name+'. Прогресс открывает карьерные этапы, а репутация и день определяют доступ к клиентам.':'Верхний ранг достигнут — сосредоточься на сложных клиентах и качестве сделок.'}</small></div><div className="arena-os-economy-next"><span className="arena-os-kicker">СЛЕДУЮЩАЯ ПОКУПКА</span>{nextUpgrade?<><b>{nextUpgrade.name}</b><p>{nextUpgrade.desc}</p><strong>{money(nextUpgrade.price)}</strong><small>{props.cash>=nextUpgrade.price?'Денег хватает. Улучшение покупается один раз.':'Не хватает '+money(nextUpgrade.price-props.cash)+'. Заработай на сделках; ежедневных платежей нет.'}</small><button className="arena-os-secondary" onClick={()=>setActiveApp('equipment')}>Сравнить оборудование</button></>:<><b>Базовый комплект собран</b><p>Дальше накопи на деловой образ или партнёрский костюм — это дополнительный бонус к первому впечатлению, но не замена аргументам.</p><button className="arena-os-secondary" onClick={()=>setActiveApp('wardrobe')}>Открыть гардероб</button></>}</div></section><div className="arena-os-empire-goal"><span className="arena-os-kicker">ГЛАВНАЯ ЦЕЛЬ · РАЗВИТИЕ ФИРМЫ</span><h3>{nextBusinessAsset ? 'Следующий этап: ' + nextBusinessAsset.name : 'Федеральная сеть построена'}</h3><p>{nextBusinessAsset ? 'Цель стоит ' + money(nextBusinessAsset.price) + '. Требования: день ' + nextBusinessAsset.minDay + ' и репутация ' + nextBusinessAsset.minReputation + '. Текущий чистый доход фирмы: ' + money(currentBusinessNetIncome) + '/день. Закрывай сделки, откладывай прибыль и покупай активы по порядку — так доход со временем перестанет зависеть только от твоих звонков.' : 'Фирма приносит ' + money(currentBusinessNetIncome) + '/день чистыми. Дальше можно накапливать личное состояние и улучшать образ жизни.'}</p><button className="arena-os-secondary" onClick={()=>setActiveApp('business')}>Управлять фирмой <ChevronRight size={15}/></button></div></section>}
          {activeApp==='market' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РЫНОЧНЫЙ ТЕРМИНАЛ</span><h1>Каталог акций</h1><p>У каждой идеи есть сильные стороны и неудобные вопросы. Подбирай продукт под клиента, а не наоборот.</p></div><label className="arena-os-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Тикер или компания"/></label></div><div className="arena-os-stock-grid">{STOCKS.filter(s=>(s.name+' '+s.ticker).toLowerCase().includes(query.toLowerCase())).map(s=><article className="arena-os-stock-card" key={s.ticker}><div className="arena-os-stock-top"><span className="arena-os-ticker">{s.ticker}</span><span className={'arena-os-risk '+s.risk}>{s.risk} риск</span></div><h3>{s.name}</h3><strong className="arena-os-stock-price">{money(s.price)}</strong><div className="arena-os-pros"><b>Потенциал</b><p>{s.upside}</p></div><div className="arena-os-cons"><b>Что может пойти не так</b><p>{s.downside}</p></div><small>{s.fit}</small><button className="arena-os-secondary" onClick={()=>{setActiveStock(s);setActiveApp('calls');setWindowOpen(true);setWindowMinimized(false);setStockPicker(false);setNotice('Акция выбрана для обсуждения. Выбери клиента и начни звонок.') }}>Выбрать для переговоров <ChevronRight size={15}/></button></article>)}</div></section>}
          {activeApp==='calls' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">БРОКЕРСКАЯ ЛИНИЯ</span><h1>{callState==='active'?'Видеозвонок с клиентом':callState==='won'?'Сделка закрыта':callState==='lost'?'Звонок завершён':'Клиентская линия'}</h1><p>Клиент оценивает не только акцию, но и то, насколько честно ты говоришь о рисках.</p></div><span className={'arena-os-call-status '+callState}>{callState==='active'?'● В ЭФИРЕ':callState==='won'?'✓ УСПЕХ':callState==='lost'?'● ЗАВЕРШЁН':'● ГОТОВ'}</span></div>
            {callState!=='active' && <div className="arena-os-call-start"><div className="arena-os-client-list">{unlockedClients.slice(0,8).map(c=><button key={c.id} className={'arena-os-client-row '+(clientId===c.id?'active':'')} onClick={()=>setClientId(c.id)}><span className="arena-os-client-avatar"><ClientAvatar2D tier={c.tier} identity={c.id} mood="neutral"/></span><span><b>{c.name}</b><small>{c.profession}</small><em>{c.temperament} · капитал {money(c.budget)}</em></span><ChevronRight size={16}/></button>)}</div><div className="arena-os-call-preview"><div className="arena-os-preview-face"><ClientAvatar2D tier={client.tier} identity={client.id} mood="skeptical"/></div><span className="arena-os-kicker">ВХОДЯЩИЙ КЛИЕНТ</span><h2>{client.name}</h2><p>{client.quote}</p><div className="arena-os-tags"><span>Уровень {client.tier}</span><span>{client.experience}</span><span>{client.temperament}</span></div><button className="arena-os-primary" onClick={()=>startCall(client.id)}><PhoneCall size={17}/> Принять звонок</button></div></div>}
            {callState==='active' && <div className="arena-os-live-call"><div className="arena-os-call-video"><div className="arena-os-video-tile"><span>КЛИЕНТ · {client.name}</span><ClientAvatar2D tier={client.tier} identity={client.id} mood={trust>65?'interested':trust<30?'angry':'skeptical'}/></div><div className="arena-os-video-tile self"><span>ВАША КАМЕРА</span><BrokerAvatar3D identity="player" outfit={props.selectedOutfit} compact/><small>{props.ownedItems.includes('camera')?'HD-камера':'Встроенная камера'} · {props.ownedItems.includes('mic')?'USB-микрофон':'Встроенный микрофон'}</small></div></div><div className="arena-os-call-metrics"><div><span>Вероятность сделки</span><b>{lastChance||chance}%</b><div className="arena-os-progress"><i style={{width:(lastChance||chance)+'%'}}/></div><small>{qualityPenalty>0?'Слабое оборудование снижает первое впечатление. ':'Оборудование в порядке. '}{client.tier>=3?'Клиент требовательный: сначала докажи компетентность.':'Подстрой аргументы под цель клиента.'}</small></div><div><span>Доверие</span><b>{trust}/100</b><div className="arena-os-progress trust"><i style={{width:trust+'%'}}/></div></div><div><span>Терпение</span><b>{patience}/100</b><div className="arena-os-progress patience"><i style={{width:patience+'%'}}/></div></div></div>
              <div className="arena-os-dialogue"><div className="arena-os-dialogue-log" ref={dialogueLogRef}>{callLog.slice(-12).map((line,i)=>{const mine=line.startsWith('Ты:');const system=line.startsWith('СДЕЛКА')||line.startsWith('Клиент завершил');const body=line.startsWith(client.name+':')?line.slice(client.name.length+1).trim():line.replace(/^(Ты:|СДЕЛКА ЗАКРЫТА\.|Клиент завершил звонок\.)\s*/,'');return <div key={i} className={'arena-os-chat-row '+(mine?'mine':system?'system':'theirs')}>{!mine&&!system&&<span className="arena-os-chat-avatar">{client.initials}</span>}<div className={'arena-os-chat-bubble '+(mine?'player-line':system?'system-line':'client-line')}><small>{mine?'Вы':system?'Итог системы':client.name}</small><p>{body||line}</p><time>{new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time></div></div>})}</div>
                {stockPicker || !activeStock ? <div className="arena-os-stock-picker"><b>Клиент заинтересовался идеей. Выбери акцию и изучи аргументы.</b><div className="arena-os-stock-picker-grid">{STOCKS.map(s=><button key={s.ticker} onClick={()=>chooseStock(s)}><b>{s.name}</b><small>{s.ticker} · риск {s.risk.toLowerCase()}</small></button>)}</div></div> : <div className="arena-os-argument-panel"><div className="arena-os-stock-dossier"><b>{activeStock.name} · {activeStock.ticker}</b><p><strong>Потенциал:</strong> {activeStock.upside}</p><p><strong>Финансы:</strong> {activeStock.financials}</p><p><strong>Катализатор:</strong> {activeStock.catalyst}</p><p><strong>Риск:</strong> {activeStock.downside}</p><p><strong>Красные флаги:</strong> {activeStock.redFlags}</p><p><strong>Горизонт:</strong> {activeStock.horizon}</p><p><strong>Кому подходит:</strong> {activeStock.fit}</p></div><div className="arena-os-response-actions"><span>Выбери готовую реплику или напиши свою:</span><button onClick={()=>respond('free','У компании есть потенциал роста: '+activeStock.upside+' Но рост бизнеса не гарантирует рост котировки. Я бы проверял квартальную выручку и денежный поток, а если '+activeStock.redFlags.toLowerCase()+' начнут подтверждаться, пересмотрел бы рекомендацию.')}>У компании есть потенциал роста: {activeStock.upside} При этом я не обещаю доходность и предлагаю регулярно проверять отчётность и денежный поток.</button><button onClick={()=>respond('free','Главный риск по '+activeStock.name+': '+activeStock.downside+' Поэтому я не предлагаю вкладывать деньги, которые могут понадобиться в ближайшее время. Сначала определим допустимый убыток и долю капитала, а при ухудшении показателей сократим позицию.')}>Сначала о рисках: {activeStock.downside} Не будем вкладывать деньги, которые могут скоро понадобиться; заранее определим допустимый убыток и условие выхода.</button><button onClick={()=>respond('free','Предлагаю не принимать решение на эмоциях. Проверим '+activeStock.catalyst+' и отдельно следим за '+activeStock.redFlags.toLowerCase()+' Начнём с небольшой доли капитала, а через квартал сравним факты с тезисом. Если он не подтвердится, признаем ошибку и пересмотрим позицию.')}>План действий: проверяем {activeStock.catalyst} и следим за {activeStock.redFlags} Начинаем с ограниченной доли и пересматриваем решение по фактам.</button></div><form onSubmit={e=>{e.preventDefault();if(message.trim())respond('free',message)}} className="arena-os-free-text"><textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(message.trim())respond('free',message)}}} aria-label="Твой ответ клиенту" maxLength={900} placeholder="Ответь на вопрос клиента своими словами. Enter — отправить, Shift+Enter — новая строка…" rows={2} /><button type="button" className="arena-os-mic-button" onClick={startDictation}><Mic size={14}/> Диктовать</button><button type="submit" disabled={!message.trim()}>Отправить ответ</button></form><small>Ответ не выбирается из трёх реплик: пиши свободно. Клиент реагирует на смысл ответа, выбранную компанию, свою цель и отношение к риску. Это локальная игровая логика, не подключённая языковая модель.</small></div>}
              </div><button className="arena-os-hangup" onClick={()=>{setCallState('idle');setActiveStock(null);setStockPicker(false);setCallLog([])}}><X size={15}/> Завершить звонок</button></div>}
            {(callState==='won'||callState==='lost') && <div className="arena-os-call-result"><div className={'arena-os-result-icon '+(callState==='won'?'success':'failure')}>{callState==='won'?<Check size={24}/>:<X size={24}/>}</div><span className="arena-os-kicker">ИТОГ ПЕРЕГОВОРОВ</span><h2>{callState==='won'?'Клиент доволен сотрудничеством.':'Клиент пока не готов.'}</h2><p>{callState==='won'?'«Отлично, буду ещё к вам обращаться. Если появятся интересные предложения — пишите. Порекомендую вас знакомым».':'Сделки нет. Разбери возражения и попробуй снова — или подготовься лучше.'}</p><div className="arena-os-debrief"><b>Что произошло</b><p>Компания: {activeStock ? activeStock.name + ' (' + activeStock.ticker + ')' : 'не выбрана'} · Итог: {callState==='won'?'сделка закрыта': 'сделка не закрыта'}.</p><p>Доверие клиента: {trust}/100 · Терпение: {patience}/100 · Расчётная вероятность на последнем ходе: {lastChance || chance}%.</p><p>{callState==='won'?'Ты заработал комиссию, получил опыт и повысил репутацию. Следующая цель — удержать клиента и получить рекомендации.':'Проверь, на каком аргументе просело доверие. Перед повторным звонком изучи финансовые показатели, назови конкретный риск и предложи критерий, при котором пересмотришь рекомендацию.'}</p></div>{callState==='won' && !props.companyName.trim() && <form className="arena-os-firm-naming" onSubmit={event=>{event.preventDefault();const name=companyNameDraft.trim().slice(0,42);if(name){props.setCompanyName(name);setNotice('Поздравляем! Теперь ты развиваешь брокерскую фирму «'+name+'».')}}}><span className="arena-os-kicker">ТВОЯ ПЕРВАЯ СДЕЛКА · ТВОЙ БРЕНД</span><h3>«Как называется ваша фирма?»</h3><p>Клиент хочет сохранить контакт. Придумай название — серьёзное, смешное или совершенно абсурдное. Оно останется в сохранении и будет отображаться в ARENA OS.</p><input value={companyNameDraft} onChange={event=>setCompanyNameDraft(event.target.value)} maxLength={42} placeholder="Например, ООО «Бычий огурец»"/><button className="arena-os-primary" type="submit" disabled={!companyNameDraft.trim()}>Назвать фирму</button></form>}{callState==='won' && props.companyName.trim() && <div className="arena-os-firm-banner"><span className="arena-os-kicker">ТВОЯ БРОКЕРСКАЯ ФИРМА</span><strong>{props.companyName}</strong><p>Каждая следующая сделка строит репутацию твоего бренда.</p></div>}{callState==='won' && <div className="arena-os-payout-report"><div><small>ТВОЯ КОМИССИЯ</small><strong>+{money(lastPayout)}</strong></div><div><small>РЕПУТАЦИЯ</small><strong>+2</strong></div><div><small>ОПЫТ</small><strong>+45 XP</strong></div></div>}{callState==='won' && <div className="arena-os-contact-unlock"><Users size={20}/><div><b>Контакт сохранён: {lastContactName}</b><p>Открой «Клиентскую базу», чтобы увидеть контакты и новых знакомых. Успешные переговоры помогают расширять сеть рекомендаций.</p></div><button className="arena-os-secondary" onClick={()=>setActiveApp('clients')}>Открыть контакты</button></div>}<button className="arena-os-primary" onClick={()=>{setCallState('idle');setActiveStock(null);setCallLog([]);setActiveApp('calls')}}>Следующий клиент <ChevronRight size={16}/></button></div>}
          </section>}
          {activeApp==='clients' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">CRM · КЛИЕНТСКАЯ БАЗА</span><h1>Люди, а не кошельки</h1><p>У каждого клиента свои ожидания. Более высокий капитал не означает лёгкую сделку.</p></div><span className="arena-os-count">{unlockedClients.length} открыто / {CLIENTS.length}</span></div><div className="arena-os-all-clients">{CLIENTS.map(c=>{const open=newContacts.includes(c.id)||(c.minDay<=props.day&&c.minReputation<=props.reputation)||(props.businessUpgrades.includes('lead-network')&&c.minDay<=props.day+2&&c.minReputation<=props.reputation+10)||(props.businessUpgrades.includes('client-crm')&&c.minDay<=props.day+3&&c.minReputation<=props.reputation+15);return <article key={c.id} className={open?'':'locked'}><div className="arena-os-small-face"><ClientAvatar2D tier={c.tier} identity={c.id} mood="neutral"/></div><div><b>{open?c.name:'Закрытый контакт'}</b><small>{c.profession}</small><p>{open?c.goal:'Откроется на '+c.minDay+' дне при репутации '+c.minReputation+'.'}</p><span>{c.temperament} · {c.experience}</span></div><strong>{open?money(c.budget):<ShieldCheck size={17}/>}</strong><button disabled={!open} onClick={()=>{setClientId(c.id);setActiveApp('calls')}}>{open?'Выбрать':'Закрыт'}</button></article>})}</div></section>}
          {activeApp==='wardrobe' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ARENA STYLE</span><h1>Гардероб</h1><p>Покупаешь один раз. Образ меняет первое впечатление, но не заменяет компетентность.</p></div><span className="arena-os-count">Текущий образ: {OUTFITS.find(o=>o.id===props.selectedOutfit)?.name}</span></div><div className="arena-os-outfit-grid">{OUTFITS.map(o=><article key={o.id} className={props.selectedOutfit===o.id?'equipped':''}><div className="arena-os-outfit-preview"><BrokerAvatar3D identity="player" outfit={o.id}/></div><h3>{o.name}</h3><p>{o.desc}</p><div className="arena-os-item-foot"><b>{money(o.price)}</b><span>+{o.bonus} к первому впечатлению</span></div><button className={props.ownedOutfits.includes(o.id)?'arena-os-secondary':'arena-os-primary'} onClick={()=>buyOutfit(o.id,o.price)}>{props.selectedOutfit===o.id?'Надето':props.ownedOutfits.includes(o.id)?'Надеть': 'Купить один раз'}</button></article>)}</div></section>}
          {activeApp==='equipment' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РАБОЧЕЕ МЕСТО</span><h1>Оборудование</h1><p>Четыре осмысленных улучшения. Нет аренды, ежедневных счетов и бессмысленной мелочёвки.</p></div><span className="arena-os-count">Качество связи: {Math.max(0,100-qualityPenalty*4)}%</span></div><div className="arena-os-gear-grid">{GEAR.map(g=>{const owned=props.ownedItems.includes(g.id);return <article key={g.id} className={owned?'owned':''}><div className="arena-os-gear-art">{g.icon==='mic'?<Mic/>:g.icon==='camera'?<Video/>:g.icon==='background'?<House/>:g.icon==='desk'?<Building2/>:<Sparkles/>}</div><div><h3>{g.name}</h3><p>{g.desc}</p><span>+{g.bonus} к качеству переговоров</span></div><button disabled={owned} onClick={()=>buyGear(g.id,g.price)}>{owned?<><Check size={15}/> Куплено</>:<>Купить · {money(g.price)}</>}</button></article>})}</div><div className="arena-os-note"><ShieldCheck size={18}/><p>Владение жильём не создаёт ежедневных расходов. Деньги уходят только на выбранные покупки; заработок зависит от сделок, а не от ожидания таймера аренды.</p></div></section>}
          {activeApp==='business' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">МАСШТАБИРОВАНИЕ · БРОКЕРСКИЙ БИЗНЕС</span><h1>От одиночки к брокерской фирме</h1><p>Вкладывай заработанное в источники лидов, аналитику и клиентский сервис. Улучшения открывают больше возможностей, но не превращают каждую сделку в джекпот.</p></div><span className="arena-os-count">Улучшено: {props.businessUpgrades.length}/{BUSINESS_UPGRADES.length}</span></div><div className="arena-os-business-summary"><div><small>ЛИЧНЫЕ СРЕДСТВА</small><b>{money(props.cash)}</b></div><div><small>ЗВОНКОВ СЕГОДНЯ</small><b>{props.callsToday}/{dailyCallLimit}</b></div><div><small>ПОТОЛОК БОНУСА</small><b>{money(getBusinessPayoutCap(props.businessUpgrades))}</b></div></div><div className="arena-os-staff-section"><div className="arena-os-page-heading"><div><span className="arena-os-kicker">МАСШТАБИРОВАНИЕ · НАЙМ</span><h2>{props.companyName.trim() || 'Твоя брокерская фирма'} · Команда</h2><p>Купи второй стол, найми первого брокера и получай чистый ежедневный доход. Зарплата автоматически вычитается из его выручки: в твой баланс поступает только остаток. В квартире доступно 1 место для сотрудника; покупка «Команды брокеров» открывает офис на 5 мест.</p></div><span className="arena-os-count">Сотрудники: {props.ownedEmployees.length}/{staffCapacity}</span></div><div className="arena-os-staff-summary"><div><small>ВЫРУЧКА СОТРУДНИКОВ / ДЕНЬ</small><b>{money(BROKER_HIRES.filter(e=>props.ownedEmployees.includes(e.id)).reduce((sum,e)=>sum+e.dailyRevenue,0))}</b></div><div><small>ЗАРПЛАТЫ / ДЕНЬ</small><b>{money(BROKER_HIRES.filter(e=>props.ownedEmployees.includes(e.id)).reduce((sum,e)=>sum+e.dailySalary,0))}</b></div><div><small>ЧИСТЫЙ ДОХОД / ДЕНЬ</small><b>+{money(currentStaffNetIncome)}</b></div></div><div className="arena-os-staff-grid">{BROKER_HIRES.map(employee=>{const owned=props.ownedEmployees.includes(employee.id);const officeOpen=props.ownedBusinessAssets.some(id=>['broker-team','city-agency','national-network'].includes(id));const full=props.ownedEmployees.length>=staffCapacity;const deskNeeded=!officeOpen&&!props.ownedItems.includes('second-desk');const locked=props.day<employee.minDay||props.reputation<employee.minReputation;const affordable=props.cash>=employee.price;return <article key={employee.id} className={owned?'owned':''}><div className="arena-os-staff-avatar"><BrokerAvatar3D identity={employee.id} outfit={employee.id==='junior-broker'?'intern':employee.id==='team-lead'?'premium':'classic'}/></div><div className="arena-os-staff-copy"><h3>{employee.name}</h3><p>{employee.description}</p><div className="arena-os-asset-finances"><span>Выручка <b>{money(employee.dailyRevenue)}/день</b></span><span>Зарплата <b>{money(employee.dailySalary)}/день</b></span><strong>Чистыми <b>+{money(employee.dailyRevenue-employee.dailySalary)}/день</b></strong></div><small>{owned?'Работает в команде':deskNeeded?'Сначала купи второй рабочий стол':full?'Нет свободных рабочих мест':locked?'Откроется с '+employee.minDay+' дня при репутации '+employee.minReputation:affordable?'Можно нанять':'Не хватает '+money(employee.price-props.cash)}</small><button className={owned?'arena-os-secondary':'arena-os-primary'} disabled={owned||full||deskNeeded||locked||!affordable} onClick={()=>hireBroker(employee.id)}>{owned?'Нанят':deskNeeded?'Нужен второй стол':full?'Нужно больше места':locked?'Пока закрыт':affordable?'Нанять · '+money(employee.price):'Нужно накопить'}</button></div></article>})}</div></div><div className="arena-os-business-grid">{BUSINESS_UPGRADES.map((upgrade,index)=>{const owned=props.businessUpgrades.includes(upgrade.id);const locked=props.day<upgrade.minDay||props.reputation<upgrade.minReputation;const canAfford=props.cash>=upgrade.price;return <article key={upgrade.id} className={'arena-os-business-card'+(owned?' owned':'')}><div className="arena-os-business-icon">{index===0?<Users/>:index===1?<Activity/>:index===2?<TrendingUp/>:<Building2/>}<span>ЭТАП 0{index+1}</span></div><div className="arena-os-business-copy"><h3>{upgrade.name}</h3><p>{upgrade.description}</p><div className="arena-os-business-effect"><Check size={14}/><span>{upgrade.effect}</span></div><div className="arena-os-business-cap">Предел бонуса за сделку <b>{money(upgrade.payoutCap)}</b></div><small>{owned?'Улучшение установлено':locked?'Откроется с '+upgrade.minDay+' дня при репутации '+upgrade.minReputation:canAfford?'Доступно для покупки':'Не хватает '+money(upgrade.price-props.cash)}</small><button className={owned?'arena-os-secondary':'arena-os-primary'} disabled={owned||locked||!canAfford} onClick={()=>buyBusinessUpgrade(upgrade.id)}>{owned?'Установлено':locked?'Пока закрыто':canAfford?'Инвестировать · '+money(upgrade.price):'Нужно накопить'}</button></div></article>})}</div><div className="arena-os-note"><Building2 size={18}/><p>Улучшения помогают лично тебе закрывать сделки. Следующий уровень — покупать активы фирмы: они приносят регулярный доход, но требуют первоначальных вложений и ежедневных расходов.</p></div>
<div className="arena-os-empire">
  <div className="arena-os-page-heading"><div><span className="arena-os-kicker">ГЛАВНАЯ ЦЕЛЬ · СТРОЙ СВОЮ ФИРМУ</span><h2>От рабочего стола до брокерской сети</h2><p>Покупай активы по порядку. Каждый новый уровень открывает более крупный постоянный денежный поток. Доход зачисляется в личный баланс в начале нового дня.</p></div><span className="arena-os-count">Активов: {props.ownedBusinessAssets.length}/{BUSINESS_ASSETS.length}</span></div>
  <div className="arena-os-business-summary">
    <div><small>ЧИСТЫЙ ДОХОД ФИРМЫ / ДЕНЬ</small><b>{money(getBusinessDailyNetIncome(props.ownedBusinessAssets))}</b></div>
    <div><small>ВЫРУЧКА АКТИВОВ / ДЕНЬ</small><b>{money(BUSINESS_ASSETS.filter(a=>props.ownedBusinessAssets.includes(a.id)).reduce((s,a)=>s+a.dailyRevenue,0))}</b></div>
    <div><small>СОДЕРЖАНИЕ / ДЕНЬ</small><b>{money(BUSINESS_ASSETS.filter(a=>props.ownedBusinessAssets.includes(a.id)).reduce((s,a)=>s+a.dailyCost,0))}</b></div>
  </div>
  <div className="arena-os-business-grid">{BUSINESS_ASSETS.map((asset,index)=>{
    const owned=props.ownedBusinessAssets.includes(asset.id)
    const locked=props.day<asset.minDay||props.reputation<asset.minReputation
    const prerequisiteMissing=Boolean(asset.prerequisite&&!props.ownedBusinessAssets.includes(asset.prerequisite))
    const canAfford=props.cash>=asset.price
    const net=asset.dailyRevenue-asset.dailyCost
    return <article key={asset.id} className={'arena-os-business-card arena-os-asset-card'+(owned?' owned':'')}>
      <div className="arena-os-business-icon"><Building2/><span>ЭТАП 0{index+1}</span></div>
      <div className="arena-os-business-copy"><h3>{asset.name}</h3><p>{asset.description}</p>
      <div className="arena-os-asset-finances"><span>Доход <b>{money(asset.dailyRevenue)}/день</b></span><span>Расходы <b>{money(asset.dailyCost)}/день</b></span><strong>Чистыми <b>+{money(net)}/день</b></strong></div>
      <div className="arena-os-business-effect"><Check size={14}/><span>{asset.effect}</span></div>
      <small>{owned?'Актив работает и приносит доход':prerequisiteMissing?'Сначала купи предыдущий этап':locked?'Откроется с '+asset.minDay+' дня при репутации '+asset.minReputation:canAfford?'Можно приобрести':'Не хватает '+money(asset.price-props.cash)}</small>
      <button className={owned?'arena-os-secondary':'arena-os-primary'} disabled={owned||locked||prerequisiteMissing||!canAfford} onClick={()=>buyBusinessAsset(asset.id)}>{owned?'Работает · куплено':locked?'Пока закрыто':prerequisiteMissing?'Нужен предыдущий этап':canAfford?'Купить актив · '+money(asset.price):'Нужно накопить'}</button>
      </div>
    </article>
  })}</div>
  <div className="arena-os-empire-goal"><span className="arena-os-kicker">ДОЛГОСРОЧНАЯ ЦЕЛЬ</span><h3>{props.ownedBusinessAssets.includes('national-network')?'Ты построил федеральную брокерскую сеть':'Следующая цель: '+(BUSINESS_ASSETS.find(a=>!props.ownedBusinessAssets.includes(a.id))?.name??'Федеральная сеть')}</h3><p>{props.ownedBusinessAssets.includes('national-network')?'Теперь заработок позволяет содержать большую фирму, улучшать жильё и собирать личное состояние.':'Сделки дают стартовый капитал. Активы создают регулярный доход. Этот доход помогает оплатить команду, жильё и следующий этап расширения — так ты перестаёшь зависеть только от собственных звонков.'}</p></div>
</div></section>}
          {activeApp==='housing' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">КАРЬЕРА · НОВЫЙ УРОВЕНЬ</span><h1>Жильё и рабочая среда</h1><p>Переезд мгновенно меняет локацию. Комфорт помогает сохранять терпение клиента, а первое впечатление влияет на доверие; жильё покупается один раз и не создаёт ежедневной аренды.</p></div><span className="arena-os-count">Сейчас: {currentHousing.name}</span></div><div className="arena-os-housing-grid">{HOUSING.map((home,index)=>{const current=home.id===props.housingId;const locked=props.day<home.minDay||props.reputation<home.minReputation;const canAfford=props.cash>=home.price;return <article key={home.id} className={'arena-os-housing-card'+(current?' current':'')}><div className={'arena-os-housing-art housing-art-'+home.id}><House size={30}/><span>УРОВЕНЬ {index+1}</span></div><div className="arena-os-housing-copy"><h3>{home.name}</h3><p>{home.description}</p><div className="arena-os-housing-stats"><span>Комфорт <b>+{home.comfort}</b></span><span>Первое впечатление <b>{home.firstImpression>0?'+':''}{home.firstImpression}</b></span></div><strong className="arena-os-housing-price">{home.price===0?'Стартовое жильё':money(home.price)}</strong><small>{current?'Ты уже здесь':locked?'Откроется на '+home.minDay+' дне при репутации '+home.minReputation+'.':canAfford?'Можно переехать сейчас':'Не хватает '+money(home.price-props.cash)}</small><button className={current?'arena-os-secondary':'arena-os-primary'} disabled={current||locked||!canAfford} onClick={()=>{if(current||locked||!canAfford)return;props.setCash(value=>value-home.price);props.setHousingId(home.id);setNotice('Переезд оформлен. Сейчас ты автоматически переместишься в новое жильё.')}}>{current?'Текущее жильё':locked?'Пока закрыто':canAfford?'Переехать':'Нужно накопить'}</button></div></article>})}</div><div className="arena-os-note"><House size={18}/><p>Текущее жильё: <b>{currentHousing.name}</b>. Его влияние на первое впечатление учитывается в переговорах. После закрытия ARENA OS увидишь соответствующий интерьер комнаты. Покупка списывает цену переезда один раз. Ежедневной аренды нет: деньги нужны для оборудования и расширения фирмы.</p></div></section>}
          {activeApp==='tasks' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ПЛАН СМЕНЫ</span><h1>Твои задачи</h1><p>Подготовка помогает закрывать сделки. Не продавай то, что не можешь объяснить.</p></div></div><div className="arena-os-task-list"><article><Check/><div><b>Изучи хотя бы одну компанию</b><p>Открой биржевой каталог и прочитай плюсы и минусы выбранной акции.</p></div><button onClick={()=>setActiveApp('market')}>Открыть биржу</button></article><article><PhoneCall/><div><b>Проведи переговоры</b><p>Успех зависит от доверия, репутации, оборудования и того, насколько честно ты объясняешь риск.</p></div><button onClick={()=>setActiveApp('calls')}>Клиенты</button></article><article><ShoppingBag/><div><b>Инвестируй в себя</b><p>Покупки разовые. Улучшения помогают, но не превращают требовательного клиента в лёгкую добычу.</p></div><button onClick={()=>setActiveApp('equipment')}>Оборудование</button></article></div></section>}
        </div>
        <footer className="arena-os-taskbar"><button className={'arena-os-start '+(startMenuOpen?'active':'')} onClick={()=>setStartMenuOpen(v=>!v)} aria-label="Открыть меню Пуск">⊞</button><span className="arena-os-taskbar-label">АРЕНА ОС</span>{nav.filter(n=>n.id!=='home').map(n=>{const I=n.icon;return <button key={n.id} className={activeApp===n.id?'active':''} title={n.label} onClick={()=>{setActiveApp(n.id);setWindowOpen(true);setWindowMinimized(false)}}><I size={17}/></button>})}<span className="arena-os-taskbar-spacer"/>{soundPanelOpen && <div className="arena-os-volume-panel"><strong>Звук игры</strong><label>Общая громкость <b>{gameVolume}%</b></label><input type="range" min="0" max="100" value={gameVolume} onChange={e=>setGameVolume(Number(e.target.value))}/><small>Настройка сохраняется в этом браузере.</small></div>}<span className="arena-os-tray"><span className="arena-os-online-dot"/> <button className="arena-os-volume-toggle" onClick={()=>setSoundPanelOpen(v=>!v)} aria-label="Настроить громкость" title="Громкость игры">🔊</button><Clock3 size={14}/><b>{clockNow.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</b></span></footer>
      </main>}
    </div>
    {startMenuOpen && <div className="arena-os-start-menu"><div className="arena-os-start-menu-heading"><span className="arena-os-mark">A</span><div><b>ARENA OS</b><small>Рабочая станция</small></div></div><div className="arena-os-start-menu-grid">{nav.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setActiveApp(item.id);setStartMenuOpen(false);setWindowOpen(true);setWindowMinimized(false)}}><span className={'arena-os-app-icon '+item.id}><Icon size={19}/></span><span>{item.label}</span></button>})}</div><div className="arena-os-start-menu-footer"><span>День {props.day} · {money(props.cash)}</span><button onClick={props.onClose}>Выйти из системы</button></div></div>}
    {notice && <div className="arena-os-toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {incoming && <div className="arena-os-incoming-backdrop"><section className="arena-os-incoming-modal"><div className="arena-os-incoming-icon"><PhoneCall size={25}/></div><span className="arena-os-kicker">БРОКЕРСКАЯ ЛИНИЯ · ВХОДЯЩИЙ ЗВОНОК</span><h2>Тебе звонят.</h2><p>Первый клиент уже на линии. Прими вызов, оцени ситуацию и выбери акцию, которую сможешь защитить аргументами.</p><div className="arena-os-incoming-client"><div className="arena-os-incoming-face"><ClientAvatar2D tier={0} identity="alex-vorontsov" mood="neutral"/></div><div><b>{(CLIENTS.find(c=>c.id==='alex-vorontsov')??CLIENTS[0]).name}</b><small>Первичный контакт · потенциальный клиент</small></div><span className="arena-os-ringing">● ● ●</span></div><button className="arena-os-primary" onClick={()=>{setIncoming(false);setActiveApp('calls');setWindowOpen(true);setWindowMinimized(false);startCall('alex-vorontsov')}}><PhoneCall size={17}/> Принять вызов</button><button className="arena-os-incoming-dismiss" onClick={()=>{setIncoming(false);setActiveApp('calls');setWindowOpen(true);setWindowMinimized(false)}}>Открыть рабочий стол</button></section></div>}
  </div>
}
