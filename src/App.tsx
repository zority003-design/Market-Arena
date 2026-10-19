import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { OrbitControls } from '@react-three/drei'
import {
  Activity, ArrowLeft, ArrowUpRight, Bell, CalendarDays, MapPin,
  Check, ChevronRight, CircleDollarSign, Clock3, Headphones,
  Laptop, MessageCircle, Newspaper, Phone, Power, ShieldAlert,
  Sparkles, TrendingUp, Wallet, X, Zap, Users, ShoppingBag, House, Video,
  Settings, Play, RotateCcw, ArrowRight
} from 'lucide-react'
import RoomScene from './RoomScene'
import CityScene from './CityScene'
import ClientPortrait3D from './ClientPortrait3D'
import { configureAudio, playSound, stopSpeech } from './audio'
import { calculateDeal, CLIENTS, DAILY_SALARY, getAvailableClients, getBackgroundModifier, getDailyLeadIds, getFirstImpression, getVideoQuality, HOUSING, ROOM_ITEMS, STARTING_CASH, STARTING_FIRM_CAPITAL, STARTING_HOUSING_ID, type VideoBackground } from './game/economy'

type Panel = 'room' | 'computer' | 'wardrobe' | 'city'
type Tab = 'overview' | 'market' | 'news' | 'calls' | 'clients' | 'shop' | 'housing' | 'city'
type CallStatus = 'idle' | 'active' | 'won' | 'lost'
type RoomObject = 'lamp' | 'light' | 'curtains' | 'wardrobe'
type OutfitId = 'intern' | 'classic' | 'premium'
const NEGOTIATION_STAGES = ['ОТКРЫТИЕ', 'ПРОДУКТ И СПРОС', 'РИСКИ И ВОЗРАЖЕНИЯ', 'ЭКОНОМИКА БИЗНЕСА', 'ФИНАЛЬНЫЕ УСЛОВИЯ']

const OUTFITS: { id: OutfitId; name: string; price: number; description: string }[] = [
  { id: 'intern', name: 'Стажёр', price: 0, description: 'Футболка, тёмные брюки и удобная обувь.' },
  { id: 'classic', name: 'Классический брокер', price: 4500, description: 'Рубашка, аккуратный пиджак и деловой силуэт.' },
  { id: 'premium', name: 'Премиальный костюм', price: 12500, description: 'Тёмный костюм, светлая рубашка и золотистые детали.' },
]

const companies = [
  { ticker: 'KOTL', name: 'Котолёт', sector: 'Робототехника', price: '₽ 148,60', change: '+3,42%', positive: true, cap: '₽ 8,4 млрд', revenue: '120 ИУ', profit: '−18 ИУ', risk: 'Высокий', description: 'Разрабатывает автономных роботов-доставщиков для магазинов и логистических центров. Выручка растёт, но компания пока вкладывает почти всё в масштабирование.', advantages: 'Рост заказов; крупный контракт на тестирование; потенциально масштабируемая технология.', risks: 'Чистый убыток; зависимость от крупных контрактов; расходы на разработку и сервис.' },
  { ticker: 'OGUR', name: 'Огурец Капитал', sector: 'Напитки', price: '₽ 92,15', change: '+0,84%', positive: true, cap: '₽ 5,1 млрд', revenue: '210 ИУ', profit: '+16 ИУ', risk: 'Средний', description: 'Производитель напитков и готовых соков с сетью региональных дистрибьюторов. Компания прибыльна и расширяет линейку, но чувствительна к стоимости упаковки и сырья.', advantages: 'Положительная прибыль; узнаваемая линейка; стабильные каналы продаж.', risks: 'Подорожание сырья; конкуренция за полку; умеренный темп роста.' },
  { ticker: 'TAPK', name: 'ТапокТех', sector: 'Электроника', price: '₽ 64,20', change: '−4,16%', positive: false, cap: '₽ 3,2 млрд', revenue: '95 ИУ', profit: '−27 ИУ', risk: 'Очень высокий', description: 'Создаёт умные тапочки с датчиками движения и приложением для дома. Возвраты товара растут, а новая версия ещё не доказала, что сможет исправить ситуацию.', advantages: 'Низкая цена акции; необычный продукт; возможный эффект от удачного обновления.', risks: 'Большой убыток; высокий процент возвратов; спрос и качество пока не подтверждены.' },
  { ticker: 'DUST', name: 'Пыль и прибыль', sector: 'Услуги', price: '₽ 210,80', change: '+0,26%', positive: true, cap: '₽ 12,6 млрд', revenue: '240 ИУ', profit: '+21 ИУ', risk: 'Низкий', description: 'Оказывает услуги по обслуживанию коммерческих зданий и автоматизации уборки. Рост умеренный, зато контракты долгосрочные и бизнес уже приносит прибыль.', advantages: 'Прибыльная модель; долгосрочные контракты; сравнительно низкий риск.', risks: 'Невысокие темпы роста; давление на зарплаты и себестоимость услуг.' },
  { ticker: 'BTRAN', name: 'Банан Транс', sector: 'Топливо и сеть АЗС', price: '₽ 176,40', change: '+1,18%', positive: true, cap: '₽ 18,9 млрд', revenue: '380 ИУ', profit: '+29 ИУ', risk: 'Средний', description: 'Крупная городская сеть автозаправок: топливо, магазины у кассы, мойки и зарядные станции. Сильный денежный поток зависит от закупочных цен, трафика и маржи на литр.', advantages: 'Широкая сеть АЗС; повторяющийся спрос; дополнительные продажи в магазинах и сервисах.', risks: 'Колебания оптовых цен; расходы на содержание станций; конкуренция и переход части клиентов на электромобили.' },
]

function getStockQuestions(company: typeof companies[number]) {
  const scenarios: Record<string, { prompts: string[]; hints: string[]; choices: [string, string, string][] }> = {
    KOTL: {
      prompts: [
        '«Котолёт» быстро растёт, но убыточен. На каких цифрах основано предложение?',
        'Контракт на 800 роботов пока только обсуждается. Что произойдёт, если его не подпишут?',
        'Когда «Котолёт» сможет оправдать текущую оценку и что заставит нас пересмотреть идею?',
      ],
      hints: [
        'Для KOTL важны темп выручки, денежный запас и путь к прибыльности — не только рост котировки.',
        'Потенциальный контракт не равен подтверждённому заказу. Назови сценарий провала.',
        'Клиенту нужен проверяемый критерий выхода из идеи, а не обещание роста.',
      ],
      choices: [
        ['Сопоставим рост заказов с убытком и расходами на масштабирование; без сокращения затрат тезис ослабнет.', 'Контракт почти гарантирован, поэтому текущий убыток можно не учитывать.', 'Проверим денежный запас, маржу и подтверждение заказов до увеличения позиции.'],
        ['Если контракт сорвётся, расходы останутся — ограничим размер позиции и дождёмся подтверждения.', 'Сеть доставки уже тестирует роботов, значит контракт фактически заключён.', 'Сравним сценарий подписания и отказа; без контракта пересмотрим оценку.'],
        ['Будем следить за маржой, денежным запасом и реальными поставками; ухудшение этих метрик — сигнал пересмотреть тезис.', 'Технологичные компании рано или поздно растут, поэтому продавать не придётся.', 'Заранее определим допустимый убыток и не будем обещать срок выхода в прибыль.'],
      ],
    },
    OGUR: {
      prompts: [
        '«Огурец Капитал» прибыльный, но растёт медленно. Почему это подходит именно вам?',
        'Что будет с маржой, если упаковка и сырьё подорожают?',
        'Какую доходность можно ожидать от спокойного бизнеса без обещаний быстрого роста?',
      ],
      hints: [
        'Для OGUR важны стабильная прибыль и дистрибуция, но темп роста ограничен.',
        'Проверь, выдержит ли бизнес давление себестоимости и конкуренцию за полку.',
        'Не выдавай устойчивость бизнеса за гарантию доходности акции.',
      ],
      choices: [
        ['У компании есть прибыль и каналы продаж; сравним устойчивость маржи с умеренным темпом роста.', 'Напитки покупают всегда, поэтому акция не может падать.', 'Это скорее спокойная идея, но проверим стоимость сырья и упаковки перед покупкой.'],
        ['Подорожание сырья может снизить маржу; посмотрим, сможет ли компания поднять цены без потери спроса.', 'Производитель просто переложит любые расходы на покупателя.', 'Сравним маржу и условия поставщиков, а размер позиции подберём с учётом риска.'],
        ['Быстрый рост не гарантирован. Разберём прибыль, дивиденды и негативный сценарий, прежде чем определять долю.', 'Прибыльная компания точно даст не меньше 20% за год.', 'Согласуем горизонт и риск: стабильный бизнес не означает стабильную цену акции.'],
      ],
    },
    TAPK: {
      prompts: [
        '«ТапокТех» теряет 4% за день, а возвраты растут. Почему покупать сейчас — не просто ловить падающий нож?',
        'Компания обещает исправить умные тапочки. Как проверить, что проблема действительно решена?',
        'Что должно произойти, чтобы вы признали инвестиционную идею по TAPK ошибочной?',
      ],
      hints: [
        'Для TAPK ключевые сигналы — возвраты, гарантийные расходы и доказательства качества новой версии.',
        'Обещание обновления не равно результату: нужны факты после запуска.',
        'Высокий риск требует заранее сформулированного условия отказа от идеи.',
      ],
      choices: [
        ['Падение само по себе не делает акцию дешёвой. Сначала оценим возвраты, убыток и качество новой версии.', 'После падения акция обязана отскочить — надо покупать немедленно.', 'Рассмотрим небольшую позицию только после данных о возвратах и денежном запасе.'],
        ['Дождёмся статистики возвратов после обновления и проверим гарантийные расходы.', 'Руководство пообещало исправление, значит вопрос закрыт.', 'Сверим независимые показатели качества и зададим лимит риска до подтверждения.'],
        ['Если возвраты не снижаются или денежный запас быстро тает, пересмотрим тезис и ограничим убыток.', 'Даже если продукт плохой, цена рано или поздно восстановится.', 'Не будем увеличивать позицию без доказательств; заранее определим условия выхода.'],
      ],
    },
    BTRAN: {
      prompts: [
        '«Банан Транс» — крупнейшая сеть АЗС города. На чём она зарабатывает кроме бензина?',
        'Оптовая цена топлива выросла, а поднять розничную цену сразу нельзя. Что будет с маржой?',
        'Сеть строит новые станции и зарядки. Как понять, не тратит ли она слишком много?',
      ],
      hints: [
        'Раздели продажи топлива, магазин, мойку и зарядки: у каждого направления своя маржа.',
        'Трафик и цена закупки могут меняться быстрее розничных цен. Не обещай стабильную прибыль.',
        'Для расширения важны окупаемость станции, долг и денежный поток, а не только число вывесок.',
      ],
      choices: [
        ['Оценим маржу на топливе и вклад магазинов, моек и зарядок; важен доход на одну станцию.', 'Все машины обязаны заправляться, поэтому выручка сети неуязвима.', 'Сравним трафик, средний чек и прибыльность сервисов по отдельности.'],
        ['Маржа может временно сжаться. Проверим запасы, закупочные контракты и возможность менять цены без потери трафика.', 'Поднимут цену на всё сразу — водителям всё равно придётся заправляться.', 'Построим сценарии при разных оптовых ценах и оценим чувствительность прибыли.'],
        ['Сравним окупаемость новых точек, долговую нагрузку и свободный денежный поток с действующими станциями.', 'Чем больше заправок, тем автоматически дороже компания.', 'Попросим данные по сроку окупаемости и будем учитывать риск недозагрузки новых станций.'],
      ],
    },
    DUST: {
      prompts: [
        '«Пыль и прибыль» растёт медленно. Чем оправдана покупка вместо более рискованной компании?',
        'Как рост зарплат и себестоимости может повлиять на долгосрочные контракты?',
        'Что должно измениться, чтобы вы продали даже прибыльную компанию?',
      ],
      hints: [
        'Для DUST важны денежный поток и контракты, но низкий темп роста ограничивает потенциал.',
        'Долгосрочные договоры не защищают автоматически от роста затрат.',
        'Даже хороший бизнес требует оценки цены и условий пересмотра позиции.',
      ],
      choices: [
        ['У компании положительная прибыль и долгосрочные контракты, но мы сравним цену с умеренным ростом.', 'Услуги уборки нужны всегда, поэтому акция гарантированно растёт.', 'Рассмотрим DUST как более спокойную часть портфеля, не забывая о себестоимости.'],
        ['Рост зарплат сжимает маржу, если контракты не позволяют корректировать цены.', 'Долгосрочный контракт полностью исключает риск расходов.', 'Проверим условия индексации договоров и динамику затрат.'],
        ['Если маржа и денежный поток ухудшатся или цена перестанет оправдывать рост, пересмотрим позицию.', 'Прибыльные компании продавать никогда не нужно.', 'Зафиксируем критерии пересмотра и альтернативы с учётом риска.'],
      ],
    },
  }
  const scenario = scenarios[company.ticker] ?? scenarios.KOTL
  const followUps: Record<string, { title: string; hint: string; choices: [string, string, string] }[]> = {
    KOTL: [
      { title: 'Сколько роботов компания должна поставить, чтобы сервисная сеть не съела всю прибыль?', hint: 'У робототехники важны не только продажи устройств, но и стоимость обслуживания.', choices: ['Посчитаем валовую маржу вместе с ремонтом, батареями и обслуживанием каждого робота.', 'Сервис потом наладится сам — главное продать побольше роботов.', 'Сравним стоимость жизненного цикла робота с выручкой от контракта.'] },
      { title: 'Если конкурент выпустит робота дешевле, что останется преимуществом «Котолёта»?', hint: 'Проверь, есть ли у технологии защита от копирования и реальная экономия для клиента.', choices: ['Проверим точность доставки, стоимость эксплуатации и удержание клиентов, а не только красивую демонстрацию.', 'Первым на рынке всегда остаётся лидер.', 'Сравним патенты, себестоимость и повторные заказы с конкурентами.'] },
    ],
    OGUR: [
      { title: 'Сможет ли «Огурец Капитал» продать больше, если магазины отдадут полку конкурентам?', hint: 'Для напитков решают дистрибуция, узнаваемость и место на полке.', choices: ['Проверим долю полки, повторные покупки и стоимость продвижения в торговых сетях.', 'Покупатели сами найдут любимый сок — реклама не нужна.', 'Оценим продажи по регионам и зависимость от нескольких крупных сетей.'] },
      { title: 'Новая линейка напитков выглядит модно. Как понять, что это не дорогая разовая кампания?', hint: 'Отдели рекламный шум от повторного спроса и рентабельности продукта.', choices: ['Посмотрим повторные покупки, маржу новой линейки и расходы на продвижение после запуска.', 'Если упаковка яркая, продажи обязательно вырастут.', 'Сравним продажи после промо с обычными неделями и учтём списания.'] },
    ],
    TAPK: [
      { title: 'Покупатели спрашивают: «Тапочки подключаются к Bluetooth, а если телефон разрядится — я разучусь ходить?» Что ответить инвестору?', hint: 'Немного юмора уместно, но ответ должен опираться на продукт и клиентский опыт.', choices: ['Хорошая шутка, но важнее автономность и базовые функции без приложения. Проверим отзывы и возвраты после обновления.', 'Bluetooth — будущее! Скоро тапочки сами будут ходить за хозяином.', 'Проверим, какие функции работают без телефона, и сколько стоит устранить главные причины возврата.'] },
      { title: 'Умные тапочки обещают считать шаги по квартире. Есть ли за это готовность платить повторно?', hint: 'Для гаджета важно доказать реальную пользу и экономику продаж, а не только необычность идеи.', choices: ['Проверим повторные покупки, активность пользователей и себестоимость датчиков до масштабирования.', 'Это уникально, поэтому цену можно поставить любую.', 'Сравним спрос на новую версию с возвратами и стоимостью поддержки приложения.'] },
    ],
    DUST: [
      { title: 'Если крупный клиент продлит контракт, но потребует скидку, что произойдёт с прибылью?', hint: 'В сервисном бизнесе объём контракта не равен его выгодности.', choices: ['Рассчитаем прибыль после зарплат, оборудования и скидки; убыточный контракт не стоит удерживать любой ценой.', 'Большой клиент всегда полезен, даже если работать почти бесплатно.', 'Проверим возможность пересмотра объёма работ и индексации цены.'] },
      { title: 'Автоматизация уборки обещает снизить расходы. Сколько она стоит до того, как начнёт экономить?', hint: 'Технологии могут улучшить маржу, но сначала требуют вложений и обслуживания.', choices: ['Сравним стоимость внедрения и сервиса с реальной экономией часов труда на объекте.', 'Роботы заменят всех сотрудников уже в следующем месяце.', 'Начнём с пилотных объектов и проверим окупаемость до расширения.'] },
    ],
    BTRAN: [
      { title: 'На АЗС продают кофе, булочки и зарядку для телефона. Это мелочь или важная часть бизнеса?', hint: 'У сетей АЗС дополнительные сервисы могут давать иную маржу, чем топливо.', choices: ['Посмотрим долю прибыли магазинов и сервисов и средний чек на одну заправку.', 'Кофе — просто декор, деньги приносит только бензин.', 'Сравним маржу магазина с топливной и проверим, возвращаются ли покупатели.'] },
      { title: 'Город переходит на электромобили. Как сети не превратиться в музей бензоколонок?', hint: 'Нужна стратегия перехода, но зарядки тоже требуют инвестиций и загрузки.', choices: ['Оценим спрос на зарядки, стоимость подключения и срок окупаемости по локациям.', 'Электромобили — мода на один сезон, ничего менять не нужно.', 'Развернём зарядки постепенно там, где есть трафик, и сравним экономику с обычными станциями.'] },
    ],
  }
  const baseQuestions = scenario.prompts.map((title, index) => ({
    title,
    hint: scenario.hints[index],
    choices: [
      { label: scenario.choices[index][0], delta: 9, kind: 'good' },
      { label: scenario.choices[index][1], delta: -13, kind: 'bad' },
      { label: scenario.choices[index][2], delta: 7, kind: 'good' },
    ],
  }))
  const extraQuestions = (followUps[company.ticker] ?? []).map((item) => ({
    title: item.title,
    hint: item.hint,
    choices: [
      { label: item.choices[0], delta: 9, kind: 'good' },
      { label: item.choices[1], delta: -13, kind: 'bad' },
      { label: item.choices[2], delta: 7, kind: 'good' },
    ],
  }))
  return [...baseQuestions, ...extraQuestions]
}

