import './ArenaOS.css'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity, TrendingUp, Check, ChevronRight, Clock3, House, Laptop, Mic,
  Newspaper, PhoneCall, Search, ShieldCheck, ShoppingBag, Sparkles, Users,
  Video, Wallet, X
} from 'lucide-react'
import { CLIENTS, type ClientProfile } from './game/economy'
import ClientAvatar2D from './ClientAvatar2D'
import PixelAvatar from './PixelAvatar'

type OutfitId = 'intern' | 'classic' | 'premium'
type AppId = 'home' | 'calls' | 'market' | 'clients' | 'wardrobe' | 'equipment' | 'tasks'
type Stock = { ticker: string; name: string; price: number; risk: 'Низкий' | 'Средний' | 'Высокий'; upside: string; downside: string; fit: string }
type Props = {
  cash: number; setCash: (v: number | ((p: number) => number)) => void
  reputation: number; setReputation: (v: number | ((p: number) => number)) => void
  xp: number; setXp: (v: number | ((p: number) => number)) => void
  day: number
  selectedOutfit: OutfitId; setSelectedOutfit: (v: OutfitId) => void
  ownedOutfits: OutfitId[]; setOwnedOutfits: (v: OutfitId[] | ((p: OutfitId[]) => OutfitId[])) => void
  ownedItems: string[]; setOwnedItems: (v: string[] | ((p: string[]) => string[])) => void
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

export default function ArenaOS(props: Props) {
  const [activeApp,setActiveApp] = useState<AppId>(props.initialApp ?? 'home')
  const [incoming,setIncoming] = useState(() => { try { return localStorage.getItem('arena-os-v2-first-call') !== 'accepted' } catch { return true } })
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
  const unlockedClients = useMemo(() => CLIENTS.filter(c => c.minDay <= props.day && c.minReputation <= props.reputation),[props.day,props.reputation])
  const equipmentBonus = GEAR.filter(g => props.ownedItems.includes(g.id)).reduce((n,g)=>n+g.bonus,0)
  const outfitBonus = OUTFITS.find(o=>o.id===props.selectedOutfit)?.bonus ?? 0
  const qualityPenalty = (props.ownedItems.includes('mic')?0:8) + (props.ownedItems.includes('camera')?0:5) + (props.ownedItems.includes('backdrop')?0:3)
  const chance = Math.max(5,Math.min(92,Math.round(30 + trust*.48 + props.reputation*.12 + equipmentBonus + outfitBonus - qualityPenalty + (activeStock && activeStock.risk === 'Низкий' && client.tier >= 2 ? 4 : 0) - Math.max(0,client.tier-1)*9)))
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-last-app',activeApp) } catch {} },[activeApp])
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
    const lower = (kind==='free'?text:kind).toLowerCase()
    const hasRisk = /риск|долг|убыт|потер|волат|гарант|паден|комисс|не гарант|минус/.test(lower)
    const hasUpside = /рост|прибыл|выруч|спрос|контракт|потенциал|развити|плюс|дивиденд/.test(lower)
    const nonsense = kind==='absurd' || /котлет|инопланет|космос|мем|не знаю|ляля|бред/.test(lower)
    let delta = 0; let reply = ''
    if(kind==='free') {
      delta = (hasRisk && hasUpside) ? 8 : hasRisk ? 5 : hasUpside ? 2 : nonsense ? -10 : -2
      reply = hasRisk && hasUpside ? '«Вот это уже похоже на анализ: есть потенциал и есть условия, при которых идея не сработает».' : hasRisk ? '«Хорошо, что вы хотя бы не скрываете риск. А источник возможного роста?»' : hasUpside ? '«Вы назвали плюсы. Теперь назовите причину, по которой я могу потерять деньги».' : nonsense ? '«Это презентация актива или проверка, сколько абсурда выдержит моя гарнитура?»' : '«Вы уходите от вопроса. Можно конкретнее — цифры, допущения и риск?»'
    } else if(kind==='benefit') {
      delta = activeStock && (client.tier<=1 ? activeStock.risk==='Низкий' : client.tier>=3 ? activeStock.risk==='Высокий' : activeStock.risk==='Средний') ? 8 : 3
      reply = '«Потенциал услышал. Не путайте возможность роста с гарантией доходности».'
    } else if(kind==='risk') {
      delta = 7; reply = '«Наконец-то брокер, который не обещает мне золотой унитаз без единой царапины».'
    } else {
      delta = -12; reply = '«Я позвонил за инвестиционной идеей, а не на кастинг в цирк. Вернёмся к делу».'
    }
    const newTrust = Math.max(0,Math.min(100,trust+delta))
    const newPatience = Math.max(0,patience-(kind==='risk'?3:kind==='free'?6:5))
    setTrust(newTrust); setPatience(newPatience); setCallLog(prev=>[...prev,'Ты: '+(kind==='free'?text:kind==='benefit'?'Объясняешь потенциальную выгоду':kind==='risk'?'Честно раскрываешь риски':'Отвечаешь невпопад'),client.name+': '+reply])
    setMessage('')
    const newChance = Math.max(5,Math.min(92,Math.round(30+newTrust*.48+props.reputation*.12+equipmentBonus+outfitBonus-qualityPenalty-Math.max(0,client.tier-1)*9)))
    setLastChance(newChance)
    if(newTrust>=72 && Math.random()*100<newChance) {
      const payout = Math.max(1200,Math.round(client.ticket*(client.commissionRate+client.bonusRate*.25)))
      props.setCash(v=>v+payout); props.setReputation(v=>Math.min(100,v+2)); props.setXp(v=>v+45)
      setCallState('won'); setCompleted(v=>v+1)
      setCallLog(prev=>[...prev,'СДЕЛКА ЗАКРЫТА. Комиссия: '+money(payout)+'. Клиент не стал внезапно богатым — ты заработал за работу.'])
    } else if(newTrust>=72 && newChance<100) {
      setCallLog(prev=>[...prev,client.name+': «Аргументы звучат убедительно, но я пока не готов принять решение. Мне нужно проверить детали».'])
    } else if(newTrust<=8 || newPatience<=8) {
      setCallState('lost'); props.setReputation(v=>Math.max(0,v-2)); props.setXp(v=>v+5)
      setCallLog(prev=>[...prev,'Клиент завершил звонок. Сделки нет; репутация просела.'])
    }
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
      <main className="arena-os-window">
        <div className="arena-os-window-title"><div><span className={'arena-os-app-icon mini '+activeApp}>{(()=>{const I=nav.find(n=>n.id===activeApp)?.icon??Laptop;return <I size={15}/>})()}</span><b>{title}</b></div><div className="arena-os-window-controls"><button title="Свернуть" onClick={()=>setActiveApp('home')}>−</button><button title="Развернуть" onClick={()=>setNotice('Окно уже развёрнуто на рабочем столе.')}>□</button><button title="Закрыть окно" onClick={()=>setActiveApp('home')}>×</button></div></div>
        <div className="arena-os-window-content">
          {activeApp==='home' && <section className="arena-os-home"><div className="arena-os-welcome"><div><span className="arena-os-kicker">БРОКЕРСКИЙ ПУЛЬТ · СМЕНА {props.day}</span><h1>Добро пожаловать в Arena.</h1><p>Звони клиентам, разбирай компании, зарабатывай комиссию и вкладывай её в образ и качество связи. Покупки разовые — ежедневной аренды и счетов нет.</p><button className="arena-os-primary" onClick={()=>{setActiveApp('calls');if(callState!=='active')setIncoming(false)}}><PhoneCall size={17}/> Открыть линию <ChevronRight size={16}/></button></div><div className="arena-os-home-avatar"><PixelAvatar outfit={props.selectedOutfit} mode="full"/></div></div><div className="arena-os-stat-grid"><article><Wallet/><small>Личные средства</small><strong>{money(props.cash)}</strong></article><article><ShieldCheck/><small>Репутация</small><strong>{props.reputation}/100</strong></article><article><Sparkles/><small>Опыт</small><strong>{props.xp} XP</strong></article><article><Activity/><small>Сделки в этой сессии</small><strong>{completed}</strong></article></div><div className="arena-os-section-heading"><div><span className="arena-os-kicker">БЫСТРЫЙ ДОСТУП</span><h2>Что делаем сегодня?</h2></div></div><div className="arena-os-quick-grid"><button onClick={()=>setActiveApp('market')}><TrendingUp/><b>Изучить акции</b><small>Плюсы, риски и подходящие клиенты</small></button><button onClick={()=>setActiveApp('clients')}><Users/><b>Найти клиента</b><small>{unlockedClients.length} доступно сейчас</small></button><button onClick={()=>setActiveApp('wardrobe')}><ShoppingBag/><b>Обновить образ</b><small>Внешний вид влияет на первое впечатление</small></button></div></section>}
          {activeApp==='market' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РЫНОЧНЫЙ ТЕРМИНАЛ</span><h1>Каталог акций</h1><p>У каждой идеи есть сильные стороны и неудобные вопросы. Подбирай продукт под клиента, а не наоборот.</p></div><label className="arena-os-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Тикер или компания"/></label></div><div className="arena-os-stock-grid">{STOCKS.filter(s=>(s.name+' '+s.ticker).toLowerCase().includes(query.toLowerCase())).map(s=><article className="arena-os-stock-card" key={s.ticker}><div className="arena-os-stock-top"><span className="arena-os-ticker">{s.ticker}</span><span className={'arena-os-risk '+s.risk}>{s.risk} риск</span></div><h3>{s.name}</h3><strong className="arena-os-stock-price">{money(s.price)}</strong><div className="arena-os-pros"><b>Потенциал</b><p>{s.upside}</p></div><div className="arena-os-cons"><b>Что может пойти не так</b><p>{s.downside}</p></div><small>{s.fit}</small><button className="arena-os-secondary" onClick={()=>{setActiveStock(s);setActiveApp('calls');setStockPicker(false);setNotice('Акция выбрана для обсуждения. Выбери клиента и начни звонок.') }}>Выбрать для переговоров <ChevronRight size={15}/></button></article>)}</div></section>}
          {activeApp==='calls' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ARENA CONNECT</span><h1>{callState==='active'?'Видеозвонок с клиентом':callState==='won'?'Сделка закрыта':callState==='lost'?'Звонок завершён':'Клиентская линия'}</h1><p>Клиент оценивает не только акцию, но и то, насколько честно ты говоришь о рисках.</p></div><span className={'arena-os-call-status '+callState}>{callState==='active'?'● В ЭФИРЕ':callState==='won'?'✓ УСПЕХ':callState==='lost'?'● ЗАВЕРШЁН':'● ГОТОВ'}</span></div>
            {callState!=='active' && <div className="arena-os-call-start"><div className="arena-os-client-list">{unlockedClients.slice(0,8).map(c=><button key={c.id} className={'arena-os-client-row '+(clientId===c.id?'active':'')} onClick={()=>setClientId(c.id)}><span className="arena-os-client-avatar"><ClientAvatar2D tier={c.tier} mood="neutral"/></span><span><b>{c.name}</b><small>{c.profession}</small><em>{c.temperament} · капитал {money(c.budget)}</em></span><ChevronRight size={16}/></button>)}</div><div className="arena-os-call-preview"><div className="arena-os-preview-face"><ClientAvatar2D tier={client.tier} mood="skeptical"/></div><span className="arena-os-kicker">ВХОДЯЩИЙ КЛИЕНТ</span><h2>{client.name}</h2><p>{client.quote}</p><div className="arena-os-tags"><span>Уровень {client.tier}</span><span>{client.experience}</span><span>{client.temperament}</span></div><button className="arena-os-primary" onClick={()=>startCall(client.id)}><PhoneCall size={17}/> Принять звонок</button></div></div>}
            {callState==='active' && <div className="arena-os-live-call"><div className="arena-os-call-video"><div className="arena-os-video-tile"><span>КЛИЕНТ · {client.name}</span><ClientAvatar2D tier={client.tier} mood={trust>65?'interested':trust<30?'angry':'skeptical'}/></div><div className="arena-os-video-tile self"><span>ВАША КАМЕРА</span><PixelAvatar outfit={props.selectedOutfit} mode="full"/><small>{props.ownedItems.includes('camera')?'HD-камера':'Встроенная камера'} · {props.ownedItems.includes('mic')?'USB-микрофон':'Встроенный микрофон'}</small></div></div><div className="arena-os-call-metrics"><div><span>Вероятность сделки</span><b>{lastChance||chance}%</b><div className="arena-os-progress"><i style={{width:(lastChance||chance)+'%'}}/></div><small>{qualityPenalty>0?'Слабое оборудование снижает первое впечатление. ':'Оборудование в порядке. '}{client.tier>=3?'Клиент требовательный: сначала докажи компетентность.':'Подстрой аргументы под цель клиента.'}</small></div><div><span>Доверие</span><b>{trust}/100</b><div className="arena-os-progress trust"><i style={{width:trust+'%'}}/></div></div><div><span>Терпение</span><b>{patience}/100</b><div className="arena-os-progress patience"><i style={{width:patience+'%'}}/></div></div></div>
              <div className="arena-os-dialogue"><div className="arena-os-dialogue-log">{callLog.slice(-8).map((line,i)=><p key={i} className={line.startsWith('Ты:')?'player-line':line.startsWith('СДЕЛКА')?'system-line':'client-line'}>{line}</p>)}</div>
                {stockPicker || !activeStock ? <div className="arena-os-stock-picker"><b>Клиент заинтересовался идеей. Выбери акцию и изучи аргументы.</b><div className="arena-os-stock-picker-grid">{STOCKS.map(s=><button key={s.ticker} onClick={()=>chooseStock(s)}><b>{s.name}</b><small>{s.ticker} · риск {s.risk.toLowerCase()}</small></button>)}</div></div> : <div className="arena-os-argument-panel"><div><b>{activeStock.name} · {activeStock.ticker}</b><p><strong>Плюс:</strong> {activeStock.upside}</p><p><strong>Минус:</strong> {activeStock.downside}</p></div><div className="arena-os-response-actions"><button onClick={()=>respond('benefit')}>Объяснить потенциал</button><button onClick={()=>respond('risk')}>Честно разобрать риски</button><button className="bad" onClick={()=>respond('absurd')}>Сказать что-нибудь нелепое</button></div><form onSubmit={e=>{e.preventDefault();respond('free',message)}} className="arena-os-free-text"><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ответить своими словами… (например, потенциал есть, но долг растёт)" /><button type="submit" disabled={!message.trim()}>Отправить</button></form><small>Свободный текст оценивается по смысловым маркерам в этой версии; для полностью живого диалога понадобится подключённая языковая модель.</small></div>}
              </div><button className="arena-os-hangup" onClick={()=>{setCallState('idle');setActiveStock(null);setStockPicker(false);setCallLog([])}}><X size={15}/> Завершить звонок</button></div>}
            {(callState==='won'||callState==='lost') && <div className="arena-os-call-result"><h2>{callState==='won'?'Отличная работа.':'Клиент положил трубку.'}</h2><p>{callState==='won'?'Комиссия за сделку зачислена. Теперь можно вложить часть заработка в оборудование или одежду.':'Сделки нет. Разбери возражения и попробуй снова — или подготовься лучше.'}</p><button className="arena-os-primary" onClick={()=>{setCallState('idle');setActiveStock(null);setCallLog([]);setActiveApp('calls')}}>Следующий клиент <ChevronRight size={16}/></button></div>}
          </section>}
          {activeApp==='clients' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">CRM · КЛИЕНТСКАЯ БАЗА</span><h1>Люди, а не кошельки</h1><p>У каждого клиента свои ожидания. Более высокий капитал не означает лёгкую сделку.</p></div><span className="arena-os-count">{unlockedClients.length} открыто / {CLIENTS.length}</span></div><div className="arena-os-all-clients">{CLIENTS.map(c=>{const open=c.minDay<=props.day&&c.minReputation<=props.reputation;return <article key={c.id} className={open?'':'locked'}><div className="arena-os-small-face"><ClientAvatar2D tier={c.tier} mood="neutral"/></div><div><b>{open?c.name:'Закрытый контакт'}</b><small>{c.profession}</small><p>{open?c.goal:'Откроется на '+c.minDay+' дне при репутации '+c.minReputation+'.'}</p><span>{c.temperament} · {c.experience}</span></div><strong>{open?money(c.budget):<ShieldCheck size={17}/>}</strong><button disabled={!open} onClick={()=>{setClientId(c.id);setActiveApp('calls')}}>{open?'Выбрать':'Закрыт'}</button></article>})}</div></section>}
          {activeApp==='wardrobe' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ARENA STYLE</span><h1>Гардероб</h1><p>Покупаешь один раз. Образ меняет первое впечатление, но не заменяет компетентность.</p></div><span className="arena-os-count">Текущий образ: {OUTFITS.find(o=>o.id===props.selectedOutfit)?.name}</span></div><div className="arena-os-outfit-grid">{OUTFITS.map(o=><article key={o.id} className={props.selectedOutfit===o.id?'equipped':''}><div className="arena-os-outfit-preview"><PixelAvatar outfit={o.id} mode="full"/></div><h3>{o.name}</h3><p>{o.desc}</p><div className="arena-os-item-foot"><b>{money(o.price)}</b><span>+{o.bonus} к первому впечатлению</span></div><button className={props.ownedOutfits.includes(o.id)?'arena-os-secondary':'arena-os-primary'} onClick={()=>buyOutfit(o.id,o.price)}>{props.selectedOutfit===o.id?'Надето':props.ownedOutfits.includes(o.id)?'Надеть': 'Купить один раз'}</button></article>)}</div></section>}
          {activeApp==='equipment' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РАБОЧЕЕ МЕСТО</span><h1>Оборудование</h1><p>Четыре осмысленных улучшения. Нет аренды, ежедневных счетов и бессмысленной мелочёвки.</p></div><span className="arena-os-count">Качество связи: {Math.max(0,100-qualityPenalty*4)}%</span></div><div className="arena-os-gear-grid">{GEAR.map(g=>{const owned=props.ownedItems.includes(g.id);return <article key={g.id} className={owned?'owned':''}><div className="arena-os-gear-art">{g.icon==='mic'?<Mic/>:g.icon==='camera'?<Video/>:g.icon==='background'?<House/>:<Sparkles/>}</div><div><h3>{g.name}</h3><p>{g.desc}</p><span>+{g.bonus} к качеству переговоров</span></div><button disabled={owned} onClick={()=>buyGear(g.id,g.price)}>{owned?<><Check size={15}/> Куплено</>:<>Купить · {money(g.price)}</>}</button></article>})}</div><div className="arena-os-note"><ShieldCheck size={18}/><p>Владение жильём не создаёт ежедневных расходов. Деньги уходят только на выбранные покупки; заработок зависит от сделок, а не от ожидания таймера аренды.</p></div></section>}
          {activeApp==='tasks' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ПЛАН СМЕНЫ</span><h1>Твои задачи</h1><p>Подготовка помогает закрывать сделки. Не продавай то, что не можешь объяснить.</p></div></div><div className="arena-os-task-list"><article><Check/><div><b>Изучи хотя бы одну компанию</b><p>Открой биржевой каталог и прочитай плюсы и минусы выбранной акции.</p></div><button onClick={()=>setActiveApp('market')}>Открыть биржу</button></article><article><PhoneCall/><div><b>Проведи переговоры</b><p>Успех зависит от доверия, репутации, оборудования и того, насколько честно ты объясняешь риск.</p></div><button onClick={()=>setActiveApp('calls')}>Клиенты</button></article><article><ShoppingBag/><div><b>Инвестируй в себя</b><p>Покупки разовые. Улучшения помогают, но не превращают требовательного клиента в лёгкую добычу.</p></div><button onClick={()=>setActiveApp('equipment')}>Оборудование</button></article></div></section>}
        </div>
        <footer className="arena-os-taskbar"><button className="arena-os-start" onClick={()=>setActiveApp('home')}>⊞</button><span className="arena-os-taskbar-label">ARENA OS</span>{nav.filter(n=>n.id!=='home').map(n=>{const I=n.icon;return <button key={n.id} className={activeApp===n.id?'active':''} title={n.label} onClick={()=>setActiveApp(n.id)}><I size={17}/></button>})}<span className="arena-os-taskbar-spacer"/><span className="arena-os-tray"><span className="arena-os-online-dot"/> Онлайн · {new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></footer>
      </main>
    </div>
    {notice && <div className="arena-os-toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {incoming && <div className="arena-os-incoming-backdrop"><section className="arena-os-incoming-modal"><div className="arena-os-incoming-icon"><PhoneCall size={25}/></div><span className="arena-os-kicker">ARENA CONNECT · ВХОДЯЩИЙ ЗВОНОК</span><h2>Тебе звонят.</h2><p>Первый клиент уже на линии. Прими вызов, оцени ситуацию и выбери акцию, которую сможешь защитить аргументами.</p><div className="arena-os-incoming-client"><div className="arena-os-incoming-face"><ClientAvatar2D tier={0} mood="neutral"/></div><div><b>{(CLIENTS.find(c=>c.id==='alex-vorontsov')??CLIENTS[0]).name}</b><small>Первичный контакт · потенциальный клиент</small></div><span className="arena-os-ringing">● ● ●</span></div><button className="arena-os-primary" onClick={()=>{setIncoming(false);try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{};startCall('alex-vorontsov')}}><PhoneCall size={17}/> Принять вызов</button><button className="arena-os-incoming-dismiss" onClick={()=>{setIncoming(false);setActiveApp('calls');try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{}}}>Открыть рабочий стол</button></section></div>}
  </div>
}
