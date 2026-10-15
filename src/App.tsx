import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, CalendarDays,
  Check, ChevronRight, CircleDollarSign, Clock3, Headphones,
  Laptop, MessageCircle, Newspaper, Phone, Power, ShieldAlert,
  Sparkles, TrendingUp, Wallet, X, Zap, Users, ShoppingBag, House, Video, Camera, PackageCheck, Monitor,
  Settings, Gamepad2, Play, RotateCcw, ArrowRight
} from 'lucide-react'
import RoomScene from './RoomScene'
import { configureAudio, playSound, speakText, stopSpeech } from './audio'
import { calculateDeal, CLIENTS, DAILY_SALARY, getAvailableClients, getBackgroundModifier, getDailyLeadIds, getFirstImpression, getVideoQuality, HOUSING, ROOM_ITEMS, STARTING_CASH, STARTING_FIRM_CAPITAL, STARTING_HOUSING_ID, type VideoBackground } from './game/economy'

type Panel = 'room' | 'computer'
type Tab = 'overview' | 'market' | 'news' | 'calls' | 'clients' | 'shop' | 'housing'
type CallStatus = 'idle' | 'active' | 'won' | 'lost'
type RoomObject = 'lamp' | 'light' | 'curtains' | 'wardrobe'
type OutfitId = 'intern' | 'classic' | 'premium'
const OUTFITS: { id: OutfitId; name: string; price: number; description: string }[] = [
  { id: 'intern', name: 'Стажёр', price: 0, description: 'Футболка, тёмные брюки и удобная обувь.' },
  { id: 'classic', name: 'Классический брокер', price: 4500, description: 'Рубашка, аккуратный пиджак и деловой силуэт.' },
  { id: 'premium', name: 'Премиальный костюм', price: 12500, description: 'Тёмный костюм, светлая рубашка и золотистые детали.' },
]

const questions = [
  {
    title: '«Котолёт» растёт на 34%, но работает в убыток. Почему мне вообще смотреть на эту акцию?',
    hint: 'Клиент проверяет, понимаешь ли ты разницу между ростом бизнеса и прибылью.',
    choices: [
      { label: 'Рост выручки сам по себе не гарантирует успех. Важно, сможет ли компания масштабироваться и сократить расходы.', delta: 8, kind: 'good' },
      { label: 'Это робототехника! Такие акции всегда выстреливают, надо брать, пока дёшево.', delta: -10, kind: 'bad' },
      { label: 'У компании есть потенциальный контракт, но я бы сначала посмотрел на себестоимость роботов и денежный запас.', delta: 6, kind: 'good' },
    ],
  },
  {
    title: 'Допустим. А что может пойти не так? Не хочу узнать о проблемах после покупки.',
    hint: 'Осторожный клиент ценит конкретные риски больше, чем общие обещания.',
    choices: [
      { label: 'Главные риски — дорогой ремонт, проблемы с батареями и задержка выхода на прибыль. Контракт тоже пока не гарантирован.', delta: 9, kind: 'good' },
      { label: 'Да ничего серьёзного. Если бы были проблемы, руководство уже всё исправило бы.', delta: -13, kind: 'bad' },
      { label: 'Риск есть у любой акции. Но давайте посмотрим на денежный запас и сценарий, при котором продажи окажутся ниже плана.', delta: 7, kind: 'good' },
    ],
  },
  {
    title: 'И последний вопрос: сколько я на этом заработаю? Назови конкретную цифру.',
    hint: 'Проверка на обещания гарантированной доходности.',
    choices: [
      { label: 'Честную гарантированную цифру назвать нельзя. Можем разобрать оптимистичный и негативный сценарии и определить приемлемую сумму.', delta: 8, kind: 'good' },
      { label: 'Минимум 40% за год. Я уверен, что акция вырастет.', delta: -16, kind: 'bad' },
      { label: 'Сначала уточню горизонт и допустимый убыток. Тогда сможем понять, подходит ли вам эта инвестиция.', delta: 7, kind: 'good' },
    ],
  },
]


const entrepreneurQuestions = [
  {
    title: 'У бизнеса сезонная выручка. Как мне не остаться без денег, если понадобится пополнить оборотный капитал?',
    hint: 'Предприниматель оценивает ликвидность и не хочет заморозить деньги, нужные компании.',
    choices: [
      { label: 'Сначала определим резерв на несколько месяцев расходов и не будем инвестировать деньги, которые могут срочно понадобиться бизнесу.', delta: 9, kind: 'good' },
      { label: 'Вложите всё свободное: если понадобится, быстро продадим акции по хорошей цене.', delta: -13, kind: 'bad' },
      { label: 'Разделим капитал по срокам: резерв оставим ликвидным, а инвестировать будем только деньги с подходящим горизонтом.', delta: 8, kind: 'good' },
    ],
  },
  {
    title: 'Почему мне не оставить весь резерв на счёте? Что именно оправдывает дополнительный риск?',
    hint: 'Нужно сопоставить потенциальную доходность, ликвидность и возможный убыток.',
    choices: [
      { label: 'Сравним сценарии с учётом риска, комиссий и срока. Если ожидаемая выгода не компенсирует риск, сделка не нужна.', delta: 9, kind: 'good' },
      { label: 'Деньги на счёте просто обесцениваются. Любая акция лучше наличных.', delta: -12, kind: 'bad' },
      { label: 'Покажу базовый и негативный сценарии, а размер позиции ограничим суммой, которую бизнес может не трогать.', delta: 7, kind: 'good' },
    ],
  },
  {
    title: 'Мне может понадобиться часть капитала через месяц. Вы сможете гарантировать, что я выйду без потерь?',
    hint: 'Клиент проверяет, не скрываешь ли ты риск падения цены и нехватки ликвидности.',
    choices: [
      { label: 'Нет, гарантировать цену выхода нельзя. Для денег с таким сроком акция может не подойти.', delta: 10, kind: 'good' },
      { label: 'Конечно, ликвидные акции всегда можно продать без убытка.', delta: -16, kind: 'bad' },
      { label: 'Давайте сначала отделим краткосрочный резерв от капитала, который действительно можно инвестировать надолго.', delta: 8, kind: 'good' },
    ],
  },
]

const professionalQuestions = [
  {
    title: 'Назовите ключевые допущения инвестиционной идеи и факты, которые опровергнут вашу рекомендацию.',
    hint: 'Опытный инвестор ждёт проверяемого тезиса, а не презентации.',
    choices: [
      { label: 'Зафиксируем базовый тезис, три главных риска и показатели, при ухудшении которых пересмотрим позицию.', delta: 10, kind: 'good' },
      { label: 'Рынок уже всё оценил, поэтому детали допущений не так важны.', delta: -15, kind: 'bad' },
      { label: 'Покажу чувствительность оценки к выручке, марже и долгу, а также укажу, что пока неизвестно.', delta: 9, kind: 'good' },
    ],
  },
  {
    title: 'Что произойдёт с позицией в негативном сценарии и какой у нас план выхода?',
    hint: 'Клиент оценивает дисциплину управления риском.',
    choices: [
      { label: 'Определим допустимый убыток, ликвидность и условия пересмотра до покупки; стоп-план не гарантирует цену исполнения.', delta: 10, kind: 'good' },
      { label: 'Если цена упадёт, просто подождём восстановления. Хорошие компании всегда возвращаются.', delta: -15, kind: 'bad' },
      { label: 'Сравним стресс-сценарий с размером позиции и не будем инвестировать сумму, потеря которой нарушит ваши планы.', delta: 8, kind: 'good' },
    ],
  },
  {
    title: 'Каким образом вы отделяете собственную комиссию от интересов клиента?',
    hint: 'Профессионал проверяет конфликт интересов и готовность брокера рекомендовать отказ.',
    choices: [
      { label: 'Покажу комиссии и альтернативы. Если продукт не подходит вашему мандату, правильное решение — отказаться от сделки.', delta: 10, kind: 'good' },
      { label: 'Моя работа — закрыть сделку. Доходность уже зависит от вас.', delta: -16, kind: 'bad' },
      { label: 'Сначала зафиксируем критерии выбора и ограничения, а затем сравним подходящие варианты, включая отсутствие сделки.', delta: 9, kind: 'good' },
    ],
  },
]

function getQuestionsForTier(tier: number) {
  if (tier >= 3) return professionalQuestions
  if (tier >= 2) return entrepreneurQuestions
  return questions
}

const companies = [
  { ticker: 'KOTL', name: 'Котолёт', sector: 'Робототехника', price: '₽ 148,60', change: '+3,42%', positive: true, cap: '₽ 8,4 млрд', revenue: '120 ИУ', profit: '−18 ИУ', risk: 'Высокий', description: 'Разрабатывает автономных роботов-доставщиков для магазинов и логистических центров. Выручка растёт, но компания пока вкладывает почти всё в масштабирование.', advantages: 'Рост заказов; крупный контракт на тестирование; потенциально масштабируемая технология.', risks: 'Чистый убыток; зависимость от крупных контрактов; расходы на разработку и сервис.' },
  { ticker: 'OGUR', name: 'Огурец Капитал', sector: 'Напитки', price: '₽ 92,15', change: '+0,84%', positive: true, cap: '₽ 5,1 млрд', revenue: '210 ИУ', profit: '+16 ИУ', risk: 'Средний', description: 'Производитель напитков и готовых соков с сетью региональных дистрибьюторов. Компания прибыльна и расширяет линейку, но чувствительна к стоимости упаковки и сырья.', advantages: 'Положительная прибыль; узнаваемая линейка; стабильные каналы продаж.', risks: 'Подорожание сырья; конкуренция за полку; умеренный темп роста.' },
  { ticker: 'TAPK', name: 'ТапокТех', sector: 'Электроника', price: '₽ 64,20', change: '−4,16%', positive: false, cap: '₽ 3,2 млрд', revenue: '95 ИУ', profit: '−27 ИУ', risk: 'Очень высокий', description: 'Создаёт умные тапочки с датчиками движения и приложением для дома. Возвраты товара растут, а новая версия ещё не доказала, что сможет исправить ситуацию.', advantages: 'Низкая цена акции; необычный продукт; возможный эффект от удачного обновления.', risks: 'Большой убыток; высокий процент возвратов; спрос и качество пока не подтверждены.' },
  { ticker: 'DUST', name: 'Пыль и прибыль', sector: 'Услуги', price: '₽ 210,80', change: '+0,26%', positive: true, cap: '₽ 12,6 млрд', revenue: '240 ИУ', profit: '+21 ИУ', risk: 'Низкий', description: 'Оказывает услуги по обслуживанию коммерческих зданий и автоматизации уборки. Рост умеренный, зато контракты долгосрочные и бизнес уже приносит прибыль.', advantages: 'Прибыльная модель; долгосрочные контракты; сравнительно низкий риск.', risks: 'Невысокие темпы роста; давление на зарплаты и себестоимость услуг.' },
]

const news = [
  { tag: 'КОТОЛЁТ', time: '09:14', title: '«Котолёт» ведёт переговоры о контракте на 800 роботов', body: 'Сеть доставки подтвердила тестирование, но требует гарантий бесперебойной работы.', tone: 'green' },
  { tag: 'РЫНОК', time: '08:52', title: 'Инвесторы стали внимательнее к компаниям без прибыли', body: 'После серии слабых отчётов рынок требует доказательств пути к положительному денежному потоку.', tone: 'gold' },
  { tag: 'ТАПОКТЕХ', time: '08:30', title: 'Возвраты умных тапочек превысили прогноз', body: 'Компания обещает обновить посадку устройства. Акции теряют часть вчерашнего роста.', tone: 'red' },
]

function readSave() {
  try {
    const raw = localStorage.getItem('na-vse-kotirovki-save-v1')
    if (raw) return JSON.parse(raw) as { cash?: number; firmCapital?: number; debt?: number; reputation?: number; day?: number; deals?: number; housingId?: string; ownedItems?: string[]; selectedClientId?: string; videoBackground?: VideoBackground; clientLastContactDay?: Record<string, number>; clientDealCounts?: Record<string, number>; clientInvested?: Record<string, number>; callClientId?: string; callsToday?: number; dailyLeadIds?: string[]; gameMinutes?: number; dayEnded?: boolean }
  } catch { /* Storage may be disabled; the game still works for this session. */ }
  return {}
}

