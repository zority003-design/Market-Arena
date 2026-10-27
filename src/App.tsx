import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import DailyMissionPanel from './DailyMissionPanel'
import PixelAvatar from './PixelAvatar'
import { configureAudio, playSound, stopSpeech } from './audio'
import { calculateDeal, CLIENTS, DAILY_SALARY, getAvailableClients, getBackgroundModifier, getDailyLeadIds, getFirstImpression, getVideoQuality, getOutfitModifier, HOUSING, ROOM_ITEMS, STARTING_CASH, STARTING_FIRM_CAPITAL, STARTING_HOUSING_ID, type VideoBackground } from './game/economy'

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

const COMPANY_BANTER: Record<string, string> = {
  KOTL: '«Я слышал, ваши роботы уже доставляют посылки. Надеюсь, прибыль они тоже умеют доставлять — желательно не только в презентациях».',
  OGUR: '«Соки я люблю. Особенно когда в отчёте прибыль не разбавлена водой».',
  TAPK: '«Умные тапочки? Главное, чтобы после обновления они не начали ходить от инвесторов сами».',
  DUST: '«Уборка — бизнес стабильный. Пыль, в отличие от инвесторов, возвращается регулярно».',
  BTRAN: '«Бензин дорожает, кофе остывает, а инвестор всё ещё хочет гарантированную доходность. С чего начнём?»',
}

