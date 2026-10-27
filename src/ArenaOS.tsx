import './ArenaOS.css'
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Activity, TrendingUp, Check, ChevronRight, Clock3, House, Laptop, Mic,
  PhoneCall, Search, ShieldCheck, ShoppingBag, Sparkles, Users,
  Video, Wallet, X
} from 'lucide-react'
import { CLIENTS, type ClientProfile } from './game/economy'
import ClientAvatar2D from './ClientAvatar2D'
import PixelAvatar from './PixelAvatar'
import { playSound } from './audio'

type OutfitId = 'intern' | 'classic' | 'premium'
type SpeechResultLike = { transcript: string }
type SpeechEventLike = { results: ArrayLike<ArrayLike<SpeechResultLike>> }
type SpeechRecognizerLike = {
  lang: string; interimResults: boolean; maxAlternatives: number
  onresult: ((event: SpeechEventLike) => void) | null
  onerror: (() => void) | null; onend: (() => void) | null
  start: () => void
}
type AppId = 'home' | 'calls' | 'market' | 'clients' | 'wardrobe' | 'equipment' | 'tasks'
type Stock = { ticker: string; name: string; price: number; risk: 'Низкий' | 'Средний' | 'Высокий'; upside: string; downside: string; fit: string }
type Props = {
  cash: number; setCash: Dispatch<SetStateAction<number>>
  reputation: number; setReputation: Dispatch<SetStateAction<number>>
  xp: number; setXp: Dispatch<SetStateAction<number>>
  day: number
  selectedOutfit: OutfitId; setSelectedOutfit: (v: OutfitId) => void
  ownedOutfits: OutfitId[]; setOwnedOutfits: Dispatch<SetStateAction<OutfitId[]>>
  ownedItems: string[]; setOwnedItems: Dispatch<SetStateAction<string[]>>
  onClose: () => void
  initialApp?: AppId
}

const STOCKS: Stock[] = [
  { ticker:'KTLT', name:'Котолёт', price:184, risk:'Высокий', upside:'Растущий рынок доставки товаров дронами и сильный спрос на автоматизацию.', downside:'Компания тратит деньги быстрее, чем превращает обещания в прибыль; регулятор может остановить часть полётов.', fit:'Подходит тем, кто готов к резким колебаниям и долгому горизонту.' },
  { ticker:'SBRX', name:'СберТехно', price:312, risk:'Средний', upside:'Стабильная клиентская база, регулярная выручка и инвестиции в цифровые сервисы.', downside:'Рост замедляется, а конкуренты давят на маржу.', fit:'Понятный компромисс между ростом и устойчивостью.' },
  { ticker:'NEFT', name:'СеверНефть', price:728, risk:'Средний', upside:'Денежный поток поддерживают экспорт и действующие производственные активы.', downside:'Зависимость от сырьевых цен, курса и ограничений на поставки.', fit:'Может подойти инвестору, который принимает цикличность сырьевого сектора.' },
  { ticker:'MEDX', name:'МедЭкспресс', price:496, risk:'Низкий', upside:'Спрос на медицинские услуги устойчив, компания расширяет сеть клиник.', downside:'Открытие новых центров дорого, а долги ограничивают скорость расширения.', fit:'Более защитный вариант, но низкий риск не означает отсутствие потерь.' },
  { ticker:'GROV', name:'ГроуМаркет', price:92, risk:'Высокий', upside:'Онлайн-торговля растёт, компания быстро привлекает новых покупателей.', downside:'Большие расходы на логистику и скидки съедают прибыль.', fit:'Для готовых следить за отчётностью и переносить волатильность.' },
  { ticker:'GRID', name:'Городские сети', price:67, risk:'Низкий', upside:'Регулируемая инфраструктура и предсказуемый спрос.', downside:'Тарифные решения и крупные капитальные затраты ограничивают рост.', fit:'Скорее история стабильности, чем быстрого удорожания.' },
  { ticker:'BYTE', name:'БайтСофт', price:251, risk:'Высокий', upside:'Новый продукт может резко увеличить продажи при успешном запуске.', downside:'Запуск ещё не доказал коммерческий успех; высокая оценка уже учитывает оптимизм.', fit:'Спекулятивная ставка на исполнение плана.' },
  { ticker:'LOGI', name:'ЛогистикПро', price:438, risk:'Средний', upside:'Контракты с крупными сетями и растущий объём доставки.', downside:'Топливо, зарплаты и простой транспорта могут снизить прибыль.', fit:'Умеренный вариант для инвестора, понимающего операционный бизнес.' }
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
  {id:'lamp',name:'Настольный свет',price:1800,desc:'Лицо видно, даже если переговоры затянулись до ночи.',bonus:2,icon:'light'}
]
const money = (n:number) => Math.round(n).toLocaleString('ru-RU') + ' ₽'