const news = [
  { tag: 'КОТОЛЁТ', time: '09:14', title: '«Котолёт» ведёт переговоры о контракте на 800 роботов', body: 'Сеть доставки подтвердила тестирование, но требует гарантий бесперебойной работы.', meaning: 'Тестирование ещё не означает, что контракт подписан. Если сделка состоится, выручка может вырасти; если нет — расходы на разработку останутся.', impact: 'Сигнал для KOTL: осторожно позитивный, подтверждения заказа пока нет.', tone: 'green' },
  { tag: 'РЫНОК', time: '08:52', title: 'Инвесторы стали внимательнее к компаниям без прибыли', body: 'После серии слабых отчётов рынок требует доказательств пути к положительному денежному потоку.', meaning: 'Даже быстро растущая выручка не гарантирует рост акции. Смотри, сокращается ли убыток, хватает ли денег и когда бизнес сможет финансировать себя.', impact: 'Рыночный риск: компании с убытками могут дешеветь даже при росте продаж.', tone: 'gold' },
  { tag: 'ТАПОКТЕХ', time: '08:30', title: 'Возвраты умных тапочек превысили прогноз', body: 'Компания обещает обновить посадку устройства. Акции теряют часть вчерашнего роста.', meaning: 'Возвраты означают потерянную выручку и дополнительные расходы. Обещание исправить товар — не доказательство, что проблема решена.', impact: 'Сигнал для TAPK: негативный; следи за возвратами и расходами на гарантию.', tone: 'red' },
]

function readSave() {
  try {
    const raw = localStorage.getItem('na-vse-kotirovki-save-v1')
    if (raw) return JSON.parse(raw) as { cash?: number; firmCapital?: number; debt?: number; reputation?: number; day?: number; deals?: number; housingId?: string; ownedItems?: string[]; selectedClientId?: string; videoBackground?: VideoBackground; clientLastContactDay?: Record<string, number>; clientDealCounts?: Record<string, number>; clientInvested?: Record<string, number>; callClientId?: string; callsToday?: number; dailyLeadIds?: string[]; gameMinutes?: number; dayEnded?: boolean; dailySalesAmount?: number; dailySalesShares?: number }
  } catch { /* Storage may be disabled; the game still works for this session. */ }
  return {}
}

function SelfCameraPreview({ enabled, background, outfit }: { enabled: boolean; background: VideoBackground; outfit: OutfitId }) {
  return <div className={'player-preview-tile in-game-self-view ' + background + ' outfit-' + outfit + (enabled ? '' : ' video-disabled')} aria-label="Игровой видеокадр персонажа">
    <div className="self-view-room"><span className="self-view-window" /><span className="self-view-lamp" /><span className="self-view-shelf" /></div>
    {enabled ? <Canvas className="self-avatar-canvas" camera={{ position: [0, 1.35, 4.5], fov: 42 }} dpr={[1, 1.5]}><ambientLight intensity={1.25} /><directionalLight position={[-2, 3, 3]} intensity={1.8} /><WardrobeAvatar3D outfit={outfit} /></Canvas> : <div className="video-off-overlay"><Video size={16} /><span>ВИДЕО ВЫКЛЮЧЕНО</span></div>}
    <small>{enabled ? 'ТВОЙ ПЕРСОНАЖ' : 'ТОЛЬКО АУДИО'}</small>
  </div>
}

function OutfitIllustration({ id }: { id: OutfitId }) {
  const jacket = id === 'premium' ? '#1d3440' : id === 'classic' ? '#3c5268' : '#557b6d'
  const trousers = id === 'premium' ? '#17232b' : id === 'classic' ? '#2b3540' : '#35433f'
  const shirt = id === 'intern' ? '#80a596' : '#eee8dc'
  return <svg className={'outfit-illustration outfit-illustration-' + id} viewBox="0 0 120 150" role="img" aria-label={id === 'intern' ? 'Повседневный комплект' : id === 'classic' ? 'Классический деловой костюм' : 'Премиальный деловой костюм'}>
    <ellipse cx="60" cy="140" rx="31" ry="5" fill="#06100f" opacity=".45"/>
    <path d="M48 51L37 59 29 91 40 95 47 75 47 101H73V75L80 95 91 91 83 59 72 51Z" fill={id === 'intern' ? shirt : jacket} stroke="#a5c7b4" strokeOpacity=".25" strokeWidth="1.2"/>
    {id !== 'intern' && <path d="M49 51L60 65 71 51 66 49H54Z" fill="#f1ecdf"/>}
    {id !== 'intern' && <path d="M60 64L56 71 60 89 64 71Z" fill={id === 'premium' ? '#c7a96d' : '#30475c'}/>}
    {id === 'premium' && <path d="M76 60l3 5-3 5-3-5z" fill="#d8bd7c"/>}
    <path d="M47 99H73L78 130 65 132 60 111 55 132 42 130Z" fill={trousers}/>
    <path d="M42 130L55 132 55 137H37Q35 134 42 130ZM65 132L78 130Q85 134 83 137H65Z" fill="#182125"/>
    <path d="M47 101H73" stroke="#b5c9bd" strokeOpacity=".3"/>
    <rect x="55" y="41" width="10" height="12" rx="3" fill="#bd8868"/>
    <ellipse cx="60" cy="28" rx="16" ry="19" fill="#c99170"/>
    <path d={id === 'premium' ? "M44 28Q41 8 60 8Q79 8 76 28L72 19Q61 13 48 21Z" : "M44 27Q41 9 60 9Q78 9 76 27L72 19Q59 14 48 22Z"} fill={id === 'premium' ? '#24211f' : '#382920'}/>
    <path d="M52 29h3M65 29h3" stroke="#30241f" strokeWidth="2" strokeLinecap="round"/>
    <path d="M55 37Q60 40 65 37" stroke="#8a4d3d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {id !== 'intern' && <path d="M39 62L49 54 55 65 47 72ZM81 62L71 54 65 65 73 72Z" fill={id === 'premium' ? '#28434d' : '#526a7b'} stroke="#8ca79a" strokeOpacity=".3"/>}
  </svg>
}

