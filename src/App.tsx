import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays,
  Check, ChevronRight, CircleDollarSign, Clock3, Headphones,
  Laptop, LockKeyhole, MessageCircle, Newspaper, Phone, Power, ShieldAlert,
  Sparkles, TrendingUp, Wallet, X, Zap
} from 'lucide-react'
import RoomScene from './RoomScene'

type Panel = 'room' | 'computer'
type Tab = 'overview' | 'market' | 'news' | 'calls'
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
    if (raw) return JSON.parse(raw) as { cash?: number; reputation?: number; day?: number; deals?: number }
  } catch { /* Storage may be disabled; the game still works for this session. */ }
  return {}
}

export default function App() {
  const saved = useMemo(() => readSave(), [])
  const [panel, setPanel] = useState<Panel>('room')
  const [tab, setTab] = useState<Tab>('overview')
  const [cash, setCash] = useState(saved.cash ?? 18500)
  const [reputation, setReputation] = useState(saved.reputation ?? 42)
  const [day, setDay] = useState(saved.day ?? 1)
  const [deals, setDeals] = useState(saved.deals ?? 0)
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

  useEffect(() => {
    try { localStorage.setItem('na-vse-kotirovki-save-v1', JSON.stringify({ cash, reputation, day, deals })) } catch { /* Ignore unavailable storage. */ }
  }, [cash, reputation, day, deals])

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

  const activeQuestion = questions[questionIndex]
  const trustLabel = trust >= 72 ? 'Высокое доверие' : trust >= 52 ? 'Осторожный интерес' : trust >= 32 ? 'Сомневается' : 'На грани отказа'

  function openComputer() {
    setPanel('computer')
    setTab('overview')
  }

  function startCall() {
    setQuestionIndex(0)
    setTrust(48)
    setPatience(74)
    setTimeLeft(12)
    setLastPenaltySecond(12)
    setFreeAnswer('')
    setLastResult('')
    setConversation([{ from: 'client', text: 'Здравствуйте. У меня есть немного свободных денег, но я не хочу покупать кота в мешке. Расскажите про «Котолёт».' }])
    setCallStatus('active')
    setTab('calls')
  }

  function resolveCall(nextTrust: number, nextPatience: number) {
    setCallStatus(nextTrust >= 58 && nextPatience > 20 ? 'won' : 'lost')
    if (nextTrust >= 58 && nextPatience > 20) {
      setCash((value) => value + 3200)
      setReputation((value) => Math.min(100, value + 4))
      setDeals((value) => value + 1)
      setLastResult('Сделка закрыта: клиент согласился на небольшую пробную позицию. Комиссия +3 200 ₽, репутация +4.')
      setConversation((items) => [...items, { from: 'system', text: '✓ Сделка закрыта. Клиент выбрал небольшую пробную позицию.' }])
    } else {
      setReputation((value) => Math.max(0, value - 2))
      setLastResult('Сделка не состоялась. Клиент пока не готов рисковать деньгами. Подготовься лучше и попробуй снова.')
      setConversation((items) => [...items, { from: 'system', text: '— Клиент отказался от сделки.' }])
    }
  }

  function answerQuestion(text: string, delta: number) {
    if (callStatus !== 'active') return
    const nextTrust = Math.max(0, Math.min(100, trust + delta))
    const nextPatience = Math.max(0, patience - 4)
    setTrust(nextTrust)
    setPatience(nextPatience)
    setConversation((items) => [...items, { from: 'you', text }, ...(questionIndex < questions.length - 1 ? [{ from: 'client' as const, text: questions[questionIndex + 1].title }] : [])])
    setFreeAnswer('')
    if (questionIndex >= questions.length - 1) {
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

  function endDay() {
    setDay((value) => value + 1)
    setCash((value) => Math.max(0, value - 650))
    setToast('День завершён. Аренда рабочего места и бытовые расходы: −650 ₽.')
    window.setTimeout(() => setToast(''), 3600)
    setPanel('room')
    setCallStatus('idle')
  }

  return (
    <main className="game-shell">
      <div className="scene-layer" aria-label="3D-комната общежития">
        <RoomScene onInteract={openComputer} />
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
          <div className="hud-stat reputation-stat"><ShieldAlert size={15} /><span><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></span></div>
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
              <div className="sidebar-spacer" />
              <div className="side-account"><div className="account-row"><span>Деньги</span><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div className="mini-meter"><span style={{ width: Math.min(100, cash / 300) + '%' }} /></div><div className="account-row"><span>Репутация</span><strong>{reputation}%</strong></div><div className="mini-meter reputation-meter"><span style={{ width: reputation + '%' }} /></div></div>
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
                    <div className="metric-card"><span className="metric-icon violet"><Zap size={17} /></span><small>ЭНЕРГИЯ</small><strong>86<sup>/100</sup></strong><em>Рабочий день только начался</em></div>
                  </div>
                  <div className="section-head"><div><h3>План на сегодня</h3><p>Небольшие шаги. Никаких золотых унитазов — пока.</p></div><span className="progress-label">0 / 3</span></div>
                  <div className="mission-list">
                    <div className="mission-row"><span className="mission-number">01</span><div><strong>Разобраться в одной компании</strong><small>Прочитай показатели и свежие новости.</small></div><button onClick={() => setTab('market')}>Открыть <ChevronRight size={14} /></button></div>
                    <div className="mission-row"><span className="mission-number">02</span><div><strong>Провести первый звонок</strong><small>Клиент сомневается — и правильно делает.</small></div><button onClick={startCall}>Принять звонок <ChevronRight size={14} /></button></div>
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

              {tab === 'calls' && (
                <div className="calls-page">
                  <div className="page-heading"><div><div className="eyebrow">ОТДЕЛ ПРОДАЖ · ЛИНИЯ 01</div><h2>Клиенты и звонки</h2><p>Доверие нельзя купить. Но можно потерять за одну фразу.</p></div><div className={callStatus === 'active' ? 'call-live-badge active' : 'call-live-badge'}><span className="live-dot" /> {callStatus === 'active' ? 'ЗВОНОК ИДЁТ' : 'ЛИНИЯ СВОБОДНА'}</div></div>
                  {callStatus === 'idle' && <div className="incoming-call"><div className="incoming-visual"><div className="client-avatar"><span>А</span><i /></div><div className="incoming-wave"><span /><span /><span /><span /><span /><span /><span /></div></div><div className="incoming-copy"><span className="eyebrow">ВХОДЯЩИЙ КЛИЕНТ · 01</span><h3>Алексей Воронцов</h3><p>34 года · владелец небольшой студии дизайна</p><div className="client-tags"><span><ShieldAlert size={13} /> Осторожный</span><span><CircleDollarSign size={13} /> Бюджет 50 000 ₽</span><span><Activity size={13} /> Опыт: новичок</span></div><blockquote>«Хочу попробовать инвестировать, но мне уже обещали золотые горы. Чем вы отличаетесь?»</blockquote><button className="primary-action" onClick={startCall}><Phone size={16} /> Принять звонок <ChevronRight size={16} /></button></div></div>}
                  {callStatus === 'active' && activeQuestion && <div className="call-workspace"><div className="client-panel"><div className="client-panel-top"><div className="client-avatar large"><span>А</span><i /></div><div><span className="eyebrow">КЛИЕНТ · ВХОДЯЩИЙ ЗВОНОК</span><h3>Алексей Воронцов</h3><p>Осторожный инвестор · 34 года</p></div><button className="hangup" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}><Phone size={16} /></button></div><div className="client-meters"><div className="meter-label"><span>Доверие</span><strong>{trust}% <small>{trustLabel}</small></strong></div><div className="trust-track"><span style={{ width: trust + '%' }} /></div><div className="meter-label"><span>Терпение</span><strong>{patience}%</strong></div><div className="patience-track"><span style={{ width: patience + '%' }} /></div></div><div className="client-goal"><small>ЦЕЛЬ КЛИЕНТА</small><strong>Сохранить накопления и разобраться в инвестициях</strong><p>Не любит давление. Проверяет обещания и боится скрытых рисков.</p></div><div className="conversation-log">{conversation.slice(-4).map((entry, i) => <div key={i} className={'log-line ' + entry.from}><span>{entry.from === 'you' ? 'ТЫ' : entry.from === 'system' ? 'СИСТЕМА' : 'АЛЕКСЕЙ'}</span><p>{entry.text}</p></div>)}</div></div><div className="answer-panel"><div className="answer-heading"><span className="eyebrow">ВОПРОС {questionIndex + 1} ИЗ {questions.length}</span><div className={'timer-pill ' + (timeLeft <= 4 ? 'urgent' : '')}><Clock3 size={15} /><strong>{timeLeft.toFixed(1)}с</strong></div></div><h3>{activeQuestion.title}</h3><p className="question-hint"><Sparkles size={14} /> {activeQuestion.hint}</p><div className="answer-options">{activeQuestion.choices.map((choice, i) => <button className="answer-option" key={choice.label} onClick={() => answerQuestion(choice.label, choice.delta)}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{choice.label}</span><ChevronRight size={16} /></button>)}</div><div className="free-answer"><label htmlFor="free-answer">СВОЙ ОТВЕТ</label><textarea id="free-answer" placeholder="Напиши, что ответил бы клиенту… (например: «Гарантий нет, давайте сначала разберём риски») " value={freeAnswer} onChange={(event) => setFreeAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendFreeAnswer() } }} /><div className="free-answer-footer"><span>Enter — отправить · Shift + Enter — новая строка</span><button disabled={!freeAnswer.trim()} onClick={sendFreeAnswer}>Ответить <ArrowUpRight size={14} /></button></div></div><div className="timer-warning"><Clock3 size={14} /> Чем дольше думаешь, тем быстрее падает терпение. После таймера клиент может уйти.</div></div></div>}
                  {(callStatus === 'won' || callStatus === 'lost') && <div className="call-result"><div className={callStatus === 'won' ? 'result-icon success' : 'result-icon failure'}>{callStatus === 'won' ? <Check size={28} /> : <X size={28} />}</div><span className="eyebrow">ИТОГ ПЕРЕГОВОРОВ</span><h3>{callStatus === 'won' ? 'Первый клиент — почти твой.' : 'Не каждая сделка твоя.'}</h3><p>{lastResult}</p><div className="result-stats"><div><small>ДОВЕРИЕ</small><strong>{trust}/100</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div><div><small>ЗАКРЫТО СДЕЛОК</small><strong>{deals}</strong></div></div><div className="result-actions"><button className="secondary-action" onClick={() => setCallStatus('idle')}>Вернуться к клиентам</button><button className="primary-action" onClick={() => { setCallStatus('idle'); setTab('overview') }}>К обзору дня <ChevronRight size={16} /></button></div></div>}
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