function evaluateFreeReply(text: string, client: ClientProfile, stock: Stock | null) {
  const s = text.toLowerCase()
  const hasRisk = /риск|долг|убыт|потер|волат|гарант|паден|комисс|минус|сниз|сценари|ликвид|ограничен|нестабиль|непредсказ|резерв|налог|просад|не обещ|не гарант/.test(s)
  const hasUpside = /рост|прибыл|выруч|спрос|контракт|потенциал|развити|дивиденд|рынок|продаж|расшир|драйвер|преимущ|долгосроч|план|увелич|клиент|проект|продукт/.test(s)
  const hasPlan = /если|когда|порог|лимит|доля|срок|пересмотр|стоп|выход|сравн|провер|отч[её]т|контрол|раздел|частями|резерв|диверсиф/.test(s)
  const hasQuestion = /\?|почему|как |сколько|что если|какой|какая|какие|когда|зачем/.test(s)
  const promises = /гарантирую|точно вырастет|без риска|не может упасть|железно|сто процентов|100\s*%|удвоим|верняк|беспроигрыш/.test(s)
  const nonsense = /котлет|инопланет|космос|мем|ляля|бред|единорог|попугай|магия|проклят|сатан|чёрн|черн|похорон|морг|кладбищ|труп|покойник/.test(s)
  const concrete = /\d|%|руб|₽|миллион|тысяч|срок|отч[её]т|выруч|долг|марж|прибыл|контракт/.test(s)
  const joke = /шут|ха-ха|хаха|юмор|мем|похорон|морг|кладбищ|труп|покойник|котол[её]т|золотой унитаз/.test(s)
  let delta = -3
  let reply = ''
  if (promises) {
    delta = -16
    reply = client.temperament.toLowerCase().includes('импульсив')
      ? '«Вот это “железно” меня и пугает. Последний человек с такой уверенностью продал мне NFT холодильника. Где реальные риски?»'
      : '«Слово “гарантирую” — красный флаг. Даже у похоронного бюро нет гарантированного числа клиентов. Переделайте ответ без обещаний доходности».'
  } else if (hasRisk && hasUpside && hasPlan) {
    delta = 12
    reply = client.tier >= 3
      ? '«Уже похоже на рабочий процесс: тезис, риск и условия пересмотра. Теперь покажите, какие факты подтвердят или опровергнут сценарий».'
      : '«Вот это разговор: не сказка про деньги из воздуха, а план с запасным выходом. Какие показатели проверяем первыми?»'
  } else if (hasRisk && hasUpside) {
    delta = 9
    reply = '«Наконец-то не презентация в стиле “ракета летит только вверх”. Назовите конкретный сигнал, после которого мы признаем, что ошиблись».'
  } else if (hasRisk && hasPlan) {
    delta = 8
    reply = '«Честность плюс план выхода — уже лучше половины брокеров из моего спам-фильтра. А за счёт чего идея вообще может заработать?»'
  } else if (hasRisk) {
    delta = 6
    reply = client.temperament.toLowerCase().includes('дотош')
      ? '«Риски перечислены. Теперь нужны цифры: комиссия, возможная просадка и срок, на который деньги могут быть заморожены».'
      : '«Спасибо, что не прячете минусы под ковёр. Но я позвонил не за некрологом компании: что у неё может получиться хорошо?»'
  } else if (hasUpside && hasPlan) {
    delta = 7
    reply = '«Есть идея и порядок действий. Но вы обошли неприятную часть — что конкретно может сломать ваш прогноз?»'
  } else if (hasUpside && concrete) {
    delta = 5
    reply = '«Аргумент уже не совсем из воздуха. А теперь проверим обратную сторону: что рынок может оценивать неправильно?»'
  } else if (joke && hasUpside) {
    delta = 3
    reply = '«Юмор засчитан. Если бизнес-модель не держится без панихиды, шутка будет за мой счёт. Теперь — реальные цифры».'
  } else if (nonsense || joke) {
    delta = -8
    reply = '«Я ценю чёрный юмор, но мои накопления пока не согласились стать главным героем анекдота. Вернёмся к компании и рискам».'
  } else if (hasQuestion) {
    delta = -1
    reply = '«Вы задаёте вопрос вместо ответа — дипломатично, но я нанял брокера, а не адвоката по уклонению от ответа. Объясните свою позицию».'
  } else {
    delta = -4
    reply = '«Звучит уверенно, но я не понял сути. Объясните простыми словами: почему именно эта компания, что может пойти не так и что будем делать при плохом сценарии?»'
  }
  if (stock && /конкур|клиент|продукт|спрос|контракт|выруч|рынок/.test(s) && hasUpside) delta += 1
  if (client.temperament.toLowerCase().includes('скептич') && !hasRisk) delta -= 2
  if (client.temperament.toLowerCase().includes('занят') && text.length > 280) {
    delta -= 2
    reply = '«Коротко, пожалуйста. У меня встреча через пять минут, а не аудиокнига на три тома. Главный риск и главный аргумент — в двух фразах».'
  }
  return { delta: Math.max(-18, Math.min(13, delta)), reply }
}