function RoomItemIllustration({ id }: { id: string }) {
  const stroke = '#b8dfcc'
  const shade = '#24463e'
  return <svg className={'room-item-illustration illustration-' + id} viewBox="0 0 140 110" role="img" aria-label={id.replace(/-/g, ' ')}>
    <defs><linearGradient id={'item-metal-' + id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#b8d2c7" /><stop offset="100%" stopColor="#47685e" /></linearGradient></defs>
    <ellipse cx="70" cy="96" rx="44" ry="6" fill="#071011" opacity=".55" />
    {id === 'desk-lamp' && <g stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M54 88h34M70 86l-8-34 23-17" /><path d="M74 27l28 4-9 17-28-4z" fill={shade} /><path d="M79 48l-5 9M86 49l-2 9" stroke="#e4c88b" strokeWidth="2" /></g>}
    {id === 'used-chair' && <g stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M46 24q0-5 6-5h26q7 0 7 7v34H46z" fill={shade}/><path d="M43 58h47v13H43z" fill="#355a50"/><path d="M49 71l-7 20M83 71l9 20M66 71v20" fill="none"/><path d="M41 92h-8M92 92h9" fill="none"/></g>}
    {id === 'headset' && <g stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M36 60V47a34 34 0 0 1 68 0v13"/><rect x="29" y="52" width="18" height="29" rx="7" fill={shade}/><rect x="93" y="52" width="18" height="29" rx="7" fill={shade}/><path d="M101 80q-3 15-22 15h-8" strokeWidth="3"/><circle cx="66" cy="95" r="4" fill="#d7b879" stroke="none"/></g>}
    {id === 'ring-light' && <g strokeLinecap="round" strokeLinejoin="round" fill="none"><circle cx="70" cy="40" r="27" stroke="#e7d8a8" strokeWidth="7"/><circle cx="70" cy="40" r="19" stroke="#8bb9a4" strokeWidth="2"/><path d="M70 67v24M56 92h28" stroke={stroke} strokeWidth="4"/><path d="M48 26l-7-4M92 26l7-4" stroke="#f2d8a1" strokeWidth="2"/></g>}
    {id === 'hd-camera' && <g stroke={stroke} strokeWidth="4" strokeLinejoin="round"><rect x="31" y="37" width="78" height="42" rx="9" fill={shade}/><circle cx="70" cy="58" r="17" fill="#0c1c1c"/><circle cx="70" cy="58" r="10" fill="#548b7b"/><circle cx="66" cy="54" r="4" fill="#c5ead8" stroke="none"/><path d="M48 36l7-8h30l7 8" fill="none"/><circle cx="98" cy="47" r="3" fill="#d7b879" stroke="none"/></g>}
    {id === 'neutral-backdrop' && <g stroke={stroke} strokeWidth="4" strokeLinejoin="round"><path d="M36 86V24M104 86V24M32 25h76" fill="none"/><path d="M42 29h56v55H42z" fill={shade}/><path d="M51 31v51M63 31v51M76 31v51M88 31v51" stroke="#547d6d" strokeWidth="2"/><path d="M31 88h15M94 88h15" fill="none"/></g>}
    {id === 'second-monitor' && <g stroke={stroke} strokeWidth="4" strokeLinejoin="round"><rect x="18" y="23" width="48" height="43" rx="4" fill={shade}/><rect x="72" y="15" width="50" height="51" rx="4" fill="#19332e"/><path d="M26 53l10-12 8 6 11-15M80 50l10-15 8 8 14-14" fill="none" stroke="#7de0b1" strokeWidth="2.5"/><path d="M42 67v13M96 67v13M31 81h23M84 81h24" fill="none"/></g>}
    {id === 'chromakey-kit' && <g stroke={stroke} strokeWidth="4" strokeLinejoin="round"><path d="M31 88V21M109 88V21M27 22h86" fill="none"/><path d="M38 27h64v55H38z" fill="#2f8466"/><path d="M46 35h48M46 45h48M46 55h48M46 65h48" stroke="#67b994" strokeWidth="2" opacity=".65"/><path d="M30 89h-7M110 89h7" fill="none"/></g>}
    {id === 'pro-mic' && <g stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><rect x="54" y="16" width="32" height="48" rx="15" fill={shade}/><path d="M45 44v8a25 25 0 0 0 50 0v-8M70 77v13M56 91h28" fill="none"/><path d="M62 24v22M70 22v24M78 24v22" stroke="#80c4a2" strokeWidth="2"/></g>}
    {!['desk-lamp','used-chair','headset','ring-light','hd-camera','neutral-backdrop','second-monitor','chromakey-kit','pro-mic'].includes(id) && <g stroke={stroke} strokeWidth="4" fill={shade}><rect x="35" y="25" width="70" height="55" rx="7"/><path d="M48 91h44M70 80v11" fill="none"/></g>}
  </svg>
}

function WardrobeAvatar3D({ outfit }: { outfit: OutfitId }) {
  const jacket = outfit === 'premium' ? '#1b2d38' : outfit === 'classic' ? '#34485d' : '#496b60'
  const shirt = outfit === 'intern' ? '#6c897e' : '#e8e2d6'
  const trousers = outfit === 'premium' ? '#202b33' : outfit === 'classic' ? '#303943' : '#303b42'
  const skin = '#bda18a'
  const hair = outfit === 'premium' ? '#211e1c' : '#35271f'
  const skinTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const base = ctx.createLinearGradient(0, 0, 512, 512)
    base.addColorStop(0, '#c9b09a')
    base.addColorStop(0.45, '#bda18a')
    base.addColorStop(1, '#a78b76')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 512, 512)
    const cheek = ctx.createRadialGradient(180, 245, 12, 180, 245, 170)
    cheek.addColorStop(0, 'rgba(166,105,91,0.12)')
    cheek.addColorStop(1, 'rgba(166,105,91,0)')
    ctx.fillStyle = cheek
    ctx.fillRect(0, 0, 512, 512)
    let seed = 82471
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    for (let i = 0; i < 2100; i++) {
      const x = random() * 512, y = random() * 512, r = 0.35 + random() * 1.15
      ctx.fillStyle = random() > 0.5 ? 'rgba(91,48,35,0.10)' : 'rgba(255,224,193,0.12)'
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [])
  return <group position={[0, 0.02, 0]}>
    <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[0.72, 48]} /><meshStandardMaterial color="#1a2829" roughness={0.96} /></mesh>
    <mesh position={[0, 0.78, 0]} scale={[0.34, 0.24, 0.205]} castShadow><sphereGeometry args={[1, 40, 32]} /><meshStandardMaterial color={trousers} roughness={0.9} /></mesh>
    {[-0.145, 0.145].map((x) => <group key={x} position={[x, 0.08, 0]}>
      <mesh position={[0, 0.43, 0]} scale={[0.94, 1, 0.94]} castShadow><capsuleGeometry args={[0.092, 0.55, 12, 24]} /><meshStandardMaterial color={trousers} roughness={0.9} /></mesh>
      <mesh position={[0, 0.075, 0.075]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 0.8, 1]} castShadow><capsuleGeometry args={[0.072, 0.14, 8, 18]} /><meshStandardMaterial color="#20262a" roughness={0.82} /></mesh>
    </group>)}
    <mesh position={[0, 1.17, 0]} scale={[1, 1.03, 0.92]} castShadow><capsuleGeometry args={[0.255, 0.43, 16, 32]} /><meshStandardMaterial color={jacket} roughness={0.86} /></mesh>
    <mesh position={[0, 0.99, 0.224]} scale={[0.105, 0.3, 0.045]} castShadow><capsuleGeometry args={[0.1, 0.22, 12, 24]} /><meshStandardMaterial color={shirt} roughness={0.88} /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 0.245, 1.4, 0]}>
      <mesh position={[side * 0.105, -0.24, 0]} rotation={[0, 0, side * -0.19]} castShadow><capsuleGeometry args={[0.078, 0.43, 14, 28]} /><meshStandardMaterial color={jacket} roughness={0.9} /></mesh>
      <mesh position={[side * 0.16, -0.51, 0.01]} rotation={[0, 0, side * -0.13]} castShadow><capsuleGeometry args={[0.054, 0.13, 12, 22]} /><meshStandardMaterial color={skin} roughness={0.86} /></mesh>
    </group>)}
    <mesh position={[0, 1.59, 0]} castShadow><cylinderGeometry args={[0.065, 0.078, 0.19, 24]} /><meshStandardMaterial color={skin} roughness={0.86} /></mesh>
    <mesh position={[0, 1.94, 0.005]} scale={[0.188, 0.245, 0.18]} castShadow><sphereGeometry args={[1, 64, 48]} /><meshStandardMaterial color={skin} roughness={0.88} metalness={0} map={skinTexture ?? undefined} /></mesh>
    <mesh position={[0, 2.105, -0.008]} scale={[0.19, 0.092, 0.184]} castShadow><sphereGeometry args={[1, 40, 28]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    <mesh position={[0, 2.08, 0.095]} scale={[0.17, 0.065, 0.105]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * 0.184, 1.95, 0.002]} scale={[0.027, 0.045, 0.026]} castShadow><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color={skin} roughness={0.86} /></mesh>)}
    {[-0.067, 0.067].map((x) => <group key={x}>
      <mesh position={[x, 1.974, 0.174]} scale={[0.026, 0.015, 0.009]}><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#e8d6c5" roughness={0.55} /></mesh>
      <mesh position={[x, 1.974, 0.182]}><sphereGeometry args={[0.009, 20, 16]} /><meshStandardMaterial color="#4b625b" roughness={0.52} /></mesh>
      <mesh position={[x, 2.004, 0.17]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}><capsuleGeometry args={[0.008, 0.035, 6, 12]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    </group>)}
    <mesh position={[0, 1.928, 0.184]} scale={[0.012, 0.03, 0.015]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color={skin} roughness={0.86} /></mesh>
    <mesh position={[0, 1.874, 0.174]} scale={[0.026, 0.006, 0.006]}><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color="#8b5146" roughness={0.92} /></mesh>
    {outfit !== 'intern' && <>
      <mesh position={[-0.045, 1.46, 0.221]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.07, 0.15, 0.018]} /><meshStandardMaterial color="#f0eadf" roughness={0.9} /></mesh>
      <mesh position={[0.045, 1.46, 0.221]} rotation={[0, 0, 0.2]}><boxGeometry args={[0.07, 0.15, 0.018]} /><meshStandardMaterial color="#f0eadf" roughness={0.9} /></mesh>
      <mesh position={[0, 1.29, 0.265]}><coneGeometry args={[0.027, 0.14, 4]} /><meshStandardMaterial color={outfit === 'premium' ? '#b69a62' : '#243d52'} roughness={0.75} /></mesh>
    </>}
    {outfit === 'premium' && <mesh position={[0.18, 1.3, 0.22]}><sphereGeometry args={[0.016, 16, 12]} /><meshStandardMaterial color="#d7b879" metalness={0.3} roughness={0.7} /></mesh>}
  </group>
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
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [startSearch, setStartSearch] = useState('')
  const [appWindows, setAppWindows] = useState<Array<{ id: number; app: 'overview' | 'market' | 'news' | 'calls' | 'clients' | 'shop' | 'housing'; x: number; y: number; minimized: boolean; maximized: boolean }>>([])
  const [nextAppWindowId, setNextAppWindowId] = useState(1)
  const appWindowDragRef = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null)
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
  const [ownedOutfits, setOwnedOutfits] = useState<OutfitId[]>(() => { try { const raw = JSON.parse(localStorage.getItem('na-vse-kotirovki-owned-outfits') || '["intern"]'); return Array.isArray(raw) ? Array.from(new Set<OutfitId>(['intern', ...raw.filter((id: string): id is OutfitId => id === 'classic' || id === 'premium' || id === 'intern')])) : ['intern'] } catch { return ['intern'] } })
  const [outfitDetailsId, setOutfitDetailsId] = useState<OutfitId | null>(null)
  const [roomItemDetailsId, setRoomItemDetailsId] = useState<string | null>(null)
  const finishIntro = useCallback(() => setIntroActive(false), [])
  useEffect(() => { try { localStorage.setItem('na-vse-kotirovki-outfit', selectedOutfit); localStorage.setItem('na-vse-kotirovki-owned-outfits', JSON.stringify(ownedOutfits)) } catch { /* Outfit preferences are optional if storage is unavailable. */ } }, [selectedOutfit, ownedOutfits])
  const [careerStarted, setCareerStarted] = useState(() => startNewCareerOnLoad || Object.keys(readSave()).length > 0)
  const [hasSavedGame, setHasSavedGame] = useState(() => Object.keys(readSave()).length > 0)
  const [menuSettings, setMenuSettings] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-reduced-motion') === 'true' } catch { return false } })
  const [soundEnabled, setSoundEnabled] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-sound') !== 'false' } catch { return true } })
  const [ambienceEnabled, setAmbienceEnabled] = useState(() => { try { return localStorage.getItem('na-vse-kotirovki-ambience') !== 'false' } catch { return true } })
  const [masterVolume, setMasterVolume] = useState(() => { try { const value = localStorage.getItem('na-vse-kotirovki-volume'); return value === null ? 72 : Math.max(0, Math.min(100, Number(value) || 0)) } catch { return 72 } })
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
  const lastTimerBeep = useRef(0)
  const lastCallTickSecond = useRef(-1)
  const [choiceOrders, setChoiceOrders] = useState<number[][]>([])
  const [lastPenaltySecond, setLastPenaltySecond] = useState(25)
  const [freeAnswer, setFreeAnswer] = useState('')
  const [conversation, setConversation] = useState<{ from: 'client' | 'you' | 'system'; text: string }[]>([])
  const [lastResult, setLastResult] = useState('')
  const [toast, setToast] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('KOTL')
  const [newsImpacts, setNewsImpacts] = useState<Record<string, number>>({})
  const [marketReviewed, setMarketReviewed] = useState(false)
  const [newsReviewed, setNewsReviewed] = useState(false)
  const [dailySalesAmount, setDailySalesAmount] = useState(saved.dailySalesAmount ?? 0)
  const [dailySalesShares, setDailySalesShares] = useState(saved.dailySalesShares ?? 0)
  const [shiftReport, setShiftReport] = useState<{success:boolean; ticker:string; company:string; shares:number; targetShares:number; amount:number; targetAmount:number; reward:number; penalty:number} | null>(null)
  const [cityLocation, setCityLocation] = useState('office')
  const [cityVisitedToday, setCityVisitedToday] = useState<string[]>([])
  const [cityBonus, setCityBonus] = useState(0)

  useEffect(() => {
    if (startNewCareerOnLoad) { try { localStorage.removeItem('na-vse-kotirovki-start-new-career') } catch { /* Ignore unavailable storage. */ } }
  }, [startNewCareerOnLoad])

  useEffect(() => {
    configureAudio({ enabled: soundEnabled, ambience: ambienceEnabled, voice: false, curtainsOpen, inRoom: mainMenu || panel === 'room' || panel === 'computer', inCall: callStatus === 'active', paused: pauseOpen || menuSettings, volume: masterVolume / 100 })
    try {
      localStorage.setItem('na-vse-kotirovki-sound', String(soundEnabled))
      localStorage.setItem('na-vse-kotirovki-ambience', String(ambienceEnabled))
      localStorage.setItem('na-vse-kotirovki-volume', String(masterVolume))
    } catch { /* Audio preferences are optional if storage is unavailable. */ }
    if (callStatus !== 'active' || mainMenu || tab !== 'calls') stopSpeech()
  }, [soundEnabled, ambienceEnabled, masterVolume, curtainsOpen, mainMenu, panel, callStatus, pauseOpen, menuSettings, tab])

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
    try { localStorage.setItem('na-vse-kotirovki-save-v1', JSON.stringify({ cash, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callsToday, dailyLeadIds, gameMinutes, dayEnded, dailySalesAmount, dailySalesShares })) } catch { /* Ignore unavailable storage. */ }
  }, [careerStarted, cash, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callsToday, dailyLeadIds, gameMinutes, dayEnded, dailySalesAmount, dailySalesShares])

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

  // In-game clock: two minutes pass in the world every real minute; pausing freezes it.
  useEffect(() => {
    if (pauseOpen) return
    const clock = window.setInterval(() => setGameMinutes((value) => (value + 2) % (24 * 60)), 60000)
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
    if (callStatus !== 'active') { lastCallTickSecond.current = -1; return }
    const second = Math.floor(timeLeft)
    if (second !== lastCallTickSecond.current) {
      lastCallTickSecond.current = second
      if (timeLeft > 4) playSound('tick')
    }
  }, [timeLeft, callStatus])

  useEffect(() => {
    if (callStatus !== 'active') { lastTimerBeep.current = 0; return }
    if (timeLeft > 4) { lastTimerBeep.current = 0; return }
    const second = Math.ceil(timeLeft)
    if (second > 0 && second !== lastTimerBeep.current) { lastTimerBeep.current = second; playSound('countdown') }
  }, [timeLeft, callStatus])

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
  const getDisplayedPrice = (company: typeof companies[number]) => { const base = Number(company.price.replace(/[^0-9,.-]/g, '').replace(',', '.')); const moved = base * (1 + (newsImpacts[company.ticker] ?? 0) / 100); return '₽ ' + moved.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
  const getDisplayedChange = (company: typeof companies[number]) => { const base = Number(company.change.replace('%', '').replace(/[−–]/g, '-').replace(',', '.')); const moved = base + (newsImpacts[company.ticker] ?? 0); return (moved > 0 ? '+' : '') + moved.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' }
  const marketIndexImpact = Object.values(newsImpacts).reduce((total, impact) => total + impact, 0) / 4
  const currentHousing = HOUSING.find((home) => home.id === housingId) ?? HOUSING[0]
  const activeQuestions = getStockQuestions(activeCompany)
  const activeQuestion = activeQuestions[questionIndex]
  function openAppWindow(app: 'overview' | 'market' | 'news' | 'calls' | 'clients' | 'shop' | 'housing') {
    // Each launch creates a real independent window, just like a desktop OS.
    setAppWindows((items) => [...items, {
      id: nextAppWindowId,
      app,
      x: 24 + ((items.length * 38) % 250),
      y: 22 + ((items.length * 28) % 150),
      minimized: false,
      maximized: false,
    }])
    setNextAppWindowId((id) => id + 1)
    setStartMenuOpen(false)
    setStartSearch('')
  }
  const displayedChoices = activeQuestion ? (choiceOrders[questionIndex]?.map((index) => activeQuestion.choices[index]).filter(Boolean) ?? activeQuestion.choices) : []
  const trustLabel = trust >= 72 ? 'Высокое доверие' : trust >= 52 ? 'Осторожный интерес' : trust >= 32 ? 'Сомневается' : 'На грани отказа'

  useEffect(() => {
    if (panel !== 'computer' || tab !== 'calls' || callStatus !== 'active') return
    function handleNegotiationKeys(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) return
      const index = /^[1-4]$/.test(event.key) ? Number(event.key) - 1 : /^[a-d]$/i.test(event.key) ? event.key.toLowerCase().charCodeAt(0) - 97 : -1
      if (index < 0 || index >= displayedChoices.length) return
      event.preventDefault()
      const choice = displayedChoices[index]
      if (choice) answerQuestion(choice.label, choice.delta)
    }
    window.addEventListener('keydown', handleNegotiationKeys)
    return () => window.removeEventListener('keydown', handleNegotiationKeys)
  }, [panel, tab, callStatus, displayedChoices, questionIndex, trust, patience, videoEnabled, videoBackground, ownedItems, activeClient, activeQuestions])

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
    setNewsImpacts({})
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
    if (object === 'wardrobe') { setPanel('wardrobe'); setNearbyRoomObject(null); playSound('ui') }
  }, [])

  function startCall(embedded = false) {
    if (dayEnded) { setToast('Рабочий день уже завершён. Подойди к кровати и нажми E, чтобы поспать.'); return }
    const dailyCallLimit = reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2
    if (callsToday >= dailyCallLimit) { setToast('На сегодня лимит звонков исчерпан. Восстановись и продолжи завтра.'); return }
    if (!availableClients.some((client) => client.id === activeClient.id)) { setToast('Этот лид сейчас недоступен. Выбери клиента из списка актуальных предложений.'); return }
    setCallsToday((count) => count + 1)
    setQuestionIndex(0)
    setChoiceOrders(activeQuestions.map((question) => question.choices.map((_, index) => index).sort(() => Math.random() - 0.5)))
    lastTimerBeep.current = 0
    setVideoSwitchEffectUsed(false)
    setCallClientId(activeClient.id)
    setClientLastContactDay((items) => ({ ...items, [activeClient.id]: day }))
    const preparationBonus = (marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0) + cityBonus
    const roomBonus = getFirstImpression(housingId, ownedItems, activeClient)
    const relationshipBonus = Math.min(15, (clientDealCounts[activeClient.id] ?? 0) * 6)
    const videoBonus = videoEnabled ? 2 + Math.min(3, getVideoQuality(ownedItems)) : 0
    const backgroundBonus = videoEnabled ? getBackgroundModifier(videoBackground, ownedItems, activeClient) : 0
    const newsFitBonus = (newsImpacts[activeCompany.ticker] ?? 0) > 0 ? 2 : (newsImpacts[activeCompany.ticker] ?? 0) < 0 ? -2 : 0
    const companyFitBonus = (activeCompany.risk === 'Очень высокий' ? -5 : activeCompany.risk === 'Высокий' ? -2 : activeCompany.positive ? 3 : -3) + newsFitBonus
    setTrust(Math.max(0, Math.min(100, activeClient.baseTrust + preparationBonus + roomBonus + relationshipBonus + videoBonus + backgroundBonus + companyFitBonus)))
    setPatience(activeClient.patience)
    setTimeLeft(75)
    setLastPenaltySecond(75)
    setFreeAnswer('')
    setLastResult('')
    setConversation([{ from: 'system', text: 'Твоё предложение: акция «' + activeCompany.name + '» (' + activeCompany.sector + ', риск: ' + activeCompany.risk.toLowerCase() + ').' }, { from: 'client', text: 'Здравствуйте. ' + activeClient.quote }, ...(preparationBonus > 0 ? [{ from: 'system' as const, text: 'Подготовка перед звонком помогла: начальное доверие повышено на ' + preparationBonus + ' пунктов.' }] : []), ...(roomBonus !== 0 ? [{ from: 'system' as const, text: 'Первое впечатление от жилья и рабочего места: ' + (roomBonus > 0 ? '+' : '') + roomBonus + ' к доверию.' }] : []), ...(backgroundBonus !== 0 ? [{ from: 'system' as const, text: 'Выбранный фон изменил первое впечатление на ' + (backgroundBonus > 0 ? '+' : '') + backgroundBonus + ' к доверию.' }] : []), ...(relationshipBonus > 0 ? [{ from: 'system' as const, text: 'Клиент помнит прошлое сотрудничество: +' + relationshipBonus + ' к начальному доверию.' }] : [])])
    setMarketReviewed(false)
    setNewsReviewed(false)
    setCityBonus(0)
    setCallStatus('active')
    playSound('computer')
    setTimeLeft(75)
    setLastPenaltySecond(75)
    setWindowMinimized(false)
    setWindowMaximized(!embedded)
    if (!embedded) setTab('calls')
  }

  function resolveCall(nextTrust: number, nextPatience: number) {
    const threshold = 58 + activeClient.tier * 2
    const success = nextTrust >= threshold && nextPatience > 20
    setCallStatus(success ? 'won' : 'lost')
    if (success) {
      playSound('deal')
      const payout = calculateDeal(activeClient, nextTrust, clientDealCounts[activeClient.id] ?? 0, clientInvested[activeClient.id] ?? 0)
      setCash((value) => value + payout.playerBonus)
      setFirmCapital((value) => Math.max(0, value + payout.firmRevenue - payout.playerBonus))
      setReputation((value) => Math.min(100, value + (activeClient.tier >= 2 ? 5 : 4)))
      setDeals((value) => value + 1)
      setClientDealCounts((counts) => ({ ...counts, [activeClient.id]: (counts[activeClient.id] ?? 0) + 1 }))
      setClientInvested((invested) => ({ ...invested, [activeClient.id]: (invested[activeClient.id] ?? 0) + payout.ticket }))
      const soldPrice = Number(activeCompany.price.replace(/[^0-9,.-]/g, '').replace(',', '.')) * (1 + (newsImpacts[activeCompany.ticker] ?? 0) / 100)
      const soldShares = Math.floor(payout.ticket / Math.max(0.01, soldPrice))
      const quotaTargetCompany = companies[(day - 1) % companies.length]
      if (activeCompany.ticker === quotaTargetCompany.ticker) {
        setDailySalesAmount((value) => value + payout.ticket)
        setDailySalesShares((value) => value + soldShares)
      }
      setLastResult('Сделка с ' + activeClient.name + ' закрыта. Клиент разместил ' + payout.ticket.toLocaleString('ru-RU') + ' ₽. Твой бонус: +' + payout.playerBonus.toLocaleString('ru-RU') + ' ₽; доход фирмы после бонуса: +' + Math.max(0, payout.firmRevenue - payout.playerBonus).toLocaleString('ru-RU') + ' ₽. Репутация +' + (activeClient.tier >= 2 ? 5 : 4) + '.')
      const quotaNote = activeCompany.ticker === quotaTargetCompany.ticker ? ' В дневной план засчитано ' + soldShares + ' акций ' + quotaTargetCompany.ticker + '.' : ' Внимание: дневной план по ' + quotaTargetCompany.ticker + ', поэтому эта бумага в квоту не засчитана.'
      setConversation((items) => [...items, { from: 'system', text: '✓ Сделка закрыта. Объём ' + payout.ticket.toLocaleString('ru-RU') + ' ₽; фирма заработала комиссию ' + payout.firmRevenue.toLocaleString('ru-RU') + ' ₽.' + quotaNote }])
    } else {
      playSound('decline')
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
    setConversation((items) => [...items, { from: 'you', text }, ...(backgroundCaught ? [{ from: 'system' as const, text: 'Клиент заметил несоответствие в виртуальном фоне и стал внимательнее проверять твои слова. Доверие −7.' }] : []), ...(questionIndex < activeQuestions.length - 1 ? [{ from: 'client' as const, text: activeQuestions[questionIndex + 1].title }] : [])])
    setFreeAnswer('')
    if (questionIndex >= activeQuestions.length - 1) {
      resolveCall(nextTrust, nextPatience)
    } else {
      setQuestionIndex((value) => value + 1)
      const nextTime = 75
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

  function travelToCity(location: string) {
    if (dayEnded) { setToast('Смена закончена. Исследовать город можно завтра.'); return }
    const firstVisit = !cityVisitedToday.includes(location)
    setCityLocation(location)
    setCityVisitedToday((items) => items.includes(location) ? items : [...items, location])
    setGameMinutes((minutes) => (minutes + 15) % (24 * 60))
    if (firstVisit) {
      const bonus = location === 'exchange' ? 3 : location === 'cafe' ? 2 : location === 'newsstand' ? 2 : 1
      setCityBonus((value) => Math.min(6, value + bonus))
      if (location === 'newsstand') setNewsReviewed(true)
      const label = location === 'exchange' ? 'Биржевая площадь: +3 к доверию за подготовку' : location === 'cafe' ? 'Кафе инвесторов: +2 к доверию за знакомство' : location === 'newsstand' ? 'Киоск новостей: новости изучены, +2 к доверию' : 'Офисный квартал: +1 к доверию за знакомство'
      setToast(label)
    } else setToast('Ты уже изучил это место сегодня. Прогулка продвинула игровое время на 15 минут.')
    window.setTimeout(() => setToast(''), 4000)
  }

  function endDay() {
    if (dayEnded) { setToast('Рабочий день уже завершён. Подойди к кровати и нажми E, чтобы поспать.'); return }
    const shiftTargetCompany = companies[(day - 1) % companies.length]
    const targetShares = 25 + day * 10
    const targetAmount = 8000 + day * 4000
    const success = dailySalesShares >= targetShares && dailySalesAmount >= targetAmount
    const reward = success ? 1000 + day * 250 : 0
    const penalty = success ? 0 : 750
    if (success) { setCash((value) => value + reward); setReputation((value) => Math.min(100, value + 4)); setToast('План смены выполнен! Премия +' + reward.toLocaleString('ru-RU') + ' ₽, репутация +4.') }
    else { setReputation((value) => Math.max(0, value - 3)); setFirmCapital((value) => Math.max(0, value - penalty)); setToast('План не выполнен: репутация −3, фирма потеряла ' + penalty.toLocaleString('ru-RU') + ' ₽.') }
    setShiftReport({ success, ticker: shiftTargetCompany.ticker, company: shiftTargetCompany.name, shares: dailySalesShares, targetShares, amount: dailySalesAmount, targetAmount, reward, penalty })
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
    setDailySalesAmount(0)
    setDailySalesShares(0)
    setShiftReport(null)
    setCityVisitedToday([])
    setCityBonus(0)
    setCityLocation('office')
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
      {shiftReport && <div className="shift-report-backdrop"><section className="shift-report-modal"><span className="eyebrow">ДЕНЬ {day} · ОТЧЁТ ПО СМЕНЕ</span><div className={'shift-report-icon ' + (shiftReport.success ? 'success' : 'failure')}>{shiftReport.success ? <Check size={26} /> : <X size={26} />}</div><h2>{shiftReport.success ? 'План выполнен' : 'План не выполнен'}</h2><p className="shift-report-lead">{shiftReport.company} ({shiftReport.ticker}) — обязательная бумага дня. Сделки по другим акциям не заменяют этот план.</p><div className="shift-report-stats"><div><small>ПРОДАНО АКЦИЙ</small><strong>{shiftReport.shares} / {shiftReport.targetShares}</strong></div><div><small>ОБОРОТ ПО ЦЕЛЕВОЙ БУМАГЕ</small><strong>{shiftReport.amount.toLocaleString('ru-RU')} / {shiftReport.targetAmount.toLocaleString('ru-RU')} ₽</strong></div></div><div className={'shift-report-consequence ' + (shiftReport.success ? 'good' : 'bad')}>{shiftReport.success ? 'Премия +' + shiftReport.reward.toLocaleString('ru-RU') + ' ₽ и +4 к репутации.' : 'Штраф фирме −' + shiftReport.penalty.toLocaleString('ru-RU') + ' ₽ и −3 к репутации. Завтра план станет сложнее.'}</div><button className="primary-action" onClick={() => setShiftReport(null)}>Продолжить <ArrowRight size={15} /></button></section></div>}
      {!mainMenu && introActive && <div key={day + '-wake-' + String(introActive)} className="intro-curtain" aria-label="Пробуждение"><div className="intro-wake-caption"><span>07:00</span><strong>Пора вставать.</strong></div></div>}
      <div className="scene-layer" aria-label="3D-комната общежития">
        <RoomScene onInteract={openComputer} onExitCity={() => {}} onCanExitCityChange={() => {}} onCanInteractChange={setCanInteractWithComputer} onInteractObject={interactWithRoomObject} onNearbyObjectChange={setNearbyRoomObject} introActive={introActive} onIntroComplete={finishIntro} active={!mainMenu && panel === 'room'} ownedItems={ownedItems} housingId={housingId} gameMinutes={gameMinutes} onCanSleepChange={setCanSleep} onSleepInteract={sleepNow} deskLampOn={deskLampOn} roomLightOn={roomLightOn} curtainsOpen={curtainsOpen} />
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
          </section>
          {menuSettings && <div className="menu-modal-backdrop" onClick={() => setMenuSettings(false)}><section className="menu-settings-modal" onClick={(event) => event.stopPropagation()}><button className="menu-modal-close" onClick={() => setMenuSettings(false)} aria-label="Закрыть настройки"><X size={18} /></button><span className="menu-eyebrow"><Settings size={14} /> ПАРАМЕТРЫ ИГРЫ</span><h2>Настройки</h2><div className="settings-row"><span><strong>Звуковые эффекты</strong><small>Кнопки, шаги, компьютер и действия в комнате.</small></span><button className={'settings-toggle' + (soundEnabled ? ' on' : '')} onClick={() => setSoundEnabled((value) => !value)} aria-pressed={soundEnabled}>{soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Шум города</strong><small>Фоновая городская атмосфера; дождь не включается постоянно.</small></span><button className={'settings-toggle' + (ambienceEnabled ? ' on' : '')} onClick={() => setAmbienceEnabled((value) => !value)} aria-pressed={ambienceEnabled}>{ambienceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-volume-row"><label htmlFor="master-volume"><span><strong>Громкость</strong><small>Общая громкость эффектов и фонового звука.</small></span><output htmlFor="master-volume">{masterVolume}%</output></label><input id="master-volume" type="range" min="0" max="100" step="1" value={masterVolume} onChange={(event) => setMasterVolume(Number(event.target.value))} aria-label="Общая громкость" /></div><div className="settings-row"><span><strong>Уменьшить анимации</strong><small>Отключает декоративные движения интерфейса.</small></span><button className={'settings-toggle' + (reducedMotion ? ' on' : '')} onClick={toggleReducedMotion} aria-pressed={reducedMotion}>{reducedMotion ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Сохранение</strong><small>Прогресс карьеры хранится локально в браузере.</small></span><span className="settings-local-save">ЛОКАЛЬНО</span></div><button className="menu-modal-done" onClick={() => setMenuSettings(false)}>Готово <ArrowRight size={16} /></button></section></div>}
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
          
          <div className="hud-stat hud-balance-stat"><Wallet size={19} /><span><small>ЛИЧНЫЕ СРЕДСТВА</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></span></div>
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

      

      {panel === 'city' && (
        <div className="computer-overlay city-world-overlay city-3d-overlay">
          <div className="computer-topbar os-topbar">
            <button className="back-button" onClick={() => setPanel('room')}><ArrowLeft size={16} /> Войти домой</button>
            <div className="os-topbar-center"><span className="os-status-dot" /> Жилой район · свободное передвижение</div>
            <button className="os-pause-button" onClick={() => { setPanel('computer'); setTab('housing') }}><House size={15} /> Недвижимость</button>
          </div>
          <div className="city-3d-stage">
            <CityScene
              gameMinutes={gameMinutes}
              onEnterHome={() => { setPanel('room'); playSound('ui') }}
              onOpenLocation={(location) => {
                setCityLocation(location)
                setCityVisitedToday((previous) => previous.includes(location) ? previous : [...previous, location])
                setCityBonus((previous) => previous + (cityVisitedToday.includes(location) ? 0 : 2))
                setGameMinutes((previous) => (previous + 15) % (24 * 60))
                setPanel('computer')
                setTab(location === 'office' ? 'housing' : location === 'exchange' ? 'market' : location === 'newsstand' ? 'news' : 'calls')
                setCallStatus('idle')
                playSound('ui')
              }}
            />
            <div className="city-3d-hud">
              <span className="city-3d-time"><Clock3 size={14} /> {String(Math.floor(gameMinutes / 60)).padStart(2,'0')}:{String(gameMinutes % 60).padStart(2,'0')}</span>
              <span className="city-3d-controls"><b>WASD</b> идти <b>мышь</b> осмотреть <b>E</b> взаимодействовать</span>
            </div>
          </div>
        </div>
      )}

      {panel === 'wardrobe' && (
        <div className="computer-overlay wardrobe-overlay">
          <div className="computer-topbar os-topbar">
            <button className="back-button" onClick={() => setPanel('room')}><ArrowLeft size={16} /> В комнату</button>
            <div className="os-topbar-center"><span className="os-status-dot" /> Личный шкаф · гардероб и покупки</div>
            <button className="os-pause-button" onClick={() => setPanel('room')}><X size={15} /> Закрыть</button>
          </div>
          <main className="wardrobe-screen">
            <div className="page-heading"><div><div className="eyebrow">ОТДЕЛЬНО ОТ КОМПЬЮТЕРА</div><h2>Гардероб и личные покупки</h2><p>Меняй одежду и покупай предметы для комнаты здесь. Биржа, звонки и рабочие приложения находятся на компьютере.</p></div><div className="market-status"><Wallet size={15} /> {cash.toLocaleString('ru-RU')} ₽</div></div>
            <section className="wardrobe-studio"><div className="wardrobe-character-stage"><span className="wardrobe-light" /><Canvas className="wardrobe-3d-canvas" camera={{ position: [0, 1.35, 4.5], fov: 32 }} dpr={[1, 1.5]}><color attach="background" args={['#142224']} /><ambientLight intensity={1.05} /><directionalLight position={[-2.5, 4, 3]} intensity={2.1} /><pointLight position={[2, 2.5, -1]} intensity={0.8} color="#75d8ae" /><WardrobeAvatar3D outfit={selectedOutfit} /><OrbitControls enablePan={false} minDistance={3.8} maxDistance={5.5} minPolarAngle={1.05} maxPolarAngle={1.75} target={[0, 1.15, 0]} /></Canvas><span className="wardrobe-stage-label">ПЕРСОНАЖ · ПОТЯНИ, ЧТОБЫ ПОВЕРНУТЬ</span></div><div className="wardrobe-studio-copy"><span className="eyebrow">ТВОЙ ПЕРСОНАЖ</span><h3>{OUTFITS.find((outfit) => outfit.id === selectedOutfit)?.name}</h3><p>Одежда меняется и в гардеробе, и в видеокадре звонка. Модель пока стилизованная — это не реалистичный человеческий скан.</p><div className="wardrobe-look-tags"><span>Текущий образ</span><span>{ownedOutfits.length} комплект(а)</span></div></div></section>
            <section className="outfit-selector"><div className="outfit-selector-heading"><div><span className="eyebrow">ОДЕЖДА</span><h3>Выбери комплект</h3></div><span>Деньги: {cash.toLocaleString('ru-RU')} ₽</span></div><div className="outfit-grid">{OUTFITS.map((outfit) => { const owned = ownedOutfits.includes(outfit.id); const wearing = selectedOutfit === outfit.id; const canAfford = cash >= outfit.price; return <article className={'outfit-card outfit-' + outfit.id + (wearing ? ' wearing' : '') + (outfitDetailsId === outfit.id ? ' details-open' : '')} key={outfit.id}><button className="outfit-preview-button" onClick={() => { setSelectedOutfit(outfit.id); setOutfitDetailsId(outfit.id) }}><div className="outfit-swatch"><OutfitIllustration id={outfit.id} /></div><span className="outfit-preview-caption">{wearing ? 'Сейчас надет' : 'Примерить'}</span></button><div className="outfit-card-copy"><strong>{outfit.name}</strong><p>{outfit.description}</p><small>{outfit.price === 0 ? 'Стартовый комплект' : outfit.price.toLocaleString('ru-RU') + ' ₽'}</small></div><div className="outfit-card-actions"><button className="outfit-details-button" onClick={() => setOutfitDetailsId(outfitDetailsId === outfit.id ? null : outfit.id)}>{outfitDetailsId === outfit.id ? 'Скрыть детали' : 'Что даёт?'}</button><button disabled={wearing || (!owned && !canAfford)} onClick={() => { if (owned) { setSelectedOutfit(outfit.id); return } setCash((value) => value - outfit.price); setOwnedOutfits((value) => [...value, outfit.id]); setSelectedOutfit(outfit.id); setOutfitDetailsId(outfit.id); playSound('deal') }}>{wearing ? 'Надет' : owned ? 'Надеть' : canAfford ? 'Купить' : 'Не хватает денег'}</button></div>{outfitDetailsId === outfit.id && <div className="outfit-detail-panel"><strong>Что даёт этот образ</strong><p>{outfit.id === 'intern' ? 'Бесплатный базовый комплект. Сохраняет деньги на оборудование и развитие.' : outfit.id === 'classic' ? 'Деловой внешний вид для ролевого прогресса. Не улучшает качество рекомендаций сам по себе.' : 'Премиальный внешний вид для встреч высокого уровня. Не гарантирует доверие или сделку.'}</p></div>}</article> })}</div></section>
            <section className="outfit-selector wardrobe-store"><div className="outfit-selector-heading"><div><span className="eyebrow">МАГАЗИН КОМНАТЫ</span><h3>Оборудование и обстановка</h3></div><span>Магазин также доступен на компьютере</span></div><div className="shop-grid">{ROOM_ITEMS.map((item) => { const owned = ownedItems.includes(item.id); const locked = day < item.minDay; const detailsOpen = roomItemDetailsId === item.id; return <article className={'shop-item' + (owned ? ' owned' : '') + (detailsOpen ? ' details-open' : '')} key={item.id}><div className="shop-item-icon-wrap"><RoomItemIllustration id={item.id} /><span>{item.category === 'video' ? 'ЗВУК / КАМЕРА' : item.category === 'background' ? 'ОБСТАНОВКА' : item.category === 'work' ? 'ПРОИЗВОДИТЕЛЬНОСТЬ' : 'КОМФОРТ'}</span></div><div className="shop-item-meta"><span className="eyebrow">{item.category === 'video' ? 'ВИДЕОСВЯЗЬ' : item.category === 'background' ? 'ФОН' : item.category === 'work' ? 'РАБОТА' : 'КОМФОРТ'}</span><strong>{item.name}</strong><p>{item.description}</p><button className="shop-item-details-toggle" onClick={() => setRoomItemDetailsId(detailsOpen ? null : item.id)}>{detailsOpen ? 'Скрыть подробности' : 'Что даёт предмет?'}</button>{detailsOpen && <div className="shop-item-detail-panel"><strong>Эффект в игре</strong><p>{item.videoQuality > 0 ? 'Качество видеосвязи +' + item.videoQuality + '/8. ' : ''}{item.firstImpression > 0 ? 'Первое впечатление +' + item.firstImpression + '. ' : ''}{item.id === 'second-monitor' ? 'Помогает сравнивать данные, но не добавляет доверие автоматически.' : item.id === 'chromakey-kit' ? 'Открывает виртуальные фоны; при плохой маске клиент может заподозрить обман.' : item.id === 'used-chair' ? 'Даёт комфорт, без прямого бонуса к переговорам.' : 'Улучшает атмосферу или качество звонка, но не гарантирует сделку.'}</p><span>{owned ? 'Уже установлено' : locked ? 'Доступно с ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает ' + (item.price - cash).toLocaleString('ru-RU') + ' ₽' : 'Можно приобрести сейчас'}</span></div>}</div><div className="shop-item-footer"><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={owned || locked || cash < item.price} className={owned ? 'secondary-action' : 'primary-action'} onClick={() => buyRoomItem(item.id)}>{owned ? 'Куплено' : locked ? 'С ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает' : 'Купить'}</button></div></article> })}</div></section>
          </main>
        </div>
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
              {tab !== 'overview' && <div className="os-window-titlebar" onPointerDown={(event) => { if (windowMaximized || (event.target as HTMLElement).closest('button')) return; dragWindowRef.current = { x: event.clientX, y: event.clientY, originX: windowOffset.x, originY: windowOffset.y } }}><span className={'os-window-app-icon ' + tab}>{tab === 'market' ? <TrendingUp size={15} /> : tab === 'news' ? <Newspaper size={15} /> : tab === 'calls' ? <Video size={15} /> : tab === 'clients' ? <Users size={15} /> : tab === 'shop' ? <ShoppingBag size={15} /> : tab === 'housing' ? <House size={15} /> : <MapPin size={15} />}</span><strong>{tab === 'market' ? 'Биржа' : tab === 'news' ? 'Новости' : tab === 'calls' ? 'Видеозвонки и клиенты' : tab === 'clients' ? 'База клиентов' : tab === 'shop' ? 'Магазин и гардероб' : tab === 'housing' ? 'Недвижимость' : 'Карта города'}</strong><div className="os-window-controls"><button aria-label="Свернуть окно" onClick={() => setWindowMinimized(true)}>—</button><button aria-label={windowMaximized ? 'Восстановить окно' : 'На весь экран'} onClick={() => setWindowMaximized((value) => !value)}>□</button><button aria-label="Закрыть окно" onClick={() => { setTab('overview'); setWindowMinimized(false); setWindowMaximized(false); setWindowOffset({ x: 0, y: 0 }) }}>×</button></div></div>}
              {windowMinimized && tab !== 'overview' ? <div className="os-minimized-placeholder"><Laptop size={24} /><strong>Окно свёрнуто</strong><button onClick={() => setWindowMinimized(false)}>Восстановить окно</button></div> : null}
              {!windowMinimized && tab === 'overview' && (
                <div className="desktop-page">
                  <div className="desktop-wallpaper-glow" />
                  <div className="desktop-greeting"><span className="desktop-system-label"><span className="live-dot" /> ЛИЧНЫЙ КОМПЬЮТЕР</span><h2>{gameMinutes < 12 * 60 ? 'Доброе утро.' : gameMinutes < 18 * 60 ? 'Хорошего дня.' : 'Добрый вечер.'}</h2><p>День {String(day).padStart(2, '0')} · {currentHousing.name} · {String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</p></div>
                  <div className="desktop-shift-strip"><div className="shift-strip-title"><span className="live-dot" /><div><strong>ПЛАН РАБОЧЕЙ СМЕНЫ</strong><small>Действия, которые помогут провести первую сделку осознанно</small></div></div><div className={'shift-strip-step' + (marketReviewed ? ' is-done' : '')}><b>{marketReviewed ? '✓' : '01'}</b><span>Изучить акцию</span><small>{marketReviewed ? 'Готово' : 'Терминал'}</small></div><div className={'shift-strip-step' + (newsReviewed ? ' is-done' : '')}><b>{newsReviewed ? '✓' : '02'}</b><span>Проверить новости</span><small>{newsReviewed ? 'Готово' : 'Лента'}</small></div><div className={'shift-strip-step' + (callsToday > 0 ? ' is-done' : '')}><b>{callsToday > 0 ? '✓' : '03'}</b><span>Обсудить риск с клиентом</span><small>{callsToday > 0 ? 'Звонок проведён' : 'Видеозвонок'}</small></div><button onClick={() => setTab(marketReviewed ? newsReviewed ? 'calls' : 'news' : 'market')}>{marketReviewed ? newsReviewed ? 'Перейти к звонку' : 'Открыть новости' : 'Начать с терминала'} <ArrowRight size={14} /></button></div>
                  <div className="desktop-app-grid">
                    <button className="desktop-app-icon" onClick={() => openAppWindow('market')}><span className="desktop-icon-tile market-app"><TrendingUp size={23} /></span><strong>Биржа</strong></button>
                    <button className="desktop-app-icon" onClick={() => openAppWindow('news')}><span className="desktop-icon-tile news-app"><Newspaper size={23} /></span><strong>Новости</strong><small>Сводка рынка</small></button>
                    <button className="desktop-app-icon" onClick={() => openAppWindow('calls')}><span className="desktop-icon-tile calls-app"><Video size={23} /></span><strong>Видеозвонки</strong>{callStatus === 'active' && <i>LIVE</i>}</button>
                    <button className="desktop-app-icon" onClick={() => openAppWindow('clients')}><span className="desktop-icon-tile clients-app"><Users size={23} /></span><strong>Клиенты</strong><small>{availableClients.length} лидов</small></button>
                    <button className="desktop-app-icon" onClick={() => openAppWindow('shop')}><span className="desktop-icon-tile shop-app"><ShoppingBag size={23} /></span><strong>Магазин</strong><small>Рабочее место</small></button>
                    <button className="desktop-app-icon" onClick={() => openAppWindow('housing')}><span className="desktop-icon-tile housing-app"><House size={23} /></span><strong>Недвижимость</strong></button>
                  </div>
                  <div className="desktop-bottom-widgets">
                    <div className="desktop-widget daily-task-widget"><div className="desktop-widget-heading"><span><Sparkles size={15} /> ГЛАВНОЕ ЗАДАНИЕ</span><span>ДЕНЬ {day}</span></div><h3>Сделай первую честную сделку</h3><p>Заработок покупает оборудование и жильё. Репутация открывает клиентов с большим капиталом. Долг и расходы фирмы растут, если проваливаешь план.</p><div className="desktop-mission-steps"><span className={marketReviewed ? 'is-done' : ''}><b>{marketReviewed ? '✓' : '1'}</b>Разобрать компанию</span><span className={newsReviewed ? 'is-done' : ''}><b>{newsReviewed ? '✓' : '2'}</b>Проверить новости</span><span className={callsToday > 0 ? 'is-done' : ''}><b>{callsToday > 0 ? '✓' : '3'}</b>Поговорить с клиентом</span></div><div className="desktop-task-actions"><button onClick={() => setTab('market')}>Изучить рынок <ArrowRight size={14} /></button><button disabled={availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)} onClick={startCall}>Позвонить клиенту <Phone size={14} /></button></div></div>
                    <div className="desktop-widget desktop-finances"><div className="desktop-widget-heading"><span><Wallet size={15} /> МОИ ФИНАНСЫ</span><span className="desktop-account-status">ЛОКАЛЬНО</span></div><strong>{cash.toLocaleString('ru-RU')} ₽</strong><small>Личные деньги</small><div className="desktop-finance-row"><span>Репутация</span><b>{reputation}/100</b></div><div className="desktop-finance-track"><span style={{ width: reputation + '%' }} /></div><div className="desktop-finance-row"><span>Капитал фирмы</span><b>{firmCapital.toLocaleString('ru-RU')} ₽</b></div><button className="desktop-end-day" onClick={endDay}>Завершить рабочий день <ArrowRight size={14} /></button></div>
                  </div>
                  <div className="desktop-preview-widgets"><div className="desktop-preview-chart"><div><span className="preview-window-label">КОТИРОВКИ · KOTL</span><strong>Котолёт <em>+3,4%</em></strong></div><svg viewBox="0 0 260 64" preserveAspectRatio="none" aria-label="Предварительный график акций"><path d="M0 49 L18 42 L35 46 L53 31 L70 36 L88 20 L105 27 L123 16 L140 31 L158 23 L175 29 L194 12 L211 20 L230 8 L260 14" fill="none" stroke="#63e6ae" strokeWidth="2.5"/><path d="M0 49 L18 42 L35 46 L53 31 L70 36 L88 20 L105 27 L123 16 L140 31 L158 23 L175 29 L194 12 L211 20 L230 8 L260 14 L260 64 L0 64Z" fill="#63e6ae" opacity=".1"/></svg><small>Демо-данные · график реагирует на события рынка в игре</small></div><div className="desktop-preview-call"><div className="preview-call-avatar">К</div><div><span className="preview-window-label">ВИДЕОЗВОНКИ</span><strong>{callStatus === 'active' ? 'Идёт переговоры' : 'Клиент ждёт звонка'}</strong><small>{callStatus === 'active' ? activeClient.name : availableClients[0]?.name ?? 'Нет доступных клиентов'}</small></div><button onClick={() => setTab('calls')}><Video size={15} /> Открыть</button></div></div>
                </div>
              )}

              {!windowMinimized && tab === 'market' && (
                <div className="market-page">
                  <div className="page-heading"><div><div className="eyebrow">РЫНОК · ИГРОВОЙ МИР</div><h2>Биржевой терминал</h2><p>Все компании и показатели вымышлены. Анализируй бизнес, а не только цвет графика.</p></div><div className="market-status"><span className="live-dot" /> ОТКРЫТО</div></div>
                  <section className="guided-mission" style={{ margin: '0 0 18px', padding: '18px 20px', borderRadius: 14, border: '1px solid rgba(77,210,166,.28)', background: 'linear-gradient(120deg, rgba(25,67,58,.88), rgba(20,31,40,.96))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 320px' }}><div className="eyebrow" style={{ color: '#69dfb5' }}>ТВОЯ ПЕРВАЯ СДЕЛКА · ОБУЧАЮЩИЙ СЦЕНАРИЙ</div><h3 style={{ margin: '7px 0', color: '#f0f7f4', fontSize: 22 }}>Не угадывай цену — собери инвестиционную идею</h3><p style={{ margin: 0, maxWidth: 700, color: '#bdccc8', lineHeight: 1.65 }}>Твоя задача — помочь клиенту принять взвешенное решение. Изучи «Котолёт» (KOTL), сравни сильную сторону с рисками и проверь новости. Компания растёт, но пока убыточна: это повод разобраться, а не автоматически покупать.</p><div className="mission-checklist"><span className={marketReviewed ? 'mission-step complete' : 'mission-step'}><b>{marketReviewed ? '✓' : '1'}</b><span><strong>Изучи компанию</strong><small>Отчётность и риск</small></span></span><span className={newsReviewed ? 'mission-step complete' : 'mission-step'}><b>{newsReviewed ? '✓' : '2'}</b><span><strong>Проверь новости</strong><small>Факты и события</small></span></span><span className={callsToday > 0 ? 'mission-step complete' : 'mission-step'}><b>{callsToday > 0 ? '✓' : '3'}</b><span><strong>Поговори с клиентом</strong><small>Объясни идею и риск</small></span></span></div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 155 }}>
                      <button className="row-action" style={{ padding: '12px 14px', whiteSpace: 'nowrap', background: '#47d5a5', color: '#10271f', borderRadius: 9, fontWeight: 750 }} onClick={() => { setSelectedCompany('KOTL'); document.querySelector('.company-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>1. Изучить KOTL <ArrowRight size={15} /></button>
                      <button className="row-action" style={{ padding: '10px 14px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,.07)', color: '#e5efeb', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9 }} onClick={() => setTab('news')}>2. Проверить новости</button>
                      <button className="row-action" style={{ padding: '10px 14px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,.07)', color: '#e5efeb', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9 }} onClick={() => setTab('calls')}>3. Обсудить с клиентом</button>
                    </div>
                  </section>
                  <div className="market-summary"><div><small>ИНДЕКС БИРЖИ «КОТИРОВКА» · КБ-100</small><strong>{(1842.76 * (1 + marketIndexImpact / 100)).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <em>{(1.28 + marketIndexImpact) > 0 ? '+' : ''}{(1.28 + marketIndexImpact).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</em></strong></div><div className="sparkline"><svg viewBox="0 0 250 55" preserveAspectRatio="none"><path d="M0 42 L18 37 L31 43 L47 28 L60 33 L77 22 L91 30 L108 16 L126 23 L142 10 L158 18 L176 13 L191 22 L210 8 L226 14 L250 3" fill="none" stroke="#35d6a0" strokeWidth="2.2" /><path d="M0 42 L18 37 L31 43 L47 28 L60 33 L77 22 L91 30 L108 16 L126 23 L142 10 L158 18 L176 13 L191 22 L210 8 L226 14 L250 3 L250 55 L0 55Z" fill="url(#sparkFill)" opacity=".18" /><defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#35d6a0" /><stop offset="1" stopColor="#35d6a0" stopOpacity="0" /></linearGradient></defs></svg></div></div>
                  <section className="daily-stock-contract"><div><span className="eyebrow">ОБЯЗАТЕЛЬСТВО СМЕНЫ · ДЕНЬ {day}</span><h3>План по акции {companies[(day - 1) % companies.length].ticker}</h3><p>Продай не менее <strong>{25 + day * 10} акций</strong> и набери оборот <strong>{(8000 + day * 4000).toLocaleString('ru-RU')} ₽</strong>. Сделки с другими бумагами в эту квоту не засчитываются.</p></div><div className="daily-stock-progress"><div><span>Акции</span><strong>{dailySalesShares} / {25 + day * 10}</strong></div><div className="daily-stock-track"><i style={{width:Math.min(100,dailySalesShares/(25+day*10)*100)+'%'}} /></div><div><span>Оборот</span><strong>{dailySalesAmount.toLocaleString('ru-RU')} / {(8000 + day * 4000).toLocaleString('ru-RU')} ₽</strong></div><div className="daily-stock-track"><i style={{width:Math.min(100,dailySalesAmount/(8000+day*4000)*100)+'%'}} /></div></div></section>
                  <div className="company-table"><div className="table-header"><span>КОМПАНИЯ</span><span>ЦЕНА</span><span>ИЗМЕНЕНИЕ</span><span>ДЕЙСТВИЕ</span></div>{companies.map((company) => <div className={selectedCompany === company.ticker ? 'company-row selected' : 'company-row'} key={company.ticker} onClick={() => setSelectedCompany(company.ticker)}><div className="company-name"><span className={'company-logo ' + company.ticker.toLowerCase()}>{company.ticker.slice(0, 2)}</span><span><strong>{company.name}</strong><small>{company.sector} · {company.ticker}</small></span></div><strong className="price">{getDisplayedPrice(company)}</strong><span className={getDisplayedChange(company).startsWith('-') ? 'change negative' : 'change positive'}>{getDisplayedChange(company)}</span><button className="row-action" onClick={(event) => { event.stopPropagation(); setSelectedCompany(company.ticker) }}>{selectedCompany === company.ticker ? 'Выбрана' : 'Изучить'}</button></div>)}</div>
                  <div className="company-detail"><div className="detail-top"><div><span className="eyebrow">КАРТОЧКА ЭМИТЕНТА · {companies.find((c) => c.ticker === selectedCompany)?.ticker}</span><h3>{activeCompany.name}</h3><p>{activeCompany.sector}</p><p className="company-description">{activeCompany.description}</p></div><div className="detail-price"><strong>{getDisplayedPrice(activeCompany)}</strong><span className={getDisplayedChange(activeCompany).startsWith('-') ? 'negative' : 'positive'}>{getDisplayedChange(activeCompany)}</span></div></div><div className="detail-stats"><div><small>КАПИТАЛИЗАЦИЯ</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.cap}</strong></div><div><small>ВЫРУЧКА</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.revenue}</strong></div><div><small>ЧИСТАЯ ПРИБЫЛЬ</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.profit}</strong></div><div><small>УРОВЕНЬ РИСКА</small><strong>{companies.find((c) => c.ticker === selectedCompany)?.risk}</strong></div></div><div className="company-pros-cons"><div><strong>Преимущества</strong><p>{activeCompany.advantages}</p></div><div><strong>Риски и недостатки</strong><p>{activeCompany.risks}</p></div></div><div className="detail-disclaimer"><ShieldAlert size={15} /> Рост цены не гарантирует прибыль. Сверяй выручку, прибыль, долг и новости.</div><div className="market-order-dock"><div><span className="eyebrow">СЛЕДУЮЩИЙ ШАГ</span><strong>Подготовь предложение для клиента</strong><p>Перенеси выбранную компанию в переговоры и объясни потенциальную выгоду вместе с рисками.</p></div><button onClick={() => setTab('calls')}>К выбору клиента <ArrowRight size={15} /></button></div></div>
                </div>
              )}

              {!windowMinimized && tab === 'news' && (
                <div className="news-page"><div className="page-heading"><div><div className="eyebrow">ИНФОРМАЦИОННОЕ АГЕНТСТВО «СЛУХИ И ФАКТЫ»</div><h2>Лента новостей</h2><p>Новости могут изменить отношение клиента к компании прямо во время звонка.</p></div><div className="market-status"><span className="live-dot" /> LIVE FEED</div></div><div className="news-list">{news.map((item) => <article className="news-card" key={item.title}><div className="news-card-top"><span className={'news-tag ' + item.tone}>{item.tag}</span><time>{item.time}</time></div><h3>{item.title}</h3><p>{item.body}</p><div className="news-meaning"><strong>Как это читать</strong><p>{item.meaning}</p><span>{item.impact}</span></div><button onClick={() => { const ticker = item.tag === 'ТАПОКТЕХ' ? 'TAPK' : item.tag === 'КОТОЛЁТ' ? 'KOTL' : 'DUST'; const impact = item.tag === 'ТАПОКТЕХ' ? -3.5 : item.tag === 'КОТОЛЁТ' ? 2.5 : -0.8; setNewsImpacts((current) => current[ticker] === undefined ? { ...current, [ticker]: impact } : current); setSelectedCompany(ticker); setTab('market'); setToast(newsImpacts[ticker] === undefined ? 'Новость учтена: котировка ' + ticker + ' отреагировала на событие.' : 'Эта новость уже учтена в котировке ' + ticker + '.') }}>Учесть новость в котировке <ArrowUpRight size={14} /></button></article>)}</div><div className="bottom-note"><Newspaper size={16} /><span>Проверяй источник и отделяй подтверждённые факты от слухов. В этом мире заголовок может быть громче отчётности.</span></div></div>
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
                  <div className="wardrobe-studio"><div className="wardrobe-character-stage"><span className="wardrobe-light" /><Canvas className="wardrobe-3d-canvas" camera={{ position: [0, 1.35, 4.5], fov: 32 }} dpr={[1, 1.5]} shadows><color attach="background" args={['#142224']} /><ambientLight intensity={1.05} /><directionalLight position={[-2.5, 4, 3]} intensity={2.1} castShadow /><pointLight position={[2, 2.5, -1]} intensity={0.8} color="#75d8ae" /><WardrobeAvatar3D outfit={selectedOutfit} /><OrbitControls enablePan={false} minDistance={3.8} maxDistance={5.5} minPolarAngle={1.05} maxPolarAngle={1.75} target={[0, 1.15, 0]} /></Canvas><span className="wardrobe-stage-label">ПЕРСОНАЖ · ПОТЯНИ, ЧТОБЫ ПОВЕРНУТЬ</span></div><div className="wardrobe-studio-copy"><span className="eyebrow">ГАРДЕРОБ · ПЕРСОНАЖ</span><h3>Твой брокерский образ</h3><p>Выбирай образ для переговоров: одежда меняется и в гардеробе, и в маленьком видеокадре во время звонка.</p><div className="wardrobe-look-tags"><span>{selectedOutfit === 'premium' ? 'Премиальный костюм' : selectedOutfit === 'classic' ? 'Деловой пиджак' : 'Базовая футболка'}</span><span>{selectedOutfit === 'intern' ? 'Тёмные брюки' : 'Деловой силуэт'}</span><span>{selectedOutfit === 'premium' ? 'Золотые детали' : selectedOutfit === 'classic' ? 'Строгий стиль' : 'Повседневный стиль'}</span></div></div></div>
                  <section className="outfit-selector"><div className="outfit-selector-heading"><div><span className="eyebrow">ГАРДЕРОБ</span><h3>Одежда персонажа</h3></div><span>На тебе: {OUTFITS.find((outfit) => outfit.id === selectedOutfit)?.name}</span></div><div className="outfit-grid">{OUTFITS.map((outfit) => { const owned = ownedOutfits.includes(outfit.id); const wearing = selectedOutfit === outfit.id; const canAfford = cash >= outfit.price; return <article className={'outfit-card outfit-' + outfit.id + (wearing ? ' wearing' : '') + (outfitDetailsId === outfit.id ? ' details-open' : '')} key={outfit.id}><button className="outfit-preview-button" aria-label={'Примерить образ «' + outfit.name + '»'} onClick={() => { setSelectedOutfit(outfit.id); setOutfitDetailsId(outfit.id); playSound('ui') }}><div className="outfit-swatch"><OutfitIllustration id={outfit.id} /></div><span className="outfit-preview-caption">{wearing ? 'Сейчас надет' : 'Нажми для примерки'}</span></button><div className="outfit-card-copy"><strong>{outfit.name}</strong><p>{outfit.description}</p><small>{outfit.price === 0 ? 'Стартовый комплект' : outfit.price.toLocaleString('ru-RU') + ' ₽'}</small></div><div className="outfit-card-actions"><button className="outfit-details-button" onClick={() => setOutfitDetailsId(outfitDetailsId === outfit.id ? null : outfit.id)}>{outfitDetailsId === outfit.id ? 'Скрыть детали' : 'Подробнее'}</button><button disabled={wearing || (!owned && !canAfford)} onClick={() => { if (owned) { setSelectedOutfit(outfit.id); playSound('ui'); return } setCash((value) => value - outfit.price); setOwnedOutfits((value) => [...value, outfit.id]); setSelectedOutfit(outfit.id); setOutfitDetailsId(outfit.id); playSound('deal'); setToast('Новый образ добавлен в гардероб') }}>{wearing ? 'На тебе' : owned ? 'Надеть' : canAfford ? 'Купить' : 'Не хватает денег'}</button></div>{outfitDetailsId === outfit.id && <div className="outfit-detail-panel"><strong>Что даёт этот образ</strong><p>{outfit.id === 'intern' ? 'Бесплатный стартовый комплект. Не даёт бонуса к первому впечатлению, зато сохраняет деньги на важные покупки.' : outfit.id === 'classic' ? 'Деловой стиль для более убедительного образа на встречах. Это косметическое улучшение: знания компании и честность в ответах важнее одежды.' : 'Премиальный внешний вид для ролевого прогресса. Дороже остальных, но не гарантирует сделку и не заменяет подготовку.'}</p><span>{owned ? 'Уже куплено' : canAfford ? 'Можно купить сейчас' : 'Сначала накопи нужную сумму'}</span></div>}</article> })}</div></section>
                  <div className="shop-grid">{ROOM_ITEMS.map((item) => { const owned = ownedItems.includes(item.id); const locked = day < item.minDay; const detailsOpen = roomItemDetailsId === item.id; return <article className={(owned ? 'shop-item owned' : 'shop-item') + (detailsOpen ? ' details-open' : '')} key={item.id}><div className="shop-item-icon-wrap"><RoomItemIllustration id={item.id} /><span>{item.category === 'video' ? 'ЗВУК / КАМЕРА' : item.category === 'background' ? 'ОБСТАНОВКА' : item.category === 'work' ? 'ПРОИЗВОДИТЕЛЬНОСТЬ' : 'КОМФОРТ'}</span></div><div className="shop-item-meta"><span className="eyebrow">{item.category === 'video' ? 'ВИДЕОСВЯЗЬ' : item.category === 'background' ? 'ФОН' : item.category === 'work' ? 'РАБОТА' : 'КОМФОРТ'}</span><strong>{item.name}</strong><p>{item.description}</p><button className="shop-item-details-toggle" onClick={() => setRoomItemDetailsId(detailsOpen ? null : item.id)}>{detailsOpen ? 'Скрыть подробности' : 'Что даёт предмет?'}</button>{detailsOpen && <div className="shop-item-detail-panel"><strong>Эффект в игре</strong><p>{item.videoQuality > 0 ? 'Качество видеосвязи +' + item.videoQuality + '/8. ' : ''}{item.firstImpression > 0 ? 'Первое впечатление +' + item.firstImpression + '. ' : ''}{item.id === 'second-monitor' ? 'Помогает сравнивать данные, но не добавляет доверие автоматически.' : item.id === 'chromakey-kit' ? 'Открывает виртуальные фоны; при плохом качестве маски клиент может заподозрить обман.' : item.id === 'used-chair' ? 'Даёт комфорт для рабочего дня, без прямого бонуса к переговорам.' : item.id === 'desk-lamp' ? 'Небольшой бонус к первому впечатлению и качеству видео.' : 'Улучшает рабочую атмосферу или качество звонка, но не гарантирует сделку.'}</p><span>{owned ? 'Уже установлено' : locked ? 'Доступно с ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает ' + (item.price - cash).toLocaleString('ru-RU') + ' ₽' : 'Можно приобрести сейчас'}</span></div>}</div><div className="shop-item-footer"><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={owned || locked || cash < item.price} className={owned ? 'secondary-action' : 'primary-action'} onClick={() => buyRoomItem(item.id)}>{owned ? 'Куплено' : locked ? 'С ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает' : 'Купить'}</button></div></article> })}</div>
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

              {!windowMinimized && tab === 'city' && (
                <div className="city-page">
                  <div className="page-heading"><div><div className="eyebrow">ГОРОДСКОЙ РАЙОН · ПЕРВАЯ ВЕРСИЯ</div><h2>Город за пределами комнаты</h2><p>Исследуй район между звонками: знакомства и информация помогают подготовить переговоры. Каждая поездка продвигает время смены на 15 минут.</p></div><div className="market-status"><MapPin size={14} /> {cityVisitedToday.length} / 4 МЕСТ</div></div>
                  <div className="city-map-shell">
                    <div className="city-map-art" aria-label="Схематичная карта финансового района">
                      <div className="city-map-road road-horizontal" /><div className="city-map-road road-vertical" /><div className="city-map-park"><span>СКВЕР</span><i /><i /><i /></div><div className="city-map-water" />
                      {[
                        {id:'office',name:'Офисный квартал',x:18,y:24,icon:'⌂'},
                        {id:'exchange',name:'Биржевая площадь',x:67,y:19,icon:'↗'},
                        {id:'cafe',name:'Кафе инвесторов',x:31,y:72,icon:'☕'},
                        {id:'newsstand',name:'Киоск новостей',x:75,y:70,icon:'▤'},
                      ].map((place) => <button key={place.id} className={'city-map-pin '+(cityLocation===place.id?'current ':'')+(cityVisitedToday.includes(place.id)?'visited':'')} style={{left:place.x+'%',top:place.y+'%'}} onClick={() => travelToCity(place.id)}><b>{place.icon}</b><span>{place.name}</span></button>)}
                      <span className="city-map-label map-label-north">ФИНАНСОВЫЙ РАЙОН</span><span className="city-map-label map-label-south">НАБЕРЕЖНАЯ</span>
                    </div>
                    <div className="city-location-panel"><span className="eyebrow">ТЕКУЩАЯ ЛОКАЦИЯ</span><h3>{({office:'Офисный квартал',exchange:'Биржевая площадь',cafe:'Кафе инвесторов',newsstand:'Киоск новостей'} as Record<string,string>)[cityLocation]}</h3><p>{({office:'Здесь можно встретить коллег, обсудить смену и подготовить следующую встречу.',exchange:'Уличные экраны показывают котировки и настроение рынка. Первый визит добавляет +3 к начальному доверию на следующем звонке.',cafe:'Место для неформальных знакомств с предпринимателями. Первый визит добавляет +2 к доверию.',newsstand:'Сводка слухов и свежих заголовков. Первый визит отмечает новости как изученные и даёт +2 к доверию.'} as Record<string,string>)[cityLocation]}</p><div className="city-benefit"><span>Бонус подготовки</span><strong>+{cityBonus} доверия</strong></div><div className="city-location-list">{[{id:'office',name:'Офисный квартал',desc:'Коллеги и контакты'},{id:'exchange',name:'Биржевая площадь',desc:'Настроение рынка'},{id:'cafe',name:'Кафе инвесторов',desc:'Нетворкинг'},{id:'newsstand',name:'Киоск новостей',desc:'Слухи и заголовки'}].map((place) => <button key={place.id} className={cityLocation===place.id?'selected':''} onClick={() => travelToCity(place.id)}><span><strong>{place.name}</strong><small>{place.desc}</small></span><em>{cityVisitedToday.includes(place.id)?'Посещено':'+15 мин'}</em></button>)}</div></div>
                  </div>
                  <div className="bottom-note"><MapPin size={16} /><span>Это первый игровой городской узел, а не финальный открытый мир. Следующий этап — соединить эти точки с физическим перемещением персонажа и событиями NPC.</span></div>
                </div>
              )}

              {!windowMinimized && tab === 'calls' && (
                <div className="calls-page">
                  <div className="page-heading"><div><div className="eyebrow">ОТДЕЛ ПРОДАЖ · ЛИНИЯ 01</div><h2>Клиенты и звонки</h2><p>Слушай клиента, выбери точный ответ и закрой сделку без пустых обещаний. Репутация открывает клиентов крупнее, а деньги улучшают жильё и рабочее место.</p></div><div className={callStatus === 'active' ? 'call-live-badge active' : 'call-live-badge'}><span className="live-dot" /> {callStatus === 'active' ? 'ЗВОНОК ИДЁТ' : 'ЛИНИЯ СВОБОДНА'}</div></div>
                  {callStatus === 'idle' && <div className="precall-briefing">
                    <div className="call-planning-section"><div className="call-planning-heading"><span className="eyebrow">ШАГ 1 · ВЫБЕРИ КЛИЕНТА</span><strong>Кому сегодня предложим инвестицию?</strong><small>В первый день доступны два клиента. Новые лиды открываются с ростом репутации и прогрессом карьеры.</small></div><div className="call-client-picker">{CLIENTS.map((client) => { const unlocked = availableClients.some((candidate) => candidate.id === client.id); return <button key={client.id} disabled={!unlocked} className={'call-client-option' + (selectedClientId === client.id ? ' selected' : '') + (!unlocked ? ' locked' : '')} onClick={() => setSelectedClientId(client.id)}><span className="call-client-avatar">{unlocked ? client.initials : '🔒'}</span><span className="call-client-option-copy"><strong>{client.name}</strong><small>{unlocked ? client.profession + ' · уровень ' + client.tier : 'Пока недоступен'}</small><em>{unlocked ? 'Капитал до ' + client.budget.toLocaleString('ru-RU') + ' ₽' : 'Развивай карьеру'}</em></span></button>})}</div><div className="call-planning-heading stock-planning-heading"><span className="eyebrow">ШАГ 2 · ВЫБЕРИ АКЦИЮ</span><strong>Что предложим клиенту?</strong><small>Выбор бумаги влияет на первое впечатление и риск сделки. Изучи карточку в приложении «Биржа».</small></div><div className="call-stock-picker">{companies.map((company) => <button key={company.ticker} className={'call-stock-option' + (selectedCompany === company.ticker ? ' selected' : '')} onClick={() => setSelectedCompany(company.ticker)}><span className={'company-logo ' + company.ticker.toLowerCase()}>{company.ticker.slice(0, 2)}</span><span><strong>{company.name}</strong><small>{company.sector} · риск {company.risk.toLowerCase()}</small></span><em className={company.positive ? 'positive' : 'negative'}>{company.change}</em></button>)}</div></div><div className="briefing-copy"><span className="eyebrow">ЗАЧЕМ НУЖЕН ЗВОНОК</span><strong>Ты не продаёшь акцию вслепую — ты помогаешь принять решение</strong><p>У {activeClient.name} есть собственные цели и отношение к риску. Выбранная акция — лишь предложение: объясни, как она может помочь, что может пойти не так и в каких случаях лучше отказаться от сделки.</p><div className="call-goal-list"><span>1. Разобраться в бизнесе</span><span>2. Проверить свежие новости</span><span>3. Обсудить риски с клиентом</span></div><small>Подготовка к рынку и новостям добавляет +4 к начальному доверию за каждый изученный раздел.</small></div>
                    <div className="briefing-actions">
                      <button className={marketReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('market')}><TrendingUp size={15} /><span><strong>Отчёт компании</strong><small>{marketReviewed ? 'Изучено · +4 доверия' : 'Финансы и риски'}</small></span><span className="briefing-check">{marketReviewed ? '✓' : '↗'}</span></button>
                      <button className={newsReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('news')}><Newspaper size={15} /><span><strong>Новости рынка</strong><small>{newsReviewed ? 'Изучено · +4 доверия' : 'Катализаторы и угрозы'}</small></span><span className="briefing-check">{newsReviewed ? '✓' : '↗'}</span></button>
                    </div>
                    <div className="briefing-total"><span>Бонус подготовки</span><strong>+{(marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0)} доверия</strong></div>
                  </div>}
                  {callStatus === 'idle' && <div className="background-selector"><div className="background-selector-copy"><span className="eyebrow">ТВОЙ ОБРАЗ В КАДРЕ</span><p>Фон влияет на первое впечатление. Виртуальный офис может насторожить опытного клиента, если качество маски слабое.</p></div><div className="background-options"><button className={videoBackground === 'real' ? 'selected' : ''} onClick={() => setVideoBackground('real')}>Реальная комната</button><button disabled={!ownedItems.includes('neutral-backdrop') && !ownedItems.includes('chromakey-kit')} className={videoBackground === 'neutral' ? 'selected' : ''} onClick={() => setVideoBackground('neutral')}>Нейтральный фон</button><button disabled={!ownedItems.includes('chromakey-kit')} className={videoBackground === 'luxury' ? 'selected' : ''} onClick={() => setVideoBackground('luxury')}>Премиум-офис</button></div><small>{videoBackground === 'luxury' ? 'Виртуальный офис: бонус статуса, но опытный клиент может заметить подмену.' : videoBackground === 'neutral' ? 'Нейтральный фон: небольшой бонус без притворства, что это реальное жильё.' : 'Показываешь свою комнату без дополнительных эффектов.'}</small></div>}
                  {callStatus === 'idle' && availableClients.length > 0 && callsToday < (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) && <div className="incoming-call"><div className="incoming-visual"><div className="client-avatar"><span>{activeClient.initials}</span><i /></div><div className="incoming-wave"><span /><span /><span /><span /><span /><span /><span /></div></div><div className="incoming-copy"><span className="eyebrow">{activeClient.source.toUpperCase()} · УРОВЕНЬ {activeClient.tier}</span><h3>{activeClient.name}</h3><p>{activeClient.age} лет · {activeClient.profession}</p><div className="client-tags"><span><ShieldAlert size={13} /> {activeClient.temperament}</span><span><CircleDollarSign size={13} /> Капитал {activeClient.budget.toLocaleString('ru-RU')} ₽</span><span><Activity size={13} /> Опыт: {activeClient.experience.toLowerCase()}</span></div><blockquote>{activeClient.quote}</blockquote><button className="primary-action" onClick={startCall}><Video size={16} /> Принять звонок и начать разговор <ChevronRight size={16} /></button></div></div>}
                  {callStatus === 'idle' && (availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)) && <div className="no-leads-card"><Users size={25} /><h3>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'На сегодня звонки закончились' : 'Свободных клиентов пока нет'}</h3><p>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'Лимит на сегодня: ' + callsToday + ' звонка. Заверши день, чтобы восстановить рабочее время.' : 'Дождись повторного контакта или развивай репутацию, чтобы открыть новые предложения.'}</p><button className="primary-action" onClick={endDay}>Завершить день <ChevronRight size={15} /></button></div>}
                  {callStatus === 'active' && activeQuestion && <><div className="call-purpose-strip"><div><span className="eyebrow">С КЕМ ТЫ ГОВОРИШЬ</span><strong>{activeClient.name} · {activeClient.profession}</strong><p>Клиент хочет понять, подходит ли ему акция «{activeCompany.name}». Твоя задача — объяснить выгоду, назвать риски и не обещать гарантированную прибыль.</p></div><div><span className="eyebrow">ТВОЯ БУМАГА</span><strong>{activeCompany.ticker} · риск {activeCompany.risk.toLowerCase()}</strong><p>{activeCompany.description}</p></div></div><div className="call-workspace immersive-call-workspace"><div className="client-panel"><div className="client-panel-top"><div className="client-avatar large"><span>{activeClient.initials}</span><i /></div><div><span className="eyebrow">КЛИЕНТ · ВИДЕОСВЯЗЬ</span><h3>{activeClient.name}</h3><p>{activeClient.temperament} инвестор · {activeClient.age} лет</p></div><button className="hangup" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}><Phone size={16} /></button></div><div className="client-video-stage"><div className="client-video-feed"><ClientPortrait3D tier={activeClient.tier} /><span className="video-nameplate">{activeClient.name}</span><span className="video-live-indicator"><i /> СВЯЗЬ СТАБИЛЬНА</span></div><div className="self-video-column"><SelfCameraPreview enabled={videoEnabled} background={videoBackground} outfit={selectedOutfit} /></div><div className="video-side-info"><span className="eyebrow">ВИДЕОЗВОНОК</span><strong>{videoEnabled ? 'Камера включена' : 'Только аудио'}</strong><small>Качество оборудования: {getVideoQuality(ownedItems)}/8</small><button className="video-toggle" onClick={toggleVideo}><Video size={14} /> {videoEnabled ? 'Отключить видео' : 'Включить видео'}</button></div></div><div className="client-meters"><div className="meter-label"><span>Доверие</span><strong>{trust}% <small>{trustLabel}</small></strong></div><div className="trust-track"><span style={{ width: trust + '%' }} /></div><div className="meter-label"><span>Терпение</span><strong>{patience}%</strong></div><div className="patience-track"><span style={{ width: patience + '%' }} /></div></div><div className="call-stock-offer"><span>ТВОЁ ПРЕДЛОЖЕНИЕ</span><strong>{activeCompany.name}</strong><small>{activeCompany.sector} · {getDisplayedPrice(activeCompany)} · изменение {getDisplayedChange(activeCompany)} · риск {activeCompany.risk.toLowerCase()}</small><p>{activeCompany.description}</p><div className="call-stock-offer-columns"><span><b>Плюс:</b> {activeCompany.advantages}</span><span><b>Риск:</b> {activeCompany.risks}</span></div></div><div className="client-goal"><small>ЦЕЛЬ КЛИЕНТА</small><strong>{activeClient.goal}</strong><p>{activeClient.temperament}. {activeClient.experience}. Подбирай аргументы под его задачу.</p></div><div className="conversation-log">{conversation.slice(-2).map((entry, i) => <div key={i} className={'log-line ' + entry.from}><span>{entry.from === 'you' ? 'ТЫ' : entry.from === 'system' ? 'СИСТЕМА' : activeClient.name.toUpperCase()}</span><p>{entry.text}</p></div>)}</div></div><div className="answer-panel"><div className="answer-heading"><span className="eyebrow">{NEGOTIATION_STAGES[Math.min(questionIndex, NEGOTIATION_STAGES.length - 1)]} · ВОПРОС {questionIndex + 1} ИЗ {activeQuestions.length}</span><div className="answer-controls"><span className="answer-shortcut-hint">1–4 / A–D · быстрый ответ</span><div className={'timer-pill ' + (timeLeft <= 4 ? 'urgent' : '')}><Clock3 size={15} /><strong>{timeLeft.toFixed(1)}с</strong></div></div></div><h3>{activeQuestion.title}</h3><p className="question-hint"><Sparkles size={14} /> {activeQuestion.hint}</p><div className="answer-options">{displayedChoices.map((choice, i) => <button className="answer-option" key={choice.label} onClick={() => answerQuestion(choice.label, choice.delta)}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{choice.label}</span><ChevronRight size={16} /></button>)}</div><div className="free-answer"><label htmlFor="free-answer">СВОЙ ОТВЕТ</label><textarea id="free-answer" placeholder="Напиши, что ответил бы клиенту… (например: «Гарантий нет, давайте сначала разберём риски») " value={freeAnswer} onChange={(event) => setFreeAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendFreeAnswer() } }} /><div className="free-answer-footer"><span>Enter — отправить · Shift + Enter — новая строка</span><button disabled={!freeAnswer.trim()} onClick={sendFreeAnswer}>Ответить <ArrowUpRight size={14} /></button></div></div><div className="timer-warning"><Clock3 size={14} /> Чем дольше думаешь, тем быстрее падает терпение. После таймера клиент может уйти.</div></div></div></>}
                  {(callStatus === 'won' || callStatus === 'lost') && <div className="call-result"><div className={callStatus === 'won' ? 'result-icon success' : 'result-icon failure'}>{callStatus === 'won' ? <Check size={28} /> : <X size={28} />}</div><span className="eyebrow">ИТОГ ПЕРЕГОВОРОВ</span><h3>{callStatus === 'won' ? 'Сделка закрыта.' : 'Переговоры не завершились сделкой.'}</h3><p>{lastResult}</p><div className="result-stats"><div><small>ДОВЕРИЕ</small><strong>{trust}/100</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div><div><small>ЗАКРЫТО СДЕЛОК</small><strong>{deals}</strong></div></div><div className="result-actions"><button className="secondary-action" onClick={() => setCallStatus('idle')}>Вернуться к клиентам</button><button className="primary-action" onClick={() => { setCallStatus('idle'); setTab('overview') }}>К обзору дня <ChevronRight size={16} /></button></div></div>}
                </div>
              )}
            </section>
            <aside className="terminal-right-rail">
              <div className="rail-title"><span>РАБОЧИЙ СТОЛ</span><button aria-label="Уведомления"><Bell size={15} /></button></div>
              <div className="rail-widget time-widget"><span className="rail-icon"><Clock3 size={16} /></span><small>ВРЕМЯ</small><strong>{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</strong><em>День {day} · рабочая смена</em></div>
              <div className="rail-widget"><div className="rail-widget-heading"><span className="rail-icon gold"><Zap size={16} /></span><span><small>ЗАДАЧА ДНЯ</small><strong>Первая сделка</strong></span></div><div className="task-progress"><span style={{ width: deals > 0 ? '100%' : '0%' }} /></div><div className="rail-caption">{deals > 0 ? 'Выполнено — отлично!' : 'Осталось закрыть 1 сделку'}</div></div>
              <div className="rail-widget mini-news"><div className="rail-widget-heading"><span className="rail-icon green"><Newspaper size={16} /></span><span><small>ВАЖНОЕ</small><strong>Новости рынка</strong></span></div><p>«Котолёт» ведёт переговоры о крупном контракте.</p><button onClick={() => setTab('news')}>Читать ленту <ChevronRight size={13} /></button></div>
              <div className="rail-widget contact-widget"><div className="rail-widget-heading"><span className="rail-icon blue"><MessageCircle size={16} /></span><span><small>НАСТАВНИК</small><strong>Виктор Петрович</strong></span></div><p>«Не продавай то, чего сам не понимаешь. Особенно если оно летает на батарейках».</p></div>
              <div className="rail-footer"><span><span className="live-dot" /> Все системы работают</span><small>BUILD 0.8.0 · DEMO</small></div>
            </aside>
          </div>
          {appWindows.length > 0 && <div className="os-multi-window-layer" aria-label="Открытые приложения">
            {appWindows.map((win, index) => {
              const title = win.app === 'overview' ? 'Обзор дня' : win.app === 'market' ? 'Биржевой терминал' : win.app === 'news' ? 'Лента новостей' : win.app === 'calls' ? 'Видеозвонки' : win.app === 'clients' ? 'База клиентов' : win.app === 'shop' ? 'Магазин комнаты' : 'Недвижимость'
              const icon = win.app === 'overview' ? <Activity size={15} /> : win.app === 'market' ? <TrendingUp size={15} /> : win.app === 'news' ? <Newspaper size={15} /> : win.app === 'calls' ? <Video size={15} /> : win.app === 'clients' ? <Users size={15} /> : win.app === 'shop' ? <ShoppingBag size={15} /> : <House size={15} />
              return <section key={win.id} className={'os-floating-window' + (win.maximized ? ' maximized' : '') + (win.minimized ? ' minimized' : '')} style={{ left: win.maximized ? 8 : win.x, top: win.maximized ? 8 : win.y, zIndex: 100 + index }} onPointerMove={(event) => { const drag = appWindowDragRef.current; if (!drag || drag.id !== win.id || win.maximized) return; setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, x: Math.max(0, Math.min(420, drag.originX + event.clientX - drag.x)), y: Math.max(0, Math.min(260, drag.originY + event.clientY - drag.y)) } : item)) }} onPointerUp={() => { appWindowDragRef.current = null }}>
                <header className="os-floating-titlebar" onPointerDown={(event) => { if ((event.target as HTMLElement).closest('button')) return; appWindowDragRef.current = { id: win.id, x: event.clientX, y: event.clientY, originX: win.x, originY: win.y }; event.currentTarget.setPointerCapture(event.pointerId); setAppWindows((items) => [...items.filter((item) => item.id !== win.id), win]) }}>
                  <span>{icon}{title}</span><div className="os-floating-controls"><button aria-label="Свернуть окно" onClick={() => setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, minimized: true } : item))}>−</button><button aria-label="Развернуть окно" onClick={() => setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, maximized: !item.maximized, minimized: false } : item))}>□</button><button aria-label="Закрыть окно" onClick={() => setAppWindows((items) => items.filter((item) => item.id !== win.id))}>×</button></div>
                </header>
                {!win.minimized && <div className="os-floating-content">
                  {win.app === 'overview' && <><span className="os-floating-eyebrow">СИСТЕМА · ДЕНЬ {day}</span><h3>{gameMinutes < 12 * 60 ? 'Доброе утро' : gameMinutes < 18 * 60 ? 'Хорошего дня' : 'Добрый вечер'}</h3><div className="os-floating-stat-grid"><div><small>ЛИЧНЫЕ ДЕНЬГИ</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div></div><button className="os-floating-primary" onClick={() => { setTab('overview'); setWindowMinimized(false) }}>Открыть полный обзор</button></>}
                  {win.app === 'market' && <><span className="os-floating-eyebrow">КОТИРОВКИ · РЫНОК</span><h3>Биржевой терминал</h3><div className="os-market-list" aria-label="Все акции"><div className="os-market-list-heading"><span>КОМПАНИЯ / ТИКЕР</span><span>ЦЕНА / ДЕНЬ</span></div>{companies.map((company) => <button key={company.ticker} className={'os-market-row' + (selectedCompany === company.ticker ? ' selected' : '')} onClick={() => setSelectedCompany(company.ticker)}><span><strong>{company.name}</strong><small>{company.ticker} · {company.sector}</small></span><span className="os-market-price"><strong>{getDisplayedPrice(company)}</strong><small className={getDisplayedChange(company).startsWith('-') || getDisplayedChange(company).startsWith('−') ? 'negative' : 'positive'}>{getDisplayedChange(company)}</small></span></button>)}</div><div className="os-market-detail"><span className="os-floating-eyebrow">ВЫБРАННАЯ КОМПАНИЯ</span><h4>{activeCompany.name}</h4><p>{activeCompany.description}</p><div className="os-market-detail-stats"><span><small>КАПИТАЛИЗАЦИЯ</small><strong>{activeCompany.cap}</strong></span><span><small>РИСК</small><strong>{activeCompany.risk}</strong></span></div><button className="os-floating-primary" onClick={() => setTab('market')}>Открыть полный терминал</button></div></>}
                  {win.app === 'news' && <><span className="os-floating-eyebrow">ИНФОРМАЦИОННАЯ ЛЕНТА</span><h3>Новости рынка</h3><p>«Котолёт» ведёт переговоры о крупном контракте. Новость может повлиять на ожидания клиентов.</p><p>Перед сделкой сравни новость с отчётом компании и оцени риск.</p><button className="os-floating-primary" onClick={() => setTab('news')}>Открыть все новости</button></>}
                  {win.app === 'calls' && <><span className="os-floating-eyebrow">СВЯЗЬ · ВИДЕОКОНФЕРЕНЦИЯ</span><h3>{callStatus === 'active' ? 'Идёт видеозвонок' : callStatus === 'won' || callStatus === 'lost' ? 'Звонок завершён' : 'Видеозвонки'}</h3><div className="os-call-person"><div className="os-call-portrait"><ClientPortrait3D tier={activeClient.tier} /></div><div className="os-call-person-info"><strong>{activeClient.name}</strong><span>{activeClient.profession}</span><small>{callStatus === 'active' ? '● СОЕДИНЕНИЕ УСТАНОВЛЕНО' : callStatus === 'won' ? '● СДЕЛКА ЗАКРЫТА' : callStatus === 'lost' ? '● ЗВОНОК ЗАВЕРШЁН' : 'ГОТОВ К ЗВОНКУ'}</small></div></div><blockquote className="os-call-quote">«{callStatus === 'active' && activeQuestion ? activeQuestion.title : activeClient.quote}»</blockquote>{callStatus === 'idle' && <><div className="os-call-client-picker"><span className="os-floating-eyebrow">ВЫБЕРИ КЛИЕНТА</span>{availableClients.map((client) => <button key={client.id} className={'os-call-client-option' + (selectedClientId === client.id ? ' selected' : '')} onClick={() => setSelectedClientId(client.id)}><span><strong>{client.name}</strong><small>{client.profession} · уровень {client.tier}</small></span><span>›</span></button>)}</div><div className="os-floating-stat-grid"><div><small>ЗВОНКИ СЕГОДНЯ</small><strong>{callsToday}</strong></div><div><small>ДОСТУПНЫЕ ЛИДЫ</small><strong>{availableClients.length}</strong></div></div><button className="os-floating-primary" onClick={() => startCall(true)}>Начать видеозвонок</button></>}{callStatus === 'active' && <div className="os-call-answers">{displayedChoices.map((choice, choiceIndex) => <button key={choiceIndex} onClick={() => answerQuestion(choice.label, choice.delta)}><kbd>{choiceIndex + 1}</kbd><span>{choice.label}</span><small>{choice.delta > 0 ? '+' : ''}{choice.delta} доверия</small></button>)}<div className="os-call-meter"><span style={{width: trust + '%'}} /><small>Доверие {trust}% · Терпение {patience}% · {timeLeft} сек.</small></div><button className="os-call-end" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}>Завершить звонок</button></div>}{(callStatus === 'won' || callStatus === 'lost') && <><p className="os-call-result">{lastResult || 'Звонок завершён.'}</p><button className="os-floating-primary" onClick={() => { setCallStatus('idle'); setQuestionIndex(0); setSelectedClientId(availableClients[0]?.id ?? 'alex-vorontsov') }}>Выбрать следующего клиента</button></>}</>}
                  {win.app === 'clients' && <><span className="os-floating-eyebrow">CRM · КОНТАКТЫ</span><h3>База клиентов</h3><p>Доступно новых лидов: <strong>{availableClients.length}</strong></p><p>Репутация фирмы: <strong>{reputation}/100</strong>. Успешные сделки открывают клиентов с большим капиталом.</p><button className="os-floating-primary" onClick={() => setTab('clients')}>Открыть CRM</button></>}
                  {win.app === 'shop' && <><span className="os-floating-eyebrow">ОБОРУДОВАНИЕ</span><h3>Магазин рабочего места</h3><p>Баланс: <strong>{cash.toLocaleString('ru-RU')} ₽</strong></p><p>Покупай оборудование, чтобы улучшать рабочую среду и качество звонков.</p><button className="os-floating-primary" onClick={() => setTab('shop')}>Открыть магазин</button></>}
                  {win.app === 'housing' && <><span className="os-floating-eyebrow">ЖИЛЬЁ</span><h3>{currentHousing.name}</h3><p>Улучшай жильё по мере роста дохода и репутации.</p><button className="os-floating-primary" onClick={() => setTab('housing')}>Открыть недвижимость</button></>}
                </div>}
              </section>
            })}
          </div>}
          {startMenuOpen && <div className="os-start-menu" role="dialog" aria-label="Меню Пуск">
            <div className="os-start-header"><div className="os-start-user"><span>БР</span><div><strong>Младший брокер</strong><small>Личный компьютер</small></div></div><button aria-label="Закрыть меню Пуск" onClick={() => setStartMenuOpen(false)}><X size={15} /></button></div>
            <label className="os-start-search"><span>⌕</span><input aria-label="Поиск приложения" placeholder="Найти приложение или задачу" value={startSearch} onChange={event => setStartSearch(event.target.value)} /><kbd>APP</kbd></label>
            <div className="os-start-section"><strong>Закреплённые приложения</strong><small>РАБОЧИЕ ИНСТРУМЕНТЫ</small></div>
            <div className="os-start-apps">
              {(!startSearch.trim() || 'обзор дня'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('overview') }}><span className="start-app-icon start-overview"><Activity size={18} /></span><strong>Обзор дня</strong></button>}
              {(!startSearch.trim() || 'биржа'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('market') }}><span className="start-app-icon start-market"><TrendingUp size={18} /></span><strong>Биржа</strong></button>}
              {(!startSearch.trim() || 'новости'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('news') }}><span className="start-app-icon start-news"><Newspaper size={18} /></span><strong>Новости</strong></button>}
              {(!startSearch.trim() || 'видеозвонки'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('calls') }}><span className="start-app-icon start-calls"><Video size={18} /></span><strong>Видеозвонки</strong></button>}
              {(!startSearch.trim() || 'клиенты'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('clients') }}><span className="start-app-icon start-clients"><Users size={18} /></span><strong>Клиенты</strong></button>}
              {(!startSearch.trim() || 'магазин'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('shop') }}><span className="start-app-icon start-shop"><ShoppingBag size={18} /></span><strong>Магазин</strong></button>}
              {(!startSearch.trim() || 'жильё'.includes(startSearch.trim().toLowerCase())) && <button onClick={() => { openAppWindow('housing') }}><span className="start-app-icon start-housing"><House size={18} /></span><strong>Жильё</strong></button>}
            </div>
            {startSearch.trim() && !['обзор дня','биржа','новости','видеозвонки','клиенты','магазин','жильё'].some(name => name.includes(startSearch.trim().toLowerCase())) && <div className="os-start-empty">Ничего не найдено</div>}
            <div className="os-start-footer"><span><span className="os-start-status" /> Система готова</span><button onClick={() => { setStartMenuOpen(false); setPauseOpen(true) }}><Power size={15} /> Питание</button></div>
          </div>}
          <div className="os-taskbar"><button className={startMenuOpen ? 'taskbar-start active' : 'taskbar-start'} onClick={() => setStartMenuOpen(value => !value)}><span className="start-windows-mark">▦</span> <strong>Пуск</strong></button><span className="os-taskbar-separator" />{tab !== 'overview' && <button className="os-taskbar-app" onClick={() => setWindowMinimized((value) => !value)}>{tab === 'market' ? 'Биржа' : tab === 'news' ? 'Новости' : tab === 'calls' ? 'Видеозвонки' : tab === 'clients' ? 'Клиенты' : tab === 'shop' ? 'Магазин' : tab === 'city' ? 'Город' : 'Недвижимость'}</button>}<span className="os-taskbar-spacer" /><span className="os-taskbar-weather">☁ <span>Переменная облачность</span></span><span className="os-taskbar-clock">{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}<small>ДЕНЬ {day}</small></span></div>
        </div>
      )}

      {menuSettings && !mainMenu && <div className="pause-backdrop"><section className="pause-menu pause-settings-panel" role="dialog" aria-modal="true" aria-label="Настройки"><span className="pause-kicker">ПАРАМЕТРЫ ИГРЫ</span><h2>Настройки</h2><p>Управляй визуальными эффектами. Прогресс сохраняется автоматически.</p><div className="settings-row"><span><strong>Звуковые эффекты</strong><small>Кнопки, шаги и действия.</small></span><button className={'settings-toggle' + (soundEnabled ? ' on' : '')} onClick={() => setSoundEnabled((value) => !value)}>{soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Шум города и дождь</strong><small>Меняется при закрытии штор.</small></span><button className={'settings-toggle' + (ambienceEnabled ? ' on' : '')} onClick={() => setAmbienceEnabled((value) => !value)}>{ambienceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Уменьшить анимации</strong><small>Снижает интенсивность декоративных движений.</small></span><button className={'settings-toggle' + (reducedMotion ? ' on' : '')} onClick={toggleReducedMotion} aria-pressed={reducedMotion}>{reducedMotion ? 'ВКЛ' : 'ВЫКЛ'}</button></div><button className="pause-primary" onClick={() => setMenuSettings(false)}>Готово</button></section></div>}

      {pauseOpen && !mainMenu && <div className="pause-backdrop"><section className="pause-menu" role="dialog" aria-modal="true" aria-label="Пауза"><span className="pause-kicker">ИГРА ПРИОСТАНОВЛЕНА</span><h2>Передохнём?</h2><p>Время остановлено. Карьера сохраняется автоматически.</p><button className="pause-primary" onClick={() => setPauseOpen(false)}><Play size={17} fill="currentColor" /> Вернуться в игру</button><button onClick={() => { setPauseOpen(false); setMainMenu(true); setOfflineMenu(true); setConfirmNewCareer(true) }}><RotateCcw size={16} /> Начать заново</button><button onClick={() => { setPauseOpen(false); setMenuSettings(true) }}><Settings size={16} /> Настройки</button><button className="pause-exit" onClick={() => { setPauseOpen(false); setPanel('room'); setCallStatus('idle'); setMainMenu(true); setOfflineMenu(false) }}><ArrowLeft size={16} /> В главное меню</button><small>ESC — продолжить игру</small></section></div>}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      <div className="version-watermark">PROTOTYPE 0.8 <span>·</span> НЕФИНАНСОВЫЙ СОВЕТ</div>
      </> }
    </main>
  )
}
