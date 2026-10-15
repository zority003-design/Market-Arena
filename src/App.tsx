import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays,
  Check, ChevronRight, CircleDollarSign, Clock3, Headphones,
  Laptop, LockKeyhole, MessageCircle, Newspaper, Phone, Power, ShieldAlert,
  Sparkles, TrendingUp, Wallet, X, Zap, Users, ShoppingBag, House, Video, Camera, PackageCheck, Monitor
} from 'lucide-react'
import RoomScene from './RoomScene'
import { calculateDeal, CLIENTS, DAILY_SALARY, getAvailableClients, getBackgroundModifier, getDailyLeadIds, getFirstImpression, getVideoQuality, HOUSING, ROOM_ITEMS, STARTING_CASH, STARTING_FIRM_CAPITAL, STARTING_HOUSING_ID, type VideoBackground } from './game/economy'

type Panel = 'room' | 'computer'
type Tab = 'overview' | 'market' | 'news' | 'calls' | 'clients' | 'shop' | 'housing'
type CallStatus = 'idle' | 'active' | 'won' | 'lost'

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
  { ticker: 'KOTL', name: 'Котолёт', sector: 'Робототехника', price: '₽ 148,60', change: '+3,42%', positive: true, cap: '₽ 8,4 млрд', revenue: '120 ИУ', profit: '−18 ИУ', risk: 'Высокий' },
  { ticker: 'OGUR', name: 'Огурец Капитал', sector: 'Напитки', price: '₽ 92,15', change: '+0,84%', positive: true, cap: '₽ 5,1 млрд', revenue: '210 ИУ', profit: '+16 ИУ', risk: 'Средний' },
  { ticker: 'TAPK', name: 'ТапокТех', sector: 'Электроника', price: '₽ 64,20', change: '−4,16%', positive: false, cap: '₽ 3,2 млрд', revenue: '95 ИУ', profit: '−27 ИУ', risk: 'Очень высокий' },
  { ticker: 'DUST', name: 'Пыль и прибыль', sector: 'Услуги', price: '₽ 210,80', change: '+0,26%', positive: true, cap: '₽ 12,6 млрд', revenue: '240 ИУ', profit: '+21 ИУ', risk: 'Низкий' },
]

const news = [
  { tag: 'КОТОЛЁТ', time: '09:14', title: '«Котолёт» ведёт переговоры о контракте на 800 роботов', body: 'Сеть доставки подтвердила тестирование, но требует гарантий бесперебойной работы.', tone: 'green' },
  { tag: 'РЫНОК', time: '08:52', title: 'Инвесторы стали внимательнее к компаниям без прибыли', body: 'После серии слабых отчётов рынок требует доказательств пути к положительному денежному потоку.', tone: 'gold' },
  { tag: 'ТАПОКТЕХ', time: '08:30', title: 'Возвраты умных тапочек превысили прогноз', body: 'Компания обещает обновить посадку устройства. Акции теряют часть вчерашнего роста.', tone: 'red' },
]

function readSave() {
  try {
    const raw = localStorage.getItem('na-vse-kotirovki-save-v1')
    if (raw) return JSON.parse(raw) as { cash?: number; firmCapital?: number; debt?: number; reputation?: number; day?: number; deals?: number; housingId?: string; ownedItems?: string[]; selectedClientId?: string; videoBackground?: VideoBackground; clientLastContactDay?: Record<string, number>; clientDealCounts?: Record<string, number>; clientInvested?: Record<string, number>; callClientId?: string; callsToday?: number; dailyLeadIds?: string[] }
  } catch { /* Storage may be disabled; the game still works for this session. */ }
  return {}
}