function getStockQuestions(company: typeof companies[number]) {
  const scenarios: Record<string, { prompts: string[]; hints: string[]; choices: [string, string, string][] }> = {
    KOTL: {
      prompts: [
        '«Котолёт» растёт, но убыточен. Мы инвестируем в бизнес или спонсируем кота с реактивным двигателем? Покажите цифры.',
        'Контракт на 800 роботов ещё не подписан. Если заказчик передумает, кто будет кормить эту армию механических котов?',
        'Когда «Котолёт» начнёт оправдывать оценку, а не только красиво взлетать в презентациях? Назовите критерии провала.',
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
        '«Огурец Капитал» приносит прибыль, но не летит на Луну. Почему это инвестиция, а не просто дорогой овощной отдел?',
        'Если огурцы, бутылки и упаковка подорожают одновременно, где компания найдёт маржу — в соке или в слезах финансового директора?',
        'Какой здесь реалистичный сценарий доходности? И пожалуйста, без обещаний «иксов к пятнице» и прочей брокерской магии.',
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
        '«ТапокТех» падает на 4%, а клиенты возвращают тапочки. Это инвестиционная возможность или рынок пытается убежать босиком?',
        'Директор клянётся, что новая прошивка спасёт умные тапочки. Какие данные покажут, что они наконец умнее коврика у двери?',
        'Какой факт заставит нас признать, что эта идея провалилась, и не продолжать покупать тапочки в надежде на чудо?',
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
        '«Банан Транс» продаёт бензин, кофе и надежду успеть на работу. Что из этого реально приносит прибыль?',
        'Оптовое топливо дорожает, а ценник на колонке нельзя менять каждую минуту. Кто оплатит этот банановый кризис — маржа или клиент?',
        'Новые станции растут как грибы после дождя. Как понять, что это расширение бизнеса, а не памятники амбициям директора?',
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
        '«Пыль и прибыль» растёт медленно, зато убирает стабильно. Это скучный надёжный бизнес или акция, от которой уснёшь раньше дивидендов?',
        'Если зарплаты растут быстрее цены уборочного контракта, кто будет вытирать слёзы акционеров?',
        'Даже у прибыльной компании бывает момент «спасибо, расходимся». Какие цифры заставят вас продать DUST?',
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
    if (raw) return JSON.parse(raw) as { cash?: number; firmCapital?: number; debt?: number; reputation?: number; day?: number; deals?: number; housingId?: string; ownedItems?: string[]; selectedClientId?: string; videoBackground?: VideoBackground; clientLastContactDay?: Record<string, number>; clientDealCounts?: Record<string, number>; clientInvested?: Record<string, number>; callClientId?: string; callCompanyTicker?: string; callsToday?: number; dailyLeadIds?: string[]; gameMinutes?: number; dayEnded?: boolean; dailySalesAmount?: number; dailySalesShares?: number; xp?: number }
  } catch { /* Storage may be disabled; the game still works for this session. */ }
  return {}
}

function getCareerLevel(xp: number) {
  let level = 1
  let nextLevelAt = 100
  let remaining = Math.max(0, xp)
  while (remaining >= nextLevelAt) {
    remaining -= nextLevelAt
    level += 1
    nextLevelAt = Math.round(nextLevelAt * 1.25)
  }
  return { level, currentXp: remaining, nextLevelAt, progress: Math.min(100, Math.round(remaining / nextLevelAt * 100)) }
}

function SelfCameraPreview({ enabled, background, outfit }: { enabled: boolean; background: VideoBackground; outfit: OutfitId }) {
  return <div className={'player-preview-tile in-game-self-view ' + background + ' outfit-' + outfit + (enabled ? '' : ' video-disabled')} aria-label="Игровой видеокадр персонажа">
    <div className="self-view-room"><span className="self-view-window" /><span className="self-view-lamp" /><span className="self-view-shelf" /></div>
    {enabled ? <PixelAvatar className="self-pixel-avatar" outfit={outfit} mode="portrait" /> : <div className="video-off-overlay"><Video size={16} /><span>ВИДЕО ВЫКЛЮЧЕНО</span></div>}
    <small>{enabled ? 'ТВОЙ ПЕРСОНАЖ' : 'ТОЛЬКО АУДИО'}</small>
  </div>
}

function OutfitIllustration({ id }: { id: OutfitId }) {
  return <PixelAvatar className={'outfit-illustration outfit-illustration-' + id} outfit={id} />
}

function RoomItemIllustration({ id }: { id: string }) {
  const productName = ROOM_ITEMS.find((item) => item.id === id)?.name ?? id.replace(/-/g, ' ')
  const outline = '#15252b'
  const metal = '#8eaaa4'
  const metalLight = '#c0d8cb'
  const green = '#3b8167'
  const greenLight = '#79c39a'
  const dark = '#203b3b'
  return <svg className={'room-item-illustration pixel-product-art illustration-' + id} viewBox="0 0 140 110" role="img" aria-label={productName} shapeRendering="crispEdges">
    <rect x="26" y="96" width="88" height="4" fill="#02090b" opacity=".55" />
    {id === 'desk-lamp' && <g>
      <rect x="42" y="88" width="56" height="6" fill={outline}/><rect x="48" y="84" width="44" height="4" fill={metal}/>
      <rect x="66" y="56" width="8" height="30" fill={outline}/><rect x="62" y="52" width="8" height="30" fill={metal}/>
      <rect x="70" y="48" width="20" height="8" fill={outline}/><rect x="74" y="44" width="20" height="8" fill={metal}/>
      <rect x="86" y="32" width="28" height="8" fill={outline}/><rect x="82" y="36" width="32" height="8" fill={outline}/>
      <rect x="86" y="28" width="24" height="8" fill={metalLight}/><rect x="82" y="32" width="32" height="8" fill={metal}/>
      <rect x="86" y="40" width="22" height="4" fill="#e8d69b"/><rect x="94" y="44" width="18" height="4" fill="#e8d69b" opacity=".7"/>
      <rect x="64" y="60" width="4" height="20" fill={metalLight}/><rect x="50" y="88" width="40" height="2" fill={metalLight}/>
    </g>}
    {id === 'used-chair' && <g>
      <rect x="44" y="16" width="48" height="8" fill={outline}/><rect x="40" y="24" width="56" height="36" fill={outline}/>
      <rect x="48" y="24" width="40" height="28" fill={green}/><rect x="44" y="28" width="8" height="24" fill={greenLight}/>
      <rect x="52" y="32" width="32" height="4" fill="#4f9479"/><rect x="52" y="40" width="32" height="4" fill={dark}/>
      <rect x="36" y="56" width="68" height="12" fill={outline}/><rect x="40" y="56" width="60" height="8" fill="#3d6558"/>
      <rect x="44" y="68" width="8" height="20" fill={outline}/><rect x="88" y="68" width="8" height="20" fill={outline}/>
      <rect x="64" y="68" width="8" height="22" fill={metal}/><rect x="40" y="88" width="16" height="4" fill={outline}/><rect x="84" y="88" width="16" height="4" fill={outline}/>
      <rect x="48" y="72" width="4" height="12" fill={metal}/><rect x="88" y="72" width="4" height="12" fill={metal}/>
    </g>}
    {id === 'headset' && <g>
      <rect x="40" y="24" width="60" height="8" fill={outline}/><rect x="32" y="32" width="8" height="28" fill={outline}/><rect x="100" y="32" width="8" height="28" fill={outline}/>
      <rect x="40" y="20" width="60" height="8" fill={metal}/><rect x="36" y="28" width="8" height="28" fill={metal}/><rect x="96" y="28" width="8" height="28" fill={metal}/>
      <rect x="28" y="52" width="20" height="32" fill={outline}/><rect x="32" y="56" width="12" height="24" fill={green}/><rect x="36" y="60" width="4" height="16" fill={greenLight}/>
      <rect x="92" y="52" width="20" height="32" fill={outline}/><rect x="96" y="56" width="12" height="24" fill={green}/><rect x="100" y="60" width="4" height="16" fill={greenLight}/>
      <rect x="96" y="80" width="8" height="8" fill={outline}/><rect x="80" y="84" width="16" height="4" fill={metal}/><rect x="76" y="88" width="12" height="4" fill={metalLight}/>
      <rect x="72" y="88" width="8" height="8" fill={outline}/><rect x="76" y="92" width="4" height="4" fill="#d7b879"/>
    </g>}
    {id === 'ring-light' && <g>
      <rect x="52" y="12" width="36" height="8" fill={outline}/><rect x="40" y="20" width="12" height="8" fill={outline}/><rect x="88" y="20" width="12" height="8" fill={outline}/>
      <rect x="32" y="28" width="8" height="28" fill={outline}/><rect x="100" y="28" width="8" height="28" fill={outline}/>
      <rect x="40" y="56" width="12" height="8" fill={outline}/><rect x="88" y="56" width="12" height="8" fill={outline}/><rect x="52" y="64" width="36" height="8" fill={outline}/>
      <rect x="52" y="16" width="36" height="4" fill="#f3e5b4"/><rect x="40" y="24" width="8" height="32" fill="#f3e5b4"/><rect x="92" y="24" width="8" height="32" fill="#f3e5b4"/>
      <rect x="52" y="60" width="36" height="4" fill="#f3e5b4"/><rect x="48" y="28" width="8" height="24" fill="#d4e2c8"/><rect x="88" y="28" width="8" height="24" fill="#d4e2c8"/>
      <rect x="66" y="68" width="8" height="24" fill={outline}/><rect x="62" y="72" width="16" height="16" fill={metal}/>
      <rect x="46" y="92" width="48" height="4" fill={outline}/><rect x="54" y="88" width="32" height="4" fill={metalLight}/>
    </g>}
    {id === 'hd-camera' && <g>
      <rect x="28" y="36" width="84" height="40" fill={outline}/><rect x="36" y="28" width="68" height="8" fill={outline}/>
      <rect x="36" y="36" width="68" height="32" fill={dark}/><rect x="44" y="40" width="52" height="24" fill={green}/>
      <rect x="52" y="44" width="36" height="16" fill={outline}/><rect x="56" y="44" width="28" height="16" fill="#16282e"/>
      <rect x="60" y="48" width="20" height="8" fill="#6aa6b5"/><rect x="64" y="48" width="8" height="4" fill="#d4f2e9"/>
      <rect x="92" y="40" width="8" height="8" fill="#d7b879"/><rect x="36" y="32" width="20" height="4" fill={metal}/>
      <rect x="60" y="76" width="20" height="8" fill={outline}/><rect x="64" y="84" width="12" height="8" fill={metal}/>
      <rect x="48" y="92" width="44" height="4" fill={outline}/><rect x="56" y="88" width="28" height="4" fill={metalLight}/>
    </g>}
    {id === 'neutral-backdrop' && <g>
      <rect x="32" y="16" width="8" height="72" fill={outline}/><rect x="100" y="16" width="8" height="72" fill={outline}/><rect x="36" y="16" width="68" height="8" fill={outline}/>
      <rect x="40" y="24" width="60" height="60" fill="#9da8a1"/><rect x="44" y="28" width="52" height="52" fill="#c2c8bd"/>
      <rect x="48" y="28" width="4" height="52" fill="#d8d8c9"/><rect x="64" y="28" width="4" height="52" fill="#aeb7ad"/><rect x="80" y="28" width="4" height="52" fill="#d8d8c9"/>
      <rect x="28" y="88" width="20" height="4" fill={outline}/><rect x="92" y="88" width="20" height="4" fill={outline}/>
      <rect x="32" y="84" width="12" height="4" fill={metal}/><rect x="96" y="84" width="12" height="4" fill={metal}/>
    </g>}
    {id === 'second-monitor' && <g>
      <rect x="12" y="24" width="52" height="44" fill={outline}/><rect x="16" y="28" width="44" height="36" fill="#152d35"/>
      <rect x="72" y="16" width="56" height="52" fill={outline}/><rect x="76" y="20" width="48" height="44" fill="#15362f"/>
      <rect x="20" y="48" width="8" height="8" fill={green}/><rect x="28" y="40" width="8" height="16" fill={greenLight}/><rect x="36" y="44" width="8" height="12" fill={green}/><rect x="44" y="32" width="8" height="24" fill={greenLight}/>
      <rect x="80" y="48" width="8" height="8" fill={green}/><rect x="88" y="36" width="8" height="20" fill={greenLight}/><rect x="96" y="40" width="8" height="16" fill={green}/><rect x="104" y="28" width="12" height="28" fill={greenLight}/>
      <rect x="32" y="68" width="12" height="16" fill={outline}/><rect x="94" y="68" width="12" height="16" fill={outline}/>
      <rect x="20" y="84" width="36" height="4" fill={metal}/><rect x="82" y="84" width="40" height="4" fill={metal}/>
    </g>}
    {id === 'chromakey-kit' && <g>
      <rect x="28" y="16" width="8" height="72" fill={outline}/><rect x="104" y="16" width="8" height="72" fill={outline}/><rect x="32" y="16" width="76" height="8" fill={outline}/>
      <rect x="36" y="24" width="68" height="60" fill="#155b45"/><rect x="40" y="28" width="60" height="52" fill="#2a986a"/>
      <rect x="44" y="32" width="52" height="4" fill="#6acb91"/><rect x="44" y="44" width="52" height="4" fill="#6acb91"/><rect x="44" y="56" width="52" height="4" fill="#6acb91"/><rect x="44" y="68" width="52" height="4" fill="#6acb91"/>
      <rect x="24" y="88" width="20" height="4" fill={outline}/><rect x="96" y="88" width="20" height="4" fill={outline}/>
      <rect x="32" y="84" width="12" height="4" fill={metal}/><rect x="100" y="84" width="12" height="4" fill={metal}/>
    </g>}
    {id === 'pro-mic' && <g>
      <rect x="52" y="16" width="36" height="8" fill={outline}/><rect x="44" y="24" width="52" height="32" fill={outline}/>
      <rect x="48" y="24" width="44" height="28" fill={metal}/><rect x="52" y="28" width="36" height="20" fill={dark}/>
      <rect x="56" y="28" width="4" height="20" fill={greenLight}/><rect x="64" y="28" width="4" height="20" fill={green}/><rect x="72" y="28" width="4" height="20" fill={greenLight}/><rect x="80" y="28" width="4" height="20" fill={green}/>
      <rect x="44" y="52" width="52" height="8" fill={outline}/><rect x="48" y="56" width="44" height="4" fill={metalLight}/>
      <rect x="64" y="60" width="12" height="20" fill={outline}/><rect x="68" y="64" width="4" height="16" fill={metal}/>
      <rect x="52" y="80" width="36" height="8" fill={outline}/><rect x="56" y="80" width="28" height="4" fill={metal}/>
      <rect x="40" y="88" width="60" height="4" fill={outline}/><rect x="48" y="84" width="44" height="4" fill={metalLight}/>
    </g>}
    {!['desk-lamp','used-chair','headset','ring-light','hd-camera','neutral-backdrop','second-monitor','chromakey-kit','pro-mic'].includes(id) && <g>
      <rect x="32" y="24" width="76" height="60" fill={outline}/><rect x="36" y="28" width="68" height="52" fill={dark}/>
      <rect x="44" y="36" width="52" height="4" fill={greenLight}/><rect x="44" y="48" width="36" height="4" fill={green}/><rect x="44" y="60" width="44" height="4" fill={greenLight}/>
      <rect x="60" y="84" width="20" height="8" fill={metal}/><rect x="44" y="92" width="52" height="4" fill={outline}/>
    </g>}
  </svg>
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
  const [appWindows, setAppWindows] = useState<Array<{ id: number; app: 'overview' | 'market' | 'news' | 'calls' | 'clients' | 'shop' | 'housing'; x: number; y: number; width: number; height: number; minimized: boolean; maximized: boolean }>>([])
  const [nextAppWindowId, setNextAppWindowId] = useState(1)
  const appWindowDragRef = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null)
  const appWindowResizeRef = useRef<{ id: number; x: number; y: number; width: number; height: number } | null>(null)
  const dragWindowRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)
  const [offlineMenu, setOfflineMenu] = useState(false)
  const [onlineInfo, setOnlineInfo] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [confirmNewCareer, setConfirmNewCareer] = useState(false)
  const [introActive, setIntroActive] = useState(false)
  const [sleepTransition, setSleepTransition] = useState<'sleeping' | 'waking' | null>(null)
  const [canInteractWithComputer, setCanInteractWithComputer] = useState(false)

  const [canSleep, setCanSleep] = useState(false)
  const [dayEnded, setDayEnded] = useState(saved.dayEnded ?? false)
  const [deskLampOn, setDeskLampOn] = useState(false)
  const [roomLightOn, setRoomLightOn] = useState(true)
  const [curtainsOpen, setCurtainsOpen] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [nearbyRoomObject, setNearbyRoomObject] = useState<RoomObject | null>(null)
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitId>(() => { try { return (localStorage.getItem('na-vse-kotirovki-outfit') as OutfitId) || 'intern' } catch { return 'intern' } })
  const [previewOutfit, setPreviewOutfit] = useState<OutfitId | null>(null)
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
  const [xp, setXp] = useState(saved.xp ?? 0)
  const careerLevel = getCareerLevel(xp)
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
  const [callCompanyTicker, setCallCompanyTicker] = useState(saved.callCompanyTicker ?? '')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [videoSwitchEffectUsed, setVideoSwitchEffectUsed] = useState(false)
  const [videoBackground, setVideoBackground] = useState<VideoBackground>(saved.videoBackground ?? 'real')
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [trust, setTrust] = useState(48)
  const [patience, setPatience] = useState(74)
  const [timeLeft, setTimeLeft] = useState(75)
  const lastTimerBeep = useRef(0)
  const lastCallTickSecond = useRef(-1)
  const [choiceOrders, setChoiceOrders] = useState<number[][]>([])
  const [lastPenaltySecond, setLastPenaltySecond] = useState(75)
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
    try { localStorage.setItem('na-vse-kotirovki-save-v1', JSON.stringify({ cash, xp, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callCompanyTicker, callsToday, dailyLeadIds, gameMinutes, dayEnded, dailySalesAmount, dailySalesShares })) } catch { /* Ignore unavailable storage. */ }
  }, [careerStarted, cash, xp, firmCapital, debt, reputation, day, deals, housingId, ownedItems, selectedClientId, videoBackground, clientLastContactDay, clientDealCounts, clientInvested, callClientId, callCompanyTicker, callsToday, dailyLeadIds, gameMinutes, dayEnded, dailySalesAmount, dailySalesShares])

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

  // In-game time advances only while a career is actually being played.
  // The main menu must not consume game time, and pause freezes the world clock.
  useEffect(() => {
    if (mainMenu || pauseOpen) return
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



  // A paused game must freeze negotiation timers too; otherwise the player can
  // lose a call while reading the pause menu.
  useEffect(() => {
    if (callStatus !== 'active' || pauseOpen) return
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, Math.round((value - 0.1) * 10) / 10)), 100)
    return () => window.clearInterval(timer)
  }, [callStatus, questionIndex, pauseOpen])

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
  const activeCompany = callStatus === 'idle'
    ? (companies.find((company) => company.ticker === selectedCompany) ?? companies[0])
    : (companies.find((company) => company.ticker === callCompanyTicker) ?? companies.find((company) => company.ticker === selectedCompany) ?? companies[0])
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
      width: app === 'calls' ? 760 : 460,
      height: app === 'calls' ? 700 : 520,
      minimized: false,
      maximized: false,
    }])
    setNextAppWindowId((id) => id + 1)
    setStartMenuOpen(false)
    setStartSearch('')
  }
  const displayedChoices = activeQuestion ? (choiceOrders[questionIndex]?.map((index) => activeQuestion.choices[index]).filter(Boolean) ?? activeQuestion.choices) : []
  const trustLabel = trust >= 72 ? 'Высокое доверие' : trust >= 52 ? 'Осторожный интерес' : trust >= 32 ? 'Сомневается' : 'На грани отказа'
  const projectedDeal = calculateDeal(activeClient, trust, clientDealCounts[activeClient.id] ?? 0, clientInvested[activeClient.id] ?? 0)
  const dailyQuotaShares = 25 + day * 10
  const dailyQuotaAmount = 8000 + day * 4000
  const dailyQuotaCompany = companies[(day - 1) % companies.length]

  useEffect(() => {
    if (((panel !== 'computer' || tab !== 'calls') && !appWindows.some((win) => win.app === 'calls' && !win.minimized)) || callStatus !== 'active') return
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
  }, [panel, tab, appWindows, callStatus, displayedChoices, questionIndex, trust, patience, videoEnabled, videoBackground, ownedItems, activeClient, activeQuestions])

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
    setXp(0)
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
    setCallCompanyTicker('')
    setNewsImpacts({})
    setToast('')
    setLastPenaltySecond(60)
    setCallStatus('idle')
    setQuestionIndex(0)
    setTrust(48)
    setPatience(74)
    setTimeLeft(75)
    setLastPenaltySecond(75)
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
    const assignedCompany = dailyQuotaCompany
    const assignedQuestions = getStockQuestions(assignedCompany)
    setCallCompanyTicker(assignedCompany.ticker)
    setSelectedCompany(assignedCompany.ticker)
    setCallsToday((count) => count + 1)
    setQuestionIndex(0)
    setChoiceOrders(assignedQuestions.map((question) => question.choices.map((_, index) => index).sort(() => Math.random() - 0.5)))
    lastTimerBeep.current = 0
    setVideoSwitchEffectUsed(false)
    setCallClientId(activeClient.id)
    setClientLastContactDay((items) => ({ ...items, [activeClient.id]: day }))
    const preparationBonus = (marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0) + cityBonus
    const roomBonus = getFirstImpression(housingId, ownedItems, activeClient)
    const outfitBonus = getOutfitModifier(selectedOutfit, activeClient)
    const relationshipBonus = Math.min(15, (clientDealCounts[activeClient.id] ?? 0) * 6)
    const videoBonus = videoEnabled ? 2 + Math.min(3, getVideoQuality(ownedItems)) : 0
    const backgroundBonus = videoEnabled ? getBackgroundModifier(videoBackground, ownedItems, activeClient) : 0
    const newsFitBonus = (newsImpacts[assignedCompany.ticker] ?? 0) > 0 ? 2 : (newsImpacts[assignedCompany.ticker] ?? 0) < 0 ? -2 : 0
    const companyFitBonus = (assignedCompany.risk === 'Очень высокий' ? -5 : assignedCompany.risk === 'Высокий' ? -2 : assignedCompany.positive ? 3 : -3) + newsFitBonus
    setTrust(Math.max(0, Math.min(100, activeClient.baseTrust + preparationBonus + roomBonus + outfitBonus + relationshipBonus + videoBonus + backgroundBonus + companyFitBonus)))
    setPatience(activeClient.patience)
    setTimeLeft(75)
    setLastPenaltySecond(75)
    setFreeAnswer('')
    setLastResult('')
    setConversation([{ from: 'system', text: 'Поручение руководителя: акция «' + assignedCompany.name + '» (' + assignedCompany.sector + ', риск: ' + assignedCompany.risk.toLowerCase() + '). Тебе нужно найти подходящего покупателя, раскрыть риски и обосновать предложение.' }, { from: 'client', text: 'Здравствуйте. ' + activeClient.quote }, { from: 'client', text: COMPANY_BANTER[assignedCompany.ticker] ?? '«Я пришёл за цифрами, а не за магией. Хотя магию отчётности тоже видел»' }, ...(preparationBonus > 0 ? [{ from: 'system' as const, text: 'Подготовка перед звонком помогла: начальное доверие повышено на ' + preparationBonus + ' пунктов.' }] : []), ...(roomBonus !== 0 ? [{ from: 'system' as const, text: 'Первое впечатление от жилья и рабочего места: ' + (roomBonus > 0 ? '+' : '') + roomBonus + ' к доверию.' }] : []), ...(outfitBonus > 0 ? [{ from: 'system' as const, text: 'Деловой образ произвёл впечатление: +' + outfitBonus + ' к начальному доверию.' }] : []), ...(backgroundBonus !== 0 ? [{ from: 'system' as const, text: 'Выбранный фон изменил первое впечатление на ' + (backgroundBonus > 0 ? '+' : '') + backgroundBonus + ' к доверию.' }] : []), ...(relationshipBonus > 0 ? [{ from: 'system' as const, text: 'Клиент помнит прошлое сотрудничество: +' + relationshipBonus + ' к начальному доверию.' }] : [])])
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
    const prepXp = marketReviewed && newsReviewed ? 10 : 0
    const earnedXp = 25 + prepXp + (success ? 35 : 0)
    setXp((value) => value + earnedXp)
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
      setLastResult('Сделка с ' + activeClient.name + ' закрыта. Клиент разместил ' + payout.ticket.toLocaleString('ru-RU') + ' ₽. Твой бонус: +' + payout.playerBonus.toLocaleString('ru-RU') + ' ₽; доход фирмы после бонуса: +' + Math.max(0, payout.firmRevenue - payout.playerBonus).toLocaleString('ru-RU') + ' ₽. Репутация +' + (activeClient.tier >= 2 ? 5 : 4) + '. Опыт +' + earnedXp + ' XP.')
      const quotaNote = activeCompany.ticker === quotaTargetCompany.ticker ? ' В дневной план засчитано ' + soldShares + ' акций ' + quotaTargetCompany.ticker + '.' : ' Внимание: дневной план по ' + quotaTargetCompany.ticker + ', поэтому эта бумага в квоту не засчитана.'
      setConversation((items) => [...items, { from: 'system', text: '✓ Сделка закрыта. Объём ' + payout.ticket.toLocaleString('ru-RU') + ' ₽; фирма заработала комиссию ' + payout.firmRevenue.toLocaleString('ru-RU') + ' ₽.' + quotaNote }])
    } else {
      playSound('decline')
      setReputation((value) => Math.max(0, value - 2))
      setLastResult('Сделка не состоялась. ' + activeClient.name + ' не готов доверить деньги на этих условиях. Подготовься лучше или предложи более подходящий вариант. За завершённый звонок получено +' + earnedXp + ' XP.')
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
    const patienceCost = delta >= 7 ? 2 : delta <= -8 ? 9 : delta < 0 ? 6 : 4
    const nextPatience = Math.max(0, patience - patienceCost)
    setTrust(nextTrust)
    setPatience(nextPatience)
    const clientReaction = delta >= 7
      ? activeClient.tier >= 3
        ? ['«Это уже предметно. Но покажите, где расчёт перестанет работать».', '«Вы отделили факт от предположения — это хороший знак. Что может сорвать сценарий?»', '«Аргумент принимаю предварительно. Мне нужны критерии, по которым мы признаем ошибку».'][questionIndex % 3]
        : ['«Хорошо, вы связали идею с моим запросом. Продолжайте».', '«Так понятнее. Особенно то, что вы не обещаете доходность».', '«Наконец-то конкретика: теперь можно обсуждать условия, а не лозунги».'][questionIndex % 3]
      : delta <= -8
        ? activeClient.temperament === 'Скептичный' || activeClient.temperament === 'Очень требовательная'
          ? ['«Вы отвечаете слишком уверенно и не показываете, на чём основан вывод. Пока не убеждён».', '«Вы обошли риск стороной. Это как раз то, чего я опасался».', '«Если у вас нет доказательств, громкие обещания только ухудшают ситуацию».'][questionIndex % 3]
          : ['«Это звучит как обещание, а не анализ. Чем вы можете его подтвердить?»', '«Вы не ответили на главный вопрос. Я начинаю сомневаться в рекомендации».', '«С таким объяснением я не готов рисковать своими деньгами».'][questionIndex % 3]
        : ['«Я услышал ответ, но пока не понимаю, как он связан с моей задачей».', '«Давайте без общих слов. Что именно может пойти не так?»', '«Вы назвали тезис, но не показали, что он значит для моего капитала».'][questionIndex % 3]
    setConversation((items) => [...items, { from: 'you', text }, ...(backgroundCaught ? [{ from: 'system' as const, text: 'Клиент заметил несоответствие в виртуальном фоне и стал внимательнее проверять твои слова. Доверие −7.' }] : []), { from: 'client' as const, text: clientReaction }, ...(questionIndex < activeQuestions.length - 1 ? [{ from: 'client' as const, text: activeQuestions[questionIndex + 1].title }] : [])])
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
    const companySignals: Record<string, string[]> = {
      KOTL: ['контракт', 'заказ', 'робот', 'сервис', 'масштаб', 'денеж', 'убыт', 'поставк', 'марж'],
      OGUR: ['сырь', 'упаков', 'марж', 'дистрибу', 'полк', 'прибыл', 'повторн', 'конкур'],
      TAPK: ['возврат', 'обновлен', 'качест', 'гарант', 'датчик', 'приложен', 'подтверж', 'убыт', 'денеж'],
      DUST: ['контракт', 'зарплат', 'себестоим', 'денеж', 'марж', 'уборк', 'окупаем', 'индексац'],
      BTRAN: ['оптов', 'топлив', 'марж', 'трафик', 'заряд', 'станц', 'магазин', 'денеж', 'окупаем'],
    }
    const questionSignals: Record<string, string[][]> = {
      KOTL: [
        ['рост', 'заказ', 'убыт', 'расход', 'денеж', 'прибыл', 'марж'],
        ['контракт', 'подпис', 'отказ', 'срыв', 'сценар', 'подтверж', 'огранич'],
        ['марж', 'денеж', 'постав', 'метрик', 'критер', 'прибыл', 'убыт'],
        ['сервис', 'ремонт', 'батар', 'обслужив', 'расход', 'жизненного цикла'],
        ['конкур', 'дешев', 'патент', 'себестоим', 'удерж', 'повторн'],
      ],
      OGUR: [
        ['прибыл', 'дистрибу', 'канал', 'рост', 'марж', 'полк', 'темп'],
        ['сырь', 'упаков', 'себестоим', 'марж', 'поставщик', 'цен', 'спрос'],
        ['доходн', 'дивид', 'горизонт', 'риск', 'гарант', 'прибыл'],
        ['полк', 'регион', 'торгов', 'сеть', 'зависим', 'продаж'],
        ['повторн', 'марж', 'промо', 'списан', 'реклам', 'продаж'],
      ],
      TAPK: [
        ['возврат', 'убыт', 'денеж', 'качест', 'марж', 'паден', 'позици'],
        ['возврат', 'статист', 'обновлен', 'гарант', 'расход', 'подтверж'],
        ['возврат', 'денеж', 'условие', 'выход', 'лимит', 'убыт', 'метрик'],
        ['bluetooth', 'телефон', 'приложен', 'автоном', 'возврат', 'функц'],
        ['повторн', 'себестоим', 'датчик', 'поддерж', 'возврат', 'пользователь'],
      ],
      DUST: [
        ['денежный поток', 'контракт', 'рост', 'прибыл', 'цен', 'темп', 'доход'],
        ['зарплат', 'себестоим', 'марж', 'индексац', 'контракт', 'расход'],
        ['критер', 'денежный поток', 'марж', 'цен', 'альтернатив', 'выход', 'риск'],
        ['скид', 'расход', 'прибыл', 'объём', 'контракт', 'себестоим'],
        ['робот', 'автоматиз', 'стоимость', 'окупаем', 'экономи', 'сервис'],
      ],
      BTRAN: [
        ['марж', 'топлив', 'магазин', 'мойк', 'заряд', 'средний чек', 'прибыл'],
        ['оптов', 'закуп', 'марж', 'цен', 'трафик', 'сценар', 'контракт'],
        ['окупаем', 'долг', 'денежный поток', 'станци', 'свободный', 'недозагруз'],
        ['кофе', 'магазин', 'марж', 'средний чек', 'повтор'],
        ['электромоб', 'заряд', 'стоимость', 'подключен', 'окупаем', 'локац', 'трафик'],
      ],
    }
    const activeQuestionSignals = questionSignals[activeCompany.ticker]?.[questionIndex] ?? []
    const questionSignalHits = activeQuestionSignals.filter((word) => lower.includes(word)).length
    if (questionSignalHits >= 2) delta += 5
    else if (questionSignalHits === 1) delta += 3
    const riskAndEvidence = ['риск', 'убыт', 'расход', 'денежный поток', 'марж', 'провер', 'сценар', 'подтверж', 'не обещ', 'огранич', 'если']
    const recklessPromises = ['гарант', 'точно вырастет', 'без риска', '100%', 'удво', 'не может упасть', 'всегда раст', 'не потеряете']
    if ((companySignals[activeCompany.ticker] ?? []).some((word) => lower.includes(word))) delta += 3
    if (riskAndEvidence.some((word) => lower.includes(word))) delta += 3
    if (['клиент', 'цель', 'горизонт', 'ликвид', 'доля', 'размер позиции', 'подходит'].some((word) => lower.includes(word))) delta += 2
    if (recklessPromises.some((word) => lower.includes(word))) delta -= 15
    if (text.length < 18) delta -= 2
    if (text.length > 320) delta -= 2
    if (delta === 0) delta = -1
    answerQuestion(text, Math.max(-15, Math.min(8, delta)))
  }

  function buyRoomItem(itemId: string) {
    const item = ROOM_ITEMS.find((candidate) => candidate.id === itemId)
    if (!item || ownedItems.includes(itemId)) return
    if (day < item.minDay || careerLevel.level < (item.minLevel ?? 1)) { setToast('Предмет требует ' + item.minDay + '-го дня и уровня ' + (item.minLevel ?? 1) + '.'); return }
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
    if (sleepTransition) return
    playSound('sleep')
    setSleepTransition('sleeping')
    window.setTimeout(() => {
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
      setToast('Доброе утро! День ' + nextDay + '. Оклад +' + DAILY_SALARY.toLocaleString('ru-RU') + ' ₽, расходы −' + dailyCosts.toLocaleString('ru-RU') + ' ₽.' + debtNote)
      window.setTimeout(() => setToast(''), 5200)
      setPanel('room')
      setCallStatus('idle')
      setSleepTransition('waking')
      window.setTimeout(() => setSleepTransition(null), 2400)
    }, 1700)
  }


  return (
    <main className={'game-shell' + (reducedMotion ? ' reduced-motion' : '') + (mainMenu ? ' is-main-menu' : '')}>
      {shiftReport && <div className="shift-report-backdrop"><section className="shift-report-modal"><span className="eyebrow">ДЕНЬ {day} · ОТЧЁТ ПО СМЕНЕ</span><div className={'shift-report-icon ' + (shiftReport.success ? 'success' : 'failure')}>{shiftReport.success ? <Check size={26} /> : <X size={26} />}</div><h2>{shiftReport.success ? 'План выполнен' : 'План не выполнен'}</h2><p className="shift-report-lead">{shiftReport.company} ({shiftReport.ticker}) — обязательная бумага дня. Сделки по другим акциям не заменяют этот план.</p><div className="shift-report-stats"><div><small>ПРОДАНО АКЦИЙ</small><strong>{shiftReport.shares} / {shiftReport.targetShares}</strong></div><div><small>ОБОРОТ ПО ЦЕЛЕВОЙ БУМАГЕ</small><strong>{shiftReport.amount.toLocaleString('ru-RU')} / {shiftReport.targetAmount.toLocaleString('ru-RU')} ₽</strong></div></div><div className={'shift-report-consequence ' + (shiftReport.success ? 'good' : 'bad')}>{shiftReport.success ? 'Премия +' + shiftReport.reward.toLocaleString('ru-RU') + ' ₽ и +4 к репутации.' : 'Штраф фирме −' + shiftReport.penalty.toLocaleString('ru-RU') + ' ₽ и −3 к репутации. Завтра план станет сложнее.'}</div><button className="primary-action" onClick={() => setShiftReport(null)}>Продолжить <ArrowRight size={15} /></button></section></div>}
      {!mainMenu && introActive && <div key={day + '-wake-' + String(introActive)} className="intro-curtain" aria-label="Пробуждение"><div className="intro-eyelid intro-eyelid-top" /><div className="intro-eyelid intro-eyelid-bottom" /><div className="intro-wake-caption"><span>{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</span><strong>Пора вставать.</strong><small>Новый день брокера начинается</small></div></div>}
      {sleepTransition && <div className={'sleep-transition ' + sleepTransition} role="status" aria-live="polite">
        <div className="sleep-room-glow" />
        <div className="sleep-bed-silhouette"><span className="sleep-pillow" /><span className="sleep-blanket" /><span className="sleep-head" /><span className="sleep-eye left" /><span className="sleep-eye right" /></div>
        <div className="sleep-eyelid sleep-eyelid-top" /><div className="sleep-eyelid sleep-eyelid-bottom" />
        <div className="sleep-transition-caption"><span>{sleepTransition === 'sleeping' ? 'КОНЕЦ ДНЯ' : '07:00 · НОВЫЙ ДЕНЬ'}</span><strong>{sleepTransition === 'sleeping' ? 'Ты ложишься спать…' : 'Будильник. Пора вставать.'}</strong><small>{sleepTransition === 'sleeping' ? 'Закрываешь глаза, город за окном затихает.' : 'Глаза открываются. Впереди новая смена брокера.'}</small></div>
      </div>}
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
          <span className="day-pill"><CalendarDays size={13} /> ДЕНЬ {String(day).padStart(2, '0')}</span><span className="day-pill game-time-pill"><Clock3 size={13} /> {String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</span>
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
            <section className="wardrobe-studio"><div className="wardrobe-character-stage"><span className="wardrobe-light" /><PixelAvatar className="wardrobe-pixel-avatar" outfit={previewOutfit ?? selectedOutfit} /><span className="wardrobe-stage-label">2D-ПИКСЕЛЬНЫЙ ПЕРСОНАЖ · ПРИМЕРЬ ОБРАЗ</span></div><div className="wardrobe-studio-copy"><span className="eyebrow">ТВОЙ ПЕРСОНАЖ</span><h3>{OUTFITS.find((outfit) => outfit.id === (previewOutfit ?? selectedOutfit))?.name}</h3><p>Единый 2D-спрайт используется в гардеробе, карточках костюмов и твоём видеокадре. Примерка не покупает костюм: нажми «Купить» или «Надеть», чтобы закрепить образ.</p><div className="wardrobe-look-tags"><span>Сейчас надет: {OUTFITS.find((outfit) => outfit.id === selectedOutfit)?.name}</span><span>{ownedOutfits.length} комплект(а)</span></div></div></section>
            <section className="outfit-selector"><div className="outfit-selector-heading"><div><span className="eyebrow">ОДЕЖДА</span><h3>Выбери комплект</h3></div><span>Деньги: {cash.toLocaleString('ru-RU')} ₽</span></div><div className="outfit-grid">{OUTFITS.map((outfit) => { const owned = ownedOutfits.includes(outfit.id); const wearing = selectedOutfit === outfit.id; const canAfford = cash >= outfit.price; return <article className={'outfit-card outfit-' + outfit.id + (wearing ? ' wearing' : '') + (outfitDetailsId === outfit.id ? ' details-open' : '')} key={outfit.id}><button className="outfit-preview-button" onClick={() => { setPreviewOutfit(outfit.id); setOutfitDetailsId(outfit.id) }}><div className="outfit-swatch"><OutfitIllustration id={outfit.id} /></div><span className="outfit-preview-caption">{wearing ? 'Сейчас надет' : previewOutfit === outfit.id ? 'Примерка' : 'Примерить'}</span></button><div className="outfit-card-copy"><strong>{outfit.name}</strong><p>{outfit.description}</p><small>{outfit.price === 0 ? 'Стартовый комплект' : outfit.price.toLocaleString('ru-RU') + ' ₽'}</small></div><div className="outfit-card-actions"><button className="outfit-details-button" onClick={() => setOutfitDetailsId(outfitDetailsId === outfit.id ? null : outfit.id)}>{outfitDetailsId === outfit.id ? 'Скрыть детали' : 'Что даёт?'}</button><button disabled={wearing || (!owned && !canAfford)} onClick={() => { if (owned) { setSelectedOutfit(outfit.id); setPreviewOutfit(null); return } setCash((value) => value - outfit.price); setOwnedOutfits((value) => [...value, outfit.id]); setSelectedOutfit(outfit.id); setPreviewOutfit(null); setOutfitDetailsId(outfit.id); playSound('deal') }}>{wearing ? 'Надет' : owned ? 'Надеть' : canAfford ? 'Купить' : 'Не хватает денег'}</button></div>{outfitDetailsId === outfit.id && <div className="outfit-detail-panel"><strong>Что даёт этот образ</strong><p>{outfit.id === 'intern' ? 'Бесплатный базовый комплект. Сохраняет деньги на оборудование и развитие.' : outfit.id === 'classic' ? 'Деловой внешний вид для ролевого прогресса. Не улучшает качество рекомендаций сам по себе.' : 'Премиальный внешний вид для встреч высокого уровня. Не гарантирует доверие или сделку.'}</p></div>}</article> })}</div></section>
            <section className="outfit-selector wardrobe-store"><div className="outfit-selector-heading"><div><span className="eyebrow">ARENA SUPPLY · КАТАЛОГ</span><h3>Магазин и кастомизация</h3></div><span>Улучшай рабочее место, образ и качество связи</span></div><div className="shop-grid">{ROOM_ITEMS.map((item) => { const owned = ownedItems.includes(item.id); const locked = day < item.minDay || careerLevel.level < (item.minLevel ?? 1); const detailsOpen = roomItemDetailsId === item.id; return <article className={'shop-item' + (owned ? ' owned' : '') + (detailsOpen ? ' details-open' : '')} key={item.id}><div className="shop-item-icon-wrap shop-item-game-preview"><div className="shop-item-game-stage"><RoomItemIllustration id={item.id} /></div><span>{item.category === 'video' ? 'ЗВУК / КАМЕРА' : item.category === 'background' ? 'ОБСТАНОВКА' : item.category === 'work' ? 'ПРОИЗВОДИТЕЛЬНОСТЬ' : 'КОМФОРТ'}</span></div><div className="shop-item-meta"><span className="eyebrow">{item.category === 'video' ? 'ВИДЕОСВЯЗЬ' : item.category === 'background' ? 'ФОН' : item.category === 'work' ? 'РАБОТА' : 'КОМФОРТ'}</span><strong>{item.name}</strong><p>{item.description}</p><div className="shop-item-benefits">{item.videoQuality > 0 && <span className="shop-benefit-positive">Видео +{item.videoQuality}</span>}{item.firstImpression > 0 && <span className="shop-benefit-positive">Первое впечатление +{item.firstImpression}</span>}{item.id === 'second-monitor' && <span className="shop-benefit-neutral">Бонус к подготовке</span>}{item.id === 'used-chair' && <span className="shop-benefit-neutral">Комфорт на смене</span>}{item.id === 'chromakey-kit' && <span className="shop-benefit-risk">Риск подозрения +10</span>}</div><button className="shop-item-details-toggle" onClick={() => setRoomItemDetailsId(detailsOpen ? null : item.id)}>{detailsOpen ? 'Скрыть подробности' : 'Что даёт предмет?'}</button>{detailsOpen && <div className="shop-item-detail-panel"><strong>Эффект в игре</strong><p>{item.videoQuality > 0 ? 'Качество видеосвязи +' + item.videoQuality + '/8. ' : ''}{item.firstImpression > 0 ? 'Первое впечатление +' + item.firstImpression + '. ' : ''}{item.id === 'second-monitor' ? 'Помогает сравнивать данные, но не добавляет доверие автоматически.' : item.id === 'chromakey-kit' ? 'Открывает виртуальные фоны; при плохой маске клиент может заподозрить обман.' : item.id === 'used-chair' ? 'Даёт комфорт, без прямого бонуса к переговорам.' : 'Улучшает атмосферу или качество звонка, но не гарантирует сделку.'}</p><span>{owned ? 'Уже установлено' : locked ? 'Требуется день ' + item.minDay + ' · уровень ' + (item.minLevel ?? 1) : cash < item.price ? 'Не хватает ' + (item.price - cash).toLocaleString('ru-RU') + ' ₽' : 'Можно приобрести сейчас'}</span></div>}</div><div className="shop-item-footer"><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={owned || locked || cash < item.price} className={owned ? 'secondary-action' : 'primary-action'} onClick={() => buyRoomItem(item.id)}>{owned ? 'Куплено' : locked ? 'День ' + item.minDay + ' · ур. ' + (item.minLevel ?? 1) : cash < item.price ? 'Не хватает' : 'Купить'}</button></div></article> })}</div></section>
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
                <div className="avatar">БР</div><div className="profile-career-copy"><strong>Младший брокер</strong><small>Уровень {careerLevel.level} · {xp} XP</small><span className="profile-xp-track"><i style={{ width: careerLevel.progress + '%' }} /></span></div><span className="online-indicator" />
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
                <div className="desktop-page desktop-rebuilt">
                  <div className="desktop-rebuilt-glow" />
                  <div className="desktop-rebuilt-topline"><div><span className="desktop-rebuilt-mark">▦</span><span><strong>ARENA OS</strong><small>Рабочая станция брокера</small></span></div><span className="desktop-rebuilt-session"><i /> ОФЛАЙН-СЕССИЯ · ДЕНЬ {day}</span></div>
                  <div className="desktop-rebuilt-workspace">
                    <div className="desktop-rebuilt-shortcuts">
                      <button onClick={() => openAppWindow('overview')}><span className="desktop-shortcut-icon shortcut-overview"><Activity size={21} /></span><strong>Обзор</strong><small>Сводка дня</small></button>
                      <button onClick={() => openAppWindow('market')}><span className="desktop-shortcut-icon shortcut-market"><TrendingUp size={21} /></span><strong>Биржа</strong><small>Котировки</small></button>
                      <button onClick={() => openAppWindow('news')}><span className="desktop-shortcut-icon shortcut-news"><Newspaper size={21} /></span><strong>Новости</strong><small>Рынок и компании</small></button>
                      <button onClick={() => openAppWindow('calls')}><span className="desktop-shortcut-icon shortcut-calls"><Video size={21} /></span><strong>Видеозвонки</strong><small>Связь с клиентами</small></button>
                      <button onClick={() => openAppWindow('clients')}><span className="desktop-shortcut-icon shortcut-clients"><Users size={21} /></span><strong>Клиенты</strong><small>CRM и лиды</small></button>
                      <button onClick={() => openAppWindow('shop')}><span className="desktop-shortcut-icon shortcut-shop"><ShoppingBag size={21} /></span><strong>Оборудование</strong><small>Магазин</small></button>
                      <button onClick={() => openAppWindow('housing')}><span className="desktop-shortcut-icon shortcut-housing"><House size={21} /></span><strong>Жильё</strong><small>Недвижимость</small></button>
                    </div>
                    <aside className="desktop-rebuilt-widgets">
                      <section className="desktop-os-widget desktop-os-clock"><span className="desktop-os-widget-label"><Clock3 size={13} /> СИСТЕМНОЕ ВРЕМЯ</span><strong>{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</strong><small>День {day} · {currentHousing.name}</small></section>
                      <section className="desktop-os-widget"><span className="desktop-os-widget-label"><TrendingUp size={13} /> РЫНОК СЕГОДНЯ</span><strong>{activeCompany.name}</strong><div className="desktop-os-market-line"><span>{activeCompany.ticker}</span><b>{getDisplayedPrice(activeCompany)}</b></div><small>Изменение {getDisplayedChange(activeCompany)} · риск {activeCompany.risk.toLowerCase()}</small><button onClick={() => openAppWindow('market')}>Открыть котировки <ArrowRight size={13} /></button></section>
                      <section className="desktop-os-widget"><span className="desktop-os-widget-label"><Wallet size={13} /> МОИ ФИНАНСЫ</span><strong>{cash.toLocaleString('ru-RU')} ₽</strong><div className="desktop-os-market-line"><span>Репутация</span><b>{reputation}/100</b></div><div className="desktop-os-progress"><span style={{width: reputation + '%'}} /></div><small>Капитал фирмы: {firmCapital.toLocaleString('ru-RU')} ₽</small></section>
                      <section className="desktop-os-widget desktop-os-mission-widget"><span className="desktop-os-widget-label"><Check size={13} /> ПЛАН СМЕНЫ</span><strong>{dailyQuotaCompany.ticker} · {Math.round(Math.min(100, dailySalesShares / dailyQuotaShares * 100))}%</strong><small>Продай {dailyQuotaShares} акций и сделай оборот {dailyQuotaAmount.toLocaleString('ru-RU')} ₽. Это влияет на премию и репутацию.</small><div className="desktop-os-progress"><span style={{width: Math.min(100, dailySalesShares / dailyQuotaShares * 100) + '%'}} /></div><button onClick={() => openAppWindow('market')}>Изучить цель <ArrowRight size={13} /></button><button onClick={() => openAppWindow('shop')}>Зачем улучшения? <ArrowRight size={13} /></button></section><section className="desktop-os-widget desktop-os-call-widget"><span className="desktop-os-widget-label"><Video size={13} /> ВХОДЯЩИЕ ЛИДЫ</span><strong>{availableClients.length} клиентов доступны</strong><small>{availableClients[0]?.name ?? 'Новых лидов пока нет'}</small><button onClick={() => openAppWindow('calls')}>Открыть видеозвонки <ArrowRight size={13} /></button></section>
                    </aside>
                  </div>
                  <div className="desktop-rebuilt-footer"><span><i /> Все приложения готовы</span><span>ARENA OS · BUILD 0.9</span><button onClick={endDay}>Завершить день <ArrowRight size={13} /></button></div>
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
                  <section className="shop-progression-panel"><div className="shop-progression-icon"><Sparkles size={19} /></div><div className="shop-progression-copy"><div><strong>Карьера · уровень {careerLevel.level}</strong><span>{careerLevel.currentXp} / {careerLevel.nextLevelAt} XP до следующего уровня</span></div><div className="shop-progression-track"><i style={{ width: careerLevel.progress + '%' }} /></div><small>Звонок: +25 XP · успешная сделка: ещё +35 XP · изучил рынок и новости перед звонком: +10 XP</small></div></section>
                  <div className="wardrobe-studio"><div className="wardrobe-character-stage"><span className="wardrobe-light" /><WardrobeAvatar3D outfit={selectedOutfit} /><span className="wardrobe-stage-label">3D-ПРЕДПРОСМОТР ОБРАЗА</span></div><div className="wardrobe-studio-copy"><span className="eyebrow">ГАРДЕРОБ · ПЕРСОНАЖ</span><h3>Твой брокерский образ</h3><p>Выбирай образ для переговоров: одежда меняется и в гардеробе, и в маленьком видеокадре во время звонка.</p><div className="wardrobe-look-tags"><span>{selectedOutfit === 'premium' ? 'Премиальный костюм' : selectedOutfit === 'classic' ? 'Деловой пиджак' : 'Базовая футболка'}</span><span>{selectedOutfit === 'intern' ? 'Тёмные брюки' : 'Деловой силуэт'}</span><span>{selectedOutfit === 'premium' ? 'Золотые детали' : selectedOutfit === 'classic' ? 'Строгий стиль' : 'Повседневный стиль'}</span></div></div></div>
                  <section className="outfit-selector"><div className="outfit-selector-heading"><div><span className="eyebrow">ГАРДЕРОБ</span><h3>Одежда персонажа</h3></div><span>На тебе: {OUTFITS.find((outfit) => outfit.id === selectedOutfit)?.name}</span></div><div className="outfit-grid">{OUTFITS.map((outfit) => { const owned = ownedOutfits.includes(outfit.id); const wearing = selectedOutfit === outfit.id; const canAfford = cash >= outfit.price; return <article className={'outfit-card outfit-' + outfit.id + (wearing ? ' wearing' : '') + (outfitDetailsId === outfit.id ? ' details-open' : '')} key={outfit.id}><button className="outfit-preview-button" aria-label={'Примерить образ «' + outfit.name + '»'} onClick={() => { setSelectedOutfit(outfit.id); setOutfitDetailsId(outfit.id); playSound('ui') }}><div className="outfit-swatch"><OutfitIllustration id={outfit.id} /></div><span className="outfit-preview-caption">{wearing ? 'Сейчас надет' : 'Нажми для примерки'}</span></button><div className="outfit-card-copy"><strong>{outfit.name}</strong><p>{outfit.description}</p><small>{outfit.price === 0 ? 'Стартовый комплект' : outfit.price.toLocaleString('ru-RU') + ' ₽'}</small></div><div className="outfit-card-actions"><button className="outfit-details-button" onClick={() => setOutfitDetailsId(outfitDetailsId === outfit.id ? null : outfit.id)}>{outfitDetailsId === outfit.id ? 'Скрыть детали' : 'Подробнее'}</button><button disabled={wearing || (!owned && !canAfford)} onClick={() => { if (owned) { setSelectedOutfit(outfit.id); playSound('ui'); return } setCash((value) => value - outfit.price); setOwnedOutfits((value) => [...value, outfit.id]); setSelectedOutfit(outfit.id); setOutfitDetailsId(outfit.id); playSound('deal'); setToast('Новый образ добавлен в гардероб') }}>{wearing ? 'На тебе' : owned ? 'Надеть' : canAfford ? 'Купить' : 'Не хватает денег'}</button></div>{outfitDetailsId === outfit.id && <div className="outfit-detail-panel"><strong>Что даёт этот образ</strong><p>{outfit.id === 'intern' ? 'Бесплатный стартовый комплект. Не даёт бонуса к первому впечатлению, зато сохраняет деньги на важные покупки.' : outfit.id === 'classic' ? 'Деловой стиль для более убедительного образа на встречах. Это косметическое улучшение: знания компании и честность в ответах важнее одежды.' : 'Премиальный внешний вид для ролевого прогресса. Дороже остальных, но не гарантирует сделку и не заменяет подготовку.'}</p><span>{owned ? 'Уже куплено' : canAfford ? 'Можно купить сейчас' : 'Сначала накопи нужную сумму'}</span></div>}</article> })}</div></section>
                  <div className="shop-grid">{ROOM_ITEMS.map((item) => { const owned = ownedItems.includes(item.id); const locked = day < item.minDay; const detailsOpen = roomItemDetailsId === item.id; return <article className={(owned ? 'shop-item owned' : 'shop-item') + (detailsOpen ? ' details-open' : '')} key={item.id}><div className="shop-item-icon-wrap"><RoomItemIllustration id={item.id} /><span>{item.category === 'video' ? 'ЗВУК / КАМЕРА' : item.category === 'background' ? 'ОБСТАНОВКА' : item.category === 'work' ? 'ПРОИЗВОДИТЕЛЬНОСТЬ' : 'КОМФОРТ'}</span></div><div className="shop-item-meta"><span className="eyebrow">{item.category === 'video' ? 'ВИДЕОСВЯЗЬ' : item.category === 'background' ? 'ФОН' : item.category === 'work' ? 'РАБОТА' : 'КОМФОРТ'}</span><strong>{item.name}</strong><p>{item.description}</p><button className="shop-item-details-toggle" onClick={() => setRoomItemDetailsId(detailsOpen ? null : item.id)}>{detailsOpen ? 'Скрыть подробности' : 'Что даёт предмет?'}</button>{detailsOpen && <div className="shop-item-detail-panel"><strong>Эффект в игре</strong><p>{item.videoQuality > 0 ? 'Качество видеосвязи +' + item.videoQuality + '/8. ' : ''}{item.firstImpression > 0 ? 'Первое впечатление +' + item.firstImpression + '. ' : ''}{item.id === 'second-monitor' ? 'Помогает сравнивать данные, но не добавляет доверие автоматически.' : item.id === 'chromakey-kit' ? 'Открывает виртуальные фоны; при плохом качестве маски клиент может заподозрить обман.' : item.id === 'used-chair' ? 'Даёт комфорт для рабочего дня, без прямого бонуса к переговорам.' : item.id === 'desk-lamp' ? 'Небольшой бонус к первому впечатлению и качеству видео.' : 'Улучшает рабочую атмосферу или качество звонка, но не гарантирует сделку.'}</p><span>{owned ? 'Уже установлено' : locked ? 'Доступно с ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает ' + (item.price - cash).toLocaleString('ru-RU') + ' ₽' : 'Можно приобрести сейчас'}</span></div>}</div><div className="shop-item-footer"><strong>{item.price.toLocaleString('ru-RU')} ₽</strong><button disabled={owned || locked || cash < item.price} className={owned ? 'secondary-action' : 'primary-action'} onClick={() => buyRoomItem(item.id)}>{owned ? 'Куплено' : locked ? 'С ' + item.minDay + '-го дня' : cash < item.price ? 'Не хватает' : 'Купить'}</button></div></article> })}</div>
                  <div className="bottom-note"><Sparkles size={16} /><span>Каждая покупка имеет игровую функцию: свет, камера и микрофон повышают качество видеосвязи; фон и жильё влияют на первое впечатление; второй монитор помогает изучать данные. Оборудование даёт стартовое преимущество, но доверие всё равно нужно заработать в разговоре.</span></div>
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
                    <DailyMissionPanel company={dailyQuotaCompany} day={day} quotaShares={dailyQuotaShares} quotaAmount={dailyQuotaAmount} soldShares={dailySalesShares} soldAmount={dailySalesAmount} onOpenResearch={() => { setSelectedCompany(dailyQuotaCompany.ticker); setTab('market') }} />
                    <div className="call-planning-section"><div className="call-planning-heading"><span className="eyebrow">ШАГ 1 · ВЫБЕРИ КЛИЕНТА</span><strong>Кому сегодня предложим инвестицию?</strong><small>В первый день доступны два клиента. Новые лиды открываются с ростом репутации и прогрессом карьеры.</small></div><div className="call-client-picker">{CLIENTS.map((client) => { const unlocked = availableClients.some((candidate) => candidate.id === client.id); return <button key={client.id} disabled={!unlocked} className={'call-client-option' + (selectedClientId === client.id ? ' selected' : '') + (!unlocked ? ' locked' : '')} onClick={() => setSelectedClientId(client.id)}><span className="call-client-avatar">{unlocked ? client.initials : '🔒'}</span><span className="call-client-option-copy"><strong>{client.name}</strong><small>{unlocked ? client.profession + ' · уровень ' + client.tier : 'Пока недоступен'}</small><em>{unlocked ? 'Капитал до ' + client.budget.toLocaleString('ru-RU') + ' ₽' : 'Развивай карьеру'}</em></span></button>})}</div><div className="call-planning-heading stock-planning-heading"><span className="eyebrow">ШАГ 2 · ПОРУЧЕНИЕ ДНЯ</span><strong>Сегодня продаём {dailyQuotaCompany.name} ({dailyQuotaCompany.ticker})</strong><small>Акцию назначил руководитель. Твоя задача — разобраться в бизнесе, подобрать аргументы для клиента и честно ответить на вопросы о слабых местах.</small></div><div className="mission-stock-brief"><div className="mission-stock-top"><span className={'company-logo ' + dailyQuotaCompany.ticker.toLowerCase()}>{dailyQuotaCompany.ticker.slice(0, 2)}</span><div><strong>{dailyQuotaCompany.name}</strong><small>{dailyQuotaCompany.sector} · цена {getDisplayedPrice(dailyQuotaCompany)}</small></div><em className={dailyQuotaCompany.positive ? 'positive' : 'negative'}>{getDisplayedChange(dailyQuotaCompany)}</em></div><p>{dailyQuotaCompany.description}</p><div className="mission-stock-columns"><section><small>ЧТО МОЖНО ПРОДАТЬ</small><p>{dailyQuotaCompany.advantages}</p></section><section><small>ЧТО КЛИЕНТ МОЖЕТ ОСПОРИТЬ</small><p>{dailyQuotaCompany.risks}</p></section></div><div className="mission-stock-actions"><span>План: {dailyQuotaShares} акций · оборот {dailyQuotaAmount.toLocaleString('ru-RU')} ₽</span><button className="secondary-action" onClick={() => { setSelectedCompany(dailyQuotaCompany.ticker); setTab('market') }}>Изучить отчёт <ChevronRight size={14} /></button></div></div></div><div className="briefing-copy"><span className="eyebrow">ЗАЧЕМ НУЖЕН ЗВОНОК</span><strong>Ты не продаёшь акцию вслепую — ты помогаешь принять решение</strong><p>У {activeClient.name} есть собственные цели и отношение к риску. Назначенная акция — часть задания: объясни, кому она может подойти, что может пойти не так и когда разумнее отказаться от сделки.</p><div className="call-goal-list"><span>1. Разобраться в бизнесе</span><span>2. Проверить свежие новости</span><span>3. Обсудить риски с клиентом</span></div><small>Подготовка к рынку и новостям добавляет +4 к начальному доверию за каждый изученный раздел.</small></div>
                    <div className="briefing-actions">
                      <button className={marketReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('market')}><TrendingUp size={15} /><span><strong>Отчёт компании</strong><small>{marketReviewed ? 'Изучено · +4 доверия' : 'Финансы и риски'}</small></span><span className="briefing-check">{marketReviewed ? '✓' : '↗'}</span></button>
                      <button className={newsReviewed ? 'briefing-action complete' : 'briefing-action'} onClick={() => setTab('news')}><Newspaper size={15} /><span><strong>Новости рынка</strong><small>{newsReviewed ? 'Изучено · +4 доверия' : 'Катализаторы и угрозы'}</small></span><span className="briefing-check">{newsReviewed ? '✓' : '↗'}</span></button>
                    </div>
                    <div className="briefing-total"><span>Бонус подготовки</span><strong>+{(marketReviewed ? 4 : 0) + (newsReviewed ? 4 : 0)} доверия</strong></div>
                  </div>}
                  {callStatus === 'idle' && <div className="background-selector"><div className="background-selector-copy"><span className="eyebrow">ТВОЙ ОБРАЗ В КАДРЕ</span><p>Фон влияет на первое впечатление. Виртуальный офис может насторожить опытного клиента, если качество маски слабое.</p></div><div className="background-options"><button className={videoBackground === 'real' ? 'selected' : ''} onClick={() => setVideoBackground('real')}>Реальная комната</button><button disabled={!ownedItems.includes('neutral-backdrop') && !ownedItems.includes('chromakey-kit')} className={videoBackground === 'neutral' ? 'selected' : ''} onClick={() => setVideoBackground('neutral')}>Нейтральный фон</button><button disabled={!ownedItems.includes('chromakey-kit')} className={videoBackground === 'luxury' ? 'selected' : ''} onClick={() => setVideoBackground('luxury')}>Премиум-офис</button></div><small>{videoBackground === 'luxury' ? 'Виртуальный офис: бонус статуса, но опытный клиент может заметить подмену.' : videoBackground === 'neutral' ? 'Нейтральный фон: небольшой бонус без притворства, что это реальное жильё.' : 'Показываешь свою комнату без дополнительных эффектов.'}</small></div>}
                  {callStatus === 'idle' && availableClients.length > 0 && callsToday < (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) && <div className="incoming-call"><div className="incoming-visual"><div className="client-avatar"><span>{activeClient.initials}</span><i /></div><div className="incoming-wave"><span /><span /><span /><span /><span /><span /><span /></div></div><div className="incoming-copy"><span className="eyebrow">{activeClient.source.toUpperCase()} · УРОВЕНЬ {activeClient.tier}</span><h3>{activeClient.name}</h3><p>{activeClient.age} лет · {activeClient.profession}</p><div className="client-tags"><span><ShieldAlert size={13} /> {activeClient.temperament}</span><span><CircleDollarSign size={13} /> Капитал {activeClient.budget.toLocaleString('ru-RU')} ₽</span><span><Activity size={13} /> Опыт: {activeClient.experience.toLowerCase()}</span></div><blockquote>{activeClient.quote}</blockquote><button className="primary-action" onClick={() => startCall()}><Video size={16} /> Принять звонок и начать разговор <ChevronRight size={16} /></button></div></div>}
                  {callStatus === 'idle' && (availableClients.length === 0 || callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2)) && <div className="no-leads-card"><Users size={25} /><h3>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'На сегодня звонки закончились' : 'Свободных клиентов пока нет'}</h3><p>{callsToday >= (reputation >= 60 ? 4 : reputation >= 35 ? 3 : 2) ? 'Лимит на сегодня: ' + callsToday + ' звонка. Заверши день, чтобы восстановить рабочее время.' : 'Дождись повторного контакта или развивай репутацию, чтобы открыть новые предложения.'}</p><button className="primary-action" onClick={endDay}>Завершить день <ChevronRight size={15} /></button></div>}
                  {callStatus === 'active' && activeQuestion && <><div className="call-purpose-strip"><div><span className="eyebrow">С КЕМ ТЫ ГОВОРИШЬ</span><strong>{activeClient.name} · {activeClient.profession}</strong><p>Клиент хочет понять, подходит ли ему акция «{activeCompany.name}». Твоя задача — объяснить выгоду, назвать риски и не обещать гарантированную прибыль.</p></div><div><span className="eyebrow">ТВОЯ БУМАГА</span><strong>{activeCompany.ticker} · риск {activeCompany.risk.toLowerCase()}</strong><p>{activeCompany.description}</p></div></div><div className="call-workspace immersive-call-workspace"><div className="client-panel"><div className="client-panel-top"><div className="client-avatar large"><span>{activeClient.initials}</span><i /></div><div><span className="eyebrow">КЛИЕНТ · ВИДЕОСВЯЗЬ</span><h3>{activeClient.name}</h3><p>{activeClient.temperament} инвестор · {activeClient.age} лет</p></div><button className="hangup" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}><Phone size={16} /></button></div><div className="client-video-stage"><div className="client-video-feed"><ClientPortrait3D tier={activeClient.tier} mood={trust >= 70 ? 'interested' : trust >= 45 ? 'neutral' : 'skeptical'} /><span className="video-nameplate">{activeClient.name}</span><span className="video-live-indicator"><i /> СВЯЗЬ СТАБИЛЬНА</span></div><div className="self-video-column"><SelfCameraPreview enabled={videoEnabled} background={videoBackground} outfit={selectedOutfit} /></div><div className="video-side-info"><span className="eyebrow">ВИДЕОЗВОНОК</span><strong>{videoEnabled ? 'Камера включена' : 'Только аудио'}</strong><small>Качество оборудования: {getVideoQuality(ownedItems)}/8</small><button className="video-toggle" onClick={toggleVideo}><Video size={14} /> {videoEnabled ? 'Отключить видео' : 'Включить видео'}</button></div></div><div className="client-meters"><div className="meter-label"><span>Доверие</span><strong>{trust}% <small>{trustLabel}</small></strong></div><div className="trust-track"><span style={{ width: trust + '%' }} /></div><div className="meter-label"><span>Терпение</span><strong>{patience}%</strong></div><div className="patience-track"><span style={{ width: patience + '%' }} /></div></div><div className="call-stock-offer"><span>ТВОЁ ПРЕДЛОЖЕНИЕ</span><strong>{activeCompany.name}</strong><small>{activeCompany.sector} · {getDisplayedPrice(activeCompany)} · изменение {getDisplayedChange(activeCompany)} · риск {activeCompany.risk.toLowerCase()}</small><p>{activeCompany.description}</p><div className="call-stock-offer-columns"><span><b>Плюс:</b> {activeCompany.advantages}</span><span><b>Риск:</b> {activeCompany.risks}</span></div></div><div className="client-goal"><small>ЦЕЛЬ КЛИЕНТА</small><strong>{activeClient.goal}</strong><p>{activeClient.temperament}. {activeClient.experience}. Подбирай аргументы под его задачу.</p></div><div className="conversation-log">{conversation.slice(-2).map((entry, i) => <div key={i} className={'log-line ' + entry.from}><span>{entry.from === 'you' ? 'ТЫ' : entry.from === 'system' ? 'СИСТЕМА' : activeClient.name.toUpperCase()}</span><p>{entry.text}</p></div>)}</div></div><div className="answer-panel"><div className="answer-heading"><span className="eyebrow">{NEGOTIATION_STAGES[Math.min(questionIndex, NEGOTIATION_STAGES.length - 1)]} · ВОПРОС {questionIndex + 1} ИЗ {activeQuestions.length}</span><div className="answer-controls"><span className="answer-shortcut-hint">1–4 / A–D · быстрый ответ</span><div className={'timer-pill ' + (timeLeft <= 4 ? 'urgent' : '')}><Clock3 size={15} /><strong>{Math.ceil(timeLeft)}с</strong></div></div></div><h3>{activeQuestion.title}</h3><p className="question-hint"><Sparkles size={14} /> {activeQuestion.hint}</p><div className="answer-options">{displayedChoices.map((choice, i) => <button className="answer-option" key={choice.label} onClick={() => answerQuestion(choice.label, choice.delta)}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{choice.label}</span><ChevronRight size={16} /></button>)}</div><div className="free-answer"><label htmlFor="free-answer">СВОЙ ОТВЕТ</label><textarea id="free-answer" placeholder="Напиши, что ответил бы клиенту… (например: «Гарантий нет, давайте сначала разберём риски») " value={freeAnswer} onChange={(event) => setFreeAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendFreeAnswer() } }} /><div className="free-answer-footer"><span>Enter — отправить · Shift + Enter — новая строка</span><button disabled={!freeAnswer.trim()} onClick={sendFreeAnswer}>Ответить <ArrowUpRight size={14} /></button></div></div><div className="timer-warning"><Clock3 size={14} /> Чем дольше думаешь, тем быстрее падает терпение. После таймера клиент может уйти.</div></div></div></>}
                  {(callStatus === 'won' || callStatus === 'lost') && <div className="call-result"><div className={callStatus === 'won' ? 'result-icon success' : 'result-icon failure'}>{callStatus === 'won' ? <Check size={28} /> : <X size={28} />}</div><div className="result-client-reaction"><ClientPortrait3D tier={activeClient.tier} mood={callStatus === 'won' ? 'happy' : 'angry'} /></div><span className="eyebrow">ИТОГ ПЕРЕГОВОРОВ</span><h3>{callStatus === 'won' ? 'Сделка закрыта.' : 'Переговоры не завершились сделкой.'}</h3><p>{lastResult}</p><div className="result-stats"><div><small>ДОВЕРИЕ</small><strong>{trust}/100</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div><div><small>ЗАКРЫТО СДЕЛОК</small><strong>{deals}</strong></div></div><div className="result-actions"><button className="secondary-action" onClick={() => setCallStatus('idle')}>Вернуться к клиентам</button><button className="primary-action" onClick={() => { setCallStatus('idle'); setTab('overview') }}>К обзору дня <ChevronRight size={16} /></button></div></div>}
                </div>
              )}
            </section>
            <aside className="terminal-right-rail">
              <div className="rail-title"><span>РАБОЧИЙ СТОЛ</span><button aria-label="Уведомления"><Bell size={15} /></button></div>
              <div className="rail-widget time-widget"><span className="rail-icon"><Clock3 size={16} /></span><small>ВРЕМЯ</small><strong>{String(Math.floor(gameMinutes / 60)).padStart(2, '0')}:{String(gameMinutes % 60).padStart(2, '0')}</strong><em>День {day} · рабочая смена</em></div>
              <div className="rail-widget"><div className="rail-widget-heading"><span className="rail-icon gold"><Zap size={16} /></span><span><small>ОБЯЗАТЕЛЬНОЕ ПОРУЧЕНИЕ</small><strong>{dailyQuotaCompany.ticker} · план смены</strong></span></div><div className="task-progress"><span style={{ width: Math.min(100, Math.min(dailySalesShares / dailyQuotaShares, dailySalesAmount / Math.max(1, dailyQuotaAmount)) * 100) + '%' }} /></div><div className="rail-caption">{dailySalesShares >= dailyQuotaShares && dailySalesAmount >= dailyQuotaAmount ? 'План выполнен — премия заработана.' : 'Продай ' + dailyQuotaShares + ' акций и набери оборот ' + dailyQuotaAmount.toLocaleString('ru-RU') + ' ₽.'}</div></div>
              <div className="rail-widget mini-news"><div className="rail-widget-heading"><span className="rail-icon green"><Newspaper size={16} /></span><span><small>ВАЖНОЕ</small><strong>Новости рынка</strong></span></div><p>«Котолёт» ведёт переговоры о крупном контракте.</p><button onClick={() => setTab('news')}>Читать ленту <ChevronRight size={13} /></button></div>
              <div className="rail-widget contact-widget"><div className="rail-widget-heading"><span className="rail-icon blue"><MessageCircle size={16} /></span><span><small>НАСТАВНИК</small><strong>Виктор Петрович</strong></span></div><p>«Не продавай то, чего сам не понимаешь. Особенно если оно летает на батарейках».</p></div>
              <div className="rail-footer"><span><span className="live-dot" /> Все системы работают</span><small>BUILD 0.8.0 · DEMO</small></div>
            </aside>
          </div>
          {appWindows.length > 0 && <div className="os-multi-window-layer" aria-label="Открытые приложения">
            {appWindows.map((win, index) => {
              const title = win.app === 'overview' ? 'Обзор дня' : win.app === 'market' ? 'Биржевой терминал' : win.app === 'news' ? 'Лента новостей' : win.app === 'calls' ? 'Видеозвонки' : win.app === 'clients' ? 'База клиентов' : win.app === 'shop' ? 'Магазин комнаты' : 'Недвижимость'
              const icon = win.app === 'overview' ? <Activity size={15} /> : win.app === 'market' ? <TrendingUp size={15} /> : win.app === 'news' ? <Newspaper size={15} /> : win.app === 'calls' ? <Video size={15} /> : win.app === 'clients' ? <Users size={15} /> : win.app === 'shop' ? <ShoppingBag size={15} /> : <House size={15} />
              return <section key={win.id} className={'os-floating-window' + (win.maximized ? ' maximized' : '') + (win.minimized ? ' minimized' : '')} style={{ left: win.maximized ? 8 : win.x, top: win.maximized ? 8 : win.y, width: win.maximized ? undefined : win.width, height: win.maximized ? undefined : win.height, zIndex: 100 + index }} onPointerMove={(event) => { const resize = appWindowResizeRef.current; if (resize && resize.id === win.id && !win.maximized && !win.minimized) { const maxWidth = Math.max(180, window.innerWidth - Math.max(0, win.x) - 16); const maxHeight = Math.max(160, window.innerHeight - Math.max(0, win.y) - 80); const minWidth = Math.min(260, maxWidth); const minHeight = Math.min(180, maxHeight); const width = Math.max(minWidth, Math.min(maxWidth, resize.width + event.clientX - resize.x)); const height = Math.max(minHeight, Math.min(maxHeight, resize.height + event.clientY - resize.y)); event.currentTarget.style.width = width + "px"; event.currentTarget.style.height = height + "px"; return } const drag = appWindowDragRef.current; if (!drag || drag.id !== win.id || win.maximized) return; const left = Math.max(0, Math.min(window.innerWidth - Math.min(win.width, window.innerWidth - 16) - 8, drag.originX + event.clientX - drag.x)); const top = Math.max(0, Math.min(window.innerHeight - Math.min(win.height, window.innerHeight - 80) - 48, drag.originY + event.clientY - drag.y)); event.currentTarget.style.left = left + "px"; event.currentTarget.style.top = top + "px" }} onPointerUp={(event) => { const resize = appWindowResizeRef.current; if (resize && resize.id === win.id) { const maxWidth = Math.max(180, window.innerWidth - Math.max(0, win.x) - 16); const maxHeight = Math.max(160, window.innerHeight - Math.max(0, win.y) - 80); const minWidth = Math.min(260, maxWidth); const minHeight = Math.min(180, maxHeight); const width = Math.max(minWidth, Math.min(maxWidth, resize.width + event.clientX - resize.x)); const height = Math.max(minHeight, Math.min(maxHeight, resize.height + event.clientY - resize.y)); setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, width, height } : item)) } const drag = appWindowDragRef.current; if (drag && drag.id === win.id && !win.maximized) { const x = Math.max(0, Math.min(window.innerWidth - Math.min(win.width, window.innerWidth - 16) - 8, drag.originX + event.clientX - drag.x)); const y = Math.max(0, Math.min(window.innerHeight - Math.min(win.height, window.innerHeight - 80) - 48, drag.originY + event.clientY - drag.y)); setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, x, y } : item)) } appWindowDragRef.current = null; appWindowResizeRef.current = null }}>
                <header className="os-floating-titlebar" onPointerDown={(event) => { if ((event.target as HTMLElement).closest('button')) return; appWindowDragRef.current = { id: win.id, x: event.clientX, y: event.clientY, originX: win.x, originY: win.y }; event.currentTarget.setPointerCapture(event.pointerId); setAppWindows((items) => [...items.filter((item) => item.id !== win.id), win]) }}>
                  <span>{icon}{title}</span><div className="os-floating-controls"><button aria-label="Свернуть окно" onClick={() => setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, minimized: true } : item))}>−</button><button aria-label="Развернуть окно" onClick={() => setAppWindows((items) => items.map((item) => item.id === win.id ? { ...item, maximized: !item.maximized, minimized: false } : item))}>□</button><button aria-label="Закрыть окно" onClick={() => setAppWindows((items) => items.filter((item) => item.id !== win.id))}>×</button></div>
                </header>
                {!win.minimized && <div className="os-floating-content">
                  {win.app === 'overview' && <><span className="os-floating-eyebrow">СИСТЕМА · ДЕНЬ {day}</span><h3>{gameMinutes < 12 * 60 ? 'Доброе утро' : gameMinutes < 18 * 60 ? 'Хорошего дня' : 'Добрый вечер'}</h3><div className="os-floating-stat-grid"><div><small>ЛИЧНЫЕ ДЕНЬГИ</small><strong>{cash.toLocaleString('ru-RU')} ₽</strong></div><div><small>РЕПУТАЦИЯ</small><strong>{reputation}/100</strong></div></div><button className="os-floating-primary" onClick={() => { setTab('overview'); setWindowMinimized(false) }}>Открыть полный обзор</button></>}
                  {win.app === 'market' && <><span className="os-floating-eyebrow">КОТИРОВКИ · РЫНОК</span><h3>Биржевой терминал</h3><div className="os-market-list" aria-label="Все акции"><div className="os-market-list-heading"><span>КОМПАНИЯ / ТИКЕР</span><span>ЦЕНА / ДЕНЬ</span></div>{companies.map((company) => <button key={company.ticker} className={'os-market-row' + (selectedCompany === company.ticker ? ' selected' : '')} onClick={() => setSelectedCompany(company.ticker)}><span><strong>{company.name}</strong><small>{company.ticker} · {company.sector}</small></span><span className="os-market-price"><strong>{getDisplayedPrice(company)}</strong><small className={getDisplayedChange(company).startsWith('-') || getDisplayedChange(company).startsWith('−') ? 'negative' : 'positive'}>{getDisplayedChange(company)}</small></span></button>)}</div><div className="os-market-detail"><span className="os-floating-eyebrow">ВЫБРАННАЯ КОМПАНИЯ</span><h4>{activeCompany.name}</h4><p>{activeCompany.description}</p><div className="os-market-detail-stats"><span><small>КАПИТАЛИЗАЦИЯ</small><strong>{activeCompany.cap}</strong></span><span><small>РИСК</small><strong>{activeCompany.risk}</strong></span></div><button className="os-floating-primary" onClick={() => setTab('market')}>Открыть полный терминал</button></div></>}
                  {win.app === 'news' && <><span className="os-floating-eyebrow">ИНФОРМАЦИОННАЯ ЛЕНТА</span><h3>Новости рынка</h3><p>«Котолёт» ведёт переговоры о крупном контракте. Новость может повлиять на ожидания клиентов.</p><p>Перед сделкой сравни новость с отчётом компании и оцени риск.</p><button className="os-floating-primary" onClick={() => setTab('news')}>Открыть все новости</button></>}
                  {win.app === 'calls' && <div className="negotiation-app">
                    <div className="negotiation-heading">
                      <div><span className="os-floating-eyebrow">ARENA CONNECT · ПЕРЕГОВОРЫ</span><h3>{callStatus === 'active' ? 'Переговоры в эфире' : callStatus === 'won' || callStatus === 'lost' ? 'Итог переговоров' : 'Новый видеозвонок'}</h3></div>
                      <span className={'negotiation-status ' + callStatus}>{callStatus === 'active' ? '● В ЭФИРЕ' : callStatus === 'won' ? '● СДЕЛКА ЗАКРЫТА' : callStatus === 'lost' ? '● ЗАВЕРШЁН' : '● ГОТОВ К СТАРТУ'}</span>
                    </div>
                    {callStatus === 'idle' && <div className="negotiation-setup">
                      <section className="negotiation-setup-card">
                        <span className="negotiation-section-label">01 / ЧТО ПРОДАЁМ</span>
                        <label className="negotiation-field-label">Поручение руководителя · акцию менять нельзя</label>
                        <div className="negotiation-product-card"><div className="negotiation-product-top"><span>{dailyQuotaCompany.ticker}</span><span className={dailyQuotaCompany.positive ? 'positive' : 'negative'}>{getDisplayedChange(dailyQuotaCompany)}</span></div><strong>{dailyQuotaCompany.name}</strong><p>{dailyQuotaCompany.description}</p><div className="negotiation-product-metrics"><span><small>ТЕКУЩАЯ ЦЕНА</small><b>{getDisplayedPrice(dailyQuotaCompany)}</b></span><span><small>РИСК</small><b>{dailyQuotaCompany.risk}</b></span></div><div className="mission-stock-columns"><section><small>ПЛЮСЫ</small><p>{dailyQuotaCompany.advantages}</p></section><section><small>МИНУСЫ</small><p>{dailyQuotaCompany.risks}</p></section></div></div>
                        <div className="negotiation-brief"><strong>Твоя задача</strong><p>Объяснить идею честно, раскрыть риски и помочь клиенту решить, подходит ли ему продукт. Не обещай гарантированную доходность.</p></div>
                      </section>
                      <section className="negotiation-setup-card">
                        <span className="negotiation-section-label">02 / С КЕМ ГОВОРИМ</span>
                        <div className="os-call-client-picker">{availableClients.map((client) => <button key={client.id} className={'os-call-client-option' + (selectedClientId === client.id ? ' selected' : '')} onClick={() => setSelectedClientId(client.id)}><span><strong>{client.name}</strong><small>{client.profession} · {client.experience}</small></span><span>{client.tier + 1} ур. ›</span></button>)}</div>
                        <div className="negotiation-daily-goal"><span className="negotiation-section-label">ТВОЯ ЦЕЛЬ НА СЕГОДНЯ · ДЕНЬ {day}</span><strong>{dailyQuotaCompany.name} ({dailyQuotaCompany.ticker})</strong><p>Продай {dailyQuotaShares} акций и набери оборот {dailyQuotaAmount.toLocaleString('ru-RU')} ₽. Только сделки по этой компании засчитываются в обязательный план.</p><div className="negotiation-quota-track"><span style={{width: Math.min(100, dailySalesShares / dailyQuotaShares * 100) + '%'}} /></div><small>Акции: {dailySalesShares}/{dailyQuotaShares} · Оборот: {dailySalesAmount.toLocaleString('ru-RU')} / {dailyQuotaAmount.toLocaleString('ru-RU')} ₽</small><p className="negotiation-spend-hint">Зачем деньги: покупай улучшения комнаты и оборудование только когда они помогают переговорам. Свет, камера, гарнитура и фон повышают впечатление и качество звонка; жильё даёт комфорт, но увеличивает ежедневные расходы.</p></div><div className="negotiation-client-goal"><small>ЦЕЛЬ КЛИЕНТА</small><strong>{activeClient.goal}</strong><p>Бюджет: {activeClient.budget.toLocaleString('ru-RU')} ₽ · Ориентир сделки: {activeClient.ticket.toLocaleString('ru-RU')} ₽</p></div>
                        <button className="os-floating-primary negotiation-start" onClick={() => startCall(true)}><Video size={16}/> Начать видеозвонок <ArrowRight size={15}/></button>
                        <small className="negotiation-footnote">Звонков сегодня: {callsToday} · доступно лидов: {availableClients.length}</small>
                      </section>
                    </div>}
                    {callStatus === 'active' && <div className="negotiation-live">
                      <div className="negotiation-call-column">
                        <div className="negotiation-video-grid">
                          <div className="negotiation-video-tile client-tile"><div className="negotiation-video-label"><span>СОБЕСЕДНИК</span><span>● LIVE</span></div><div className="negotiation-client-video"><ClientPortrait3D tier={activeClient.tier} mood={trust >= 70 ? 'interested' : trust >= 45 ? 'neutral' : 'skeptical'}/></div><div className="negotiation-video-caption"><strong>{activeClient.name}</strong><small>{activeClient.profession}</small></div></div>
                          <div className="negotiation-video-tile self-tile"><div className="negotiation-video-label"><span>ВАШ КАДР</span><span>● ЛОКАЛЬНО</span></div><div className="negotiation-self-video"><ClientPortrait3D tier={0} variant="player" outfit={selectedOutfit}/><span>ВЫ</span></div><div className="negotiation-video-caption"><strong>Ваш брокер</strong><small>Камера персонажа</small></div></div>
                        </div>
                        <div className="negotiation-conversation-log" aria-label="Последние реплики переговоров">
                           {conversation.slice(-3).map((entry, index) => <div key={conversation.length - 3 + index} className={'negotiation-dialogue-line ' + entry.from}><span>{entry.from === 'you' ? 'ВЫ' : entry.from === 'system' ? 'ЗАМЕТКА' : activeClient.name.toUpperCase()}</span><p>{entry.text}</p></div>)}
                         </div>
                         <div className="negotiation-current-question"><div><span className="negotiation-section-label">ВОПРОС КЛИЕНТА · ЭТАП {Math.min(questionIndex + 1, activeQuestions.length)} ИЗ {activeQuestions.length}</span><strong>{activeQuestion?.title ?? 'Обсудите условия сделки'}</strong><p className="negotiation-tactic">{activeQuestion?.hint ?? 'Уточни потребности, проверь риски и не обещай гарантированную доходность.'}</p></div><span className={'negotiation-timer ' + (timeLeft <= 15 ? 'urgent' : timeLeft <= 30 ? 'warning' : '')} style={{ '--timer-progress': (Math.max(0, Math.min(75, timeLeft)) / 75 * 100) + '%' } as React.CSSProperties}><span className="negotiation-timer-value">{Math.ceil(timeLeft)}</span><small>СЕК</small></span></div>
                        <div className="negotiation-answers"><div className="negotiation-answer-heading"><strong>Как ответить?</strong><small>Выбери вариант · клавиши 1–3</small></div>{displayedChoices.map((choice, choiceIndex) => <button key={choiceIndex} className="negotiation-answer" onClick={() => answerQuestion(choice.label, choice.delta)}><kbd>{choiceIndex + 1}</kbd><span>{choice.label}</span></button>)}</div>
                        <div className="negotiation-call-controls"><span><i className="negotiation-live-dot"/> Соединение стабильно</span><button className="os-call-end" onClick={() => { setCallStatus('lost'); setLastResult('Ты завершил звонок. Клиент не успел принять решение.') }}><Phone size={14}/> Завершить звонок</button></div>
                      </div>
                      <aside className="negotiation-goals">
                        <div className="negotiation-goal-card"><span className="negotiation-section-label">ЦЕЛЬ ПЕРЕГОВОРОВ</span><strong>{activeCompany.name}</strong><small>{activeCompany.ticker} · {activeCompany.sector}</small><div className="negotiation-goal-price">{getDisplayedPrice(activeCompany)} <span className={activeCompany.positive ? 'positive' : 'negative'}>{getDisplayedChange(activeCompany)}</span></div><p>{activeCompany.description}</p></div>
                        <div className="negotiation-earnings-card"><span className="negotiation-section-label">ЭКОНОМИКА ЗВОНКА</span><div className="negotiation-earnings-main"><small>ВОЗМОЖНЫЙ БОНУС ТЕБЕ</small><strong>+{projectedDeal.playerBonus.toLocaleString('ru-RU')} ₽</strong></div><div className="negotiation-earnings-row"><span>Сумма сделки</span><b>{projectedDeal.ticket.toLocaleString('ru-RU')} ₽</b></div><div className="negotiation-earnings-row"><span>Комиссия фирмы</span><b>{projectedDeal.firmRevenue.toLocaleString('ru-RU')} ₽</b></div><p>Бонус начисляется только после успешной сделки. Зарплата и премия за план смены считаются отдельно.</p></div><div className="negotiation-live-quota"><span className="negotiation-section-label">ПЛАН СМЕНЫ · {dailyQuotaCompany.ticker}</span><div className="negotiation-live-quota-row"><span>Продано акций</span><b>{dailySalesShares} / {dailyQuotaShares}</b></div><div className="negotiation-quota-track"><span style={{width: Math.min(100, dailySalesShares / dailyQuotaShares * 100) + '%'}} /></div><div className="negotiation-live-quota-row"><span>Оборот</span><b>{dailySalesAmount.toLocaleString('ru-RU')} / {dailyQuotaAmount.toLocaleString('ru-RU')} ₽</b></div><div className="negotiation-quota-track"><span style={{width: Math.min(100, dailySalesAmount / dailyQuotaAmount * 100) + '%'}} /></div><small>Сделки по другим акциям не засчитываются в обязательный план.</small></div><div className="negotiation-goal-card"><span className="negotiation-section-label">ЧТО ВАЖНО КЛИЕНТУ</span><strong>{activeClient.goal}</strong><div className="negotiation-client-facts"><span>Бюджет <b>{activeClient.budget.toLocaleString('ru-RU')} ₽</b></span><span>План сделки <b>{activeClient.ticket.toLocaleString('ru-RU')} ₽</b></span><span>Опыт <b>{activeClient.experience}</b></span></div></div>
                        <div className="negotiation-trust-card negotiation-trust-redesign"><div className="negotiation-trust-heading"><div><span className="negotiation-section-label">ДОВЕРИЕ КЛИЕНТА</span><strong>{trust}%</strong></div><span className="negotiation-trust-target">ЦЕЛЬ {58 + activeClient.tier * 2}%</span></div><div className="negotiation-trust-track"><span className="negotiation-trust-fill" style={{width: trust + '%'}}/><i className="negotiation-trust-threshold" style={{left: (58 + activeClient.tier * 2) + '%'}}/></div><div className="negotiation-trust-scale"><span>Сомнение</span><span>Интерес</span><span>Готов к сделке</span></div><div className="negotiation-trust-next">{trust >= 58 + activeClient.tier * 2 ? 'Порог доверия достигнут — сохрани терпение клиента.' : 'До нужного уровня осталось ' + ((58 + activeClient.tier * 2) - trust) + ' пунктов доверия.'}</div><div className="negotiation-patience-row"><span>Терпение клиента</span><div className="negotiation-patience-track"><span style={{width: patience + '%'}}/></div><strong>{patience}%</strong></div><div className="negotiation-stage">{trustLabel}</div></div>
                        <div className="negotiation-risk-note"><strong>Проверь перед сделкой</strong><p>{activeCompany.advantages}</p><p className="risk-copy">{activeCompany.risks}</p></div>
                      </aside>
                    </div>}
                    {(callStatus === 'won' || callStatus === 'lost') && <div className="negotiation-result-panel"><div className={'negotiation-result-icon ' + callStatus}>{callStatus === 'won' ? '✓' : '!'}</div><span className="negotiation-section-label">{callStatus === 'won' ? 'ЦЕЛЬ ДОСТИГНУТА' : 'ПЕРЕГОВОРЫ ЗАВЕРШЕНЫ'}</span><h4>{callStatus === 'won' ? 'Сделка состоялась' : 'Сделка не закрыта'}</h4><p>{lastResult || 'Звонок завершён.'}</p><div className="negotiation-result-summary"><span>Продукт <b>{activeCompany.ticker} · {activeCompany.name}</b></span><span>Доверие в конце <b>{trust}%</b></span></div><button className="os-floating-primary" onClick={() => { setCallStatus('idle'); setQuestionIndex(0); setSelectedClientId(availableClients[0]?.id ?? 'alex-vorontsov') }}>Подготовить следующий звонок <ArrowRight size={15}/></button></div>}
                  </div>}
                  {win.app === 'clients' && <><span className="os-floating-eyebrow">CRM · КОНТАКТЫ</span><h3>База клиентов</h3><p>Доступно новых лидов: <strong>{availableClients.length}</strong></p><p>Репутация фирмы: <strong>{reputation}/100</strong>. Успешные сделки открывают клиентов с большим капиталом.</p><button className="os-floating-primary" onClick={() => setTab('clients')}>Открыть CRM</button></>}
                  {win.app === 'shop' && <><span className="os-floating-eyebrow">ОБОРУДОВАНИЕ</span><h3>Магазин рабочего места</h3><p>Баланс: <strong>{cash.toLocaleString('ru-RU')} ₽</strong></p><p>Покупай оборудование, чтобы улучшать рабочую среду и качество звонков.</p><button className="os-floating-primary" onClick={() => setTab('shop')}>Открыть магазин</button></>}
                  {win.app === 'housing' && <><span className="os-floating-eyebrow">ЖИЛЬЁ</span><h3>{currentHousing.name}</h3><p>Улучшай жильё по мере роста дохода и репутации.</p><button className="os-floating-primary" onClick={() => setTab('housing')}>Открыть недвижимость</button></>}
                </div>}
                {!win.minimized && !win.maximized && <div className="os-window-resize-handle" role="button" aria-label="Изменить размер окна" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); appWindowDragRef.current = null; appWindowResizeRef.current = { id: win.id, x: event.clientX, y: event.clientY, width: win.width, height: win.height }; event.currentTarget.setPointerCapture(event.pointerId) }} />}
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

      {menuSettings && !mainMenu && <div className="pause-backdrop"><section className="pause-menu pause-settings-panel" role="dialog" aria-modal="true" aria-label="Настройки"><span className="pause-kicker">ПАРАМЕТРЫ ИГРЫ</span><h2>Настройки</h2><p>Управляй визуальными эффектами. Прогресс сохраняется автоматически.</p><div className="settings-row"><span><strong>Звуковые эффекты</strong><small>Кнопки, шаги и действия.</small></span><button className={'settings-toggle' + (soundEnabled ? ' on' : '')} onClick={() => setSoundEnabled((value) => !value)}>{soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Звуки окружения</strong><small>Фоновая атмосфера комнаты и города.</small></span><button className={'settings-toggle' + (ambienceEnabled ? ' on' : '')} onClick={() => setAmbienceEnabled((value) => !value)}>{ambienceEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button></div><div className="settings-row"><span><strong>Уменьшить анимации</strong><small>Снижает интенсивность декоративных движений.</small></span><button className={'settings-toggle' + (reducedMotion ? ' on' : '')} onClick={toggleReducedMotion} aria-pressed={reducedMotion}>{reducedMotion ? 'ВКЛ' : 'ВЫКЛ'}</button></div><button className="pause-primary" onClick={() => setMenuSettings(false)}>Готово</button></section></div>}

      {pauseOpen && !mainMenu && <div className="pause-backdrop"><section className="pause-menu" role="dialog" aria-modal="true" aria-label="Пауза"><span className="pause-kicker">ИГРА ПРИОСТАНОВЛЕНА</span><h2>Передохнём?</h2><p>Время остановлено. Карьера сохраняется автоматически.</p><button className="pause-primary" onClick={() => setPauseOpen(false)}><Play size={17} fill="currentColor" /> Вернуться в игру</button><button onClick={() => { setPauseOpen(false); setMainMenu(true); setOfflineMenu(true); setConfirmNewCareer(true) }}><RotateCcw size={16} /> Начать заново</button><button onClick={() => { setPauseOpen(false); setMenuSettings(true) }}><Settings size={16} /> Настройки</button><button className="pause-exit" onClick={() => { setPauseOpen(false); setPanel('room'); setCallStatus('idle'); setMainMenu(true); setOfflineMenu(false) }}><ArrowLeft size={16} /> В главное меню</button><small>ESC — продолжить игру</small></section></div>}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      <div className="version-watermark">PROTOTYPE 0.8 <span>·</span> НЕФИНАНСОВЫЙ СОВЕТ</div>
      </> }
    </main>
  )
}