function SelfCameraPreview({ enabled, background, outfit }: { enabled: boolean; background: VideoBackground; outfit: OutfitId }) {
  return <div className={'player-preview-tile in-game-self-view ' + background + ' outfit-' + outfit + (enabled ? '' : ' video-disabled')} aria-label="Игровой видеокадр персонажа">
    <div className="self-view-room"><span className="self-view-window" /><span className="self-view-lamp" /><span className="self-view-shelf" /></div>
    {enabled ? <div className="player-silhouette"><span className="player-hair" /><span className="player-head"><i /><i /><b /></span><span className="player-neck" /><span className="player-body"><i /><i /></span><span className="player-arm left" /><span className="player-arm right" /></div> : <div className="video-off-overlay"><Video size={16} /><span>ВИДЕО ВЫКЛЮЧЕНО</span></div>}
    <small>{enabled ? 'ТВОЙ ПЕРСОНАЖ' : 'ТОЛЬКО АУДИО'}</small>
  </div>
}

export default function App() {
  const startNewCareerOnLoad = useMemo(() => { try { return localStorage.getItem('na-vse-kotirovki-start-new-career') === 'true' } catch { return false } }, [])
  const saved = useMemo(() => readSave(), [])
  const [mainMenu, setMainMenu] = useState(!startNewCareerOnLoad)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [gameMinutes, setGameMinutes] = useState(saved.gameMinutes ?? 7 * 60)
  const [windowMaximized, setWindowMaximized] = useState(false)
  const [windowMinimized, setWindowMinimized] = useState(false)
  const [windowOffset, setWindowOffset] = useState({ x: 0, y: 0 })
  const dragWindowRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)
  const [offlineMenu, setOfflineMenu] = useState(false)
  const [onlineInfo, setOnlineInfo] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [confirmNewCareer, setConfirmNewCareer] = useState(false)
  const [introActive, setIntroActive] = useState(false)
  const [canInteractWithComputer, setCanInteractWithComputer] = useState(false)
  const [canSleep, setCanSleep] = useState(false)
  const [dayEnded, setDayEnded] = useState(saved.dayEnded ?? false)
  const [deskLampOn, setDeskLampOn] = useState(false)
  const [roomLightOn, setRoomLightOn] = useState(true)
  const [curtainsOpen, setCurtainsOpen] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [nearbyRoomObject, setNearbyRoomObject] = useState<RoomObject | null>(null)
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitId>(() => { try { return (localStorage.getItem('na-vse-kotirovki-outfit') as OutfitId) || 'intern' } catch { return 'intern' } })
  const [ownedOutfits, setOwnedOutfits] = useState<OutfitId[]>(() => { try { const raw = JSON.parse(localStorage.getItem('na-vse-kotirovki-owned-outfits') || '["intern"]'); return Array.isArray(raw) ? Array.from(new Set<OutfitId>(['intern', ...raw.filter((id: string) => ['classic', 'premium'].includes(id))])) : ['intern'] } catch { return ['intern'] } })
  const finishIntro = useCallback(() => setIntroActive(false), [])
  useEffect(() => { try { localStorage.setItem('na-vse-kotirovki-outfit', selectedOutfit); localStorage.setItem('na-vse-kotirovki-owned-outfits', JSON.stringify(ownedOutfits)) } catch { /* Outfit preferences are optional if storage is unavailable. */ } }, [selectedOutfit, ownedOutfits])
  const [careerStarted, setCareerStarted] = useState(() => startNewCareerOnLoad || Object.keys(readSave()).length > 0)
  const [hasSavedGame, setHasSavedGame] = useState(() => Object.keys(readSave()).length > 0)
  const [menuSettings, setMenuSettings] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-reduced-motion') === 'true' } catch { return false } })
  const [soundEnabled, setSoundEnabled] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-sound') !== 'false' } catch { return true } })
  const [ambienceEnabled, setAmbienceEnabled] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-ambience') !== 'false' } catch { return true } })
  const [voiceEnabled, setVoiceEnabled] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-voice') === 'true' } catch { return false } })
  const [panel, setPanel] = useState<Panel>('room')
  const [tab, setTab] = useState<Tab>('overview')
  const [cash, setCash] = useState(saved.cash ?? STARTING_CASH)
  const [firmCapital, setFirmCapital] = useState(saved.firmCapital ?? STARTING_FIRM_CAPITAL)
  const [debt, setDebt] = useState(saved.debt ?? 0)
  const [reputation, setReputation] = useState(saved.reputation ?? 42)
  const [day, setDay] = useState(saved.day ?? 1)
  const [deals, setDeals] = useState(saved.deals ?? 0)
  const [callsToday, setCallsToday] = useState(saved.callsToday ?? 0)
  const [housingId, setHousingId] = useState(saved.housingId ?? STARTING_HOUSING_ID)
  const [ownedItems, setOwnedItems] = useState<string[]>(saved.ownedItems ?? [])
  const [selectedClientId, setSelectedClientId] = useState(saved.selectedClientId ?? 'alex-vorontsov')
  const [clientLastContactDay, setClientLastContactDay] = useState<Record<string, number>>(saved.clientLastContactDay ?? {})
  const [clientDealCounts, setClientDealCounts] = useState<Record<string, number>>(saved.clientDealCounts ?? {})
  const [clientInvested, setClientInvested] = useState<Record<string, number>>(saved.clientInvested ?? {})
  const [dailyLeadIds, setDailyLeadIds] = useState<string[]>(saved.dailyLeadIds ?? getDailyLeadIds(day, reputation, saved.clientLastContactDay ?? {}, saved.clientDealCounts ?? {}, saved.clientInvested ?? {}))
  const [callClientId, setCallClientId] = useState(saved.callClientId ?? 'alex-vorontsov')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [videoSwitchEffectUsed, setVideoSwitchEffectUsed] = useState(false)
  const [videoBackground, setVideoBackground] = useState<VideoBackground>(saved.videoBackground ?? 'real')
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [trust, setTrust] = useState(48)
  const [patience, setPatience] = useState(74)
  const [timeLeft, setTimeLeft] = useState(60)
  const [lastPenaltySecond, setLastPenaltySecond] = useState(25)
  const [freeAnswer, setFreeAnswer] = useState('')
  const [conversation, setConversation] = useState<{ from: 'client' | 'you' | 'system'; text: string }[]>([])
  const [lastResult, setLastResult] = useState('')
  const [toast, setToast] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('KOTL')
  const [marketReviewed, setMarketReviewed] = useState(false)
  const [newsReviewed, setNewsReviewed] = useState(false)

  useEffect(() => {
    if (startNewCareerOnLoad) { try { localStorage.removeItem('na-vse-kotirovki-start-new-career') } catch { /* Ignore unavailable storage. */ } }
  }, [startNewCareerOnLoad])

  useEffect(() => {
    configureAudio({ enabled: soundEnabled, ambience: ambienceEnabled, voice: voiceEnabled, curtainsOpen, inRoom: mainMenu || panel === 'room' || panel === 'computer', inCall: callStatus === 'active', paused: pauseOpen || menuSettings })
    try {
      localStorage.setItem('na-vse-kotirovki-sound', String(soundEnabled))
      localStorage.setItem('na-vse-kotirovki-ambience', String(ambienceEnabled))
      localStorage.setItem('na-vse-kotirovki-voice', String(voiceEnabled))
    } catch { /* Audio preferences are optional if storage is unavailable. */ }
    if (!voiceEnabled) stopSpeech()
  }, [soundEnabled, ambienceEnabled, voiceEnabled, curtainsOpen, mainMenu, panel, callStatus, pauseOpen, menuSettings])

  useEffect(() => {
    if (!soundEnabled || !ambienceEnabled || panel !== 'room' || pauseOpen || mainMenu) return
    const ticker = window.setInterval(() => playSound('tick'), 1000)
    return () => window.clearInterval(ticker)
  }, [soundEnabled, ambienceEnabled, panel, pauseOpen, mainMenu])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('button, [role="button"], .desktop-app-icon, .side-link')) playSound('ui')
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => window.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  useEffect(() => {
    if (!careerStarted) return
    try { localStorage.setItem('na-vse-kotirovki-save-v1', JSON.stringify({ cash, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callsToday, dailyLeadIds, gameMinutes, dayEnded })) } catch { /* Ignore unavailable storage. */ }
  }, [careerStarted, cash, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callsToday, dailyLeadIds, gameMinutes, dayEnded])

  useEffect(() => {
    if (!controlsVisible) return
    const timer = window.setTimeout(() => setControlsVisible(false), 5000)
    return () => window.clearTimeout(timer)
  }, [controlsVisible])

  useEffect(() => {
    if (tab === 'market') setMarketReviewed(true)
    if (tab === 'news') setNewsReviewed(true)
  }, [tab])

  useEffect(() => {
    if (tab !== 'calls' || callStatus !== 'active') setWindowMaximized(false)
    setWindowMinimized(false)
  }, [tab, callStatus])

  // In-game clock: ten minutes pass in the world every real minute; pausing freezes it.
  useEffect(() => {
    if (pauseOpen) return
    const clock = window.setInterval(() => setGameMinutes((value) => (value + 5) % (24 * 60)), 60000)
    return () => window.clearInterval(clock)
  }, [mainMenu, pauseOpen])

  useEffect(() => {
    if (mainMenu) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setPauseOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mainMenu])

  useEffect(() => {
    if (pauseOpen || windowMinimized || windowMaximized) return
    const move = (event: PointerEvent) => {
      const drag = dragWindowRef.current
      if (!drag) return
      setWindowOffset({ x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y })
    }
    const stop = () => { dragWindowRef.current = null }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }
  }, [pauseOpen, windowMinimized, windowMaximized])



  useEffect(() => {
    if (callStatus !== 'active') return
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, Math.round((value - 0.1) * 10) / 10)), 100)
    return () => window.clearInterval(timer)
  }, [callStatus, questionIndex])

  useEffect(() => {
    if (callStatus !== 'active' || timeLeft > 20 || timeLeft <= 0) return
    const second = Math.floor(timeLeft)
    if (second >= lastPenaltySecond) return
    setLastPenaltySecond(second)
    setTrust((value) => Math.max(0, value - 1))
    setPatience((value) => Math.max(0, value - 2))
  }, [timeLeft, callStatus, lastPenaltySecond])

  useEffect(() => {
    if (callStatus !== 'active' || timeLeft > 0) return
    setCallStatus('lost')
    playSound('hangup')
    speakText('Извините, у нас закончилось время. Давайте на этом закончим.', 'client')
    setTrust((value) => Math.max(0, value - 8))
    setPatience((value) => Math.max(0, value - 16))
    setLastResult('Клиент устал ждать и завершил звонок. В следующий раз изучи компанию заранее.')
    setConversation((items) => [...items, { from: 'system', text: '⏱ Время вышло. Клиент завершил звонок.' }])
  }, [timeLeft, callStatus])

  const eligibleClients = getAvailableClients(day, reputation).filter((client) =>
    day - (clientLastContactDay[client.id] ?? -100) >= 3 &&
    (clientDealCounts[client.id] ?? 0) < 3 &&
    (clientInvested[client.id] ?? 0) < client.budget
  )
  const availableClients = dailyLeadIds
    .map((id) => eligibleClients.find((client) => client.id === id))
    .filter((client): client is (typeof eligibleClients)[number] => Boolean(client))
  const selectedAvailableClient = availableClients.find((client) => client.id === selectedClientId) ?? availableClients[0] ?? CLIENTS[0]
  const activeClient = callStatus === 'idle'
    ? selectedAvailableClient
    : CLIENTS.find((client) => client.id === callClientId) ?? selectedAvailableClient
  const activeCompany = companies.find((company) => company.ticker === selectedCompany) ?? companies[0]
  const currentHousing = HOUSING.find((home) => home.id === housingId) ?? HOUSING[0]
  const activeQuestions = getQuestionsForTier(activeClient.tier)
  const activeQuestion = activeQuestions[questionIndex]
  const trustLabel = trust >= 72 ? 'Высокое доверие' : trust >= 52 ? 'Осторожный интерес' : trust >= 32 ? 'Сомневается' : 'На грани отказа'

  function enterOfflineGame() {
    setCareerStarted(true)
    setHasSavedGame(true)
    setMainMenu(false)
    setOfflineMenu(false)
    setMenuSettings(false)
    setOnlineInfo(false)
    setPanel('room')
    setCallStatus('idle')
    setControlsVisible(true)
    setCanInteractWithComputer(false)
    if (startNewCareerOnLoad) setIntroActive(true)
  }

  function openOfflineMenu() {
    setOfflineMenu(true)
    setMenuSettings(false)
    setOnlineInfo(false)
  }

  function toggleReducedMotion() {
    setReducedMotion((value) => {
      const next = !value
      try { localStorage.setItem('na-vse-kotirovki-reduced-motion', String(next)) } catch { /* Ignore unavailable storage. */ }
      return next
    })
  }

  function startNewGame() { setConfirmNewCareer(true) }

  function confirmStartNewGame() {
    window.setTimeout(() => playSound('alarm'), 900)
    try { localStorage.removeItem('na-vse-kotirovki-save-v1'); localStorage.removeItem('na-vse-kotirovki-start-new-career') } catch { /* Local storage may be unavailable. */ }
    setCash(STARTING_CASH)
    setFirmCapital(STARTING_FIRM_CAPITAL)
    setDebt(0)
    setReputation(42)
    setDay(1)
    setDeals(0)
    setCallsToday(0)
    setHousingId(STARTING_HOUSING_ID)
    setOwnedItems([])
    setSelectedOutfit('intern')
    setOwnedOutfits(['intern'])
    setSelectedClientId('alex-vorontsov')
    setClientLastContactDay({})
    setClientDealCounts({})
    setClientInvested({})
    setDailyLeadIds(getDailyLeadIds(1, 42, {}, {}, {}))
    setCallClientId('alex-vorontsov')
    setVideoBackground('real')
    setVideoEnabled(true)
    setVideoSwitchEffectUsed(false)
    setSelectedCompany('KOTL')
    setToast('')
    setLastPenaltySecond(60)
    setCallStatus('idle')
    setQuestionIndex(0)
    setTrust(48)
    setPatience(74)
    setTimeLeft(60)
    setLastPenaltySecond(60)
    setGameMinutes(7 * 60)
    setPauseOpen(false)
    setDayEnded(false)
    setCanSleep(false)
    setDeskLampOn(false)
    setRoomLightOn(true)
    setCurtainsOpen(true)
    setWindowOffset({ x: 0, y: 0 })
    setWindowMaximized(false)
    setWindowMinimized(false)
    setFreeAnswer('')
    setConversation([])
    setLastResult('')
    setMarketReviewed(false)
    setNewsReviewed(false)
    setPanel('room')
    setTab('overview')
    setCareerStarted(true)
    setHasSavedGame(true)
    setMainMenu(false)
    setOfflineMenu(false)
    setConfirmNewCareer(false)
    setControlsVisible(true)
    setCanInteractWithComputer(false)
    setIntroActive(true)
    setNearbyRoomObject(null)
  }

  const openComputer = useCallback(() => {
    playSound('computer')
    setPanel('computer')
    setTab('overview')
    setNearbyRoomObject(null)
  }, [])

  const interactWithRoomObject = useCallback((object: RoomObject) => {
    if (object === 'lamp') { playSound('lamp'); setDeskLampOn((value) => !value); return }
    if (object === 'light') { playSound('lamp'); setRoomLightOn((value) => !value); return }
    if (object === 'curtains') { playSound('curtain'); setCurtainsOpen((value) => !value); return }
    if (object === 'wardrobe') { setPanel('computer'); setTab('shop'); setWindowMinimized(false); setWindowMaximized(false); setWindowOffset({ x: 0, y: 0 }) }
  }, [])

  function startCall() {
    if (dayEnded) { setToast('Рабочий день уже завершён. Подойди к кровати и нажми E, чтобы поспать.'); return }
    const dailyCallLimit = reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2
    if (callsToday >= dailyCallLimit) { setToast('На сегодня лимит звонков исчерпан. Восстановись и продолжи завтра.'); return }
    if (!availableClients.some((client) => client.id === activeClient.id)) { setToast('Этот лид сейчас недоступен. Выбери клиента из списка актуальных предложений.'); return }
    setCallsToday((count) => count + 1)
    setQuestionIndex(0)
    setVideoSwitchEffectUsed(false)
    setCallClientId(activeClient.id)
    setClientLastContactDay((items) => ({ ...items, [activeClient.id]: day }))
    const preparationBonus = (marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0)
    const roomBonus = getFirstImpression(housingId, ownedItems, activeClient)
    const relationshipBonus = Math.min(15, (clientDealCounts[activeClient.id] ?? 0) * 6)
    const videoBonus = videoEnabled ? 2 + Math.min(3, getVideoQuality(ownedItems)) : 0
    const backgroundBonus = videoEnabled ? getBackgroundModifier(videoBackground, ownedItems, activeClient) : 0
    const companyFitBonus = activeCompany.risk === 'Очень высокий' ? -5 : activeCompany.risk === 'Высокий' ? -2 : activeCompany.positive ? 3 : -3
    setTrust(Math.max(0, Math.min(100, activeClient.baseTrust + preparationBonus + roomBonus + relationshipBonus + videoBonus + backgroundBonus + companyFitBonus)))
    setPatience(activeClient.patience)
    setTimeLeft(12)
    setLastPenaltySecond(12)
    setFreeAnswer('')
    setLastResult('')
    setConversation([{ from: 'system', text: 'Твоё предложение: акция «' + activeCompany.name + '» (' + activeCompany.sector + ', риск: ' + activeCompany.risk.toLowerCase() + ').' }, { from: 'client', text: 'Здравствуйте. ' + activeClient.quote }, ...(preparationBonus > 0 ? [{ from: 'system' as const, text: 'Подготовка перед звонком помогла: начальное доверие повышено на ' + preparationBonus + ' пунктов.' }] : []), ...(roomBonus !== 0 ? [{ from: 'system' as const, text: 'Первое впечатление от жилья и рабочего места: ' + (roomBonus > 0 ? '+' : '') + roomBonus + ' к доверию.' }] : []), ...(backgroundBonus !== 0 ? [{ from: 'system' as const, text: 'Выбранный фон изменил первое впечатление на ' + (backgroundBonus > 0 ? '+' : '') + backgroundBonus + ' к доверию.' }] : []), ...(relationshipBonus > 0 ? [{ from: 'system' as const, text: 'Клиент помнит прошлое сотрудничество: +' + relationshipBonus + ' к начальному доверию.' }] : [])])
    setMarketReviewed(false)
    setNewsReviewed(false)
    setCallStatus('active')
    playSound('computer')
    speakText('Здравствуйте. ' + activeClient.quote, 'client')
    setTimeLeft(60)
    setLastPenaltySecond(60)
    setWindowMinimized(false)
    setWindowMaximized(true)
    setTab('calls')
  }

  function resolveCall(nextTrust: number, nextPatience: number) {
    const threshold = 58 + activeClient.tier * 2
    const success = nextTrust >= threshold && nextPatience > 20
    setCallStatus(success ? 'won' : 'lost')
    if (success) {
      playSound('deal')
      speakText('Отлично. Давайте оформим сделку.', 'client')
      const payout = calculateDeal(activeClient, nextTrust, clientDealCounts[activeClient.id] ?? 0, clientInvested[activeClient.id] ?? 0)
      setCash((value) => value + payout.playerBonus)
      setFirmCapital((value) => Math.max(0, value + payout.firmRevenue - payout.playerBonus))
      setReputation((value) => Math.min(100, value + (activeClient.tier >= 2 ? 5 : 4)))
      setDeals((value) => value + 1)
      setClientDealCounts((counts) => ({ ...counts, [activeClient.id]: (counts[activeClient.id] ?? 0) + 1 }))
      setClientInvested((invested) => ({ ...invested, [activeClient.id]: (invested[activeClient.id] ?? 0) + payout.ticket }))
      setLastResult('Сделка с ' + activeClient.name + ' закрыта. Клиент разместил ' + payout.ticket.toLocaleString('ru-RU') + ' ₽. Твой бонус: +' + payout.playerBonus.toLocaleString('ru-RU') + ' ₽; доход фирмы после бонуса: +' + Math.max(0, payout.firmRevenue - payout.playerBonus).toLocaleString('ru-RU') + ' ₽. Репутация +' + (activeClient.tier >= 2 ? 5 : 4) + '.')
      setConversation((items) => [...items, { from: 'system', text: '✓ Сделка закрыта. Объём ' + payout.ticket.toLocaleString('ru-RU') + ' ₽; фирма заработала комиссию ' + payout.firmRevenue.toLocaleString('ru-RU') + ' ₽.' }])
    } else {
      playSound('decline')
      speakText('Спасибо за разговор, но я пока не готов инвестировать.', 'client')
      setReputation((value) => Math.max(0, value - 2))
      setLastResult('Сделка не состоялась. ' + activeClient.name + ' не готов доверить деньги на этих условиях. Подготовься лучше или предложи более подходящий вариант.')
      setConversation((items) => [...items, { from: 'system', text: '— Клиент отказался от сделки. Комиссия не начислена.' }])
    }
  }

  function toggleVideo() {
    const nextEnabled = !videoEnabled
    setVideoEnabled(nextEnabled)
    if (callStatus === 'active' && !videoSwitchEffectUsed) {
      const delta = nextEnabled ? 1 : -3
      setTrust((value) => Math.max(0, Math.min(100, value + delta)))
      setVideoSwitchEffectUsed(true)
      setConversation((items) => [...items, { from: 'system', text: nextEnabled ? 'Картинка восстановлена, клиенту стало немного спокойнее: доверие +1.' : 'Ты отключил камеру во время разговора. Клиент насторожился: доверие −3.' }])
    }
  }

  function answerQuestion(text: string, delta: number) {
    if (callStatus !== 'active') return
    const backgroundCaught = videoEnabled && videoBackground === 'luxury' && activeClient.statusSensitive && getVideoQuality(ownedItems) < 4 && questionIndex === 0
    const nextTrust = Math.max(0, Math.min(100, trust + delta - (backgroundCaught ? 7 : 0)))
    const nextPatience = Math.max(0, patience - 4)
    setTrust(nextTrust)
    setPatience(nextPatience)
    speakText(text, 'player')
    if (questionIndex < activeQuestions.length - 1) speakText(activeQuestions[questionIndex + 1].title, 'client')
    setConversation((items) => [...items, { from: 'you', text }, ...(backgroundCaught ? [{ from: 'system' as const, text: 'Клиент заметил несоответствие в виртуальном фоне и стал внимательнее проверять твои слова. Доверие −7.' }] : []), ...(questionIndex < activeQuestions.length - 1 ? [{ from: 'client' as const, text: questions[questionIndex + 1].title }] : [])])
    setFreeAnswer('')
    if (questionIndex >= activeQuestions.length - 1) {
      resolveCall(nextTrust, nextPatience)
    } else {
      setQuestionIndex((value) => value + 1)
      const nextTime = questionIndex === 1 ? 9 : 12
      setTimeLeft(nextTime)
      setLastPenaltySecond(nextTime)
    }
  }

  function sendFreeAnswer() {
    const text = freeAnswer.trim()
    if (!text || callStatus !== 'active') return
    const lower = text.toLowerCase()
    let delta = 0
    const positiveWords = ['риск', 'убыт', 'долг', 'денеж', 'сценар', 'гарант', 'не обещ', 'прибыл', 'контракт', 'выруч', 'зависит', 'провер']
    const riskyWords = ['гарантирую', 'точно вырастет', 'без риска', '100%', 'удво', 'не может упасть', 'всегда раст']
    if (positiveWords.some((word) => lower.includes(word))) delta += 5
    if (riskyWords.some((word) => lower.includes(word))) delta -= 13
    if (text.length < 18) delta -= 2
    if (text.length > 280) delta -= 2
    if (delta === 0) delta = -1
    answerQuestion(text, Math.max(-15, Math.min(8, delta)))
  }

  function buyRoomItem(itemId: string) {
    const item = ROOM_ITEMS.find((candidate) => candidate.id === itemId)
    if (!item || ownedItems.includes(itemId)) return
    if (day < item.minDay) { setToast('Этот предмет появится в продаже на ' + item.minDay + '-й день.'); return }
    if (cash < item.price) { setToast('Не хватает ' + (item.price - cash).toLocaleString('ru-RU') + ' ₽.'); return }
    setCash((value) => value - item.price)
    setOwnedItems((items) => [...items, itemId])
    setToast('Куплено: ' + item.name + '. Предмет добавлен в инвентарь комнаты.')
  }

  function moveToHousing(homeId: string) {
    const home = HOUSING.find((candidate) => candidate.id === homeId)
    if (!home || home.id === housingId) return
    if (day < home.minDay || reputation < home.minReputation) { setToast('Пока недоступно: требуется день ' + home.minDay + ' и репутация ' + home.minReputation + '.'); return }
    if (cash < home.price) { setToast('Не хватает ' + (home.price - cash).toLocaleString('ru-RU') + ' ₽ на переезд и депозит.'); return }
    setCash((value) => value - home.price)
    setHousingId(home.id)
    setToast('Переезд завершён: ' + home.name + '. Ежедневные расходы теперь ' + home.dailyCost.toLocaleString('ru-RU') + ' ₽.')
  }

  function endDay() {
    if (dayEnded) { setToast('Рабочий день уже завершён. Подойди к кровати и нажми E, чтобы поспать.'); return }
    playSound('notification')
    setDayEnded(true)
    setCanInteractWithComputer(false)
    setCanSleep(false)
    setPanel('room')
    setCallStatus('idle')
    setToast('Рабочий день завершён. Подойди к кровати и нажми E, чтобы лечь спать.')
    window.setTimeout(() => setToast(''), 5200)
  }

  function sleepNow() {
    if (!dayEnded) { setToast('Пока рано спать: сначала заверши рабочий день на компьютере.'); return }
    playSound('sleep')
    const nextDay = day + 1
    setDay(nextDay)
    setCallsToday(0)
    setDailyLeadIds(getDailyLeadIds(nextDay, reputation, clientLastContactDay, clientDealCounts, clientInvested))
    const dailyCosts = currentHousing.dailyCost
    const available = cash + DAILY_SALARY
    const paidCosts = Math.min(available, dailyCosts)
    const shortfall = dailyCosts - paidCosts
    const remainder = available - paidCosts
    const debtPayment = Math.min(debt, remainder)
    setCash(remainder - debtPayment)
    setDebt(Math.max(0, debt - debtPayment) + shortfall)
    const debtNote = shortfall > 0
      ? ' Просрочка по расходам: +' + shortfall.toLocaleString('ru-RU') + ' ₽ к долгу.'
      : debtPayment > 0 ? ' Погашено долга: ' + debtPayment.toLocaleString('ru-RU') + ' ₽.' : ''
    setGameMinutes(7 * 60)
    setDayEnded(false)
    setCanSleep(false)
    setToast('Доброе утро! День ' + nextDay + '. Дневной оклад +' + DAILY_SALARY.toLocaleString('ru-RU') + ' ₽ (не выплата за звонок), расходы −' + dailyCosts.toLocaleString('ru-RU') + ' ₽.' + debtNote)
    window.setTimeout(() => setToast(''), 5200)
    setPanel('room')
    setCallStatus('idle')
  }

  return (
    <main className={'game-shell' + (reducedMotion ? ' reduced-motion' : '') + (mainMenu ? ' is-main-menu' : '')}>
      {!mainMenu && introActive && <div key={day + '-wake-' + String(introActive)} className="intro-curtain" aria-label="Пробуждение"><div className="intro-eyelid intro-eyelid-top" /><div className="intro-eyelid intro-eyelid-bottom" /><div className="intro-wake-caption"><span>07:00</span><strong>Пора вставать.</strong></div></div>}
      <div className="scene-layer" aria-label="3D-комната общежития">
        <RoomScene onInteract={openComputer} onCanInteractChange={setCanInteractWithComputer} onInteractObject={interactWithRoomObject} onNearbyObjectChange={setNearbyRoomObject} introActive={introActive} onIntroComplete={finishIntro} active={!mainMenu && panel === 'room'} ownedItems={ownedItems} housingId={housingId} gameMinutes={gameMinutes} onCanSleepChange={setCanSleep} onSleepInteract={sleepNow} deskLampOn={deskLampOn} roomLightOn={roomLightOn} curtainsOpen={curtainsOpen} />
      </div>

      {mainMenu && (
        <div className="main-menu-screen">
          <div className="menu-atmosphere" />
          <div className="menu-topline">
            <div className="menu-brand"><span className="brand-mark"><TrendingUp size={20} strokeWidth={2.5} /></span><span><strong>НА ВСЕ КОТИРОВКИ</strong><small>КАРЬЕРА БРОКЕРА · САТИРИЧЕСКИЙ СИМУЛЯТОР</small></span></div>
            <div className="menu-build"><span className="live-dot" /> ОФЛАЙН-ДЕМО <i>v0.8</i></div>
          </div>
          <section className="menu-content">
            {!offlineMenu ? (
              <div className="menu-copy">
                <div className="menu-eyebrow"><span /> ТВОЯ КАРЬЕРА НАЧИНАЕТСЯ СЕЙЧАС</div>
                <h1>Большие деньги.<br /><em>Маленькая комната.</em></h1>
                <p className="menu-description">Начни с подержанного ноутбука и пары сомнительных акций. Убеди первых клиентов, заработай репутацию и построй брокерскую империю — или потеряй всё, пытаясь казаться богаче, чем ты есть.</p>
                <div className="menu-actions menu-main-actions">
                  <button className="menu-play-button" onClick={openOfflineMenu}><Play size={18} fill="currentColor" /> Играть офлайн <ArrowRight size={17} /></button>
                  <button className="menu-secondary-button menu-online-button" onClick={() => setOnlineInfo(true)}><Users size={17} /> Играть онлайн <span>СКОРО</span></button>
                  <button className="menu-secondary-button" onClick={() => setChangelogOpen(true)}><Clock3 size={17} /> История обновлений</button>
                  <button className="menu-secondary-button" onClick={() => setMenuSettings(true)}><Settings size={17} /> Настройки</button>
                </div>
                <div className="menu-footnote">ОФЛАЙН-КАРЬЕРА · СОХРАНЕНИЕ В БРАУЗЕРЕ НА ЭТОМ УСТРОЙСТВЕ</div>
              </div>
            ) : (
              <div className="menu-copy offline-select-screen">
                <button className="menu-back-button" onClick={() => setOfflineMenu(false)}><ArrowLeft size={15} /> ГЛАВНОЕ МЕНЮ</button>
                <div className="menu-eyebrow"><span /> ОФЛАЙН-КАРЬЕРА</div>
                <h1>С чего <em>начнём?</em></h1>
                <p className="menu-description">Прогресс автоматически сохраняется в этом браузере. Пока серверных аккаунтов нет, сохранение доступно только на этом устройстве и в этом браузере.</p>
                <div className="offline-save-card">
                  <div className="offline-save-icon"><Laptop size={23} /></div>
                  <div className="offline-save-copy"><strong>Твоя карьера</strong><small>{hasSavedGame ? `День ${String(day).padStart(2, '0')} · ${currentHousing.name} · ${cash.toLocaleString('ru-RU')} ₽` : 'Сохранений пока нет — самое время начать.'}</small></div>
                  <span className={'offline-save-status' + (hasSavedGame ? ' saved' : '')}>{hasSavedGame ? 'СОХРАНЕНО' : 'ПУСТО'}</span>
                </div>
                <div className="offline-menu-actions">
                  <button className="menu-play-button" onClick={enterOfflineGame} disabled={!hasSavedGame}><Play size={17} fill="currentColor" /> Загрузить игру <ArrowRight size={16} /></button>
                  <button className="menu-secondary-button" onClick={startNewGame}><RotateCcw size={16} /> Новая карьера</button>
                </div>
                <p className="offline-save-note">{hasSavedGame ? 'Загрузка продолжит последнее сохранение.' : 'Сначала создай карьеру. После начала игры она будет сохраняться автоматически.'}</p>
              </div>
            )}
            <div className="menu-scene-caption">
              <span className="caption-line" />
              <div><strong>ДЕНЬ {String(day).padStart(2, '0')} / {currentHousing.name.toUpperCase()}</strong><small>Твой первый офис — пока что чужая комната.</small></div>
            </div>
          </section>
          <div className="menu-bottomline"><span><Gamepad2 size={15} /> WASD · МЫШЬ · ПЕРЕГОВОРЫ · КАРЬЕРА</span><span>НЕФИНАНСОВЫЙ СОВЕТ. НЕ СОВСЕМ ЧЕСТНЫЕ БРОКЕРЫ.</span></div>
          {menuSettings && <div className="menu-modal-backdrop" onClick={() => setMenuSettings(false)}><section className="menu-settings-modal" onClick={(event) => event.stopPropagation()}><button className="menu-modal-close" onClick={() => setMenuSettings(false)} aria-label="Закрыть настройки"><X size={18} /></button><span className="menu-eyebrow"><Settings size={14} /> ПАРАМЕТРЫ ИГРЫ</span><h2>Настройки</h2><div className="settings-row"><span><strong>Звуковые эффекты</strong><small>Кнопки, шаги, компьютер и действия в комнате.</small></span><button className={'settings-toggle' + (soundEnabled ? ' on' : '')} onClick={() => setSoundEnabled((value) => !value)} aria-pressed={soundEnabled}>{soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Шум города и дождь</strong><small>Тихий процедурный фон; за закрытыми шторами звучит тише.</small></span><button className={'settings-toggle' + (ambienceEnabled ? ' on' : '')} onClick={() => setAmbienceEnabled((value) => !value)} aria-pressed={ambienceEnabled}>{ambienceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Озвучка переговоров</strong><small>Синтез речи на устройстве; голоса зависят от браузера.</small></span><button className={'settings-toggle' + (voiceEnabled ? ' on' : '')} onClick={() => setVoiceEnabled((value) => !value)} aria-pressed={voiceEnabled}>{voiceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Уменьшить анимации</strong><small>Отключает декоративные движения интерфейса.</small></span><button className={'settings-toggle' + (reducedMotion ? ' on' : '')} onClick={toggleReducedMotion} aria-pressed={reducedMotion}>{reducedMotion ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Сохранение</strong><small>Прогресс карьеры хранится локально в браузере.</small></span><span className="settings-local-save">ЛОКАЛЬНО</span></div><button className="menu-modal-done" onClick={() => setMenuSettings(false)}>Готово <ArrowRight size={16} /></button></section></div>}
          {confirmNewCareer && <div className="menu-modal-backdrop" onClick={() => setConfirmNewCareer(false)}><section className="menu-settings-modal confirm-career-modal" onClick={(event) => event.stopPropagation()}><span className="menu-eyebrow"><RotateCcw size={14} /> НОВОЕ НАЧАЛО</span><h2>Начать новую карьеру?</h2><p className="online-info-copy">Текущее сохранение будет удалено с этого устройства. Это действие нельзя отменить.</p><div className="confirm-career-actions"><button className="menu-secondary-button" onClick={() => setConfirmNewCareer(false)}>Отмена</button><button className="menu-play-button" onClick={confirmStartNewGame}>Начать заново <ArrowRight size={16} /></button></div></section></div>}
          {changelogOpen && <div className="menu-modal-backdrop" onClick={() => setChangelogOpen(false)}><section className="menu-settings-modal changelog-modal" onClick={(event) => event.stopPropagation()}><button className="menu-modal-close" onClick={() => setChangelogOpen(false)} aria-label="Закрыть историю обновлений"><X size={18} /></button><span className="menu-eyebrow"><Clock3 size={14} /> ЖУРНАЛ РАЗРАБОТКИ</span><h2>История обновлений</h2><div className="changelog-list"><article className="changelog-entry current"><div className="changelog-version"><strong>v0.5.0</strong><span>В РАБОТЕ</span></div><h3>Первые шаги к полноценной игре</h3><ul><li>Вступительная сцена пробуждения и временные подсказки управления.</li><li>Улучшение взаимодействия с компьютером и столкновений в комнате.</li><li>Стартовый экран компьютера превращён в рабочий стол с иконками приложений.</li><li>Начата визуальная переработка видеопереговоров.</li></ul></article><article className="changelog-entry"><div className="changelog-version"><strong>v0.4.0</strong><span>ПРОТОТИП</span></div><h3>Стартовое меню и локальная карьера</h3><ul><li>Добавлены офлайн-режим, экран загрузки сохранения и создание новой карьеры.</li><li>Добавлены настройки и заглушка будущего онлайн-режима.</li><li>Прогресс сохраняется в браузере на этом устройстве.</li></ul></article></div><p className="changelog-note">Здесь будут появляться заметки к каждой опубликованной версии.</p><button className="menu-modal-done" onClick={() => setChangelogOpen(false)}>Назад в меню</button></section></div>}
          {onlineInfo && <div className="menu-modal-backdrop" onClick={() => setOnlineInfo(false)}><section className="menu-settings-modal online-info-modal" onClick={(event) => event.stopPropagation()}><button className="menu-modal-close" onClick={() => setOnlineInfo(false)} aria-label="Закрыть окно"><X size={18} /></button><span className="menu-eyebrow"><Users size={14} /> СЕТЕВАЯ КАРЬЕРА</span><h2>Онлайн появится позже</h2><p className="online-info-copy">Сначала доведём до ума одиночную карьеру. Затем добавим аккаунты и серверные сохранения, таблицы лидеров и соревнования с друзьями. Сейчас онлайн-режим ещё не подключён.</p><div className="online-roadmap"><span><Check size={15} /> Локальная карьера</span><span><Clock3 size={15} /> Сервер и аккаунты — в разработке</span><span><Users size={15} /> Соревнования — позже</span></div><button className="menu-modal-done" onClick={() => setOnlineInfo(false)}>Понятно</button></section></div>}
        </div>
      )}

      {!mainMenu && <>
      <header className="top-hud">
        <button className="brand-lockup" onClick={() => { setPanel('room'); setCallStatus('idle') }} aria-label="Вернуться в комнату">
          <span className="brand-mark"><TrendingUp size={20} strokeWidth={2.5} /></span>
          <span className="brand-text"><strong>НА ВСЕ КОТИРОВКИ</strong><small>БРОКЕРСКАЯ СИМУЛЯЦИЯ</small></span>
        </button>
        <div className="hud-center">
          <span className="day-pill"><CalendarDays size={13} /> ДЕНЬ {String(day).padStart(2, '0')}</span><span className="day-pill game-time-pill"><Clock3 size={13} /> {String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</span><span className="day-pill game-weather-pill">☂ ДОЖДЬ</span>
          <span className="market-open"><span className="live-dot" /> РЫНОК ОТКРЫТ</span>
        </div>
        <div className="hud-right">
          <div className="hud-stat"><Wallet size={15} /><span><small>ЛИЧНЫЕ СРЕДСТВА</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></span></div>
          <div className="hud-stat workday-stat"><CalendarDays size={15} /><span><small>ЗВОНКИ СЕГОДНЯ</small><strong>{callsToday}/{reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2}</strong></span></div><div className="hud-stat reputation-stat"><ShieldAlert size={15} /><span><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></span></div>
          {debt > 0 && <div className="hud-stat debt-stat"><ShieldAlert size={15} /><span><small>ДОЛГ</small><strong>{debt.toLocaleString('ru-RU')} ₽</strong></span></div>}<button className="hud-pause-button" onClick={() => setPauseOpen(true)} aria-label="Открыть паузу"><span>Ⅱ</span> Пауза</button>
        </div>
      </header>

      {/* Contextual E prompts replace the fixed room-control dock. */}

      {panel === 'room' && (
        <>
          {controlsVisible && <div className="control-hint control-hint-temporary"><div className="key-cluster"><kbd>W</kbd><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div><span>ПЕРЕДВИЖЕНИЕ</span><i /><div className="mouse-hint"><span className="mouse-icon" /></div><span>ОБЗОР</span></div>}
          {canSleep && dayEnded ? <button className="interact-card proximity-interact sleep-interact" onClick={sleepNow}><span className="enter-key">E</span><span className="interact-copy"><strong>Лечь спать</strong><em>Отдохнуть и начать новый день</em></span><ChevronRight size={17} /></button> : nearbyRoomObject ? <button className="interact-card proximity-interact" onClick={() => interactWithRoomObject(nearbyRoomObject)}><span className="enter-key">E</span><span className="interact-copy"><strong>{nearbyRoomObject === 'lamp' ? `Настольная лампа · ${deskLampOn ? 'выключить' : 'включить'}` : nearbyRoomObject === 'light' ? `Освещение комнаты · ${roomLightOn ? 'выключить' : 'включить'}` : nearbyRoomObject === 'curtains' ? `Шторы · ${curtainsOpen ? 'закрыть' : 'открыть'}` : 'Открыть шкаф и гардероб'}</strong><em>{nearbyRoomObject === 'wardrobe' ? 'Одежда и внешний вид персонажа' : 'Нажми E, чтобы взаимодействовать'}</em></span><ChevronRight size={17} /></button> : canInteractWithComputer && <button className="interact-card proximity-interact" onClick={openComputer}><span className="enter-key">E</span><span className="interact-copy"><strong>Сесть за компьютер</strong><em>Нажми E, чтобы начать работу</em></span><ChevronRight size={17} /></button>}
        </>
      )}

      {panel === 'computer' && (
        <div className="computer-overlay os-shell">
          <div className="computer-topbar os-topbar">
            <button className="back-button" onClick={() => { setPanel('room'); setCallStatus('idle'); setPauseOpen(false) }}><ArrowLeft size={16} /> В комнату</button>
            <div className="os-topbar-center"><span className="os-status-dot" /> Рабочая станция · {String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</div>
            <button className="os-pause-button" onClick={() => setPauseOpen(true)}><span>Ⅱ</span> Пауза</button>
          </div>
          <div className={'terminal-body os-terminal-body ' + (tab === 'overview' ? 'desktop-home-body' : '') + (tab === 'calls' && callStatus === 'active' ? ' immersive-call-body' : '')}>
            <aside className="terminal-sidebar">
              <div className="profile-card">
                <div className="avatar">БР</div><div><strong>Младший брокер</strong><small>Стажёр · 1-й день</small></div><span className="online-indicator" />
              </div>
              <div className="side-section-label">РАБОЧИЙ СТОЛ</div>
              <button className={tab === 'overview' ? 'side-link active' : 'side-link'} onClick={() => setTab('overview')}><Activity size={17} /> Обзор дня <span className="side-dot" /></button>
              <button className={tab === 'market' ? 'side-link active' : 'side-link'} onClick={() => setTab('market')}><TrendingUp size={17} /> Биржевой терминал</button>
              <button className={tab === 'news' ? 'side-link active' : 'side-link'} onClick={() => setTab('news')}><Newspaper size={17} /> Лента новостей <span className="nav-count">3</span></button>
              <button className={tab === 'calls' ? 'side-link active' : 'side-link'} onClick={() => setTab('calls')}><Headphones size={17} /> Клиенты и звонки {callStatus === 'active' && <span className="nav-live">LIVE</span>}</button>
              <button className={tab === 'clients' ? 'side-link active' : 'side-link'} onClick={() => setTab('clients')}><Users size={17} /> База клиентов <span className="nav-count">{availableClients.length}</span></button>
              <button className={tab === 'shop' ? 'side-link active' : 'side-link'} onClick={() => setTab('shop')}><ShoppingBag size={17} /> Магазин комнаты</button>
              <button className={tab === 'housing' ? 'side-link active' : 'side-link'} onClick={() => setTab('housing')}><House size={17} /> Жильё</button>
              <div className="sidebar-spacer" />
              <div className="side-account"><div className="account-row"><span>Деньги</span><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div className="mini-meter"><span style={{ width: Math.min(100, cash / 300) + '%' }} /></div><div className="account-row"><span>Репутация</span><strong>{reputation}%</strong></div><div className="mini-meter reputation-meter"><span style={{ width: reputation + '%' }} /></div><div className="account-row"><span>Капитал фирмы</span><strong>{firmCapital.toLocaleString('ru-RU')} ₽</strong></div><div className="account-row"><span>Долг / просрочка</span><strong className={debt > 0 ? 'debt-value' : ''}>{debt.toLocaleString('ru-RU')} ₽</strong></div></div>
              <button className="end-day-button" onClick={endDay}><Power size={15} /> Завершить день</button>
            </aside>

            <section className={'terminal-content os-window ' + (tab === 'overview' ? 'os-window-desktop' : '') + (windowMaximized && tab !== 'overview' ? ' os-window-maximized' : '') + (windowMinimized ? ' os-window-minimized' : '')} style={tab === 'overview' || windowMaximized ? undefined : { transform: `translate(${windowOffset.x}px, ${windowOffset.y}px)` }}>
              {tab !== 'overview' && <div className="os-window-titlebar" onPointerDown={(event) => { if (windowMaximized || (event.target as HTMLElement).closest('button')) return; dragWindowRef.current = { x: event.clientX, y: event.clientY, originX: windowOffset.x, originY: windowOffset.y } }}><span className={'os-window-app-icon ' + tab}>{tab === 'market' ? <TrendingUp size={15} /> : tab === 'news' ? <Newspaper size={15} /> : tab === 'calls' ? <Video size={15} /> : tab === 'clients' ? <Users size={15} /> : tab === 'shop' ? <ShoppingBag size={15} /> : <House size={15} />}</span><strong>{tab === 'market' ? 'Биржа' : tab === 'news' ? 'Новости' : tab === 'calls' ? 'Видеозвонки и клиенты' : tab === 'clients' ? 'База клиентов' : tab === 'shop' ? 'Магазин и гардероб' : 'Недвижимость'}</strong><div className="os-window-controls"><button aria-label="Свернуть окно" onClick={() => setWindowMinimized(true)}>—</button><button aria-label={windowMaximized ? 'Восстановить окно' : 'На весь экран'} onClick={() => setWindowMaximized((value) => !value)}>□</button><button aria-label="Закрыть окно" onClick={() => { setTab('overview'); setWindowMinimized(false); setWindowMaximized(false); setWindowOffset({ x: 0, y: 0 }) }}>×</button></div></div>}
              {windowMinimized && tab !== 'overview' ? <div className="os-minimized-placeholder"><Laptop size={24} /><strong>Окно свёрнуто</strong><button onClick={() => setWindowMinimized(false)}>Восстановить окно</button></div> : null}
              {!windowMinimized && tab === 'overview' && (
                <div className="desktop-page">
                  <div className="desktop-wallpaper-glow" />
                  <div className="desktop-greeting"><span className="desktop-system-label"><span className="live-dot" /> ЛИЧНЫЙ КОМПЬЮТЕР</span><h2>{gameMinutes < 12 * 60 ? 'Доброе утро.' : gameMinutes < 18 * 60 ? 'Хорошего дня.' : 'Добрый вечер.'}</h2><p>День {String(day).padStart(2, '0')} · {currentHousing.name} · {String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</p></div>
                  <div className="desktop-app-grid">
                    <button className="desktop-app-icon" onClick={() => setTab('market')}><span className="desktop-icon-tile market-app"><TrendingUp size={23} /></span><strong>Биржа</strong></button>
                    <button className="desktop-app-icon" onClick={() => setTab('news')}><span className="desktop-icon-tile news-app"><Newspaper size={23} /></span><strong>Новости</strong><small>Сводка рынка</small></button>
                    <button className="desktop-app-icon" onClick={() => setTab('calls')}><span className="desktop-icon-tile calls-app"><Video size={23} /></span><strong>Видеозвонки</strong>{callStatus === 'active' && <i>LIVE</i>}</button>
                    <button className="desktop-app-icon" onClick={() => setTab('clients')}><span className="desktop-icon-tile clients-app"><Users size={23} /></span><strong>Клиенты</strong><small>{availableClients.length} лидов</small></button>
                    <button className="desktop-app-icon" onClick={() => setTab('shop')}><span className="desktop-icon-tile shop-app"><ShoppingBag size={23} /></span><strong>Магазин</strong><small>Рабочее место</small></button>
                    <button className="desktop-app-icon" onClick={() => setTab('housing')}><span className="desktop-icon-tile housing-app"><House size={23} /></span><strong>Недвижимость</strong></button>
                  </div>
                  <div className="desktop-bottom-widgets">
                    <div className="desktop-widget daily-task-widget"><div className="desktop-widget-heading"><span><Sparkles size={15} /> СЕГОДНЯ</span><span>ДЕНЬ {day}</span></div><h3>Сначала разберись в рынке</h3><p>Посмотри компанию и новости, затем позвони клиенту. Не обещай доходность, которую не можешь гарантировать.</p><div className="desktop-task-actions"><button onClick={() => setTab('market')}>Изучить рынок <ArrowRight size={14} /></button><button disabled={availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)} onClick={startCall}>Позвонить клиенту <Phone size={14} /></button></div></div>
                    <div className="desktop-widget desktop-finances"><div className="desktop-widget-heading"><span><Wallet size={15} /> МОИ ФИНАНСЫ</span><span className="desktop-account-status">ЛОКАЛЬНО</span></div><strong>{cash.toLocaleString('ru-RU')} ₽</strong><small>Личные деньги</small><div className="desktop-finance-row"><span>Репутация</span><b>{reputation}/100</b></div><div className="desktop-finance-track"><span style={{ width: reputation + '%' }} /></div><div className="desktop-finance-row"><span>Капитал фирмы</span><b>{firmCapital.toLocaleString('ru-RU')} ₽</b></div><button className="desktop-end-day" onClick={endDay}>Завершить рабочий день <ArrowRight size={14} /></button></div>
                  </div>
                  <div className="desktop-preview-widgets"><div className="desktop-preview-chart"><div><span className="preview-window-label">КОТИРОВКИ · KOTL</span><strong>Котолёт <em>+3,4%</em></strong></div><svg viewBox="0 0 260 64" preserveAspectRatio="none" aria-label="Предварительный график акций"><path d="M0 49 L18 42 L35 46 L53 31 L70 36 L88 20 L105 27 L123 16 L140 31 L158 23 L175 29 L194 12 L211 20 L230 8 L260 14" fill="none" stroke="#63e6ae" strokeWidth="2.5"/><path d="M0 49 L18 42 L35 46 L53 31 L70 36 L88 20 L105 27 L123 16 L140 31 L158 23 L175 29 L194 12 L211 20 L230 8 L260 14 L260 64 L0 64Z" fill="#63e6ae" opacity=".1"/></svg><small>Демо-данные · график реагирует на события рынка в игре</small></div><div className="desktop-preview-call"><div className="preview-call-avatar">К</div><div><span className="preview-window-label">ВИДЕОЗВОНКИ</span><strong>{callStatus === 'active' ? 'Идёт переговоры' : 'Клиент ждёт звонка'}</strong><small>{callStatus === 'active' ? activeClient.name : availableClients[0]?.name ?? 'Нет доступных клиентов'}</small></div><button onClick={() => setTab('calls')}><Video size={15} /> Открыть</button></div></div><div className="desktop-taskbar"><button className="taskbar-start" onClick={() => { setTab('overview'); setWindowMinimized(false); setWindowMaximized(false) }}><TrendingUp size={15} /> ПУСК</button><span><span className="live-dot" /> Рынок открыт</span><span>{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</span></div>
                </div>
              )}

              {!windowMinimized && tab === 'market' && (
                <div className="market-page">
                  <div className="page-heading"><div><div className="eyebrow">РЫНОК · ИГРОВОЙ МИР</div><h2>Биржевой терминал</h2><p>Все компании и показатели вымышлены. Анализируй бизнес, а не только цвет графика.</p></div><div className="market-status"><span className="live-dot" /> ОТКРЫТО</div></div>
                  <div className="market-summary"><div><small>ИНДЕКС УСЛОВНОГО РЫНКА</small><strong>1 842,76 <em>+1,28%</em></strong></div><div className="sparkline"><svg viewBox="0 0 250 55" preserveAspectRatio="none"><path d="M0 42 L18 37 L31 43 L47 28 L60 33 L77 22 L91 30 L108 16 L126 23 L142 10 L158 18 L176 13 L191 22 L210 8 L226 14 L250 3" fill="none" stroke="#35d6a0" strokeWidth="2.2" /><path d="M0 42 L18 37 L31 43 L47 28 L60 33 L77 22 L91 30 L108 16 L126 23 L142 10 L158 18 L176 13 L191 22 L210 8 L226 14 L250 3 L250 55 L0 55Z" fill="url(#sparkFill)" opacity=".18" /><defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#35d6a0" /><stop offset="1" stopColor="#35d6a0" stopOpacity="0" /></linearGradient></defs></svg></div></div>
                  <div className="company-table"><div className="table-header"><span>КОМПАНИЯ</span><span>ЦЕНА</span><span>ИЗМЕНЕНИЕ</span><span>ДЕЙСТВИЕ</span></div>{companies.map((company) => <div className={selectedCompany === company.ticker ? 'company-row selected' : 'company-row'} key={company.ticker} onClick={() => setSelectedCompany(company.ticker)}><div className="company-name"><span className={'company-logo ' + company.ticker.toLowerCase()}>{company.ticker.slice(0, 2)}</span><span><strong>{company.name}</strong><small>{company.sector} · {company.ticker}</small></span></div><strong className="price">{company.price}</strong><span className={company.positive ? 'change positive' : 'change negative'}>{company.change}</span><button className="row-action" onClick={(event) => { event.stopPropagation(); setSelectedCompany(company.ticker) }}>{selectedCompany === company.ticker ? 'Выбрана' : 'Изучить'}</button></div>)}</div>
                  <div className="company-detail"><div className="detail-top"><div><span className="eyebrow">КАРТОЧКА ЭМИТЕНТА · {companies.find((c) => c.ticker === selectedCompany)?.ticker}</span><h3>{activeCompany.name}</h3><p>{activeCompany.sector}</p><p className="company-description">{activeCompany.description}</p></div><div className="detail-price"><strong>{companies.find((c) => c.ticker === selectedCompany)?.price}</strong><span className={companies.find((c) => c.ticker === selectedCompany)?.positive ? 'positive' : 'negative'}>{companies.find((c) => c.ticker === selectedCompany)?.change}</span></div></div><div className="detail-stats"><div><small>КАПИТАЛИЗАЦИЯ</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.cap}</strong></div><div><small>ВЫРУЧКА</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.revenue}</strong></div><div><small>ЧИСТАЯ ПРИБЫЛЬ</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.profit}</strong></div><div><small>УРОВЕНЬ РИСКА</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.risk}</strong></div></div><div className="company-pros-cons"><div><strong>Преимущества</strong><p>{activeCompany.advantages}</p></div><div><strong>Риски и недостатки</strong><p>{activeCompany.risks}</p></div></div><div className="detail-disclaimer"><ShieldAlert size={15} /> Рост цены не гарантирует прибыль. Сверяй выручку, прибыль, долг и новости.</div></div>
                </div>
              )}

              {!windowMinimized && tab === 'news' && (
                <div className="news-page"><div className="page-heading"><div><div className="eyebrow">ИНФОРМАЦИОННОЕ АГЕНТСТВО «СЛУХИ И ФАКТЫ»</div><h2>Лента новостей</h2><p>Новости могут изменить отношение клиента к компании прямо во время звонка.</p></div><div className="market-status"><span className="live-dot" /> LIVE FEED</div></div><div className="news-list">{news.map((item) => <article className="news-card" key={item.title}><div className="news-card-top"><span className={'news-tag ' + item.tone}>{item.tag}</span><time>{item.time}</time></div><h3>{item.title}</h3><p>{item.body}</p><button onClick={() => { setSelectedCompany(item.tag === 'ТАПОКТЕХ' ? 'TAPK' : 'KOTL'); setTab('market') }}>Открыть компанию <ArrowUpRight size={14} /></button></article>)}</div><div className="bottom-note"><Newspaper size={16} /><span>Проверяй источник и отделяй подтверждённые факты от слухов. В этом мире заголовок может быть громче отчётности.</span></div></div>
              )}

              {!windowMinimized && tab === 'clients' && (
                <div className="clients-page">
                  <div className="page-heading"><div><div className="eyebrow">ОТДЕЛ ПРОДАЖ · CRM</div><h2>Клиенты и возможности</h2><p>Список растёт по мере карьеры. Больший капитал означает более высокие требования, а не гарантированную сделку.</p></div><div className="market-status"><Users size={14} /> {availableClients.length} ДОСТУПНО</div></div>
                  <div className="economy-summary"><div><small>ТВОИ СРЕДСТВА</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div><div><small>ЗАКРЫТО СДЕЛОК</small><strong>{deals}</strong></div></div>
                  <div className="client-card-list">{availableClients.length === 0 && <div className="no-leads-card"><Users size={24} /><h3>Пока нет новых лидов</h3><p>Контакт не повторяется каждый день. После звонка клиент может вернуться через несколько игровых дней; новые уровни открываются по дню карьеры и репутации.</p></div>}{availableClients.map((client) => <article className={selectedClientId === client.id ? 'client-opportunity selected' : 'client-opportunity'} key={client.id}><div className="opportunity-avatar">{client.initials}</div><div className="opportunity-main"><div className="opportunity-top"><span className="eyebrow">УРОВЕНЬ {client.tier} · {client.source.toUpperCase()}</span><span className="opportunity-capital">{client.budget.toLocaleString('ru-RU')} ₽</span></div><h3>{client.name}</h3><p>{client.age} лет · {client.profession}</p><div className="opportunity-tags"><span>{client.temperament}</span><span>{client.experience}</span><span>Ожидаемый ордер до {client.ticket.toLocaleString('ru-RU')} ₽</span></div><blockquote>{client.quote}</blockquote><small className="opportunity-goal">ЦЕЛЬ: {client.goal}</small></div><div className="opportunity-actions"><button className={selectedClientId === client.id ? 'secondary-action' : 'primary-action'} onClick={() => { setSelectedClientId(client.id); setToast('Выбран клиент: ' + client.name) }}>{selectedClientId === client.id ? 'Выбран' : 'Выбрать'}</button><button className="secondary-action" onClick={() => { setSelectedClientId(client.id); setTab('calls') }}>К звонку <ChevronRight size={14} /></button></div></article>)}</div>
                  <div className="bottom-note"><ShieldAlert size={16} /><span><strong>Важно:</strong> деньги в карточке — капитал клиента, а не твоя выручка. Ты получаешь только личный бонус от сделки.</span></div>
                </div>
              )}

              {!windowMinimized && tab === 'shop' && (
                <div className="shop-page">
                  <div className="page-heading"><div><div className="eyebrow">ИНВЕНТАРЬ · ОБОРУДОВАНИЕ</div><h2>Улучши рабочее место</h2><p>Техника улучшает качество звонков и первое впечатление. Она не заменяет знания и честные ответы.</p></div><div className="market-status"><ShoppingBag size={14} /> {cash.toLocaleString('ru-RU')} ₽</div></div>
                  <div className="economy-summary"><div><small>ЛИЧНЫЕ ДЕНЬГИ</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div><small>УСТАНОВЛЕНО ПРЕДМЕТОВ</small><strong>{ownedItems.length}</strong></div><div><small>КАЧЕСТВО ВИДЕО</small><strong>{getVideoQuality(ownedItems)}/8</strong></div></div>
                  <div className="wardrobe-studio"><div className="wardrobe-character-stage"><span className="wardrobe-light" /><div className={'wardrobe-character outfit-' + selectedOutfit}><span className="wardrobe-hair" /><span className="wardrobe-head"><i /><i /><b /></span><span className="wardrobe-neck" /><span className={'wardrobe-shirt outfit-' + selectedOutfit}><i /><i /></span><span className="wardrobe-arm left" /><span className="wardrobe-arm right" /><span className="wardrobe-pants"><i /><i /></span><span className="wardrobe-shoe left" /><span className="wardrobe-shoe right" /></div><span className="wardrobe-stage-label">ПРЕДПРОСМОТР ПЕРСОНАЖА</span></div><div className="wardrobe-studio-copy"><span className="eyebrow">ГАРДЕРОБ · ПЕРСОНАЖ</span><h3>Твой брокерский образ</h3><p>Сейчас на тебе базовая одежда стажёра. Покупки пока улучшают комнату и качество видеосвязи; следующий шаг — отдельная система одежды и смены внешности.</p><div className="wardrobe-look-tags"><span>Базовая футболка</span><span>Тёмные брюки</span><span>Повседневный стиль</span></div></div></div>
                  <section className="outfit-selector"><div className="outfit-selector-heading"><div><span className="eyebrow">ГАРДЕРОБ</span><h3>Одежда персонажа</h3></div><span>На тебе: {OUTFITS.find((outfit) => outfit.id === selectedOutfit)?.name}</span></div><div className="outfit-grid">{OUTFITS.map((outfit) => { const owned = ownedOutfits.includes(outfit.id); const wearing = selectedOutfit === outfit.id; const canAfford = cash >= outfit.price; return <article className={'outfit-card outfit-' + outfit.id + (wearing ? ' wearing' : '')} key={outfit.id}><div className="outfit-swatch"><span className="outfit-swatch-head" /><span className="outfit-swatch-body" /><span className="outfit-swatch-legs" /></div><div className="outfit-card-copy"><strong>{outfit.name}</strong><p>{outfit.description}</p><small>{outfit.price === 0 ? 'Стартовый комплект' : outfit.price.toLocaleString('ru-RU') + ' ₽'}</small></div><button disabled={wearing || (!owned && !canAfford)} onClick={() => { if (owned) { setSelectedOutfit(outfit.id); playSound('ui'); return } setCash((value) => value - outfit.price); setOwnedOutfits((value) => [...value, outfit.id]); setSelectedOutfit(outfit.id); playSound('deal'); setToast('Новый образ добавлен в гардероб') }}>{wearing ? 'На тебе' : owned ? 'Надеть' : canAfford ? 'Купить' : 'Не хватает денег'}</button></article> })}</div></section>
                  <div className="shop-grid">{ROOM_ITEMS.map((item) => { const owned = ownedItems.includes(item.id); const locked = day < item.minDay; return <article className={owned ? 'shop-item owned' : 'shop-item'} key={item.id}><div className={'shop-item-icon ' + item.category}>{item.category === 'video' ? <Camera size={21} /> : item.category === 'background' ? <Video size={21} /> : item.category === 'work' ? <Monitor size={21} /> : <PackageCheck size={21} />}</div><div className="shop-item-meta"><span className="eyebrow">{item.category === 'video' ? 'ВИДЕОСВЯЗЬ' : item.category === 'background' ? 'ФОН' : item.category === 'work' ? 'РАБОТА' : 'КОМФОРТ'}</span><strong>{item.name}</strong><p>{item.description}</p></div><div className="shop-item-footer"><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={owned || locked || cash < item.price} className={owned ? 'secondary-action' : 'primary-action'} onClick={() => buyRoomItem(item.id)}>{owned ? 'Куплено' : locked ? 'С ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает' : 'Купить'}</button></div></article> })}</div>
                  <div className="bottom-note"><Sparkles size={16} /><span>Установленные предметы сохраняются. Бонус от внешнего вида ограничен: подготовка к звонку и качество ответов важнее дорогого оборудования.</span></div>
                </div>
              )}

              {!windowMinimized && tab === 'housing' && (
                <div className="housing-page">
                  <div className="page-heading"><div><div className="eyebrow">ОБРАЗ ЖИЗНИ · ЖИЛЬЁ</div><h2>Следующий адрес — твой выбор</h2><p>Больше приватности и статуса, но и постоянные расходы. Не переезжай, если после депозита не останется резерва.</p></div><div className="market-status"><House size={14} /> {currentHousing.name.toUpperCase()}</div></div>
                  <div className="current-home-banner"><div className="home-symbol"><House size={28} /></div><div><span className="eyebrow">ТЕКУЩЕЕ ЖИЛЬЁ</span><h3>{currentHousing.name}</h3><p>{currentHousing.description}</p></div><div className="home-cost"><small>РАСХОДЫ / ДЕНЬ</small><strong>{currentHousing.dailyCost.toLocaleString('ru-RU')} ₽</strong></div></div>
                  <div className="housing-list">{HOUSING.map((home, index) => { const current = home.id === housingId; const locked = day < home.minDay || reputation < home.minReputation; return <article className={current ? 'housing-option current' : 'housing-option'} key={home.id}><div className="housing-rank">0{index + 1}</div><div className="housing-option-main"><span className="eyebrow">УРОВЕНЬ ЖИЛЬЯ {index}</span><h3>{home.name}</h3><p>{home.description}</p><div className="housing-effects"><span>Первое впечатление {home.firstImpression > 0 ? '+' : ''}{home.firstImpression}</span><span>Комфорт +{home.comfort}</span></div></div><div className="housing-option-buy"><strong>{home.price === 0 ? 'Стартовое' : home.price.toLocaleString('ru-RU') + ' ₽'}</strong><small>{home.dailyCost.toLocaleString('ru-RU')} ₽ / день</small><button disabled={current || locked || cash < home.price} className={current ? 'secondary-action' : 'primary-action'} onClick={() => moveToHousing(home.id)}>{current ? 'Текущее жильё' : locked ? 'Пока закрыто' : cash < home.price ? 'Нужно накопить' : 'Переехать'}</button></div></article> })}</div>
                  <div className="bottom-note"><Wallet size={16} /><span>Оклад за рабочий день — {DAILY_SALARY.toLocaleString('ru-RU')} ₽. Перед переездом сравни его с ежедневными расходами: дорогой адрес может съесть весь доход.</span></div>
                </div>
              )}

              {!windowMinimized && tab === 'calls' && (
                <div className="calls-page">
                  <div className="page-heading"><div><div className="eyebrow">ОТДЕЛ ПРОДАЖ · ЛИНИЯ 01</div><h2>Клиенты и звонки</h2><p>Доверие нельзя купить. Но можно потерять за одну фразу.</p></div><div className={callStatus === 'active' ? 'call-live-badge active' : 'call-live-badge'}><span className="live-dot" /> {callStatus === 'active' ? 'ЗВОНОК ИДЁТ' : 'ЛИНИЯ СВОБОДНА'}</div></div>
                  {callStatus === 'idle' && <div className="precall-briefing">
                    <div className="call-planning-section"><div className="call-planning-heading"><span className="eyebrow">ШАГ 1 · ВЫБЕРИ КЛИЕНТА</span><strong>Кому сегодня предложим инвестицию?</strong><small>Закрытые клиенты откроются с ростом репутации и прогрессом карьеры.</small></div><div className="call-client-picker">{CLIENTS.map((client) => { const unlocked = availableClients.some((candidate) => candidate.id === client.id); return <button key={client.id} disabled={!unlocked} className={'call-client-option' + (selectedClientId === client.id ? ' selected' : '') + (!unlocked ? ' locked' : '')} onClick={() => setSelectedClientId(client.id)}><span className="call-client-avatar">{unlocked ? client.initials : '🔒'}</span><span className="call-client-option-copy"><strong>{client.name}</strong><small>{unlocked ? client.profession + ' · уровень ' + client.tier : 'Пока недоступен'}</small><em>{unlocked ? 'Капитал до ' + client.budget.toLocaleString('ru-RU') + ' ₽' : 'Развивай карьеру'}</em></span></button>})}</div><div className="call-planning-heading stock-planning-heading"><span className="eyebrow">ШАГ 2 · ВЫБЕРИ АКЦИЮ</span><strong>Что предложим клиенту?</strong><small>Выбор бумаги влияет на первое впечатление и риск сделки. Изучи карточку в приложении «Биржа».</small></div><div className="call-stock-picker">{companies.map((company) => <button key={company.ticker} className={'call-stock-option' + (selectedCompany === company.ticker ? ' selected' : '')} onClick={() => setSelectedCompany(company.ticker)}><span className={'company-logo ' + company.ticker.toLowerCase()}>{company.ticker.slice(0, 2)}</span><span><strong>{company.name}</strong><small>{company.sector} · риск {company.risk.toLowerCase()}</small></span><em className={company.positive ? 'positive' : 'negative'}>{company.change}</em></button>)}</div></div><div className="briefing-copy"><span className="eyebrow">ПОДГОТОВКА К ПЕРЕГОВОРАМ</span><strong>Сначала факты — потом обещания</strong><p>Изучи компанию и свежие новости. За каждый просмотренный раздел получишь +4 к начальному доверию клиента.</p></div>
                    <div className="briefing-actions">
                      <button className={marketReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('market')}><TrendingUp size={15} /><span><strong>Отчёт компании</strong><small>{marketReviewed ? 'Изучено · +4 доверия' : 'Финансы и риски'}</small></span><span className="briefing-check">{marketReviewed ? '✓' : '↗'}</span></button>
                      <button className={newsReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('news')}><Newspaper size={15} /><span><strong>Новости рынка</strong><small>{newsReviewed ? 'Изучено · +4 доверия' : 'Катализаторы и угрозы'}</small></span><span className="briefing-check">{newsReviewed ? '✓' : '↗'}</span></button>
                    </div>
                    <div className="briefing-total"><span>Бонус подготовки</span><strong>+{(marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0)} доверия</strong></div>
                  </div>}
                  {callStatus === 'idle' && <div className="background-selector"><div className="background-selector-copy"><span className="eyebrow">ТВОЙ ОБРАЗ В КАДРЕ</span><p>Фон влияет на первое впечатление. Виртуальный офис может насторожить опытного клиента, если качество маски слабое.</p></div><div className="background-options"><button className={videoBackground === 'real' ? 'selected' : ''} onClick={() => setVideoBackground('real')}>Реальная комната</button><button disabled={!ownedItems.includes('neutral-backdrop') && !ownedItems.includes('chromakey-kit')} className={videoBackground === 'neutral' ? 'selected' : ''} onClick={() => setVideoBackground('neutral')}>Нейтральный фон</button><button disabled={!ownedItems.includes('chromakey-kit')} className={videoBackground === 'luxury' ? 'selected' : ''} onClick={() => setVideoBackground('luxury')}>Премиум-офис</button></div><small>{videoBackground === 'luxury' ? 'Виртуальный офис: бонус статуса, но опытный клиент может заметить подмену.' : videoBackground === 'neutral' ? 'Нейтральный фон: небольшой бонус без притворства, что это реальное жильё.' : 'Показываешь свою комнату без дополнительных эффектов.'}</small></div>}
                  {callStatus === 'idle' && availableClients.length > 0 && callsToday < (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) && <div className="incoming-call"><div className="incoming-visual"><div className="client-avatar"><span>{activeClient.initials}</span><i /></div><div className="incoming-wave"><span /><span /><span /><span /><span /><span /><span /></div></div><div className="incoming-copy"><span className="eyebrow">{activeClient.source.toUpperCase()} · УРОВЕНЬ {activeClient.tier}</span><h3>{activeClient.name}</h3><p>{activeClient.age} лет · {activeClient.profession}</p><div className="client-tags"><span><ShieldAlert size={13} /> {activeClient.temperament}</span><span><CircleDollarSign size={13} /> Капитал {activeClient.budget.toLocaleString('ru-RU')} ₽</span><span><Activity size={13} /> Опыт: {activeClient.experience.toLowerCase()}</span></div><blockquote>{activeClient.quote}</blockquote><button className="primary-action" onClick={startCall}><Video size={16} /> Начать видеозвонок <ChevronRight size={16} /></button></div></div>}
                  {callStatus === 'idle' && (availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)) && <div className="no-leads-card"><Users size={25} /><h3>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'На сегодня звонки закончились' : 'Свободных клиентов пока нет'}</h3><p>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'Лимит на сегодня: ' + callsToday + ' звонка. Заверши день, чтобы восстановить рабочее время.' : 'Дождись повторного контакта или развивай репутацию, чтобы открыть новые предложения.'}</p><button className="primary-action" onClick={endDay}>Завершить день <ChevronRight size={15} /></button></div>}
                  {callStatus === 'active' && activeQuestion && <div className="call-workspace immersive-call-workspace"><div className="client-panel"><div className="client-panel-top"><div className="client-avatar large"><span>{activeClient.initials}</span><i /></div><div><span className="eyebrow">КЛИЕНТ · ВИДЕОСВЯЗЬ</span><h3>{activeClient.name}</h3><p>{activeClient.temperament} инвестор · {activeClient.age} лет</p></div><button className="hangup" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}><Phone size={16} /></button></div><div className="client-video-stage"><div className="client-video-feed"><div className="client-sim-person" aria-label={"Видеопортрет клиента " + activeClient.name}><div className={"client-sim-hair hair-" + activeClient.tier} /><div className="client-sim-neck" /><div className="client-sim-face"><i className="client-sim-brow left" /><i className="client-sim-brow right" /><i className="client-sim-eye left" /><i className="client-sim-eye right" /><i className="client-sim-nose" /><i className="client-sim-mouth" /></div><div className={"client-sim-shirt shirt-" + activeClient.tier} /></div><span className="video-nameplate">{activeClient.name}</span><span className="video-live-indicator"><i /> СВЯЗЬ СТАБИЛЬНА</span><SelfCameraPreview enabled={videoEnabled} background={videoBackground} outfit={selectedOutfit} /></div><div className="video-side-info"><span className="eyebrow">ВИДЕОЗВОНОК</span><strong>{videoEnabled ? 'Камера включена' : 'Только аудио'}</strong><small>Качество оборудования: {getVideoQuality(ownedItems)}/8</small><button className="video-toggle" onClick={toggleVideo}><Video size={14} /> {videoEnabled ? 'Отключить видео' : 'Включить видео'}</button></div></div><div className="client-meters"><div className="meter-label"><span>Доверие</span><strong>{trust}% <small>{trustLabel}</small></strong></div><div className="trust-track"><span style={{ width: trust + '%' }} /></div><div className="meter-label"><span>Терпение</span><strong>{patience}%</strong></div><div className="patience-track"><span style={{ width: patience + '%' }} /></div></div><div className="call-stock-offer"><span>ТВОЁ ПРЕДЛОЖЕНИЕ</span><strong>{activeCompany.name}</strong><small>{activeCompany.sector} · {activeCompany.price} · риск {activeCompany.risk.toLowerCase()}</small><p>{activeCompany.description}</p><div className="call-stock-offer-columns"><span><b>Плюс:</b> {activeCompany.advantages}</span><span><b>Риск:</b> {activeCompany.risks}</span></div></div><div className="client-goal"><small>ЦЕЛЬ КЛИЕНТА</small><strong>{activeClient.goal}</strong><p>{activeClient.temperament}. {activeClient.experience}. Подбирай аргументы под его задачу.</p></div><div className="conversation-log">{conversation.slice(-4).map((entry, i) => <div key={i} className={'log-line ' + entry.from}><span>{entry.from === 'you' ? 'ТЫ' : entry.from === 'system' ? 'СИСТЕМА' : activeClient.name.toUpperCase()}</span><p>{entry.text}</p></div>)}</div></div><div className="answer-panel"><div className="answer-heading"><span className="eyebrow">ВОПРОС {questionIndex + 1} ИЗ {questions.length}</span><div className={'timer-pill ' + (timeLeft <= 4 ? 'urgent' : '')}><Clock3 size={15} /><strong>{timeLeft.toFixed(1)}с</strong></div></div><h3>{questionIndex === 0 ? activeClient.quote : activeQuestion.title}</h3><p className="question-hint"><Sparkles size={14} /> {activeQuestion.hint}</p><div className="answer-options">{activeQuestion.choices.map((choice, i) => <button className="answer-option" key={choice.label} onClick={() => answerQuestion(choice.label, choice.delta)}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{choice.label}</span><ChevronRight size={16} /></button>)}</div><div className="free-answer"><label htmlFor="free-answer">СВОЙ ОТВЕТ</label><textarea id="free-answer" placeholder="Напиши, что ответил бы клиенту… (например: «Гарантий нет, давайте сначала разберём риски») " value={freeAnswer} onChange={(event) => setFreeAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendFreeAnswer() } }} /><div className="free-answer-footer"><span>Enter — отправить · Shift + Enter — новая строка</span><button disabled={!freeAnswer.trim()} onClick={sendFreeAnswer}>Ответить <ArrowUpRight size={14} /></button></div></div><div className="timer-warning"><Clock3 size={14} /> Чем дольше думаешь, тем быстрее падает терпение. После таймера клиент может уйти.</div></div></div>}
                  {(callStatus === 'won' || callStatus === 'lost') && <div className="call-result"><div className={callStatus === 'won' ? 'result-icon success' : 'result-icon failure'}>{callStatus === 'won' ? <Check size={28} /> : <X size={28} />}</div><span className="eyebrow">ИТОГ ПЕРЕГОВОРОВ</span><h3>{callStatus === 'won' ? 'Сделка закрыта.' : 'Переговоры не завершились сделкой.'}</h3><p>{lastResult}</p><div className="result-stats"><div><small>ДОВЕРИЕ</small><strong>{trust}/100</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div><div><small>ЗАКРЫТО СДЕЛОК</small><strong>{deals}</strong></div></div><div className="result-actions"><button className="secondary-action" onClick={() => setCallStatus('idle')}>Вернуться к клиентам</button><button className="primary-action" onClick={() => { setCallStatus('idle'); setTab('overview') }}>К обзору дня <ChevronRight size={16} /></button></div></div>}
                </div>
              )}
            </section>
            <aside className="terminal-right-rail">
              <div className="rail-title"><span>РАБОЧИЙ СТОЛ</span><button aria-label="Уведомления"><Bell size={15} /></button></div>
              <div className="rail-widget time-widget"><span className="rail-icon"><Clock3 size={16} /></span><small>ВРЕМЯ</small><strong>09:16</strong><em>Четверг, 15 октября</em></div>
              <div className="rail-widget"><div className="rail-widget-heading"><span className="rail-icon gold"><Zap size={16} /></span><span><small>ЗАДАЧА ДНЯ</small><strong>Первая сделка</strong></span></div><div className="task-progress"><span style={{ width: deals > 0 ? '100%' : '0%' }} /></div><div className="rail-caption">{deals > 0 ? 'Выполнено — отлично!' : 'Осталось закрыть 1 сделку'}</div></div>
              <div className="rail-widget mini-news"><div className="rail-widget-heading"><span className="rail-icon green"><Newspaper size={16} /></span><span><small>ВАЖНОЕ</small><strong>Новости рынка</strong></span></div><p>«Котолёт» ведёт переговоры о крупном контракте.</p><button onClick={() => setTab('news')}>Читать ленту <ChevronRight size={13} /></button></div>
              <div className="rail-widget contact-widget"><div className="rail-widget-heading"><span className="rail-icon blue"><MessageCircle size={16} /></span><span><small>НАСТАВНИК</small><strong>Виктор Петрович</strong></span></div><p>«Не продавай то, чего сам не понимаешь. Особенно если оно летает на батарейках».</p></div>
              <div className="rail-footer"><span><span className="live-dot" /> Все системы работают</span><small>BUILD 0.8.0 · DEMO</small></div>
            </aside>
          </div>
          <div className="os-taskbar"><button onClick={() => { setTab('overview'); setWindowMinimized(false); setWindowMaximized(false) }}><TrendingUp size={16} /> <strong>Пуск</strong></button><span className="os-taskbar-separator" />{tab !== 'overview' && <button className="os-taskbar-app" onClick={() => setWindowMinimized((value) => !value)}>{tab === 'market' ? 'Биржа' : tab === 'news' ? 'Новости' : tab === 'calls' ? 'Видеозвонки' : tab === 'clients' ? 'Клиенты' : tab === 'shop' ? 'Магазин' : 'Недвижимость'}</button>}<span className="os-taskbar-spacer" /><span className="os-taskbar-weather">☁ <span>Переменная облачность</span></span><span className="os-taskbar-clock">{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}<small>ДЕНЬ {day}</small></span></div>
        </div>
      )}

      {menuSettings && !mainMenu && <div className="pause-backdrop"><section className="pause-menu pause-settings-panel" role="dialog" aria-modal="true" aria-label="Настройки"><span className="pause-kicker">ПАРАМЕТРЫ ИГРЫ</span><h2>Настройки</h2><p>Управляй визуальными эффектами. Прогресс сохраняется автоматически.</p><div className="settings-row"><span><strong>Звуковые эффекты</strong><small>Кнопки, шаги и действия.</small></span><button className={'settings-toggle' + (soundEnabled ? ' on' : '')} onClick={() => setSoundEnabled((value) => !value)}>{soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Шум города и дождь</strong><small>Меняется при закрытии штор.</small></span><button className={'settings-toggle' + (ambienceEnabled ? ' on' : '')} onClick={() => setAmbienceEnabled((value) => !value)}>{ambienceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Озвучка переговоров</strong><small>Голоса синтезируются браузером.</small></span><button className={'settings-toggle' + (voiceEnabled ? ' on' : '')} onClick={() => setVoiceEnabled((value) => !value)}>{voiceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Уменьшить анимации</strong><small>Снижает интенсивность декоративных движений.</small></span><button className={'settings-toggle' + (reducedMotion ? ' on' : '')} onClick={toggleReducedMotion} aria-pressed={reducedMotion}>{reducedMotion ? 'ВКЛ' : 'ВЫКЛ'}</button></div><button className="pause-primary" onClick={() => setMenuSettings(false)}>Готово</button></section></div>}

      {pauseOpen && !mainMenu && <div className="pause-backdrop"><section className="pause-menu" role="dialog" aria-modal="true" aria-label="Пауза"><span className="pause-kicker">ИГРА ПРИОСТАНОВЛЕНА</span><h2>Передохнём?</h2><p>Время остановлено. Карьера сохраняется автоматически.</p><button className="pause-primary" onClick={() => setPauseOpen(false)}><Play size={17} fill="currentColor" /> Вернуться в игру</button><button onClick={() => { setPauseOpen(false); setMainMenu(true); setOfflineMenu(true); setConfirmNewCareer(true) }}><RotateCcw size={16} /> Начать заново</button><button onClick={() => { setPauseOpen(false); setMenuSettings(true) }}><Settings size={16} /> Настройки</button><button className="pause-exit" onClick={() => { setPauseOpen(false); setPanel('room'); setCallStatus('idle'); setMainMenu(true); setOfflineMenu(false) }}><ArrowLeft size={16} /> В главное меню</button><small>ESC — продолжить игру</small></section></div>}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      <div className="version-watermark">PROTOTYPE 0.8 <span>·</span> НЕФИНАНСОВЫЙ СОВЕТ</div>
      </> }
    </main>
  )
}