export default function App() {
  const saved = useMemo(() => readSave(), [])
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
  const [timeLeft, setTimeLeft] = useState(12)
  const [lastPenaltySecond, setLastPenaltySecond] = useState(12)
  const [freeAnswer, setFreeAnswer] = useState('')
  const [conversation, setConversation] = useState<{ from: 'client' | 'you' | 'system'; text: string }[]>([])
  const [lastResult, setLastResult] = useState('')
  const [toast, setToast] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('KOTL')
  const [showGuide, setShowGuide] = useState(true)
  const [marketReviewed, setMarketReviewed] = useState(false)
  const [newsReviewed, setNewsReviewed] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('na-vse-kotirovki-save-v1', JSON.stringify({ cash, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callsToday, dailyLeadIds })) } catch { /* Ignore unavailable storage. */ }
  }, [cash, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callsToday, dailyLeadIds])

  useEffect(() => {
    if (tab === 'market') setMarketReviewed(true)
    if (tab === 'news') setNewsReviewed(true)
  }, [tab])

  useEffect(() => {
    if (panel !== 'room') return
    const handleInteractionKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key.toLowerCase() === 'e') openComputer()
    }
    window.addEventListener('keydown', handleInteractionKey)
    return () => window.removeEventListener('keydown', handleInteractionKey)
  }, [panel])

  useEffect(() => {
    if (callStatus !== 'active') return
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, Math.round((value - 0.1) * 10) / 10)), 100)
    return () => window.clearInterval(timer)
  }, [callStatus, questionIndex])

  useEffect(() => {
    if (callStatus !== 'active' || timeLeft > 9 || timeLeft <= 0) return
    const second = Math.floor(timeLeft)
    if (second >= lastPenaltySecond) return
    setLastPenaltySecond(second)
    setTrust((value) => Math.max(0, value - 1))
    setPatience((value) => Math.max(0, value - 2))
  }, [timeLeft, callStatus, lastPenaltySecond])

  useEffect(() => {
    if (callStatus !== 'active' || timeLeft > 0) return
    setCallStatus('lost')
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
  const currentHousing = HOUSING.find((home) => home.id === housingId) ?? HOUSING[0]
  const activeQuestions = getQuestionsForTier(activeClient.tier)
  const activeQuestion = activeQuestions[questionIndex]
  const trustLabel = trust >= 72 ? 'Высокое доверие' : trust >= 52 ? 'Осторожный интерес' : trust >= 32 ? 'Сомневается' : 'На грани отказа'

  function openComputer() {
    setPanel('computer')
    setTab('overview')
  }

  function startCall() {
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
    setTrust(Math.max(0, Math.min(100, activeClient.baseTrust + preparationBonus + roomBonus + relationshipBonus + videoBonus + backgroundBonus)))
    setPatience(activeClient.patience)
    setTimeLeft(12)
    setLastPenaltySecond(12)
    setFreeAnswer('')
    setLastResult('')
    setConversation([{ from: 'client', text: 'Здравствуйте. ' + activeClient.quote }, ...(preparationBonus > 0 ? [{ from: 'system' as const, text: 'Подготовка перед звонком помогла: начальное доверие повышено на ' + preparationBonus + ' пунктов.' }] : []), ...(roomBonus !== 0 ? [{ from: 'system' as const, text: 'Первое впечатление от жилья и рабочего места: ' + (roomBonus > 0 ? '+' : '') + roomBonus + ' к доверию.' }] : []), ...(backgroundBonus !== 0 ? [{ from: 'system' as const, text: 'Выбранный фон изменил первое впечатление на ' + (backgroundBonus > 0 ? '+' : '') + backgroundBonus + ' к доверию.' }] : []), ...(relationshipBonus > 0 ? [{ from: 'system' as const, text: 'Клиент помнит прошлое сотрудничество: +' + relationshipBonus + ' к начальному доверию.' }] : [])])
    setMarketReviewed(false)
    setNewsReviewed(false)
    setCallStatus('active')
    setTab('calls')
  }

  function resolveCall(nextTrust: number, nextPatience: number) {
    const threshold = 58 + activeClient.tier * 2
    const success = nextTrust >= threshold && nextPatience > 20
    setCallStatus(success ? 'won' : 'lost')
    if (success) {
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
    setToast('День завершён: оклад +' + DAILY_SALARY.toLocaleString('ru-RU') + ' ₽, жильё и быт −' + dailyCosts.toLocaleString('ru-RU') + ' ₽.' + debtNote)
    window.setTimeout(() => setToast(''), 5200)
    setPanel('room')
    setCallStatus('idle')
  }

  return (
    <main className="game-shell">
      <div className="scene-layer" aria-label="3D-комната общежития">
        <RoomScene onInteract={openComputer} active={panel === 'room'} ownedItems={ownedItems} housingId={housingId} />
      </div>

      <header className="top-hud">
        <button className="brand-lockup" onClick={() => { setPanel('room'); setCallStatus('idle') }} aria-label="Вернуться в комнату">
          <span className="brand-mark"><TrendingUp size={20} strokeWidth={2.5} /></span>
          <span className="brand-text"><strong>НА ВСЕ КОТИРОВКИ</strong><small>БРОКЕРСКАЯ СИМУЛЯЦИЯ</small></span>
        </button>
        <div className="hud-center">
          <span className="day-pill"><CalendarDays size={13} /> ДЕНЬ {String(day).padStart(2, '0')}</span>
          <span className="market-open"><span className="live-dot" /> РЫНОК ОТКРЫТ</span>
        </div>
        <div className="hud-right">
          <div className="hud-stat"><Wallet size={15} /><span><small>ЛИЧНЫЕ СРЕДСТВА</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></span></div>
          <div className="hud-stat workday-stat"><CalendarDays size={15} /><span><small>ЗВОНКИ СЕГОДНЯ</small><strong>{callsToday}/{reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2}</strong></span></div><div className="hud-stat reputation-stat"><ShieldAlert size={15} /><span><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></span></div>
          {debt > 0 && <div className="hud-stat debt-stat"><ShieldAlert size={15} /><span><small>ДОЛГ</small><strong>{debt.toLocaleString('ru-RU')} ₽</strong></span></div>}
        </div>
      </header>

      {panel === 'room' && (
        <>
          <div className="room-label">
            <span className="room-kicker"><span className="live-dot" /> ЛИЧНОЕ ПРОСТРАНСТВО</span>
            <h1>Большие деньги.<br /><em>Маленькая комната.</em></h1>
            <p>Твой первый рабочий день начинается здесь.</p>
          </div>
          <div className="room-bottom">
            <div className="control-hint">
              <div className="key-cluster"><kbd>W</kbd><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div>
              <span>ПЕРЕДВИЖЕНИЕ</span>
              <i />
              <div className="mouse-hint"><span className="mouse-icon" /></div>
              <span>ОБЗОР</span>
            </div>
            <button className="interact-card" onClick={openComputer}>
              <span className="interact-icon"><Laptop size={21} /></span>
              <span className="interact-copy"><small>ВЗАИМОДЕЙСТВИЕ</small><strong>Сесть за компьютер</strong><em>Открыть терминал и начать день</em></span>
              <span className="enter-key">E <ChevronRight size={15} /></span>
            </button>
          </div>
          {showGuide && <div className="intro-tip"><button className="tip-close" onClick={() => setShowGuide(false)}><X size={13} /></button><Sparkles size={16} /><span><strong>Первый день на рынке</strong><br />Подойди к компьютеру. Сегодня тебе предстоит убедить первого клиента — без обещаний лёгких денег.</span></div>}
        </>
      )}

      {panel === 'computer' && (
        <div className="computer-overlay">
          <div className="computer-topbar">
            <button className="back-button" onClick={() => { setPanel('room'); setCallStatus('idle') }}><ArrowLeft size={16} /> В комнату</button>
            <div className="terminal-title"><span className="terminal-logo"><Activity size={17} /></span><span><strong>КОТИРОВКИ / TERMINAL</strong><small>PERSONAL BROKER WORKSTATION · v0.1</small></span></div>
            <div className="secure-label"><LockKeyhole size={13} /> ЛОКАЛЬНАЯ СЕССИЯ</div>
          </div>
          <div className="terminal-body">
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

            <section className="terminal-content">
              {tab === 'overview' && (
                <div className="overview-page">
                  <div className="page-heading"><div><div className="eyebrow">ЧЕТВЕРГ · 09:16 · ПЕРВЫЙ РАБОЧИЙ ДЕНЬ</div><h2>Доброе утро, брокер.</h2><p>Рынок уже проснулся. Посмотрим, что сегодня можно продать — и что лучше не обещать.</p></div><div className="market-status"><span className="live-dot" /> ТОРГИ ИДУТ</div></div>
                  <div className="metric-grid">
                    <div className="metric-card"><span className="metric-icon green"><Wallet size={17} /></span><small>ТВОИ ДЕНЬГИ</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong><em>Личный счёт</em></div>
                    <div className="metric-card"><span className="metric-icon blue"><BriefcaseBusiness size={17} /></span><small>СДЕЛКИ СЕГОДНЯ</small><strong>{deals}</strong><em>Цель: первая сделка</em></div>
                    <div className="metric-card"><span className="metric-icon gold"><Activity size={17} /></span><small>РЕПУТАЦИЯ</small><strong>{reputation}<sup>/100</sup></strong><em>{reputation >= 50 ? 'Клиенты начинают доверять' : 'Докажи, что тебе можно верить'}</em></div>
                    <div className="metric-card"><span className="metric-icon violet"><House size={17} /></span><small>ТЕКУЩЕЕ ЖИЛЬЁ</small><strong>{currentHousing.name}</strong><em>Расходы: {currentHousing.dailyCost.toLocaleString('ru-RU')} ₽/день</em></div>
                  </div>
                  <div className="section-head"><div><h3>План на сегодня</h3><p>Небольшие шаги. Никаких золотых унитазов — пока.</p></div><span className="progress-label">0 / 3</span></div>
                  <div className="mission-list">
                    <div className="mission-row"><span className="mission-number">01</span><div><strong>Разобраться в одной компании</strong><small>Прочитай показатели и свежие новости.</small></div><button onClick={() => setTab('market')}>Открыть <ChevronRight size={14} /></button></div>
                    <div className="mission-row"><span className="mission-number">02</span><div><strong>Провести первый звонок</strong><small>Клиент сомневается — и правильно делает.</small></div><button disabled={availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)} onClick={startCall}>{availableClients.length === 0 ? 'Нет клиентов' : callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'Лимит звонков' : 'Принять звонок'} <ChevronRight size={14} /></button></div>
                    <div className="mission-row"><span className="mission-number">03</span><div><strong>Закрыть день без скандала</strong><small>Сохрани деньги и не потеряй репутацию.</small></div><span className="mission-locked"><LockKeyhole size={13} /> ПОЗЖЕ</span></div>
                  </div>
                  <div className="bottom-note"><ShieldAlert size={16} /><span><strong>Правило № 1:</strong> не обещай гарантированную доходность. Клиент может забыть цифру, но не забудет, что ты его обманул.</span></div>
                </div>
              )}

              {tab === 'market' && (
                <div className="market-page">
                  <div className="page-heading"><div><div className="eyebrow">РЫНОК · ИГРОВОЙ МИР</div><h2>Биржевой терминал</h2><p>Все компании и показатели вымышлены. Анализируй бизнес, а не только цвет графика.</p></div><div className="market-status"><span className="live-dot" /> ОТКРЫТО</div></div>
                  <div className="market-summary"><div><small>ИНДЕКС УСЛОВНОГО РЫНКА</small><strong>1 842,76 <em>+1,28%</em></strong></div><div className="sparkline"><svg viewBox="0 0 250 55" preserveAspectRatio="none"><path d="M0 42 L18 37 L31 43 L47 28 L60 33 L77 22 L91 30 L108 16 L126 23 L142 10 L158 18 L176 13 L191 22 L210 8 L226 14 L250 3" fill="none" stroke="#35d6a0" strokeWidth="2.2" /><path d="M0 42 L18 37 L31 43 L47 28 L60 33 L77 22 L91 30 L108 16 L126 23 L142 10 L158 18 L176 13 L191 22 L210 8 L226 14 L250 3 L250 55 L0 55Z" fill="url(#sparkFill)" opacity=".18" /><defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#35d6a0" /><stop offset="1" stopColor="#35d6a0" stopOpacity="0" /></linearGradient></defs></svg></div></div>
                  <div className="company-table"><div className="table-header"><span>КОМПАНИЯ</span><span>ЦЕНА</span><span>ИЗМЕНЕНИЕ</span><span>ДЕЙСТВИЕ</span></div>{companies.map((company) => <div className={selectedCompany === company.ticker ? 'company-row selected' : 'company-row'} key={company.ticker} onClick={() => setSelectedCompany(company.ticker)}><div className="company-name"><span className={'company-logo ' + company.ticker.toLowerCase()}>{company.ticker.slice(0, 2)}</span><span><strong>{company.name}</strong><small>{company.sector} · {company.ticker}</small></span></div><strong className="price">{company.price}</strong><span className={company.positive ? 'change positive' : 'change negative'}>{company.change}</span><button className="row-action" onClick={(event) => { event.stopPropagation(); setSelectedCompany(company.ticker) }}>{selectedCompany === company.ticker ? 'Выбрана' : 'Изучить'}</button></div>)}</div>
                  <div className="company-detail"><div className="detail-top"><div><span className="eyebrow">КАРТОЧКА ЭМИТЕНТА · {companies.find((c) => c.ticker === selectedCompany)?.ticker}</span><h3>{companies.find((c) => c.ticker === selectedCompany)?.name}</h3><p>{companies.find((c) => c.ticker === selectedCompany)?.sector}</p></div><div className="detail-price"><strong>{companies.find((c) => c.ticker === selectedCompany)?.price}</strong><span className={companies.find((c) => c.ticker === selectedCompany)?.positive ? 'positive' : 'negative'}>{companies.find((c) => c.ticker === selectedCompany)?.change}</span></div></div><div className="detail-stats"><div><small>КАПИТАЛИЗАЦИЯ</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.cap}</strong></div><div><small>ВЫРУЧКА</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.revenue}</strong></div><div><small>ЧИСТАЯ ПРИБЫЛЬ</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.profit}</strong></div><div><small>УРОВЕНЬ РИСКА</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.risk}</strong></div></div><div className="detail-disclaimer"><ShieldAlert size={15} /> Рост цены не гарантирует прибыль. Сверяй выручку, прибыль, долг и новости.</div></div>
                </div>
              )}

              {tab === 'news' && (
                <div className="news-page"><div className="page-heading"><div><div className="eyebrow">ИНФОРМАЦИОННОЕ АГЕНТСТВО «СЛУХИ И ФАКТЫ»</div><h2>Лента новостей</h2><p>Новости могут изменить отношение клиента к компании прямо во время звонка.</p></div><div className="market-status"><span className="live-dot" /> LIVE FEED</div></div><div className="news-list">{news.map((item) => <article className="news-card" key={item.title}><div className="news-card-top"><span className={'news-tag ' + item.tone}>{item.tag}</span><time>{item.time}</time></div><h3>{item.title}</h3><p>{item.body}</p><button onClick={() => { setSelectedCompany(item.tag === 'ТАПОКТЕХ' ? 'TAPK' : 'KOTL'); setTab('market') }}>Открыть компанию <ArrowUpRight size={14} /></button></article>)}</div><div className="bottom-note"><Newspaper size={16} /><span>Проверяй источник и отделяй подтверждённые факты от слухов. В этом мире заголовок может быть громче отчётности.</span></div></div>
              )}

              {tab === 'clients' && (
                <div className="clients-page">
                  <div className="page-heading"><div><div className="eyebrow">ОТДЕЛ ПРОДАЖ · CRM</div><h2>Клиенты и возможности</h2><p>Список растёт по мере карьеры. Больший капитал означает более высокие требования, а не гарантированную сделку.</p></div><div className="market-status"><Users size={14} /> {availableClients.length} ДОСТУПНО</div></div>
                  <div className="economy-summary"><div><small>ТВОИ СРЕДСТВА</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div><div><small>ЗАКРЫТО СДЕЛОК</small><strong>{deals}</strong></div></div>
                  <div className="client-card-list">{availableClients.length === 0 && <div className="no-leads-card"><Users size={24} /><h3>Пока нет новых лидов</h3><p>Контакт не повторяется каждый день. После звонка клиент может вернуться через несколько игровых дней; новые уровни открываются по дню карьеры и репутации.</p></div>}{availableClients.map((client) => <article className={selectedClientId === client.id ? 'client-opportunity selected' : 'client-opportunity'} key={client.id}><div className="opportunity-avatar">{client.initials}</div><div className="opportunity-main"><div className="opportunity-top"><span className="eyebrow">УРОВЕНЬ {client.tier} · {client.source.toUpperCase()}</span><span className="opportunity-capital">{client.budget.toLocaleString('ru-RU')} ₽</span></div><h3>{client.name}</h3><p>{client.age} лет · {client.profession}</p><div className="opportunity-tags"><span>{client.temperament}</span><span>{client.experience}</span><span>Ожидаемый ордер до {client.ticket.toLocaleString('ru-RU')} ₽</span></div><blockquote>{client.quote}</blockquote><small className="opportunity-goal">ЦЕЛЬ: {client.goal}</small></div><div className="opportunity-actions"><button className={selectedClientId === client.id ? 'secondary-action' : 'primary-action'} onClick={() => { setSelectedClientId(client.id); setToast('Выбран клиент: ' + client.name) }}>{selectedClientId === client.id ? 'Выбран' : 'Выбрать'}</button><button className="secondary-action" onClick={() => { setSelectedClientId(client.id); setTab('calls') }}>К звонку <ChevronRight size={14} /></button></div></article>)}</div>
                  <div className="bottom-note"><ShieldAlert size={16} /><span><strong>Важно:</strong> деньги в карточке — капитал клиента, а не твоя выручка. Ты получаешь только личный бонус от сделки.</span></div>
                </div>
              )}

              {tab === 'shop' && (
                <div className="shop-page">
                  <div className="page-heading"><div><div className="eyebrow">ИНВЕНТАРЬ · ОБОРУДОВАНИЕ</div><h2>Улучши рабочее место</h2><p>Техника улучшает качество звонков и первое впечатление. Она не заменяет знания и честные ответы.</p></div><div className="market-status"><ShoppingBag size={14} /> {cash.toLocaleString('ru-RU')} ₽</div></div>
                  <div className="economy-summary"><div><small>ЛИЧНЫЕ ДЕНЬГИ</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div><small>УСТАНОВЛЕНО ПРЕДМЕТОВ</small><strong>{ownedItems.length}</strong></div><div><small>КАЧЕСТВО ВИДЕО</small><strong>{getVideoQuality(ownedItems)}/8</strong></div></div>
                  <div className="shop-grid">{ROOM_ITEMS.map((item) => { const owned = ownedItems.includes(item.id); const locked = day < item.minDay; return <article className={owned ? 'shop-item owned' : 'shop-item'} key={item.id}><div className={'shop-item-icon ' + item.category}>{item.category === 'video' ? <Camera size={21} /> : item.category === 'background' ? <Video size={21} /> : item.category === 'work' ? <Monitor size={21} /> : <PackageCheck size={21} />}</div><div className="shop-item-meta"><span className="eyebrow">{item.category === 'video' ? 'ВИДЕОСВЯЗЬ' : item.category === 'background' ? 'ФОН' : item.category === 'work' ? 'РАБОТА' : 'КОМФОРТ'}</span><strong>{item.name}</strong><p>{item.description}</p></div><div className="shop-item-footer"><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={owned || locked || cash < item.price} className={owned ? 'secondary-action' : 'primary-action'} onClick={() => buyRoomItem(item.id)}>{owned ? 'Куплено' : locked ? 'С ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает' : 'Купить'}</button></div></article> })}</div>
                  <div className="bottom-note"><Sparkles size={16} /><span>Установленные предметы сохраняются. Бонус от внешнего вида ограничен: подготовка к звонку и качество ответов важнее дорогого оборудования.</span></div>
                </div>
              )}

              {tab === 'housing' && (
                <div className="housing-page">
                  <div className="page-heading"><div><div className="eyebrow">ОБРАЗ ЖИЗНИ · ЖИЛЬЁ</div><h2>Следующий адрес — твой выбор</h2><p>Больше приватности и статуса, но и постоянные расходы. Не переезжай, если после депозита не останется резерва.</p></div><div className="market-status"><House size={14} /> {currentHousing.name.toUpperCase()}</div></div>
                  <div className="current-home-banner"><div className="home-symbol"><House size={28} /></div><div><span className="eyebrow">ТЕКУЩЕЕ ЖИЛЬЁ</span><h3>{currentHousing.name}</h3><p>{currentHousing.description}</p></div><div className="home-cost"><small>РАСХОДЫ / ДЕНЬ</small><strong>{currentHousing.dailyCost.toLocaleString('ru-RU')} ₽</strong></div></div>
                  <div className="housing-list">{HOUSING.map((home, index) => { const current = home.id === housingId; const locked = day < home.minDay || reputation < home.minReputation; return <article className={current ? 'housing-option current' : 'housing-option'} key={home.id}><div className="housing-rank">0{index + 1}</div><div className="housing-option-main"><span className="eyebrow">УРОВЕНЬ ЖИЛЬЯ {index}</span><h3>{home.name}</h3><p>{home.description}</p><div className="housing-effects"><span>Первое впечатление {home.firstImpression > 0 ? '+' : ''}{home.firstImpression}</span><span>Комфорт +{home.comfort}</span></div></div><div className="housing-option-buy"><strong>{home.price === 0 ? 'Стартовое' : home.price.toLocaleString('ru-RU') + ' ₽'}</strong><small>{home.dailyCost.toLocaleString('ru-RU')} ₽ / день</small><button disabled={current || locked || cash < home.price} className={current ? 'secondary-action' : 'primary-action'} onClick={() => moveToHousing(home.id)}>{current ? 'Текущее жильё' : locked ? 'Пока закрыто' : cash < home.price ? 'Нужно накопить' : 'Переехать'}</button></div></article> })}</div>
                  <div className="bottom-note"><Wallet size={16} /><span>Оклад за рабочий день — {DAILY_SALARY.toLocaleString('ru-RU')} ₽. Перед переездом сравни его с ежедневными расходами: дорогой адрес может съесть весь доход.</span></div>
                </div>
              )}

              {tab === 'calls' && (
                <div className="calls-page">
                  <div className="page-heading"><div><div className="eyebrow">ОТДЕЛ ПРОДАЖ · ЛИНИЯ 01</div><h2>Клиенты и звонки</h2><p>Доверие нельзя купить. Но можно потерять за одну фразу.</p></div><div className={callStatus === 'active' ? 'call-live-badge active' : 'call-live-badge'}><span className="live-dot" /> {callStatus === 'active' ? 'ЗВОНОК ИДЁТ' : 'ЛИНИЯ СВОБОДНА'}</div></div>
                  {callStatus === 'idle' && <div className="precall-briefing">
                    <div className="briefing-copy"><span className="eyebrow">ПОДГОТОВКА К ПЕРЕГОВОРАМ</span><strong>Сначала факты — потом обещания</strong><p>Изучи компанию и свежие новости. За каждый просмотренный раздел получишь +4 к начальному доверию клиента.</p></div>
                    <div className="briefing-actions">
                      <button className={marketReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('market')}><TrendingUp size={15} /><span><strong>Отчёт компании</strong><small>{marketReviewed ? 'Изучено · +4 доверия' : 'Финансы и риски'}</small></span><span className="briefing-check">{marketReviewed ? '✓' : '↗'}</span></button>
                      <button className={newsReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('news')}><Newspaper size={15} /><span><strong>Новости рынка</strong><small>{newsReviewed ? 'Изучено · +4 доверия' : 'Катализаторы и угрозы'}</small></span><span className="briefing-check">{newsReviewed ? '✓' : '↗'}</span></button>
                    </div>
                    <div className="briefing-total"><span>Бонус подготовки</span><strong>+{(marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0)} доверия</strong></div>
                  </div>}
                  {callStatus === 'idle' && <div className="background-selector"><div className="background-selector-copy"><span className="eyebrow">ТВОЙ ОБРАЗ В КАДРЕ</span><p>Фон влияет на первое впечатление. Виртуальный офис может насторожить опытного клиента, если качество маски слабое.</p></div><div className="background-options"><button className={videoBackground === 'real' ? 'selected' : ''} onClick={() => setVideoBackground('real')}>Реальная комната</button><button disabled={!ownedItems.includes('neutral-backdrop') && !ownedItems.includes('chromakey-kit')} className={videoBackground === 'neutral' ? 'selected' : ''} onClick={() => setVideoBackground('neutral')}>Нейтральный фон</button><button disabled={!ownedItems.includes('chromakey-kit')} className={videoBackground === 'luxury' ? 'selected' : ''} onClick={() => setVideoBackground('luxury')}>Премиум-офис</button></div><small>{videoBackground === 'luxury' ? 'Виртуальный офис: бонус статуса, но опытный клиент может заметить подмену.' : videoBackground === 'neutral' ? 'Нейтральный фон: небольшой бонус без притворства, что это реальное жильё.' : 'Показываешь свою комнату без дополнительных эффектов.'}</small></div>}
                  {callStatus === 'idle' && availableClients.length > 0 && callsToday < (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) && <div className="incoming-call"><div className="incoming-visual"><div className="client-avatar"><span>{activeClient.initials}</span><i /></div><div className="incoming-wave"><span /><span /><span /><span /><span /><span /><span /></div></div><div className="incoming-copy"><span className="eyebrow">{activeClient.source.toUpperCase()} · УРОВЕНЬ {activeClient.tier}</span><h3>{activeClient.name}</h3><p>{activeClient.age} лет · {activeClient.profession}</p><div className="client-tags"><span><ShieldAlert size={13} /> {activeClient.temperament}</span><span><CircleDollarSign size={13} /> Капитал {activeClient.budget.toLocaleString('ru-RU')} ₽</span><span><Activity size={13} /> Опыт: {activeClient.experience.toLowerCase()}</span></div><blockquote>{activeClient.quote}</blockquote><button className="primary-action" onClick={startCall}><Video size={16} /> Начать видеозвонок <ChevronRight size={16} /></button></div></div>}
                  {callStatus === 'idle' && (availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)) && <div className="no-leads-card"><Users size={25} /><h3>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'На сегодня звонки закончились' : 'Свободных клиентов пока нет'}</h3><p>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'Лимит на сегодня: ' + callsToday + ' звонка. Заверши день, чтобы восстановить рабочее время.' : 'Дождись повторного контакта или развивай репутацию, чтобы открыть новые предложения.'}</p><button className="primary-action" onClick={endDay}>Завершить день <ChevronRight size={15} /></button></div>}
                  {callStatus === 'active' && activeQuestion && <div className="call-workspace"><div className="client-panel"><div className="client-panel-top"><div className="client-avatar large"><span>{activeClient.initials}</span><i /></div><div><span className="eyebrow">КЛИЕНТ · ВИДЕОСВЯЗЬ</span><h3>{activeClient.name}</h3><p>{activeClient.temperament} инвестор · {activeClient.age} лет</p></div><button className="hangup" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}><Phone size={16} /></button></div><div className="client-video-stage"><div className="client-video-feed"><div className="video-avatar-orb">{activeClient.initials}</div><span className="video-nameplate">{activeClient.name}</span><span className="video-live-indicator"><i /> СВЯЗЬ СТАБИЛЬНА</span><div className={"player-preview-tile " + videoBackground}><span>БР</span><small>ТВОЙ КАДР</small></div></div><div className="video-side-info"><span className="eyebrow">ВИДЕОЗВОНОК</span><strong>{videoEnabled ? 'Камера включена' : 'Только аудио'}</strong><small>Качество оборудования: {getVideoQuality(ownedItems)}/8</small><button className="video-toggle" onClick={toggleVideo}><Video size={14} /> {videoEnabled ? 'Отключить видео' : 'Включить видео'}</button></div></div><div className="client-meters"><div className="meter-label"><span>Доверие</span><strong>{trust}% <small>{trustLabel}</small></strong></div><div className="trust-track"><span style={{ width: trust + '%' }} /></div><div className="meter-label"><span>Терпение</span><strong>{patience}%</strong></div><div className="patience-track"><span style={{ width: patience + '%' }} /></div></div><div className="client-goal"><small>ЦЕЛЬ КЛИЕНТА</small><strong>{activeClient.goal}</strong><p>{activeClient.temperament}. {activeClient.experience}. Подбирай аргументы под его задачу.</p></div><div className="conversation-log">{conversation.slice(-4).map((entry, i) => <div key={i} className={'log-line ' + entry.from}><span>{entry.from === 'you' ? 'ТЫ' : entry.from === 'system' ? 'СИСТЕМА' : activeClient.name.toUpperCase()}</span><p>{entry.text}</p></div>)}</div></div><div className="answer-panel"><div className="answer-heading"><span className="eyebrow">ВОПРОС {questionIndex + 1} ИЗ {questions.length}</span><div className={'timer-pill ' + (timeLeft <= 4 ? 'urgent' : '')}><Clock3 size={15} /><strong>{timeLeft.toFixed(1)}с</strong></div></div><h3>{questionIndex === 0 ? activeClient.quote : activeQuestion.title}</h3><p className="question-hint"><Sparkles size={14} /> {activeQuestion.hint}</p><div className="answer-options">{activeQuestion.choices.map((choice, i) => <button className="answer-option" key={choice.label} onClick={() => answerQuestion(choice.label, choice.delta)}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{choice.label}</span><ChevronRight size={16} /></button>)}</div><div className="free-answer"><label htmlFor="free-answer">СВОЙ ОТВЕТ</label><textarea id="free-answer" placeholder="Напиши, что ответил бы клиенту… (например: «Гарантий нет, давайте сначала разберём риски») " value={freeAnswer} onChange={(event) => setFreeAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendFreeAnswer() } }} /><div className="free-answer-footer"><span>Enter — отправить · Shift + Enter — новая строка</span><button disabled={!freeAnswer.trim()} onClick={sendFreeAnswer}>Ответить <ArrowUpRight size={14} /></button></div></div><div className="timer-warning"><Clock3 size={14} /> Чем дольше думаешь, тем быстрее падает терпение. После таймера клиент может уйти.</div></div></div>}
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
              <div className="rail-footer"><span><span className="live-dot" /> Все системы работают</span><small>BUILD 0.1.0 · DEMO</small></div>
            </aside>
          </div>
        </div>
      )}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      <div className="version-watermark">PROTOTYPE 0.1 <span>·</span> НЕФИНАНСОВЫЙ СОВЕТ</div>
    </main>
  )
}