export default function ArenaOS(props: Props) {
  const [activeApp,setActiveApp] = useState<AppId>(props.initialApp ?? 'home')
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
  const [notice,setNotice] = useState('')
  const [query,setQuery] = useState('')
  const [lastChance,setLastChance] = useState(0)
  const [completed,setCompleted] = useState(0)
  const client = useMemo(() => (CLIENTS.find(c => c.id === clientId) ?? CLIENTS[0]) as ClientProfile,[clientId])
  const unlockedClients = useMemo(() => CLIENTS.filter(c => newContacts.includes(c.id) || (props.day >= 3 && c.minDay <= props.day && c.minReputation <= props.reputation)),[props.day,props.reputation,newContacts])
  const equipmentBonus = GEAR.filter(g => props.ownedItems.includes(g.id)).reduce((n,g)=>n+g.bonus,0)
  const outfitBonus = OUTFITS.find(o=>o.id===props.selectedOutfit)?.bonus ?? 0
  const qualityPenalty = (props.ownedItems.includes('mic')?0:8) + (props.ownedItems.includes('camera')?0:5) + (props.ownedItems.includes('backdrop')?0:3)
  const chance = Math.max(5,Math.min(92,Math.round(30 + trust*.48 + props.reputation*.12 + equipmentBonus + outfitBonus - qualityPenalty + (activeStock && activeStock.risk === 'Низкий' && client.tier >= 2 ? 4 : 0) - Math.max(0,client.tier-1)*9)))
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-last-app',activeApp) } catch {} },[activeApp])
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-contacts',JSON.stringify(newContacts)) } catch {} },[newContacts])
  useEffect(()=>{ setWindowMinimized(false) },[activeApp])
  useEffect(()=>{
    if (props.initialApp === 'wardrobe') return
    try { if (localStorage.getItem('arena-os-v2-first-call') === 'accepted') return } catch { /* allow tutorial without storage */ }
    const timer = window.setTimeout(() => setIncoming(true), 3000)
    return () => window.clearTimeout(timer)
  },[props.initialApp])
  useEffect(()=>{ if(incoming) playSound('ring') },[incoming])
  const startCall = (id=clientId) => {
    const selected = (CLIENTS.find(c=>c.id===id) ?? CLIENTS[0]) as ClientProfile
    setClientId(selected.id); setActiveStock(null); setStockPicker(true); setCallState('active')
    const starterTrust = Math.max(12,Math.min(66,selected.baseTrust - Math.max(0,selected.tier-1)*5 - Math.round(qualityPenalty*.45) + Math.round(props.reputation*.08)))
    setTrust(starterTrust); setPatience(selected.patience); setLastChance(0)
    const lines = [selected.name + ' подключился к звонку.']
    if (!props.ownedItems.includes('mic')) lines.push('Клиент: «У вас микрофон из коробки с лапшой? Половину фразы съедает шум».')
    if (!props.ownedItems.includes('camera')) lines.push('Клиент: «Картинка мыльная. Надеюсь, финансовые расчёты у вас в фокусе лучше».')
    if (!props.ownedItems.includes('backdrop')) lines.push('Клиент оглядывает комнату: «Фон атмосферный. Это офис или место преступления?»')
    lines.push(selected.quote)
    setCallLog(lines); setMessage(''); setActiveApp('calls')
  }
  const chooseStock = (stock:Stock) => {
    setActiveStock(stock); setStockPicker(false)
    const suitable = (client.tier <= 1 && stock.risk === 'Низкий') || (client.tier >= 3 && stock.risk === 'Высокий') || (client.tier === 2 && stock.risk === 'Средний')
    setCallLog(prev=>[...prev, 'Ты открываешь карточку '+stock.name+' ('+stock.ticker+').', client.name+': «'+(suitable?'Ладно, объясните, почему именно эта компания.':'Это соответствует моему отношению к риску? Сначала объясните, почему вы выбрали её.')+'»'])
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
    const newChance = Math.max(5,Math.min(92,Math.round(30+newTrust*.48+props.reputation*.12+equipmentBonus+outfitBonus-qualityPenalty-Math.max(0,client.tier-1)*9)))
    setLastChance(newChance)
    if(newTrust>=72 && Math.random()*100<newChance) {
      const payout = Math.max(1200,Math.round(client.ticket*(client.commissionRate+client.bonusRate*.25)))
      props.setCash(v=>v+payout); props.setReputation(v=>Math.min(100,v+2)); props.setXp(v=>v+45)
      setLastPayout(payout); setLastContactName(client.name)
      setNewContacts(prev=>Array.from(new Set([...prev,client.id,...(client.id==='alex-vorontsov'?['pavel-smirnov']:client.id==='maria-sokolova'?['natalia-orlova']:client.id==='pavel-smirnov'?['maksim-sobolev']:['igor-melnikov'])])))
      setCallState('won'); setCompleted(v=>v+1)
      setCallLog(prev=>[...prev,'СДЕЛКА ЗАКРЫТА. Комиссия: '+money(payout)+'. Клиент: «Отлично, буду обращаться к вам снова. Если появятся интересные предложения — пишите. И я порекомендую вас знакомым».'])
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
    props.setCash(v=>v-price); props.setOwnedOutfits(v=>[...v,id]); props.setSelectedOutfit(id); setNotice('Покупка совершена один раз. Ежедневной платы за жильё и обслуживание нет.')
  }
  const buyGear = (id:string,price:number) => {
    if(props.ownedItems.includes(id)) { setNotice('Уже куплено.'); return }
    if(props.cash<price) { setNotice('Не хватает денег.'); return }
    props.setCash(v=>v-price); props.setOwnedItems(v=>[...v,id]); setNotice('Куплено навсегда. Никаких ежедневных платежей.')
  }
  const nav: {id:AppId;label:string;icon:typeof Laptop}[] = [
    {id:'home',label:'Рабочий стол',icon:Laptop},{id:'calls',label:'Arena Connect',icon:PhoneCall},{id:'market',label:'Биржа',icon:TrendingUp},
    {id:'clients',label:'Клиентская база',icon:Users},{id:'wardrobe',label:'Гардероб',icon:ShoppingBag},{id:'equipment',label:'Оборудование',icon:Video},{id:'tasks',label:'Задачи',icon:Check}
  ]
  const title = nav.find(n=>n.id===activeApp)?.label ?? 'Рабочий стол'
  return <div className="arena-os-v2">
    <header className="arena-os-topbar"><button className="arena-os-back" onClick={props.onClose}>‹ В комнату</button><div className="arena-os-brand"><span className="arena-os-mark">A</span><span><b>ARENA OS</b><small>Персональная рабочая станция</small></span></div><div className="arena-os-system-status"><i/> Система готова <span>·</span> <Clock3 size={14}/> День {props.day}</div><button className="arena-os-close" onClick={props.onClose} aria-label="Закрыть ОС"><X size={17}/></button></header>
    <div className="arena-os-desktop">
      <div className="arena-os-desktop-icons">
        {nav.map(item=>{const Icon=item.icon;return <button key={item.id} className={'arena-os-desktop-icon '+(activeApp===item.id?'selected':'')} onDoubleClick={()=>setActiveApp(item.id)} onClick={()=>setActiveApp(item.id)}><span className={'arena-os-app-icon '+item.id}><Icon size={23}/></span><span>{item.label}</span></button>})}
      </div>
      <main className={'arena-os-window '+(windowMaximized?'maximized':'restored')+(windowMinimized?' minimized':'')}>
        <div className="arena-os-window-title"><div><span className={'arena-os-app-icon mini '+activeApp}>{(()=>{const I=nav.find(n=>n.id===activeApp)?.icon??Laptop;return <I size={15}/>})()}</span><b>{title}</b></div><div className="arena-os-window-controls"><button title="Свернуть" onClick={()=>setWindowMinimized(true)}>−</button><button title={windowMaximized?"Восстановить":"Развернуть"} onClick={()=>setWindowMaximized(v=>!v)}>{windowMaximized?"❐":"□"}</button><button title="Закрыть окно" onClick={()=>setActiveApp('home')}>×</button></div></div>
        <div className="arena-os-window-content">
          {activeApp==='home' && <section className="arena-os-home"><div className="arena-os-welcome"><div><span className="arena-os-kicker">БРОКЕРСКИЙ ПУЛЬТ · СМЕНА {props.day}</span><h1>Добро пожаловать в Arena.</h1><p>Звони клиентам, разбирай компании, зарабатывай комиссию и вкладывай её в образ и качество связи. Покупки разовые — ежедневной аренды и счетов нет.</p><button className="arena-os-primary" onClick={()=>{setActiveApp('calls');if(callState!=='active'){setIncoming(false);try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{}}}}><PhoneCall size={17}/> Открыть линию <ChevronRight size={16}/></button></div><div className="arena-os-home-avatar"><PixelAvatar outfit={props.selectedOutfit} mode="full"/></div></div><div className="arena-os-stat-grid"><article><Wallet/><small>Личные средства</small><strong>{money(props.cash)}</strong></article><article><ShieldCheck/><small>Репутация</small><strong>{props.reputation}/100</strong></article><article><Sparkles/><small>Опыт</small><strong>{props.xp} XP</strong></article><article><Activity/><small>Сделки в этой сессии</small><strong>{completed}</strong></article></div><div className="arena-os-section-heading"><div><span className="arena-os-kicker">БЫСТРЫЙ ДОСТУП</span><h2>Что делаем сегодня?</h2></div></div><div className="arena-os-quick-grid"><button onClick={()=>setActiveApp('market')}><TrendingUp/><b>Изучить акции</b><small>Плюсы, риски и подходящие клиенты</small></button><button onClick={()=>setActiveApp('clients')}><Users/><b>Найти клиента</b><small>{unlockedClients.length} доступно сейчас</small></button><button onClick={()=>setActiveApp('wardrobe')}><ShoppingBag/><b>Обновить образ</b><small>Внешний вид влияет на первое впечатление</small></button></div></section>}
          {activeApp==='market' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РЫНОЧНЫЙ ТЕРМИНАЛ</span><h1>Каталог акций</h1><p>У каждой идеи есть сильные стороны и неудобные вопросы. Подбирай продукт под клиента, а не наоборот.</p></div><label className="arena-os-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Тикер или компания"/></label></div><div className="arena-os-stock-grid">{STOCKS.filter(s=>(s.name+' '+s.ticker).toLowerCase().includes(query.toLowerCase())).map(s=><article className="arena-os-stock-card" key={s.ticker}><div className="arena-os-stock-top"><span className="arena-os-ticker">{s.ticker}</span><span className={'arena-os-risk '+s.risk}>{s.risk} риск</span></div><h3>{s.name}</h3><strong className="arena-os-stock-price">{money(s.price)}</strong><div className="arena-os-pros"><b>Потенциал</b><p>{s.upside}</p></div><div className="arena-os-cons"><b>Что может пойти не так</b><p>{s.downside}</p></div><small>{s.fit}</small><button className="arena-os-secondary" onClick={()=>{setActiveStock(s);setActiveApp('calls');setStockPicker(false);setNotice('Акция выбрана для обсуждения. Выбери клиента и начни звонок.') }}>Выбрать для переговоров <ChevronRight size={15}/></button></article>)}</div></section>}
          {activeApp==='calls' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ARENA CONNECT</span><h1>{callState==='active'?'Видеозвонок с клиентом':callState==='won'?'Сделка закрыта':callState==='lost'?'Звонок завершён':'Клиентская линия'}</h1><p>Клиент оценивает не только акцию, но и то, насколько честно ты говоришь о рисках.</p></div><span className={'arena-os-call-status '+callState}>{callState==='active'?'● В ЭФИРЕ':callState==='won'?'✓ УСПЕХ':callState==='lost'?'● ЗАВЕРШЁН':'● ГОТОВ'}</span></div>
            {callState!=='active' && <div className="arena-os-call-start"><div className="arena-os-client-list">{unlockedClients.slice(0,8).map(c=><button key={c.id} className={'arena-os-client-row '+(clientId===c.id?'active':'')} onClick={()=>setClientId(c.id)}><span className="arena-os-client-avatar"><ClientAvatar2D tier={c.tier} identity={c.id} mood="neutral"/></span><span><b>{c.name}</b><small>{c.profession}</small><em>{c.temperament} · капитал {money(c.budget)}</em></span><ChevronRight size={16}/></button>)}</div><div className="arena-os-call-preview"><div className="arena-os-preview-face"><ClientAvatar2D tier={client.tier} identity={client.id} mood="skeptical"/></div><span className="arena-os-kicker">ВХОДЯЩИЙ КЛИЕНТ</span><h2>{client.name}</h2><p>{client.quote}</p><div className="arena-os-tags"><span>Уровень {client.tier}</span><span>{client.experience}</span><span>{client.temperament}</span></div><button className="arena-os-primary" onClick={()=>startCall(client.id)}><PhoneCall size={17}/> Принять звонок</button></div></div>}
            {callState==='active' && <div className="arena-os-live-call"><div className="arena-os-call-video"><div className="arena-os-video-tile"><span>КЛИЕНТ · {client.name}</span><ClientAvatar2D tier={client.tier} identity={client.id} mood={trust>65?'interested':trust<30?'angry':'skeptical'}/></div><div className="arena-os-video-tile self"><span>ВАША КАМЕРА</span><PixelAvatar outfit={props.selectedOutfit} mode="full"/><small>{props.ownedItems.includes('camera')?'HD-камера':'Встроенная камера'} · {props.ownedItems.includes('mic')?'USB-микрофон':'Встроенный микрофон'}</small></div></div><div className="arena-os-call-metrics"><div><span>Вероятность сделки</span><b>{lastChance||chance}%</b><div className="arena-os-progress"><i style={{width:(lastChance||chance)+'%'}}/></div><small>{qualityPenalty>0?'Слабое оборудование снижает первое впечатление. ':'Оборудование в порядке. '}{client.tier>=3?'Клиент требовательный: сначала докажи компетентность.':'Подстрой аргументы под цель клиента.'}</small></div><div><span>Доверие</span><b>{trust}/100</b><div className="arena-os-progress trust"><i style={{width:trust+'%'}}/></div></div><div><span>Терпение</span><b>{patience}/100</b><div className="arena-os-progress patience"><i style={{width:patience+'%'}}/></div></div></div>
              <div className="arena-os-dialogue"><div className="arena-os-dialogue-log">{callLog.slice(-12).map((line,i)=>{const mine=line.startsWith('Ты:');const system=line.startsWith('СДЕЛКА')||line.startsWith('Клиент завершил');const body=line.replace(/^(Ты:|СДЕЛКА ЗАКРЫТА\.|Клиент завершил звонок\.)\s*/,'').replace(new RegExp('^'+client.name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\{callLog.slice(-8).map((line,i)=><p key={i} className={line.startsWith('Ты:')?'player-line':line.startsWith('СДЕЛКА')?'system-line':'client-line'}>{line}</p>)}')+':\\s*'),'');return <div key={i} className={'arena-os-chat-row '+(mine?'mine':system?'system':'theirs')}>{!mine&&!system&&<span className="arena-os-chat-avatar">{client.initials}</span>}<div className={'arena-os-chat-bubble '+(mine?'player-line':system?'system-line':'client-line')}><small>{mine?'Вы':system?'Итог системы':client.name}</small><p>{body||line}</p><time>{new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time></div></div>})}</div>
                {stockPicker || !activeStock ? <div className="arena-os-stock-picker"><b>Клиент заинтересовался идеей. Выбери акцию и изучи аргументы.</b><div className="arena-os-stock-picker-grid">{STOCKS.map(s=><button key={s.ticker} onClick={()=>chooseStock(s)}><b>{s.name}</b><small>{s.ticker} · риск {s.risk.toLowerCase()}</small></button>)}</div></div> : <div className="arena-os-argument-panel"><div><b>{activeStock.name} · {activeStock.ticker}</b><p><strong>Плюс:</strong> {activeStock.upside}</p><p><strong>Минус:</strong> {activeStock.downside}</p></div><div className="arena-os-response-actions"><span>Примеры формулировок — можно изменить под себя:</span><button onClick={()=>setMessage('У компании есть потенциал роста за счёт спроса и развития рынка, но это не гарантия доходности. Предлагаю следить за результатами и пересмотреть идею, если факты изменятся.')}>Объяснить стратегию</button><button onClick={()=>setMessage('Риск есть: цена может снизиться, а прогноз не сбыться. Я не обещаю доходность и предлагаю не вкладывать деньги, которые могут понадобиться в ближайшее время.')}>Обсудить риски</button><button onClick={()=>setMessage('Прежде чем рекомендовать покупку, давайте определим срок, допустимый убыток и долю капитала. Если компания не подтвердит ожидания, мы пересмотрим решение.')}>Предложить план</button></div><form onSubmit={e=>{e.preventDefault();respond('free',message)}} className="arena-os-free-text"><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Напиши что угодно своими словами — аргументы, вопросы, сомнения, даже шутку…" rows={2} /><button type="button" className="arena-os-mic-button" onClick={startDictation}><Mic size={14}/> Диктовать</button><button type="submit" disabled={!message.trim()}>Отправить</button></form><small>Ответ не выбирается из трёх реплик: пиши свободно. Локальный диалоговый движок оценивает смысловые признаки и контекст, но это ещё не подключённая языковая модель — он может ошибаться.</small></div>}
              </div><button className="arena-os-hangup" onClick={()=>{setCallState('idle');setActiveStock(null);setStockPicker(false);setCallLog([])}}><X size={15}/> Завершить звонок</button></div>}
            {(callState==='won'||callState==='lost') && <div className="arena-os-call-result"><div className={'arena-os-result-icon '+(callState==='won'?'success':'failure')}>{callState==='won'?<Check size={24}/>:<X size={24}/>}</div><span className="arena-os-kicker">ИТОГ ПЕРЕГОВОРОВ</span><h2>{callState==='won'?'Клиент доволен сотрудничеством.':'Клиент пока не готов.'}</h2><p>{callState==='won'?'«Отлично, буду ещё к вам обращаться. Если появятся интересные предложения — пишите. Порекомендую вас знакомым».':'Сделки нет. Разбери возражения и попробуй снова — или подготовься лучше.'}</p>{callState==='won' && <div className="arena-os-payout-report"><div><small>ТВОЯ КОМИССИЯ</small><strong>+{money(lastPayout)}</strong></div><div><small>РЕПУТАЦИЯ</small><strong>+2</strong></div><div><small>ОПЫТ</small><strong>+45 XP</strong></div></div>}{callState==='won' && <div className="arena-os-contact-unlock"><Users size={20}/><div><b>Контакт сохранён: {lastContactName}</b><p>Открой «Клиентскую базу», чтобы увидеть контакты и новых знакомых. Успешные переговоры помогают расширять сеть рекомендаций.</p></div><button className="arena-os-secondary" onClick={()=>setActiveApp('clients')}>Открыть контакты</button></div>}<button className="arena-os-primary" onClick={()=>{setCallState('idle');setActiveStock(null);setCallLog([]);setActiveApp('calls')}}>Следующий клиент <ChevronRight size={16}/></button></div>}
          </section>}
          {activeApp==='clients' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">CRM · КЛИЕНТСКАЯ БАЗА</span><h1>Люди, а не кошельки</h1><p>У каждого клиента свои ожидания. Более высокий капитал не означает лёгкую сделку.</p></div><span className="arena-os-count">{unlockedClients.length} открыто / {CLIENTS.length}</span></div><div className="arena-os-all-clients">{CLIENTS.map(c=>{const open=newContacts.includes(c.id)||(c.minDay<=props.day&&c.minReputation<=props.reputation);return <article key={c.id} className={open?'':'locked'}><div className="arena-os-small-face"><ClientAvatar2D tier={c.tier} identity={c.id} mood="neutral"/></div><div><b>{open?c.name:'Закрытый контакт'}</b><small>{c.profession}</small><p>{open?c.goal:'Откроется на '+c.minDay+' дне при репутации '+c.minReputation+'.'}</p><span>{c.temperament} · {c.experience}</span></div><strong>{open?money(c.budget):<ShieldCheck size={17}/>}</strong><button disabled={!open} onClick={()=>{setClientId(c.id);setActiveApp('calls')}}>{open?'Выбрать':'Закрыт'}</button></article>})}</div></section>}
          {activeApp==='wardrobe' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ARENA STYLE</span><h1>Гардероб</h1><p>Покупаешь один раз. Образ меняет первое впечатление, но не заменяет компетентность.</p></div><span className="arena-os-count">Текущий образ: {OUTFITS.find(o=>o.id===props.selectedOutfit)?.name}</span></div><div className="arena-os-outfit-grid">{OUTFITS.map(o=><article key={o.id} className={props.selectedOutfit===o.id?'equipped':''}><div className="arena-os-outfit-preview"><PixelAvatar outfit={o.id} mode="full"/></div><h3>{o.name}</h3><p>{o.desc}</p><div className="arena-os-item-foot"><b>{money(o.price)}</b><span>+{o.bonus} к первому впечатлению</span></div><button className={props.ownedOutfits.includes(o.id)?'arena-os-secondary':'arena-os-primary'} onClick={()=>buyOutfit(o.id,o.price)}>{props.selectedOutfit===o.id?'Надето':props.ownedOutfits.includes(o.id)?'Надеть': 'Купить один раз'}</button></article>)}</div></section>}
          {activeApp==='equipment' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РАБОЧЕЕ МЕСТО</span><h1>Оборудование</h1><p>Четыре осмысленных улучшения. Нет аренды, ежедневных счетов и бессмысленной мелочёвки.</p></div><span className="arena-os-count">Качество связи: {Math.max(0,100-qualityPenalty*4)}%</span></div><div className="arena-os-gear-grid">{GEAR.map(g=>{const owned=props.ownedItems.includes(g.id);return <article key={g.id} className={owned?'owned':''}><div className="arena-os-gear-art">{g.icon==='mic'?<Mic/>:g.icon==='camera'?<Video/>:g.icon==='background'?<House/>:<Sparkles/>}</div><div><h3>{g.name}</h3><p>{g.desc}</p><span>+{g.bonus} к качеству переговоров</span></div><button disabled={owned} onClick={()=>buyGear(g.id,g.price)}>{owned?<><Check size={15}/> Куплено</>:<>Купить · {money(g.price)}</>}</button></article>})}</div><div className="arena-os-note"><ShieldCheck size={18}/><p>Владение жильём не создаёт ежедневных расходов. Деньги уходят только на выбранные покупки; заработок зависит от сделок, а не от ожидания таймера аренды.</p></div></section>}
          {activeApp==='tasks' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ПЛАН СМЕНЫ</span><h1>Твои задачи</h1><p>Подготовка помогает закрывать сделки. Не продавай то, что не можешь объяснить.</p></div></div><div className="arena-os-task-list"><article><Check/><div><b>Изучи хотя бы одну компанию</b><p>Открой биржевой каталог и прочитай плюсы и минусы выбранной акции.</p></div><button onClick={()=>setActiveApp('market')}>Открыть биржу</button></article><article><PhoneCall/><div><b>Проведи переговоры</b><p>Успех зависит от доверия, репутации, оборудования и того, насколько честно ты объясняешь риск.</p></div><button onClick={()=>setActiveApp('calls')}>Клиенты</button></article><article><ShoppingBag/><div><b>Инвестируй в себя</b><p>Покупки разовые. Улучшения помогают, но не превращают требовательного клиента в лёгкую добычу.</p></div><button onClick={()=>setActiveApp('equipment')}>Оборудование</button></article></div></section>}
        </div>
        <footer className="arena-os-taskbar"><button className={'arena-os-start '+(startMenuOpen?'active':'')} onClick={()=>setStartMenuOpen(v=>!v)} aria-label="Открыть меню Пуск">⊞</button><span className="arena-os-taskbar-label">ARENA OS</span>{nav.filter(n=>n.id!=='home').map(n=>{const I=n.icon;return <button key={n.id} className={activeApp===n.id?'active':''} title={n.label} onClick={()=>{setActiveApp(n.id);setWindowMinimized(false)}}><I size={17}/></button>})}<span className="arena-os-taskbar-spacer"/><span className="arena-os-tray"><span className="arena-os-online-dot"/> Онлайн · {new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></footer>
      </main>
    </div>
    {startMenuOpen && <div className="arena-os-start-menu"><div className="arena-os-start-menu-heading"><span className="arena-os-mark">A</span><div><b>ARENA OS</b><small>Рабочая станция</small></div></div><div className="arena-os-start-menu-grid">{nav.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setActiveApp(item.id);setStartMenuOpen(false);setWindowMinimized(false)}}><span className={'arena-os-app-icon '+item.id}><Icon size={19}/></span><span>{item.label}</span></button>})}</div><div className="arena-os-start-menu-footer"><span>День {props.day} · {money(props.cash)}</span><button onClick={props.onClose}>Выйти из системы</button></div></div>}
    {notice && <div className="arena-os-toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {incoming && <div className="arena-os-incoming-backdrop"><section className="arena-os-incoming-modal"><div className="arena-os-incoming-icon"><PhoneCall size={25}/></div><span className="arena-os-kicker">ARENA CONNECT · ВХОДЯЩИЙ ЗВОНОК</span><h2>Тебе звонят.</h2><p>Первый клиент уже на линии. Прими вызов, оцени ситуацию и выбери акцию, которую сможешь защитить аргументами.</p><div className="arena-os-incoming-client"><div className="arena-os-incoming-face"><ClientAvatar2D tier={0} identity="alex-vorontsov" mood="neutral"/></div><div><b>{(CLIENTS.find(c=>c.id==='alex-vorontsov')??CLIENTS[0]).name}</b><small>Первичный контакт · потенциальный клиент</small></div><span className="arena-os-ringing">● ● ●</span></div><button className="arena-os-primary" onClick={()=>{setIncoming(false);try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{};startCall('alex-vorontsov')}}><PhoneCall size={17}/> Принять вызов</button><button className="arena-os-incoming-dismiss" onClick={()=>{setIncoming(false);setActiveApp('calls');try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{}}}>Открыть рабочий стол</button></section></div>}
  </div>
}
