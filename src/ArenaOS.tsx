import './ArenaOS.css'
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Activity, TrendingUp, Check, ChevronRight, Clock3, House, Laptop, Mic, Building2,
  PhoneCall, Search, ShieldCheck, ShoppingBag, Sparkles, Users,
  Video, Wallet, X
} from 'lucide-react'
import { BROKER_HIRES, BUSINESS_ASSETS, BUSINESS_UPGRADES, CLIENTS, HOUSING, getBusinessDailyNetIncome, getBusinessPayoutCap, getFirstImpression, getStaffDailyNetIncome, getClientEquipmentAccess, getClientStockFit, getClientTrustRequirement, getClientInvestmentPreference, STOCK_PROFILES, type ClientProfile } from './game/economy'
import ClientAvatar2D from './ClientAvatar2D'
import BrokerAvatar3D, { BrokerWebcamScene } from './BrokerAvatar3D'
import { playSound } from './audio'
import { evaluateFreeReply, getEquipmentOpening, getNegotiationDifficulty } from './game/dialogue'
import { clampWindowPosition } from './game/windowGeometry'

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
type Stock = { ticker: string; name: string; price: number; risk: 'Низкий' | 'Средний' | 'Высокий' | 'Очень высокий'; upside: string; downside: string; fit: string; financials: string; catalyst: string; redFlags: string; horizon: string }
type Props = {
  cash: number; setCash: Dispatch<SetStateAction<number>>
  firmCapital: number; setFirmCapital: Dispatch<SetStateAction<number>>
  masterVolume: number; setMasterVolume: Dispatch<SetStateAction<number>>
  soundEnabled: boolean; setSoundEnabled: Dispatch<SetStateAction<boolean>>
  reputation: number; setReputation: Dispatch<SetStateAction<number>>
  xp: number; setXp: Dispatch<SetStateAction<number>>
  day: number
  gameMinutes: number
  callsToday: number; setCallsToday: Dispatch<SetStateAction<number>>
  businessUpgrades: string[]; setBusinessUpgrades: Dispatch<SetStateAction<string[]>>
  ownedBusinessAssets: string[]; setOwnedBusinessAssets: Dispatch<SetStateAction<string[]>>
  ownedEmployees: string[]; setOwnedEmployees: Dispatch<SetStateAction<string[]>>
  companyName: string; setCompanyName: Dispatch<SetStateAction<string>>
  housingId: string; setHousingId: Dispatch<SetStateAction<string>>
  selectedOutfit: OutfitId; setSelectedOutfit: (v: OutfitId) => void
  ownedOutfits: OutfitId[]; setOwnedOutfits: Dispatch<SetStateAction<OutfitId[]>>
  ownedItems: string[]; setOwnedItems: Dispatch<SetStateAction<string[]>>
  clientTrustScores: Record<string, number>; setClientTrustScores: Dispatch<SetStateAction<Record<string, number>>>
  onClose: () => void
  onEndDay: () => void
  initialApp?: AppId
  sessionId?: number
  saveSlot?: number
  introCallReceived: boolean
  setIntroCallReceived: (value: boolean) => void
}

const STOCKS: Stock[] = [
  { ticker:"KOTL", name:"Котолёт", price:184, risk:"Высокий", upside:"«Котолёт» Строит жилые кварталы с балконами для котов и отдельными лифтами для переносок. Продажи квартир могут приносить деньги.", downside:"Коты не платят ипотеку. Долг, стройматериалы и задержки сдачи способны съесть прибыль.", fit:"Для Для терпеливого клиента, принимающего риск недвижимости.", financials:"Смотри темп продаж, долг, проценты, себестоимость и сроки сдачи.", catalyst:"подтверждённый рост продаж и сдача очереди в срок.", redFlags:"замедление продаж, рост долга и переносы сдачи.", horizon:"3–5 лет; проверяй цифры, а не только название." },
  { ticker:"BTRAN", name:"Банан Транс", price:176, risk:"Средний", upside:"«Банан Транс» Возит бананы, топливо и кофе по сети АЗС. Заправки, магазины и мойки дают повторную выручку.", downside:"Бананы портятся, грузовики ломаются, а топливо дорожает быстрее розничной цены. Оборот не равен прибыли.", fit:"Для Для предпринимателя, которому понятен реальный бизнес и денежный поток.", financials:"Смотри маржу топлива, трафик, продажи магазинов, ремонт и капзатраты.", catalyst:"рост дополнительных продаж и прибыльность новых станций.", redFlags:"сжатие топливной маржи и простой транспорта.", horizon:"1–3 года; проверяй цифры, а не только название." },
  { ticker:"OGUR", name:"Огурец Капитал", price:92, risk:"Низкий", upside:"«Огурец Капитал» Делает холодный чай и напиток «Огуречный резерв». Повторные покупки и поставки в магазины поддерживают выручку.", downside:"Сырьё и упаковка дорожают, сети требуют скидки, а неудачная линейка может остаться на полке.", fit:"Для Для осторожного клиента, которому важны понятный продукт и повторный спрос.", financials:"Смотри прибыль, маржу, повторные покупки, упаковку и зависимость от сетей.", catalyst:"новые контракты с магазинами без чрезмерных скидок.", redFlags:"падение маржи, списания и потеря дистрибьютора.", horizon:"1–3 года; проверяй цифры, а не только название." },
  { ticker:"VECT", name:"МедПульс", price:312, risk:"Средний", upside:"«МедПульс» соединяет пациентов с клиниками, продаёт онлайн-консультации и корпоративные медицинские планы. Повторные обращения и загрузка врачей поддерживают выручку.", downside:"Стоимость привлечения пациентов, регулирование медицинских данных и зависимость от клиник могут ухудшить маржу.", fit:"Для клиента, которому понятна цифровая медицина и важны повторные платежи.", financials:"Смотри платящих пациентов, повторные консультации, загрузку врачей и стоимость привлечения.", catalyst:"новые корпоративные контракты и рост повторных консультаций.", redFlags:"утечка данных, отток пациентов и рост выплат клиникам.", horizon:"2–4 года; проверяй удержание и экономику пациента." },
  { ticker:"DUST", name:"Атлас Дата", price:211, risk:"Средний", upside:"«Атлас Дата» строит дата-центры и сдаёт корпоративным клиентам серверные мощности и хранение данных. Долгосрочные контракты могут давать регулярную выручку.", downside:"Электроэнергия, незагруженные стойки, обновление серверов и капитальные затраты способны съесть денежный поток.", fit:"Для клиента, который понимает инфраструктурный бизнес и готов проверять капитальные затраты.", financials:"Смотри загрузку мощностей, подписанные контракты, энергозатраты и денежный поток после capex.", catalyst:"выход нового дата-центра на проектную загрузку.", redFlags:"рост стоимости электричества, пустые мощности и увеличение долга.", horizon:"3–6 лет; сравнивай загрузку и стоимость финансирования." },
  { ticker:"TAPK", name:"СменаФлоу", price:64, risk:"Высокий", upside:"«СменаФлоу» продаёт HR SaaS для графиков смен, табелей и расчёта рабочего времени. Подписная модель масштабируется, если компании продлевают платные тарифы.", downside:"Клиенты могут вернуться к таблицам и чатам; высокий отток и дорогие интеграции съедят подписную выручку.", fit:"Для клиента, готового к технологическому риску и требующего доказательств платного спроса.", financials:"Смотри конверсию пилотов в оплату, активных сотрудников, удержание и стоимость продаж.", catalyst:"рост платящих компаний и продление годовых подписок.", redFlags:"регистрации без оплат, высокий отток и дорогие индивидуальные доработки.", horizon:"2–5 лет; проверяй удержание по когортам." },
  { ticker:"GROV", name:"МаркетКруг", price:92, risk:"Высокий", upside:"«МаркетКруг» — международный маркетплейс с комиссиями, продвижением товаров и логистическими сервисами для продавцов. Рост повторных заказов может расширить регулярную выручку.", downside:"Скидки, доставка, возвраты и борьба за продавцов могут сделать отдельный заказ убыточным.", fit:"Для клиента, готового к волатильности и проверке экономики каждого заказа.", financials:"Смотри комиссию, повторные покупки, возвраты и прибыль после доставки и рекламы.", catalyst:"рост повторных заказов и положительная маржа на заказ.", redFlags:"убыточная доставка, субсидирование скидок и мошенничество.", horizon:"2–5 лет; отделяй оборот площадки от прибыли." },
  { ticker:"GRID", name:"ВольтСеть", price:67, risk:"Средний", upside:"«ВольтСеть» модернизирует электросети, подключает промышленных клиентов и строит накопители энергии. Тарифы и долгосрочные договоры могут поддерживать денежный поток.", downside:"Регуляторные решения, задержки разрешений и перерасход капитальных затрат ухудшают окупаемость проектов.", fit:"Для клиента, которому важны инфраструктурные активы и предсказуемые договоры.", financials:"Смотри утверждённые тарифы, подключения, сетевые потери и бюджет капитальных проектов.", catalyst:"утверждение тарифа и ввод сетевого проекта в срок.", redFlags:"перерасход capex, задержки разрешений и рост долга.", horizon:"4–8 лет; проверяй окупаемость проекта." },
  { ticker:"BYTE", name:"КодКлауд", price:251, risk:"Высокий", upside:"«КодКлауд» продаёт корпоративное облачное ПО для продаж, поддержки клиентов и автоматизации. Регулярная выручка растёт, если клиенты продлевают лицензии и подключают новые модули.", downside:"Отток клиентов, дорогая разработка и скидки крупным заказчикам могут ухудшить маржу.", fit:"Для клиента, готового к риску технологического роста и проверке подписной модели.", financials:"Смотри регулярную выручку, продления, чистое удержание и стоимость привлечения.", catalyst:"рост продлений и расширение корпоративных контрактов.", redFlags:"рост оттока, расходы на разработку и модули без платного спроса.", horizon:"3–5 лет; проверяй удержание и денежный поток." },
  { ticker:"LOGI", name:"ГрузЛайн", price:438, risk:"Средний", upside:"«ГрузЛайн» доставляет посылки и грузы для интернет-магазинов и бизнеса через сортировочные центры и сеть магистральных маршрутов. Плотность маршрутов повышает прибыльность.", downside:"Топливо, зарплаты, сезонность и пустые обратные рейсы могут съесть маржу даже при росте количества посылок.", fit:"Для умеренного инвестора, понимающего расходы международной логистики.", financials:"Смотри стоимость одной доставки, загрузку маршрутов, топливо и концентрацию клиентов.", catalyst:"новые корпоративные контракты и рост плотности маршрутов.", redFlags:"рост топлива быстрее тарифов и недозагрузка сортировочных центров.", horizon:"2–4 года; считай прибыль на маршрут." },
]


const STOCK_DOSSIERS: Record<string, { business: string; advantages: string[]; disadvantages: string[]; valuation: string; argument: string }> = {

 KOTL:{business:'«Котолёт» строит жилые кварталы с балконами для котов и лифтами для переносок.',advantages:['Продажи новых очередей','Снижение стоимости финансирования','Сдача в срок'],disadvantages:['Высокий проектный долг','Рост цен на материалы','Задержки сдачи'],valuation:'Проверяй продажи, долг, проценты, себестоимость и сроки сдачи.',argument:'Кошачьи балконы — маркетинг; тезис держится на продажах, долге и сдаче в срок.'},

 VECT:{business:'«МедПульс» — цифровая медицинская платформа, онлайн-консультации и корпоративные медицинские планы.',advantages:['Повторные обращения пациентов','Корпоративные контракты','Рост загрузки врачей-партнёров'],disadvantages:['Стоимость привлечения пациентов','Регулирование и безопасность данных','Зависимость от клиник-партнёров'],valuation:'Проверяй платящих пациентов, повторные визиты, стоимость привлечения и долю клиник в цене консультации.',argument:'Регистрации не равны выручке: покажем повторные платные обращения и экономику одного пациента.'},
 NEFT:{business:'«СеверНефть» — независимая нефтедобывающая компания с несколькими месторождениями и экспортной логистикой.',advantages:['Действующие месторождения дают денежный поток при благоприятных ценах','Оптимизация добычи может снижать себестоимость','Свободный поток помогает сокращать долг'],disadvantages:['Падение цены сырья быстро сокращает прибыль','Налоги и ограничения экспорта меняют экономику поставок','Новые проекты требуют крупных вложений'],valuation:'Сравни себестоимость добычи, чистый долг, капзатраты и сценарии цены сырья.',argument:'Денежный поток цикличен. Покажем сценарий падения цены сырья и не будем строить рекомендацию на одном удачном квартале.'},
 MEDX:{business:'«МедЭкспресс» — сеть диагностических центров и амбулаторных клиник; доход дают обследования, повторные визиты и корпоративные программы.',advantages:['Базовая диагностика менее циклична, чем необязательные покупки','Повторные обращения поддерживают загрузку','Новые центры могут увеличить выручку после выхода на плановую загрузку'],disadvantages:['Оборудование и открытие филиалов требуют капитала','Нехватка врачей ограничивает расширение','Новые центры могут долго не выходить на безубыточность'],valuation:'Смотри загрузку кабинетов, выручку на врача, долг и срок окупаемости филиалов.',argument:'Защитный спрос не гарантирует прибыль: проверим загрузку клиник и окупаемость новых филиалов.'},

 GROV:{business:'«МаркетКруг» — международный маркетплейс с комиссией, рекламой, логистикой и сервисами для продавцов.',advantages:['Комиссия с завершённых сделок','Повторные покупки','Дополнительная выручка от продвижения'],disadvantages:['Субсидирование доставки','Возвраты и мошенничество','Конкуренция за продавцов и скидочное давление'],valuation:'Смотри прибыль на заказ после скидки, доставки, возвратов и рекламы.',argument:'Оборот — это не прибыль. Проверим экономику заказа и повторные покупки без промо.'},

 GRID:{business:'«ВольтСеть» — оператор электросетевой инфраструктуры, подключений и систем хранения энергии.',advantages:['Долгосрочная потребность в сетях','Регулируемые и контрактные доходы','Рост промышленных подключений'],disadvantages:['Решения регулятора','Капиталоёмкие проекты','Задержки разрешений и перерасход бюджета'],valuation:'Проверяй утверждённые тарифы, сроки проектов, сетевые потери и долговую нагрузку.',argument:'Нужная инфраструктура не гарантирует доходность: пересчитаем проект по утверждённому тарифу и фактическим затратам.'},

 BYTE:{business:'«КодКлауд» продаёт корпоративное облачное ПО для продаж, поддержки клиентов и автоматизации процессов.',advantages:['Регулярная подписная выручка','Продления контрактов','Дополнительные модули для действующих клиентов'],disadvantages:['Отток клиентов','Высокие расходы на разработку','Давление конкурентов и скидки'],valuation:'Проверяй регулярную выручку, чистое удержание, продления и стоимость привлечения.',argument:'Количество пользователей не равно платным лицензиям: покажем продления и денежный поток.'},

 LOGI:{business:'«ГрузЛайн» — сеть доставки посылок и грузов, сортировочных центров и магистральных маршрутов.',advantages:['Повторные B2B-контракты','Плотность маршрутов','Дополнительная выручка от срочной доставки'],disadvantages:['Рост топлива и зарплат','Пустые обратные рейсы','Сезонность и недозагрузка центров'],valuation:'Проверяй стоимость одной доставки, загрузку транспорта, топливо и концентрацию клиентов.',argument:'Рост числа посылок полезен только тогда, когда каждая доставка приносит положительную маржу.'},

 OGUR:{business:'«Огурец Капитал» производит холодный чай и напиток «Огуречный резерв».',advantages:['Положительная прибыль','Повторные покупки','Региональная дистрибуция'],disadvantages:['Дорогое сырьё и упаковка','Скидки сетям','Списания продукции'],valuation:'Смотри маржу, повторные покупки, списания и зависимость от сетей.',argument:'Понятный продукт помогает продажам, но рост цены акции не гарантирован.'},

 TAPK:{business:'«СменаФлоу» — HR SaaS для графиков смен, табелей и расчёта рабочего времени.',advantages:['Подписная модель','Понятная ежедневная задача клиента','Возможность расширять модули'],disadvantages:['Отток после пилота','Возврат к таблицам и чатам','Дорогие индивидуальные интеграции'],valuation:'Проверяй платящие компании, продления, активных сотрудников и стоимость привлечения.',argument:'Главный показатель — не число регистраций, а компании, которые продлевают платный тариф.'},

 DUST:{business:'«Атлас Дата» строит и обслуживает дата-центры, сдаёт корпоративным клиентам вычислительные мощности и хранение данных.',advantages:['Долгосрочные контракты','Рост спроса на облачные вычисления','Высокая загрузка действующих мощностей'],disadvantages:['Дорогая электроэнергия','Большие капитальные затраты','Устаревание серверов и долг'],valuation:'Проверяй загрузку стоек, контракты, стоимость электроэнергии и денежный поток после капитальных затрат.',argument:'Спрос на облако важен, но сначала проверим, какая доля мощностей уже оплачена клиентами.'},

 BTRAN:{business:'«Банан Транс» — сеть АЗС, магазинов, моек и перевозка скоропортящихся товаров.',advantages:['Повторный трафик','Продажи сервисов','Корпоративные перевозки'],disadvantages:['Сжатие маржи топлива','Ремонт транспорта','Порча груза'],valuation:'Сравни маржу топлива, доход на станцию, трафик и капзатраты.',argument:'Бананы создают узнаваемость, но прибыль надо разложить на топливо, магазин и транспорт.'},
}

const OUTFITS: {id:OutfitId;name:string;price:number;desc:string;bonus:number}[] = [
  {id:'intern',name:'Стажёр',price:0,desc:'Стартовый образ. Честно, но пока без статуса.',bonus:0},
  {id:'classic',name:'Деловой костюм',price:4500,desc:'Аккуратный образ для деловых переговоров.',bonus:2},
  {id:'premium',name:'Партнёрский образ',price:12500,desc:'Дорогой вид. Требовательные клиенты всё равно попросят доказать компетентность.',bonus:5}
]
const GEAR = [
  {id:'headset',name:'Гарнитура с микрофоном',price:4500,desc:'Звук станет чётче: меньше просьб повторить цифры и больше доверия на старте.',bonus:5,icon:'mic'},
  {id:'hd-camera',name:'HD-веб-камера',price:7500,desc:'Чёткая картинка для клиентов, которые не доверяют брокеру в размытии 144p.',bonus:5,icon:'camera'},
  {id:'neutral-backdrop',name:'Нейтральный фон',price:8000,desc:'Аккуратный фон повышает первое впечатление без фальшивого пентхауса.',bonus:3,icon:'background'},
  {id:'desk-lamp',name:'Настольная лампа',price:1200,desc:'Свет делает лицо заметнее и улучшает качество видеосвязи.',bonus:2,icon:'light'},
  {id:'partner-desk',name:'Дополнительный рабочий стол',price:5800,desc:'Физически появляется в комнате и открывает найм первого сотрудника в квартире.',bonus:0,icon:'desk'}
]

function GearIllustration({ type }: { type:string }) {
  const common = { strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
  return <svg viewBox="0 0 160 120" role="img" aria-label={type==='desk'?'Иллюстрация рабочего стола':type==='mic'?'Иллюстрация гарнитуры':type==='camera'?'Иллюстрация веб-камеры':type==='light'?'Иллюстрация настольной лампы':'Иллюстрация рабочего фона'}>
    <ellipse cx="80" cy="104" rx="54" ry="7" fill="#9bb5ca" opacity=".45"/>
    {type==='desk' && <>
      <rect x="58" y="18" width="45" height="31" rx="3" fill="#263e55" stroke="#122b40" strokeWidth="2"/>
      <rect x="62" y="22" width="37" height="22" rx="1.5" fill="#85c9e8"/>
      <path d="M66 37 L73 30 L79 34 L88 26 L96 34" fill="none" stroke="#e8f8ff" strokeWidth="2.5" {...common}/>
      <rect x="76" y="49" width="9" height="7" fill="#60788c"/><rect x="68" y="55" width="25" height="4" rx="2" fill="#526a7c"/>
      <path d="M24 66 L136 66 L124 78 L36 78 Z" fill="#b98d5c" stroke="#805c3a" strokeWidth="2"/>
      <path d="M38 78 L38 99 M122 78 L122 99" stroke="#5d6873" strokeWidth="6" {...common}/>
      <rect x="42" y="69" width="40" height="5" rx="2" fill="#e0b982"/>
      <rect x="96" y="69" width="22" height="5" rx="2" fill="#5b7183"/>
    </>}
    {type==='mic' && <>
      <path d="M42 68 V52 A38 38 0 0 1 118 52 V68" fill="none" stroke="#263d53" strokeWidth="11" {...common}/>
      <path d="M43 52 A37 37 0 0 1 117 52" fill="none" stroke="#7f9eb4" strokeWidth="4" {...common}/>
      <rect x="30" y="55" width="25" height="35" rx="8" fill="#24435b" stroke="#142f45" strokeWidth="2"/>
      <rect x="105" y="55" width="25" height="35" rx="8" fill="#24435b" stroke="#142f45" strokeWidth="2"/>
      <rect x="35" y="61" width="15" height="22" rx="5" fill="#72c5d5"/><rect x="110" y="61" width="15" height="22" rx="5" fill="#72c5d5"/>
      <path d="M116 83 Q116 100 94 96" fill="none" stroke="#d2a75d" strokeWidth="4" {...common}/>
      <circle cx="91" cy="96" r="5" fill="#31485d"/>
    </>}
    {type==='camera' && <>
      <rect x="25" y="39" width="110" height="47" rx="10" fill="#314b62" stroke="#192f43" strokeWidth="3"/>
      <rect x="35" y="45" width="90" height="7" rx="3" fill="#6e8ca2"/>
      <circle cx="80" cy="63" r="19" fill="#182e42" stroke="#8bb6cf" strokeWidth="4"/>
      <circle cx="80" cy="63" r="11" fill="#55a7d3"/><circle cx="76" cy="59" r="4" fill="#dff6ff"/>
      <path d="M67 87 L62 98 L98 98 L93 87" fill="#607d91"/>
    </>}
    {type==='light' && <>
      <path d="M79 96 L79 62 L102 36" stroke="#475d70" strokeWidth="7" {...common}/>
      <path d="M82 95 L55 95" stroke="#475d70" strokeWidth="7" {...common}/>
      <path d="M87 20 L122 32 L105 55 L75 43 Z" fill="#f3c969" stroke="#b48b36" strokeWidth="2" {...common}/>
      <path d="M91 42 L100 65 M104 45 L109 65 M79 45 L90 65" stroke="#f4d98b" strokeWidth="2" opacity=".8" {...common}/>
      <ellipse cx="81" cy="100" rx="26" ry="5" fill="#71879a"/>
    </>}
    {type==='background' && <>
      <rect x="24" y="16" width="112" height="82" rx="5" fill="#81969b" stroke="#526a75" strokeWidth="3"/>
      <rect x="32" y="24" width="96" height="66" rx="3" fill="#d9e8e9"/>
      <path d="M32 70 Q55 55 76 70 T128 68 V90 H32 Z" fill="#b4d3d4"/>
      <rect x="41" y="35" width="34" height="4" rx="2" fill="#91aab1"/><rect x="41" y="44" width="52" height="3" rx="1.5" fill="#a4bbc1"/>
      <path d="M111 88 V66 M111 72 Q94 66 99 56 Q113 56 111 72 M111 77 Q128 70 126 61 Q112 61 111 77" stroke="#3f8265" strokeWidth="4" fill="none" {...common}/>
    </>}
  </svg>
}

const money = (n:number) => Math.round(n).toLocaleString('ru-RU') + ' ₽'

function clientClosingLine(client:ClientProfile, stock:Stock) {
  if (client.id === 'alex-vorontsov') return '«Ладно, теперь хотя бы понятно, что именно я покупаю и где могу ошибиться. Я сохраню ваш контакт и расскажу о вас паре знакомых — но следующий отчёт вместе проверим, договорились?»'
  if (client.id === 'yaroslav-nikitin') return '«Окей, я ожидал очередную ракету на графике, а вы хотя бы объяснили, где тормоз. Контакт сохраню, друзьям расскажу — только не превращайте мой портфель в киберспортивную ставку».'
  const temperament = client.temperament.toLowerCase()
  if (client.tier >= 3 || temperament.includes('скептич') || temperament.includes('аналит')) return '«Решение принято. Я сохраню ваши расчёты и контакт. Коллегам могу вас порекомендовать, если вы и дальше будете отделять факты от красивых обещаний».'
  if (temperament.includes('дотош') || temperament.includes('требователь')) return '«Хорошо, оформляем. Пришлите итоговые условия и список рисков письменно. Если отчёт подтвердит тезис, порекомендую вас партнёрам».'
  if (temperament.includes('импульсив') || temperament.includes('азарт')) return '«Договорились! Но если меня снова потянет поставить всё на одну бумагу — напомните мне этот разговор. Контактом поделюсь с друзьями».'
  if (temperament.includes('осторож') || temperament.includes('недовер')) return '«Мне спокойнее, когда не скрывают неприятные сценарии. Начнём с этой суммы и будем следить за условиями. Если всё пойдёт честно, порекомендую вас знакомым».'
  return '«Договорились по «' + stock.name + '». Мне понравилось, что вы не продавали мечту, а объяснили и плюсы, и риски. Сохраню контакт и порекомендую вас знакомым, если будете так же работать дальше».'
}
function clientHesitationLine(client:ClientProfile, stock:Stock, turn:number) {
  const temperament = client.temperament.toLowerCase()
  const lines = client.tier >= 3
    ? ['«Идею понял. Покажите, сколько компания зарабатывает и сколько должна. Потом решим».','«Пока не хватает фактов. Что будет, если всё пойдёт плохо?»','«Не хочу покупать на эмоциях. Сравню с другой компанией и вернусь».']
    : temperament.includes('осторож') || temperament.includes('недовер')
      ? ['«Звучит занятно, но это мои деньги. Давайте без спешки».','«А если всё провалится? Объясните, сколько я могу потерять».','«Я подумаю. Красивой истории мне мало — хочу понять риск».']
      : temperament.includes('импульсив') || temperament.includes('нетерпел')
        ? ['«Уже хотел нажать “купить”, но стоп. Где подвох?»','«Звучит весело! А теперь в двух словах: что может пойти не так?»','«Почти уговорили. Дайте один факт, а не десять обещаний».']
        : ['«Понял. А что может пойти не так?»','«Хорошо, но почему эта компания заработает деньги?»','«Дайте простой пример и назовите главный минус».']
  return lines[(turn + client.id.length + stock.ticker.length) % lines.length]
}


function clientStockReaction(client:ClientProfile, stock:Stock, suitable:boolean) {
  if (!suitable) return '«Название запомнил, но мне не подходит такой риск. Не надо продавать мне не ту компанию только потому, что презентация смешная».'
  const jokes: Record<string,string> = {
    KOTL:'«Котолёт? Балкон коту я куплю сам. Покажите, что застройщик продаёт квартиры, а не только мечту о пушистом жильце».',
    BTRAN:'«Банан Транс звучит как мой последний отпуск. Где тут прибыль: бензин, кофе или бананы, которые доехали живыми?»',
    OGUR:'«Огуречный резерв? Название переживу. Прибыль там настоящая или разбавлена водой вместе с чаем?»',
    VECT:'«Неловко Вышло — надеюсь, это не прогноз моего портфеля. Сколько клиентов продлевают контракт после кризиса?»',
    DUST:'«Тихий Люкс продаёт тишину. Что будет громче в отчёте — прибыль или расходы на монтаж?»',
    TAPK:'«Не Моя Смена — приложение говорит за меня. Кафе будут платить или продолжат писать “кто может выйти?” в чат?»',
    GROV:'«Переоценка — название подходящее. Проверим, не переоценили ли мы число вещей, которые реально покупают».',
    GRID:'«Комитет по Комфорту. Наконец-то кто-то отвечает за кондиционер. А кто отвечает, если ремонт съест маржу?»',
    BYTE:'«Понедельник Labs обещает победить дедлайны. Поверю, когда клиенты продлят подписку, а не когда директор поставит ещё одну задачу».',
    LOGI:'«Срочно Вчера — мой любимый срок. Выручка растёт быстрее расходов или только водитель нервничает?»'
  }
  const line = jokes[stock.ticker] ?? '«Название запомнил. Теперь покажите, откуда берётся выручка и что может пойти не так».'
  if (client.tier >= 3 || client.temperament.toLowerCase().includes('аналит')) return line+' «Покажите подтверждающие цифры и критерий, при котором вы откажетесь от идеи».'
  if (client.temperament.toLowerCase().includes('импульсив')) return line+' «Мне нравится энергия. Теперь скажите, где подвох и сколько можно потерять».'
  return line+' «Хорошо, шутка сработала. Теперь назовите плюс, главный риск и что проверим перед решением».'
}

function getResponseOptions(stock:Stock, client:ClientProfile, turn:number) {
  const beginner = client.tier <= 1
  const name = stock.name
  const good = beginner
    ? `«${name} может заработать, если людям будет нужен её продукт. Хорошее: ${stock.upside.replace(/[«»]/g,'')} Минус: ${stock.downside} Я не обещаю прибыль: давайте проверим продажи и расходы, прежде чем решать».`
    : `«По ${name} аргумент такой: ${stock.upside} Главный риск: ${stock.downside} Я бы проверил ${stock.catalyst.toLowerCase()} и отказался от идеи, если подтвердится ${stock.redFlags.toLowerCase()}».`
  const bold = [
    `«${name} — билет в богатую жизнь! Берите сейчас: цена точно вырастет, а рисков здесь практически нет. Если упустите момент, будете жалеть!»`,
    `«Я бы на вашем месте вложил всё прямо сейчас. ${name} не может провалиться — ну, разве что Вселенная против нас. Но Вселенная обычно занята!»`,
    `«Говорю как профессионал: ${name} скоро взлетит на Луну. Никаких сомнений, никаких потерь, только деньги и красивый новый автомобиль!»`
  ][(turn + client.id.length) % 3]
  const evasive = [
    `«Ну, ${name} — это очень интересная история. Все вокруг говорят, что тема перспективная. Детали потом, главное — не упустить волну!»`,
    `«Представьте: ${name}, вы, финансовая свобода и кот в золотых очках. Звучит же отлично? Давайте не будем портить момент скучными вопросами».`,
    `«Сложно объяснить в двух словах, но там большой рынок, талантливая команда и мощная идея. Поверьте мне на слово — я же в пиджаке».`
  ][(turn + client.name.length) % 3]
  const cautious = /осторож|недовер|скептич/i.test(client.temperament)
  const tailored = cautious
    ? `«Понимаю, что вы не хотите рисковать деньгами. Для вашей цели — ${client.goal.toLowerCase()} — ${name} может оказаться не лучшим вариантом: ${stock.downside} Давайте сравним его с более спокойной идеей».`
    : /нетерпел|занят|прямолин/i.test(client.temperament)
      ? `«Коротко: ${name} может дать шанс на рост, но ${stock.downside.toLowerCase()} Если хотите, за минуту проверим один главный факт: ${stock.catalyst.toLowerCase()}».`
      : /статус/i.test(client.temperament)
        ? `«${name} может стать интересной историей для вашего портфеля, но я не стану продавать вам красивую вывеску вместо результата. Риск: ${stock.downside} Статус не защитит от убытка».`
        : `«У ${name} есть смешная идея, но деньги настоящие. Хорошая сторона: ${stock.upside} Плохая сторона: ${stock.downside} Я бы не покупал, пока не проверим, кто действительно платит компании».`
  const bank = [
    { label: beginner ? 'Объяснить просто: плюс, минус и проверка' : 'Честно разобрать выгоду и риск', text: good },
    { label: 'Надавить и пообещать золотые горы', text: bold },
    { label: cautious ? 'Учесть страх клиента и сравнить варианты' : 'Отшутиться и уйти от неудобных вопросов', text: cautious ? tailored : evasive }
  ]
  const shift = (turn * 2 + client.id.length + stock.ticker.length) % bank.length
  return [0,1,2].map(index => bank[(index + shift) % bank.length])
}

export default function ArenaOS(props: Props) {
  const [activeApp,setActiveApp] = useState<AppId>(props.initialApp ?? 'home')
  const [windowOpen,setWindowOpen] = useState(props.initialApp === 'wardrobe')
  const [windowMinimized,setWindowMinimized] = useState(false)
  const [windowMaximized,setWindowMaximized] = useState(true)
  const [windowPosition,setWindowPosition] = useState({x:90,y:24})
  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const windowDragRef = useRef<{pointerX:number;pointerY:number;originX:number;originY:number}|null>(null)
  const [navOrder,setNavOrder] = useState<AppId[]>(['home','calls','market','business','clients','wardrobe','equipment','tasks','housing'])
  const [startMenuOpen,setStartMenuOpen] = useState(false)
  const [incoming,setIncoming] = useState(false)
  const [lastPayout,setLastPayout] = useState(0)
  const [lastFirmCommission,setLastFirmCommission] = useState(0)
  const [lastClientTicket,setLastClientTicket] = useState(0)
  const [lastXpReward,setLastXpReward] = useState(0)
  const [lastReputationReward,setLastReputationReward] = useState(0)
  const [lastReferralName,setLastReferralName] = useState('')
  const [lastContactName,setLastContactName] = useState('')
  const [newContacts,setNewContacts] = useState<string[]>(() => { try { const saved = JSON.parse(localStorage.getItem('arena-os-v2-contacts') || 'null'); return Array.isArray(saved) ? Array.from(new Set(['alex-vorontsov','maria-sokolova',...saved.filter((id: unknown): id is string => typeof id === 'string')])) : ['alex-vorontsov','maria-sokolova'] } catch { return ['alex-vorontsov','maria-sokolova'] } })
  const [clientId,setClientId] = useState('alex-vorontsov')
  const [callState,setCallState] = useState<'idle'|'active'|'won'|'lost'>('idle')
  const [trust,setTrust] = useState(40)
  const [patience,setPatience] = useState(72)
  const [activeStock,setActiveStock] = useState<Stock|null>(null)
  const [stockPicker,setStockPicker] = useState(false)
  const [callLog,setCallLog] = useState<string[]>([])
  const [dialogueTurn,setDialogueTurn] = useState(0)
  const [goodTurns,setGoodTurns] = useState(0)
  const [firstDealGuide,setFirstDealGuide] = useState(false)
  const [message,setMessage] = useState('')
  const [companyNameDraft,setCompanyNameDraft] = useState('')
  const dialogueLogRef = useRef<HTMLDivElement | null>(null)
  const [soundPanelOpen, setSoundPanelOpen] = useState(false)
  const gameClockLabel = String(Math.floor(props.gameMinutes / 60) % 24).padStart(2,'0') + ':' + String(Math.floor(props.gameMinutes % 60)).padStart(2,'0')
  const gameVolume = props.masterVolume
  const setGameVolume = (value: number) => props.setMasterVolume(value)
  const [notice,setNotice] = useState('')
  const [query,setQuery] = useState('')
  const [lastChance,setLastChance] = useState(0)
  const [completed,setCompleted] = useState(0)
  const client = useMemo(() => (CLIENTS.find(c => c.id === clientId) ?? CLIENTS[0]) as ClientProfile,[clientId])
  const unlockedClients = useMemo(() => CLIENTS.filter(c => getClientEquipmentAccess(c, props.ownedItems).available && (newContacts.includes(c.id) || (props.day >= 3 && c.minDay <= props.day && c.minReputation <= props.reputation) || (props.businessUpgrades.includes('lead-network') && c.minDay <= props.day + 2 && c.minReputation <= props.reputation + 10) || (props.businessUpgrades.includes('client-crm') && c.minDay <= props.day + 3 && c.minReputation <= props.reputation + 15))),[props.day,props.reputation,newContacts,props.businessUpgrades,props.ownedItems])
  const equipmentBonus = GEAR.filter(g => props.ownedItems.includes(g.id)).reduce((n,g)=>n+g.bonus,0)
  const currentHousing = HOUSING.find(home => home.id === props.housingId) ?? HOUSING[0]
  const housingBonus = getFirstImpression(props.housingId, props.ownedItems, client)
  const estimatedBonus = Math.min(getBusinessPayoutCap(props.businessUpgrades), Math.max(200, Math.round(client.ticket * client.bonusRate * 1.25)))
  const estimatedFirmCommission = Math.round(client.ticket * client.commissionRate)
  const businessTrustBonus = BUSINESS_UPGRADES.filter(upgrade => props.businessUpgrades.includes(upgrade.id)).reduce((sum, upgrade) => sum + upgrade.trustBonus, 0)
  const dailyCallLimit = (props.reputation >= 60 ? 4 : props.reputation >= 35 ? 3 : 2) + (props.businessUpgrades.includes('lead-network') ? 1 : 0) + (props.businessUpgrades.includes('client-crm') ? 1 : 0)
  const outfitBonus = (OUTFITS.find(o=>o.id===props.selectedOutfit)?.bonus ?? 0) + (client.statusSensitive && props.selectedOutfit==='intern' ? -4 : 0)
  const missingMicPenalty = (props.ownedItems.includes('headset') || props.ownedItems.includes('pro-mic')) ? 0 : (client.tier >= 2 ? 6 : 3)
  const missingCameraPenalty = props.ownedItems.includes('hd-camera') ? 0 : (client.tier >= 2 || client.statusSensitive ? 5 : 2)
  const missingBackgroundPenalty = (props.ownedItems.includes('neutral-backdrop') || props.ownedItems.includes('chromakey-kit')) ? 0 : (client.tier >= 2 || client.statusSensitive ? 3 : 1)
  const qualityPenalty = missingMicPenalty + missingCameraPenalty + missingBackgroundPenalty
  const chance = Math.max(5,Math.min(78,Math.round(20 + trust*.43 + props.reputation*.09 + equipmentBonus*.7 + outfitBonus - qualityPenalty + housingBonus + businessTrustBonus + (activeStock && activeStock.risk === 'Низкий' && client.statusSensitive ? 3 : 0) - Math.max(0,getClientTrustRequirement(client)-trust)*.3)))
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-last-app',activeApp) } catch {} },[activeApp])
  useEffect(()=>{ try { localStorage.setItem('arena-os-v2-contacts',JSON.stringify(newContacts)) } catch {} },[newContacts])
  useEffect(()=>{
    const move=(event:PointerEvent)=>{
      const drag=windowDragRef.current
      const workspace=workspaceRef.current
      if(!drag || !workspace || windowMaximized) return
      const windowEl=workspace.querySelector<HTMLElement>('.arena-os-window.restored')
      const width=windowEl?.offsetWidth ?? 780
      const height=windowEl?.offsetHeight ?? 620
      setWindowPosition(clampWindowPosition(
        {x:drag.originX,y:drag.originY},
        {x:drag.pointerX,y:drag.pointerY},
        {x:event.clientX,y:event.clientY},
        {width:workspace.clientWidth,height:workspace.clientHeight},
        {width,height}
      ))
    }
    const stop=()=>{windowDragRef.current=null}
    window.addEventListener('pointermove',move)
    window.addEventListener('pointerup',stop)
    window.addEventListener('pointercancel',stop)
    return ()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop)}
  },[windowMaximized])
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
  const startCall = (id=clientId) => {
    if (props.callsToday >= dailyCallLimit) { setNotice('Лимит звонков на сегодня исчерпан (' + dailyCallLimit + '). Развивай сеть клиентов или возвращайся завтра.'); return }
    const selected = (CLIENTS.find(c=>c.id===id) ?? CLIENTS[0]) as ClientProfile
    props.setCallsToday(value => value + 1)
    setClientId(selected.id); setStockPicker(!activeStock); setDialogueTurn(0); setGoodTurns(0); setFirstDealGuide(false); setCallState('active')
    const homeBonus = getFirstImpression(props.housingId, props.ownedItems, selected)
    const relationshipTrustBase = props.clientTrustScores[selected.id] ?? selected.baseTrust
    const starterTrust = Math.max(12,Math.min(72,relationshipTrustBase - Math.round(qualityPenalty*.45) + Math.round(props.reputation*.08) + Math.round(homeBonus*.5) + businessTrustBonus))
    setTrust(starterTrust); setPatience(Math.min(95, selected.patience + Math.round(currentHousing.comfort*.8))); setLastChance(0)
    const lines = [selected.name + ' подключился к звонку.']
    lines.push(...getEquipmentOpening(selected, props.ownedItems).map(line => line.startsWith('Клиент') ? line : 'Клиент: ' + line))
    lines.push(selected.tier <= 1 ? selected.quote.replace(/катализатор/gi,'что может помочь компании расти').replace(/ликвидность/gi,'как быстро вернуть деньги').replace(/денежный поток/gi,'сколько денег остаётся').replace(/выручка/gi,'деньги от продаж').replace(/маржа/gi,'сколько остаётся после расходов').replace(/капитал/gi,'деньги').replace(/диверсификация/gi,'разделение денег между вариантами') : selected.quote)
    setCallLog(lines); setMessage(''); setActiveApp('calls'); setWindowOpen(true); setWindowMinimized(false)
  }
  const chooseStock = (stock:Stock) => {
    const fit = getClientStockFit(client.id, stock.ticker)
    setActiveStock(stock); setStockPicker(false); setDialogueTurn(0); setGoodTurns(0)
    if (!fit.suitable) {
      setTrust(Math.max(0, trust - 12))
      props.setClientTrustScores(scores => ({ ...scores, [client.id]: Math.max(0, (scores[client.id] ?? client.baseTrust) - 12) }))
      props.setReputation(value => Math.max(0, value - 2))
      setLastChance(0); setCallState('lost')
      setCallLog(prev => [...prev, 'Ты: «Я предлагаю рассмотреть ' + stock.name + ' (' + stock.ticker + ')».', client.name + ': ' + clientStockReaction(client,stock,false), 'Сделка сорвана до обсуждения условий: доверие −12, репутация −2, бонус не начислен.'])
      setNotice('Акция не подходит клиенту. Доверие −12, репутация −2. В следующий раз сверяй тип акции с его целью.')
      return
    }
    const pitch = client.tier <= 1
      ? 'Давай посмотрим на эту компанию. Она может вырасти, если будет больше клиентов и продаж. Но если расходы вырастут или покупателей станет меньше, цена акции может упасть.'
      : stock.upside + ' При этом важно учитывать и обратную сторону: ' + stock.downside
    setCallLog(prev=>[...prev, 'Ты: «Я предлагаю рассмотреть акцию '+stock.name+' ('+stock.ticker+'). '+pitch+'»', client.name+': '+clientStockReaction(client,stock,true)])
    setTrust(v=>Math.max(0,Math.min(100,v+4)))
    props.setClientTrustScores(scores => ({ ...scores, [client.id]: Math.min(100, (scores[client.id] ?? client.baseTrust) + 4) }))
  }
  const respond = (kind:'benefit'|'risk'|'absurd'|'free', custom='') => {
    if(callState!=='active') return
    const text = custom.trim()
    let delta = 0; let reply = ''
    if(kind==='free') {
      const evaluation = evaluateFreeReply(text, client, activeStock, dialogueTurn, props.ownedItems, { trust, patience })
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
    const nextGoodTurns = goodTurns + (delta >= 5 ? 1 : 0)
    setGoodTurns(nextGoodTurns)
    const gearMissing = Number(!(props.ownedItems.includes('headset') || props.ownedItems.includes('pro-mic')))+Number(!props.ownedItems.includes('hd-camera'))+Number(!(props.ownedItems.includes('neutral-backdrop') || props.ownedItems.includes('chromakey-kit')) && (client.tier>=2 || client.statusSensitive))
    const newPatience = Math.max(0,patience-Math.max(1,(kind==='risk'?2:kind==='free'?3:4)+Math.ceil(client.tier/2)+gearMissing))
    setTrust(newTrust); setPatience(newPatience); props.setClientTrustScores(scores => ({ ...scores, [client.id]: Math.max(0, Math.min(100, (scores[client.id] ?? client.baseTrust) + delta)) })); setCallLog(prev=>[...prev,'Ты: '+(kind==='free'?text:kind==='benefit'?'Объясняешь потенциальную выгоду':kind==='risk'?'Честно раскрываешь риски':'Отвечаешь невпопад'),client.name+': '+reply,'РАЗБОР: доверие '+(delta>0?'+':'')+delta+' ('+trust+' → '+newTrust+'); терпение −'+(patience-newPatience)+' ('+patience+' → '+newPatience+'). '+(delta>=8?'Аргументы с фактами и планом помогают клиенту проверить рекомендацию.':delta<0?'Ответ не снял возражение или содержал обещание без доказательств.':'Нужен более конкретный факт, риск или условие выхода.')])
    setMessage('')
    // Every answer is a negotiation turn. A single lucky click must never close a deal.
    setDialogueTurn(turn=>turn+1)
    const newChance = Math.max(5,Math.min(78,Math.round(20+newTrust*.43+props.reputation*.09+equipmentBonus*.7+outfitBonus-qualityPenalty+housingBonus+businessTrustBonus-Math.max(0,getClientTrustRequirement(client)-newTrust)*.3)))
    setLastChance(newChance)
    const badAnswer = delta <= -7
    const patienceDanger = newPatience <= 16
    const hangupChance = Math.min(58, (badAnswer ? 22 + Math.min(14, Math.abs(delta)) : 0) + (patienceDanger ? 18 : 0) + (newTrust <= 12 ? 12 : 0))
    const clientHangsUp = Math.random() * 100 < hangupChance
    if (clientHangsUp) {
      const reputationLoss = badAnswer || newTrust <= 12 ? 3 : 1
      setCallState('lost'); setLastXpReward(3); setLastReputationReward(-Math.min(reputationLoss,props.reputation)); setLastFirmCommission(0); setLastClientTicket(0)
      props.setReputation(value => Math.max(0,value-reputationLoss)); props.setXp(value=>value+3)
      props.setClientTrustScores(scores=>({...scores,[client.id]:Math.max(0,(scores[client.id]??client.baseTrust)-8)}))
      setCallLog(prev=>[...prev, client.name+': «Знаете что, я зря трачу время. На этом закончим».', 'КЛИЕНТ СБРОСИЛ ЗВОНОК. Сделки нет. Вероятность срыва после такого ответа: '+Math.round(hangupChance)+'%. Репутация −'+reputationLoss+'.'])
    } else if(dialogueTurn >= getNegotiationDifficulty(client, props.ownedItems)-1 && newTrust>=getClientTrustRequirement(client) && nextGoodTurns >= 2 && Math.random()*100<newChance) {
      const firmCommission = Math.round(client.ticket * client.commissionRate)
      const qualityMultiplier = newTrust >= 75 ? 1.25 : newTrust >= 62 ? 1.1 : 1
      const playerBonus = Math.min(getBusinessPayoutCap(props.businessUpgrades), Math.max(200, Math.round(client.ticket * client.bonusRate * qualityMultiplier)))
      let firstSuccessfulDeal = false
      try {
        firstSuccessfulDeal = localStorage.getItem('arena-os-v2-first-deal-guide-seen-slot-' + (props.saveSlot ?? 1)) !== 'true'
        if (firstSuccessfulDeal) localStorage.setItem('arena-os-v2-first-deal-guide-seen-slot-' + (props.saveSlot ?? 1),'true')
      } catch { firstSuccessfulDeal = completed === 0 }
      setFirstDealGuide(firstSuccessfulDeal)
      props.setCash(v=>v+playerBonus); props.setFirmCapital(v=>v+firmCommission); props.setReputation(v=>Math.min(100,v+2)); props.setXp(v=>v+45)
      setLastPayout(playerBonus); setLastFirmCommission(firmCommission); setLastClientTicket(client.ticket); setLastXpReward(45); setLastReputationReward(Math.min(2,100-props.reputation)); setLastContactName(client.name)
      const referralId = client.id==='alex-vorontsov'?'pavel-smirnov':client.id==='maria-sokolova'?'natalia-orlova':client.id==='pavel-smirnov'?'maksim-sobolev':'igor-melnikov'
      setLastReferralName(CLIENTS.find(person=>person.id===referralId)?.name ?? 'новый контакт')
      setNewContacts(prev=>Array.from(new Set([...prev,client.id,referralId])))
      setCallState('won'); setCompleted(v=>v+1)
      setCallLog(prev=>[...prev,'СДЕЛКА ЗАКРЫТА. Комиссия фирмы: +'+money(firmCommission)+'. Личный бонус: +'+money(playerBonus)+'. Общий доход владельца от сделки: +'+money(firmCommission+playerBonus)+'. Капитал клиента не является доходом фирмы.',client.name+': '+clientClosingLine(client,activeStock!)])
    } else if(newTrust>=getClientTrustRequirement(client) || dialogueTurn < getNegotiationDifficulty(client, props.ownedItems)-1) {
      setCallLog(prev=>[...prev,client.name+': '+clientHesitationLine(client,activeStock!,dialogueTurn)+(newTrust<getClientTrustRequirement(client)?' Доверие '+newTrust+'/100; требуется '+getClientTrustRequirement(client)+'.':'')+(dialogueTurn<getNegotiationDifficulty(client,props.ownedItems)-1?' Одного удачного ответа недостаточно: нужен ещё один существенный аргумент.':'')])
    } else if(newTrust<=8 || newPatience<=8) {
      setCallState('lost'); setLastXpReward(5); setLastReputationReward(-Math.min(2,props.reputation)); setLastFirmCommission(0); setLastClientTicket(0); props.setReputation(v=>Math.max(0,v-2)); props.setXp(v=>v+5)
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
    if(props.ownedOutfits.includes(id)) { props.setSelectedOutfit(id); setNotice('Образ изменён: его бонус зависит от уровня одежды и статуса клиента.'); return }
    if(props.cash<price) { setNotice('Не хватает денег. Сначала заработай на переговорах.'); return }
    props.setCash(v=>v-price); props.setOwnedOutfits(v=>[...v,id]); props.setSelectedOutfit(id); setNotice('Покупка разовая. Ежедневной аренды жилья в игре нет.')
  }
  const buyBusinessUpgrade = (id:string) => {
    const upgrade = BUSINESS_UPGRADES.find(item => item.id === id)
    if (!upgrade || props.businessUpgrades.includes(id)) return
    if (props.day < upgrade.minDay || props.reputation < upgrade.minReputation) { setNotice('Требуется день ' + upgrade.minDay + ' и репутация ' + upgrade.minReputation + '.'); return }
    if (props.firmCapital < upgrade.price) { setNotice('В капитале фирмы не хватает ' + money(upgrade.price - props.firmCapital) + '.'); return }
    props.setFirmCapital(value => Math.max(0, value - upgrade.price))
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
    if (props.firmCapital < asset.price) {
      setNotice('В капитале фирмы не хватает ' + money(asset.price - props.firmCapital) + '. Не трать личный резерв — накопи на актив.')
      return
    }
    props.setFirmCapital(value => Math.max(0, value - asset.price))
    props.setOwnedBusinessAssets(value => [...value, id])
    setNotice('Приобретено: ' + asset.name + '. Чистый доход ' + money(asset.dailyRevenue - asset.dailyCost) + ' начислится после следующего сна.')
  }
  const hireBroker = (id:string) => {
    const employee = BROKER_HIRES.find(item => item.id === id)
    if (!employee || props.ownedEmployees.includes(id)) return
    const officeOpen = props.ownedBusinessAssets.some(assetId => ['broker-team','city-agency','national-network'].includes(assetId))
    const capacity = officeOpen ? 5 : 1
    if (!officeOpen && !props.ownedItems.includes('partner-desk')) { setNotice('Сначала купи второй рабочий стол для квартиры.'); return }
    if (props.ownedEmployees.length >= capacity) { setNotice(officeOpen ? 'В этом офисе уже заняты все 5 рабочих мест.' : 'В квартире помещается только один дополнительный брокер. Купи офис, чтобы расширить команду до пяти сотрудников.'); return }
    if (props.day < employee.minDay || props.reputation < employee.minReputation) { setNotice('Для найма нужны день ' + employee.minDay + ' и репутация ' + employee.minReputation + '.'); return }
    if (props.firmCapital < employee.price) { setNotice('В капитале фирмы не хватает ' + money(employee.price - props.firmCapital) + ' на найм.'); return }
    props.setFirmCapital(value => Math.max(0, value - employee.price))
    props.setOwnedEmployees(value => [...value, id])
    setNotice('В команду принят сотрудник: ' + employee.name + '. Зарплата автоматически вычитается из его выручки; фирме начисляется только чистый остаток +' + money(employee.dailyRevenue - employee.dailySalary) + '.')
  }
  const buyGear = (id:string,price:number) => {
    if(props.ownedItems.includes(id)) { setNotice('Уже куплено.'); return }
    if(props.cash<price) { setNotice('Не хватает денег.'); return }
    props.setCash(v=>v-price); props.setOwnedItems(v=>[...v,id]); setNotice('Куплено навсегда. Ежедневной аренды жилья в игре нет.')
  }
  const nav: {id:AppId;label:string;icon:typeof Laptop}[] = [
    {id:'home',label:'Мой профиль',icon:Laptop},{id:'calls',label:'Брокерская линия',icon:PhoneCall},{id:'market',label:'Биржа',icon:TrendingUp},{id:'business',label:'Развитие бизнеса',icon:Building2},
    {id:'clients',label:'Клиентская база',icon:Users},{id:'wardrobe',label:'Гардероб',icon:ShoppingBag},{id:'equipment',label:'Оборудование',icon:Video},{id:'tasks',label:'Задачи',icon:Check},{id:'housing',label:'Жильё',icon:House}
  ]
  const orderedNav = [...nav].sort((a,b)=>navOrder.indexOf(a.id)-navOrder.indexOf(b.id))
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
  const title = nav.find(n=>n.id===activeApp)?.label ?? 'Мой профиль'
  return <div className="arena-os-v2">
    <header className="arena-os-topbar"><button className="arena-os-back" onClick={props.onClose}>‹ В комнату</button><div className="arena-os-brand"><span className="arena-os-mark">A</span><span><b>ARENA OS</b><small>Персональная рабочая станция</small></span></div><div className="arena-os-system-status"><i/> Система готова <span>·</span> <Clock3 size={14}/> День {props.day}</div><button className="arena-os-close" onClick={props.onClose} aria-label="Закрыть ОС"><X size={17}/></button></header>
    <div className="arena-os-desktop">
      <div className="arena-os-workspace" ref={workspaceRef}>
      <div className="arena-os-desktop-icons">
        {orderedNav.map(item=>{const Icon=item.icon;return <button key={item.id} draggable onDragStart={event=>event.dataTransfer.setData('text/plain',item.id)} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const dragged=event.dataTransfer.getData('text/plain') as AppId;if(dragged===item.id||!navOrder.includes(dragged))return;setNavOrder(prev=>{const next=prev.filter(id=>id!==dragged);next.splice(next.indexOf(item.id),0,dragged);return next})}} className={'arena-os-desktop-icon '+(activeApp===item.id?'selected':'')} onDoubleClick={()=>{setActiveApp(item.id);setWindowOpen(true);setWindowMinimized(false)}} onClick={()=>setActiveApp(item.id)} title="Перетащи, чтобы изменить порядок; двойной щелчок — открыть"><span className={'arena-os-app-icon '+item.id}><Icon size={23}/></span><span>{item.label}</span></button>})}
      </div>
      {windowOpen && <main style={!windowMaximized?{left:windowPosition.x,top:windowPosition.y}:undefined} className={'arena-os-window '+(windowMaximized?'maximized':'restored')+(windowMinimized?' minimized':'')}>
        <div className="arena-os-window-title" onPointerDown={event=>{if(windowMaximized || (event.target as HTMLElement).closest("button"))return;event.preventDefault();windowDragRef.current={pointerX:event.clientX,pointerY:event.clientY,originX:windowPosition.x,originY:windowPosition.y}}}><div><span className={'arena-os-app-icon mini '+activeApp}>{(()=>{const I=nav.find(n=>n.id===activeApp)?.icon??Laptop;return <I size={15}/>})()}</span><b>{title}</b></div><div className="arena-os-window-controls"><button title="Свернуть" onClick={()=>setWindowMinimized(true)}>−</button><button title={windowMaximized?"Восстановить":"Развернуть"} onClick={()=>setWindowMaximized(v=>!v)}>{windowMaximized?"❐":"□"}</button><button title="Закрыть окно" onClick={()=>{setWindowOpen(false);setWindowMinimized(false)}}>×</button></div></div>
        <div className="arena-os-window-content">
          {activeApp==='home' && <section className="arena-os-home"><div className="arena-os-welcome"><div><span className="arena-os-kicker">БРОКЕРСКИЙ ПУЛЬТ · СМЕНА {props.day}</span><h1>Мой профиль брокера</h1><p>Здесь собраны твои деньги, репутация, опыт, результаты сделок и состояние фирмы. Личный бонус — твой доход; комиссия идёт в капитал компании; XP открывает карьерные ранги и новых клиентов. Выбирай следующий шаг и строй брокерский бизнес.</p><button className="arena-os-primary" onClick={()=>{setActiveApp('calls');if(callState!=='active'){setIncoming(false);try{localStorage.setItem('arena-os-v2-first-call','accepted')}catch{}}}}><PhoneCall size={17}/> Открыть линию <ChevronRight size={16}/></button></div><div className="arena-os-home-avatar"><BrokerAvatar3D identity="player" outfit={props.selectedOutfit}/><span className="arena-os-avatar-caption">ТВОЙ ОБРАЗ · {OUTFITS.find(o=>o.id===props.selectedOutfit)?.name}</span></div></div><div className="arena-os-stat-grid"><article><Wallet/><small>Личные деньги</small><strong>{money(props.cash)}</strong></article><article><Building2/><small>Капитал фирмы</small><strong>{money(props.firmCapital)}</strong></article><article><ShieldCheck/><small>Репутация</small><strong>{props.reputation}/100</strong></article><article><Sparkles/><small>Карьерный опыт</small><strong>{props.xp} XP</strong></article><article><Activity/><small>Сделки в этой сессии</small><strong>{completed}</strong></article><article><Users/><small>Контакты в CRM</small><strong>{newContacts.length}</strong></article></div><div className="arena-os-section-heading"><div><span className="arena-os-kicker">БЫСТРЫЙ ДОСТУП</span><h2>Что делаем сегодня?</h2></div></div><div className="arena-os-quick-grid"><button onClick={()=>setActiveApp('market')}><TrendingUp/><b>Изучить акции</b><small>Плюсы, риски и подходящие клиенты</small></button><button onClick={()=>setActiveApp('clients')}><Users/><b>Найти клиента</b><small>{unlockedClients.length} доступно сейчас</small></button><button onClick={()=>setActiveApp('wardrobe')}><ShoppingBag/><b>Обновить образ</b><small>Внешний вид влияет на первое впечатление</small></button></div><section className="arena-os-economy-roadmap"><div className="arena-os-economy-main"><span className="arena-os-kicker">КАРЬЕРА И ЭКОНОМИКА</span><h2>{career.name}</h2><p>{career.goal}</p><div className="arena-os-career-track"><div><span>Прогресс по опыту</span><b>{props.xp} XP{nextCareer? ' / '+nextCareer.min+' XP':' · максимум'}</b></div><div className="arena-os-progress"><i style={{width:careerProgress+'%'}}/></div></div><small>{nextCareer?'Следующий ранг: '+nextCareer.name+'. Прогресс открывает карьерные этапы, а репутация и день определяют доступ к клиентам.':'Верхний ранг достигнут — сосредоточься на сложных клиентах и качестве сделок.'}</small></div><div className="arena-os-economy-next"><span className="arena-os-kicker">СЛЕДУЮЩАЯ ПОКУПКА</span>{nextUpgrade?<><b>{nextUpgrade.name}</b><p>{nextUpgrade.desc}</p><strong>{money(nextUpgrade.price)}</strong><small>{props.cash>=nextUpgrade.price?'Денег хватает. Улучшение покупается один раз.':'Не хватает '+money(nextUpgrade.price-props.cash)+'. Заработай на сделках; ежедневных платежей нет.'}</small><button className="arena-os-secondary" onClick={()=>setActiveApp('equipment')}>Сравнить оборудование</button></>:<><b>Базовый комплект собран</b><p>Дальше накопи на деловой образ или партнёрский костюм — это дополнительный бонус к первому впечатлению, но не замена аргументам.</p><button className="arena-os-secondary" onClick={()=>setActiveApp('wardrobe')}>Открыть гардероб</button></>}</div></section><div className="arena-os-empire-goal"><span className="arena-os-kicker">ГЛАВНАЯ ЦЕЛЬ · РАЗВИТИЕ ФИРМЫ</span><h3>{nextBusinessAsset ? 'Следующий этап: ' + nextBusinessAsset.name : 'Федеральная сеть построена'}</h3><p>{nextBusinessAsset ? 'Цель стоит ' + money(nextBusinessAsset.price) + '. Требования: день ' + nextBusinessAsset.minDay + ' и репутация ' + nextBusinessAsset.minReputation + '. Текущий чистый доход фирмы: ' + money(currentBusinessNetIncome) + '/день. Закрывай сделки, откладывай прибыль и покупай активы по порядку — так доход со временем перестанет зависеть только от твоих звонков.' : 'Фирма приносит ' + money(currentBusinessNetIncome) + '/день чистыми. Дальше можно накапливать личное состояние и улучшать образ жизни.'}</p><button className="arena-os-secondary" onClick={()=>setActiveApp('business')}>Управлять фирмой <ChevronRight size={15}/></button></div></section>}
          {activeApp==='market' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РЫНОЧНЫЙ ТЕРМИНАЛ</span><h1>Каталог акций</h1><p>У каждой идеи есть сильные стороны и неудобные вопросы. Подбирай продукт под клиента, а не наоборот.</p></div><label className="arena-os-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Тикер или компания"/></label></div><div className="arena-os-stock-grid">{STOCKS.filter(s=>(s.name+' '+s.ticker).toLowerCase().includes(query.toLowerCase())).map(s=><article className="arena-os-stock-card" key={s.ticker}><div className="arena-os-stock-top"><span className="arena-os-ticker">{s.ticker}</span><span className={'arena-os-risk '+s.risk}>{s.risk} риск</span></div><h3>{s.name}</h3><strong className="arena-os-stock-price">{money(s.price)}</strong><div className="arena-os-pros"><b>Потенциал</b><p>{s.upside}</p></div><div className="arena-os-cons"><b>Что может пойти не так</b><p>{s.downside}</p></div><small>{s.fit}</small><button className="arena-os-secondary" onClick={()=>{setActiveStock(s);setActiveApp('calls');setWindowOpen(true);setWindowMinimized(false);setStockPicker(false);setNotice('Акция выбрана для обсуждения. Выбери клиента и начни звонок.') }}>Выбрать для переговоров <ChevronRight size={15}/></button></article>)}</div></section>}
          {activeApp==='calls' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">БРОКЕРСКАЯ ЛИНИЯ</span><h1>{callState==='active'?'Видеозвонок с клиентом':callState==='won'?'Сделка закрыта':callState==='lost'?'Звонок завершён':'Клиентская линия'}</h1><p>Клиент оценивает не только акцию, но и то, насколько честно ты говоришь о рисках.</p></div><span className={'arena-os-call-status '+callState}>{callState==='active'?'● В ЭФИРЕ':callState==='won'?'✓ УСПЕХ':callState==='lost'?'● ЗАВЕРШЁН':'● ГОТОВ'}</span></div>
            {callState==='idle' && props.callsToday>=2 && <div className="arena-os-end-shift-card"><div><span className="arena-os-kicker">СМЕНА · МОЖНО ЗАКОНЧИТЬ РАНЬШЕ</span><b>Ты уже провёл {props.callsToday} клиентских звонка</b><p>Можешь продолжить до дневного лимита {dailyCallLimit} или завершить день сейчас и пойти спать. При завершении проверится дневной план: если он не выполнен, фирма потеряет 750 ₽ и репутация снизится на 3.</p></div><button className="arena-os-primary" onClick={props.onEndDay}>Завершить смену <ChevronRight size={15}/></button></div>}
            {callState==='idle' && <div className="arena-os-call-start"><div className="arena-os-client-list"><p style={{margin:"0 0 12px",fontSize:12,lineHeight:1.45,opacity:.82}}>Клиенты среднего уровня требуют гарнитуру и HD-камеру; крупные инвесторы также ждут аккуратный фон. Улучшай связь, чтобы открыть эти контакты. На первых звонках требования мягче.</p>{unlockedClients.slice(0,8).map(c=><button key={c.id} className={'arena-os-client-row '+(clientId===c.id?'active':'')} onClick={()=>setClientId(c.id)}><span className="arena-os-client-avatar"><ClientAvatar2D tier={c.tier} identity={c.id} mood="neutral"/></span><span><b>{c.name}</b><small>{c.profession}</small><em>{c.temperament} · капитал {money(c.budget)}</em></span><ChevronRight size={16}/></button>)}</div><div className="arena-os-call-preview"><div className="arena-os-preview-face"><ClientAvatar2D tier={client.tier} identity={client.id} mood="skeptical"/></div><span className="arena-os-kicker">ВХОДЯЩИЙ КЛИЕНТ</span><h2>{client.name}</h2><p>{client.quote}</p><div className="arena-os-tags"><span>Цель доверия {getClientTrustRequirement(client)}%</span><span>{client.experience}</span><span>{client.temperament}</span></div><button className="arena-os-primary" onClick={()=>startCall(client.id)}><PhoneCall size={17}/> Принять звонок</button></div></div>}
            {callState==='active' && <div className="arena-os-live-call"><div className="arena-os-call-video"><div className="arena-os-video-tile"><span>КЛИЕНТ · {client.name}</span><ClientAvatar2D tier={client.tier} identity={client.id} mood={trust>65?'interested':trust<30?'angry':'skeptical'}/></div><div className="arena-os-video-tile self"><span>ВАША КАМЕРА</span><BrokerWebcamScene identity="player" outfit={props.selectedOutfit} housingId={props.housingId} /><small>{props.ownedItems.includes('hd-camera')?'HD-камера':'Встроенная камера'} · {(props.ownedItems.includes('headset')||props.ownedItems.includes('pro-mic'))?'Внешний микрофон':'Встроенный микрофон'}</small></div></div><div className="arena-os-call-metrics"><div><span>Вероятность сделки</span><b>{lastChance||chance}%</b><div className="arena-os-progress"><i style={{width:(lastChance||chance)+'%'}}/></div><small>{qualityPenalty>0?'Слабое оборудование снижает первое впечатление. ':'Оборудование в порядке. '}{client.tier>=3?'Клиент требовательный: сначала докажи компетентность.':'Ошибки и пустые обещания могут заставить клиента сбросить звонок. Подстрой аргументы под его цель.'}</small></div><div><span>Доверие · цель {getClientTrustRequirement(client)}%</span><b>{trust}/100</b><div className="arena-os-progress trust"><i style={{width:trust+'%'}}/></div></div><div><span>Терпение</span><b>{patience}/100</b><div className="arena-os-progress patience"><i style={{width:patience+'%'}}/></div></div></div>
              <div className="arena-os-dialogue"><div className="arena-os-dialogue-log" ref={dialogueLogRef}>{callLog.slice(-12).map((line,i)=>{const mine=line.startsWith('Ты:');const system=line.startsWith('СДЕЛКА')||line.startsWith('Клиент завершил')||line.startsWith('РАЗБОР')||line.startsWith('ОШИБКА')||line.startsWith('КЛИЕНТ СБРОСИЛ');const body=line.startsWith(client.name+':')?line.slice(client.name.length+1).trim():line.replace(/^(Ты:|СДЕЛКА ЗАКРЫТА\.|Клиент завершил звонок\.|РАЗБОР:|ОШИБКА:)\s*/,'');return <div key={i} className={'arena-os-chat-row '+(mine?'mine':system?'system':'theirs')}>{!mine&&!system&&<span className="arena-os-chat-avatar">{client.initials}</span>}<div className={'arena-os-chat-bubble '+(mine?'player-line':system?'system-line':'client-line')}><small>{mine?'Вы':system?'Итог системы':client.name}</small><p>{body||line}</p><time>{new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time></div></div>})}</div>
                {stockPicker || !activeStock ? <div className="arena-os-stock-picker"><b>Подбери акцию под конкретного человека — не просто под сумму сделки.</b><p className="arena-os-client-goal">Цель: {client.goal}</p><div className="arena-os-call-offer-summary">
                  <div><small>СУММА СДЕЛКИ</small><strong>{money(client.ticket)}</strong><span>из капитала {money(client.budget)}</span></div>
                  <div className="player-estimate"><small>ТВОЙ ВОЗМОЖНЫЙ БОНУС</small><strong>до {money(estimatedBonus)}</strong><span>зависит от доверия и переговоров</span></div>
                  <div><small>ОБЩИЙ ДОХОД СДЕЛКИ</small><strong>{money(estimatedFirmCommission+estimatedBonus)}</strong><span>комиссия компании + бонус владельца</span></div>
                </div>
                <div className="arena-os-client-profile">
                  <div className="arena-os-risk-profile"><small>ПРОФИЛЬ РИСКА</small><strong>{getClientInvestmentPreference(client.id).riskLabel}</strong><span>Горизонт: {getClientInvestmentPreference(client.id).horizon}</span></div>
                  <div><small>ЧТО ЦЕНИТ</small><p>{getClientInvestmentPreference(client.id).priorities.join(' · ')}</p></div>
                  <div><small>ЧЕГО ИЗБЕГАЕТ</small><p>{getClientInvestmentPreference(client.id).avoids.join(' · ')}</p></div>
                </div><div className="arena-os-stock-picker-grid">{STOCKS.map(s=>{const profile=STOCK_PROFILES[s.ticker];const fit=getClientStockFit(client.id,s.ticker);return <button key={s.ticker} className={'arena-os-stock-choice'+(fit.suitable?'':' unsuitable')} style={{'--stock-accent':profile?.color??'#3b82f6'} as React.CSSProperties} onClick={()=>chooseStock(s)}><span className="arena-os-stock-choice-ticker">{s.ticker}</span><b>{s.name}</b><small>{profile?.label??'Инвестиционная идея'} · риск {s.risk.toLowerCase()}</small><em>{fit.suitable?'✓ Подходит профилю':'⚠ Есть несоответствие'}</em><p>{profile?.description??s.fit}</p><small className="arena-os-fit-reason">{fit.reason}</small></button>})}</div></div> : <div className="arena-os-argument-panel"><div className="arena-os-stock-dossier"><b>{activeStock.name} · {activeStock.ticker} · риск: {activeStock.risk.toLowerCase()}</b><p><strong>Чем занимается:</strong> {STOCK_DOSSIERS[activeStock.ticker]?.business ?? activeStock.fit}</p><p><strong>Инвестиционный тезис:</strong> {activeStock.upside}</p><p><strong>Плюсы:</strong></p><ul>{(STOCK_DOSSIERS[activeStock.ticker]?.advantages ?? [activeStock.catalyst]).map(item=><li key={item}>{item}</li>)}</ul><p><strong>Минусы:</strong></p><ul>{(STOCK_DOSSIERS[activeStock.ticker]?.disadvantages ?? [activeStock.downside]).map(item=><li key={item}>{item}</li>)}</ul><p><strong>Финансы:</strong> {activeStock.financials}</p><p><strong>Что может стать драйвером:</strong> {activeStock.catalyst}</p><p><strong>Красные флаги:</strong> {activeStock.redFlags}</p><p><strong>Что проверить в оценке:</strong> {STOCK_DOSSIERS[activeStock.ticker]?.valuation ?? 'Выручку, прибыль, долг и денежный поток.'}</p><p><strong>Горизонт:</strong> {activeStock.horizon}</p><p><strong>Кому подходит:</strong> {activeStock.fit}</p><p><strong>Аргумент для переговоров:</strong> {STOCK_DOSSIERS[activeStock.ticker]?.argument ?? activeStock.upside}</p></div><div className="arena-os-response-actions"><span>Варианты ответа · ход {dialogueTurn+1} · {activeStock.name}</span><div className="arena-os-response-hint">Кнопки меняются по акции и ходу разговора. Выбирай тактику или формулируй свой ответ ниже.</div>{getResponseOptions(activeStock,client,dialogueTurn).map((option,index)=><button key={activeStock.ticker+'-'+dialogueTurn+'-'+index} onClick={()=>respond('free',option.text)}><span className="arena-os-option-index">{String.fromCharCode(65+index)}</span><span><b>{option.label}</b><small>{option.text}</small></span></button>)}</div><form onSubmit={e=>{e.preventDefault();if(message.trim())respond('free',message)}} className="arena-os-free-text"><textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(message.trim())respond('free',message)}}} aria-label="Твой ответ клиенту" maxLength={900} placeholder="Ответь на вопрос клиента своими словами. Enter — отправить, Shift+Enter — новая строка…" rows={2} /><button type="button" className="arena-os-mic-button" onClick={startDictation}><Mic size={14}/> Диктовать</button><button type="submit" disabled={!message.trim()}>Отправить ответ</button></form><small>Ответ не выбирается из трёх реплик: пиши свободно. Клиент реагирует на смысл ответа, выбранную компанию, свою цель и отношение к риску. Это локальная игровая логика, не подключённая языковая модель.</small></div>}
              </div><button className="arena-os-hangup" onClick={()=>{setCallState('idle');setActiveStock(null);setStockPicker(false);setCallLog([])}}><X size={15}/> Завершить звонок</button></div>}
            {(callState==='won'||callState==='lost') && <div className="arena-os-call-result">
              <div className={'arena-os-result-icon '+(callState==='won'?'success':'failure')}>{callState==='won'?<Check size={24}/>:<X size={24}/>}</div>
              <span className="arena-os-kicker">ИТОГ ПЕРЕГОВОРОВ · ДЕНЬ {props.day}</span>
              <h2>{callState==='won'?'Сделка закрыта. Вот что ты получил.':'Сделки нет — вот что изменилось.'}</h2>
              <p>{callState==='won'?'Ты не получил весь капитал клиента: ты заработал личный бонус, а фирма получила комиссию. Клиент сохранил контакт и пообещал рассказать о тебе знакомым.':'Клиент отказался от сделки. Ты получил небольшой опыт за разговор, но потерял часть репутации. Это не денежный штраф с твоего личного баланса.'}</p>
              <div className="arena-os-debrief"><b>О чём договорились</b><p>Клиент: {client.name} · Компания: {activeStock ? activeStock.name+' ('+activeStock.ticker+')' : 'не выбрана'}.</p><p>Доверие: {trust}/100 · Терпение: {patience}/100 · Вероятность сделки на последнем ходе: {lastChance}%.</p><p>{callState==='won'?'Опыт нужен для карьерных рангов и доступа к более требовательным клиентам. Репутация помогает открывать новые контакты. Ни опыт, ни капитал клиента не являются твоими деньгами.':'Перед следующим звонком выбери клиента с подходящими предпочтениями, прочитай досье акции и ответь именно на его возражение — не повторяй одну и ту же заготовку.'}</p></div>
              {callState==='won' ? <>
                <div className="arena-os-result-hero">
                  <div className="primary-earning"><small>ТВОЙ ЛИЧНЫЙ ЗАРАБОТОК</small><strong>+{money(lastPayout)}</strong><p>Бонус за закрытие сделки. Эти деньги добавлены на твой личный баланс.</p></div>
                  <div><small>КОМИССИЯ ФИРМЫ</small><strong>+{money(lastFirmCommission)}</strong><p>Зачислено в капитал фирмы. Эти средства можно потратить на бизнес-улучшения, активы и найм сотрудников.</p></div>
                </div>
                <div className="arena-os-result-metrics">
                  <article><small>КАПИТАЛ КЛИЕНТА</small><b>{money(lastClientTicket)}</b><p>Сумма размещения клиента — не твой заработок.</p></article>
                  <article><small>РЕПУТАЦИЯ</small><b>+{lastReputationReward}</b><p>Помогает открывать новые контакты и сделки.</p></article>
                  <article><small>ОПЫТ БРОКЕРА</small><b>+{lastXpReward} XP</b><p>Продвигает карьерный ранг. XP нельзя потратить как деньги.</p></article>
                  <article><small>КЛИЕНТСКАЯ БАЗА</small><b>{newContacts.length} контактов</b><p>Всего доступно в CRM после рекомендации.</p></article>
                </div>
                <div className="arena-os-contact-unlock"><Users size={22}/><div><b>{lastContactName} рекомендует тебя знакомым</b><p>В разговоре клиент согласился поделиться контактом. Новый потенциальный клиент: <strong>{lastReferralName}</strong>. Открой клиентскую базу, чтобы посмотреть его профиль и выбрать следующий звонок.</p></div></div>
                {!props.companyName.trim() ? <form className="arena-os-firm-naming" onSubmit={event=>{event.preventDefault();const name=companyNameDraft.trim().slice(0,42);if(name){props.setCompanyName(name);setNotice('Фирма «'+name+'» зарегистрирована в твоей карьере.')}}}><span className="arena-os-kicker">СЛЕДУЮЩИЙ ШАГ · ТВОЯ ФИРМА</span><h3>Дай брокерской фирме название</h3><p>Это название появится в профиле, разделе команды и отчётах. Оно не даёт бонусов само по себе — репутацию нужно заработать.</p><input value={companyNameDraft} onChange={event=>setCompanyNameDraft(event.target.value)} maxLength={42} placeholder="Например, ООО «Бычий огурец»"/><button className="arena-os-primary" type="submit" disabled={!companyNameDraft.trim()}>Сохранить название</button></form> : <div className="arena-os-firm-banner"><span className="arena-os-kicker">ТВОЯ БРОКЕРСКАЯ ФИРМА</span><strong>{props.companyName}</strong><p>Следующая цель — реинвестировать комиссию в развитие компании, не путая её с личными деньгами.</p></div>}
                {firstDealGuide && <div className="arena-os-note"><Sparkles size={18}/><p>Первый заработок получен. Начни с оборудования, которое можешь оплатить без обнуления резерва. Дополнительный стол стоит {money(GEAR.find(item=>item.id==='partner-desk')?.price ?? 5800)} и открывает найм первого сотрудника.</p><button className="arena-os-secondary" onClick={()=>setFirstDealGuide(false)}>Понятно</button></div>}
                <div className="arena-os-next-actions">
                  <button onClick={()=>setActiveApp('equipment')}><ShoppingBag size={18}/> Купить оборудование</button>
                  <button onClick={()=>setActiveApp('clients')}><Users size={18}/> Открыть клиентскую базу</button>
                  <button onClick={()=>setActiveApp('business')}><Building2 size={18}/> Развивать фирму</button>
                </div>
              </> : <>
                <div className="arena-os-result-hero">
                  <div><small>ЛИЧНЫЙ ЗАРАБОТОК</small><strong>0 ₽</strong><p>Сделка не закрыта, бонус не начислен.</p></div>
                  <div><small>ЧТО ИЗМЕНИЛОСЬ</small><strong>{lastXpReward} XP</strong><p>Опыт за попытку сохранён; репутация изменилась на {lastReputationReward}.</p></div>
                </div>
                <div className="arena-os-next-actions">
                  <button onClick={()=>{setActiveApp('market');setStockPicker(true)}}><TrendingUp size={18}/> Пересмотреть акцию</button>
                  <button onClick={()=>setActiveApp('clients')}><Users size={18}/> Выбрать другого клиента</button>
                  <button onClick={()=>{setCallState('idle');setActiveStock(null);setStockPicker(true);setCallLog([]);setActiveApp('calls')}}><PhoneCall size={18}/> Попробовать снова</button>
                </div>
              </>}
              <button className="arena-os-primary arena-os-next-client-button" onClick={()=>{setCallState('idle');setActiveStock(null);setStockPicker(true);setCallLog([]);setActiveApp('calls')}}>Следующий клиент <ChevronRight size={16}/></button>
            </div>}
          </section>}
          {activeApp==='clients' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">CRM · КЛИЕНТСКАЯ БАЗА</span><h1>Люди, а не кошельки</h1><p>У каждого клиента свои ожидания. Более высокий капитал не означает лёгкую сделку.</p></div><span className="arena-os-count">{unlockedClients.length} открыто / {CLIENTS.length}</span></div><div className="arena-os-all-clients">{CLIENTS.map(c=>{const open=newContacts.includes(c.id)||(c.minDay<=props.day&&c.minReputation<=props.reputation)||(props.businessUpgrades.includes('lead-network')&&c.minDay<=props.day+2&&c.minReputation<=props.reputation+10)||(props.businessUpgrades.includes('client-crm')&&c.minDay<=props.day+3&&c.minReputation<=props.reputation+15);return <article key={c.id} className={open?'':'locked'}><div className="arena-os-small-face"><ClientAvatar2D tier={c.tier} identity={c.id} mood="neutral"/></div><div><b>{open?c.name:'Закрытый контакт'}</b><small>{c.profession}</small><p>{open?c.goal:'Откроется на '+c.minDay+' дне при репутации '+c.minReputation+'.'}</p><span>{c.temperament} · {c.experience}</span></div><strong>{open?money(c.budget):<ShieldCheck size={17}/>}</strong><button disabled={!open} onClick={()=>{setClientId(c.id);setActiveApp('calls')}}>{open?'Выбрать':'Закрыт'}</button></article>})}</div></section>}
          {activeApp==='wardrobe' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">ARENA STYLE</span><h1>Гардероб</h1><p>Покупаешь один раз. Образ меняет первое впечатление, но не заменяет компетентность.</p></div><span className="arena-os-count">Текущий образ: {OUTFITS.find(o=>o.id===props.selectedOutfit)?.name}</span></div><div className="arena-os-outfit-grid">{OUTFITS.map(o=><article key={o.id} className={props.selectedOutfit===o.id?'equipped':''}><div className="arena-os-outfit-preview"><BrokerAvatar3D identity="player" outfit={o.id}/></div><h3>{o.name}</h3><p>{o.desc}</p><div className="arena-os-item-foot"><b>{money(o.price)}</b><span>+{o.bonus} к первому впечатлению</span></div><button className={props.ownedOutfits.includes(o.id)?'arena-os-secondary':'arena-os-primary'} onClick={()=>buyOutfit(o.id,o.price)}>{props.selectedOutfit===o.id?'Надето':props.ownedOutfits.includes(o.id)?'Надеть': 'Купить один раз'}</button></article>)}</div></section>}
          {activeApp==='equipment' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">РАБОЧЕЕ МЕСТО</span><h1>Оборудование</h1><p>Оборудование меняет качество связи и первое впечатление; дополнительный стол физически появляется в комнате и открывает найм.</p></div><span className="arena-os-count">Качество связи: {Math.max(0,100-qualityPenalty*4)}%</span></div><div className="arena-os-gear-grid">{GEAR.map(g=>{const owned=props.ownedItems.includes(g.id);return <article key={g.id} className={owned?'owned':''}><div className={'arena-os-gear-art gear-art-'+g.icon}><GearIllustration type={g.icon}/></div><div><h3>{g.name}</h3><p>{g.desc}</p><span>{g.icon==='desk'?'Отдельное рабочее место · открывает найм':'+'+g.bonus+' к качеству переговоров'}</span></div><button disabled={owned} onClick={()=>buyGear(g.id,g.price)}>{owned?<><Check size={15}/> Куплено</>:<>Купить · {money(g.price)}</>}</button></article>})}</div><div className="arena-os-note"><ShieldCheck size={18}/><p>Владение жильём не создаёт ежедневных расходов. Деньги уходят только на выбранные покупки; заработок зависит от сделок, а не от ожидания таймера аренды.</p></div></section>}
          {activeApp==='business' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">МАСШТАБИРОВАНИЕ · БРОКЕРСКИЙ БИЗНЕС</span><h1>От одиночки к брокерской фирме</h1><p>Вкладывай заработанное в источники лидов, аналитику и клиентский сервис. Улучшения открывают больше возможностей, но не превращают каждую сделку в джекпот.</p></div><span className="arena-os-count">Улучшено: {props.businessUpgrades.length}/{BUSINESS_UPGRADES.length}</span></div><div className="arena-os-business-summary"><div><small>КАПИТАЛ ФИРМЫ</small><b>{money(props.firmCapital)}</b><small>ЛИЧНЫЕ ДЕНЬГИ</small><b>{money(props.cash)}</b></div><div><small>ЗВОНКОВ СЕГОДНЯ</small><b>{props.callsToday}/{dailyCallLimit}</b></div><div><small>ПОТОЛОК БОНУСА</small><b>{money(getBusinessPayoutCap(props.businessUpgrades))}</b></div></div><div className="arena-os-staff-section"><div className="arena-os-page-heading"><div><span className="arena-os-kicker">МАСШТАБИРОВАНИЕ · НАЙМ</span><h2>{props.companyName.trim() || 'Твоя брокерская фирма'} · Команда</h2><p>Купи второй стол, найми первого брокера и получай чистый ежедневный доход. Зарплата автоматически вычитается из его выручки: в твой баланс поступает только остаток. В квартире доступно 1 место для сотрудника; покупка «Команды брокеров» открывает офис на 5 мест.</p></div><span className="arena-os-count">Сотрудники: {props.ownedEmployees.length}/{staffCapacity}</span></div><div className="arena-os-staff-summary"><div><small>ВЫРУЧКА СОТРУДНИКОВ / ДЕНЬ</small><b>{money(BROKER_HIRES.filter(e=>props.ownedEmployees.includes(e.id)).reduce((sum,e)=>sum+e.dailyRevenue,0))}</b></div><div><small>ЗАРПЛАТЫ / ДЕНЬ</small><b>{money(BROKER_HIRES.filter(e=>props.ownedEmployees.includes(e.id)).reduce((sum,e)=>sum+e.dailySalary,0))}</b></div><div><small>ЧИСТЫЙ ДОХОД / ДЕНЬ</small><b>+{money(currentStaffNetIncome)}</b></div></div><div className="arena-os-staff-grid">{BROKER_HIRES.map(employee=>{const owned=props.ownedEmployees.includes(employee.id);const officeOpen=props.ownedBusinessAssets.some(id=>['broker-team','city-agency','national-network'].includes(id));const full=props.ownedEmployees.length>=staffCapacity;const deskNeeded=!officeOpen&&!props.ownedItems.includes('partner-desk');const locked=props.day<employee.minDay||props.reputation<employee.minReputation;const affordable=props.firmCapital>=employee.price;return <article key={employee.id} className={owned?'owned':''}><div className="arena-os-staff-avatar"><BrokerAvatar3D identity={employee.id} outfit={employee.id==='junior-broker'?'intern':employee.id==='team-lead'?'premium':'classic'}/></div><div className="arena-os-staff-copy"><h3>{employee.name}</h3><p>{employee.description}</p><div className="arena-os-asset-finances"><span>Выручка <b>{money(employee.dailyRevenue)}/день</b></span><span>Зарплата <b>{money(employee.dailySalary)}/день</b></span><strong>Чистыми <b>+{money(employee.dailyRevenue-employee.dailySalary)}/день</b></strong></div><small>{owned?'Работает в команде':deskNeeded?'Сначала купи второй рабочий стол':full?'Нет свободных рабочих мест':locked?'Откроется с '+employee.minDay+' дня при репутации '+employee.minReputation:affordable?'Можно нанять':'Не хватает '+money(employee.price-props.firmCapital)}</small><button className={owned?'arena-os-secondary':'arena-os-primary'} disabled={owned||full||deskNeeded||locked||!affordable} onClick={()=>hireBroker(employee.id)}>{owned?'Нанят':deskNeeded?'Нужен второй стол':full?'Нужно больше места':locked?'Пока закрыт':affordable?'Нанять · '+money(employee.price):'Нужно накопить'}</button></div></article>})}</div></div><div className="arena-os-business-grid">{BUSINESS_UPGRADES.map((upgrade,index)=>{const owned=props.businessUpgrades.includes(upgrade.id);const locked=props.day<upgrade.minDay||props.reputation<upgrade.minReputation;const canAfford=props.firmCapital>=upgrade.price;return <article key={upgrade.id} className={'arena-os-business-card'+(owned?' owned':'')}><div className="arena-os-business-icon">{index===0?<Users/>:index===1?<Activity/>:index===2?<TrendingUp/>:<Building2/>}<span>ЭТАП 0{index+1}</span></div><div className="arena-os-business-copy"><h3>{upgrade.name}</h3><p>{upgrade.description}</p><div className="arena-os-business-effect"><Check size={14}/><span>{upgrade.effect}</span></div><div className="arena-os-business-cap">Предел бонуса за сделку <b>{money(upgrade.payoutCap)}</b></div><small>{owned?'Улучшение установлено':locked?'Откроется с '+upgrade.minDay+' дня при репутации '+upgrade.minReputation:canAfford?'Доступно для покупки':'Не хватает '+money(upgrade.price-props.firmCapital)}</small><button className={owned?'arena-os-secondary':'arena-os-primary'} disabled={owned||locked||!canAfford} onClick={()=>buyBusinessUpgrade(upgrade.id)}>{owned?'Установлено':locked?'Пока закрыто':canAfford?'Инвестировать · '+money(upgrade.price):'Нужно накопить'}</button></div></article>})}</div><div className="arena-os-note"><Building2 size={18}/><p>Улучшения помогают лично тебе закрывать сделки. Следующий уровень — покупать активы фирмы: они приносят регулярный доход, но требуют первоначальных вложений и ежедневных расходов.</p></div>
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
    const canAfford=props.firmCapital>=asset.price
    const net=asset.dailyRevenue-asset.dailyCost
    return <article key={asset.id} className={'arena-os-business-card arena-os-asset-card'+(owned?' owned':'')}>
      <div className="arena-os-business-icon"><Building2/><span>ЭТАП 0{index+1}</span></div>
      <div className="arena-os-business-copy"><h3>{asset.name}</h3><p>{asset.description}</p>
      <div className="arena-os-asset-finances"><span>Доход <b>{money(asset.dailyRevenue)}/день</b></span><span>Расходы <b>{money(asset.dailyCost)}/день</b></span><strong>Чистыми <b>+{money(net)}/день</b></strong></div>
      <div className="arena-os-business-effect"><Check size={14}/><span>{asset.effect}</span></div>
      <small>{owned?'Актив работает и приносит доход':prerequisiteMissing?'Сначала купи предыдущий этап':locked?'Откроется с '+asset.minDay+' дня при репутации '+asset.minReputation:canAfford?'Можно приобрести':'Не хватает '+money(asset.price-props.firmCapital)}</small>
      <button className={owned?'arena-os-secondary':'arena-os-primary'} disabled={owned||locked||prerequisiteMissing||!canAfford} onClick={()=>buyBusinessAsset(asset.id)}>{owned?'Работает · куплено':locked?'Пока закрыто':prerequisiteMissing?'Нужен предыдущий этап':canAfford?'Купить актив · '+money(asset.price):'Нужно накопить'}</button>
      </div>
    </article>
  })}</div>
  <div className="arena-os-empire-goal"><span className="arena-os-kicker">ДОЛГОСРОЧНАЯ ЦЕЛЬ</span><h3>{props.ownedBusinessAssets.includes('national-network')?'Ты построил федеральную брокерскую сеть':'Следующая цель: '+(BUSINESS_ASSETS.find(a=>!props.ownedBusinessAssets.includes(a.id))?.name??'Федеральная сеть')}</h3><p>{props.ownedBusinessAssets.includes('national-network')?'Теперь заработок позволяет содержать большую фирму, улучшать жильё и собирать личное состояние.':'Сделки дают стартовый капитал. Активы создают регулярный доход. Этот доход помогает оплатить команду, жильё и следующий этап расширения — так ты перестаёшь зависеть только от собственных звонков.'}</p></div>
</div></section>}
          {activeApp==='housing' && <section><div className="arena-os-page-heading"><div><span className="arena-os-kicker">КАРЬЕРА · НОВЫЙ УРОВЕНЬ</span><h1>Жильё и рабочая среда</h1><p>Переезд мгновенно меняет локацию. Комфорт помогает сохранять терпение клиента, а первое впечатление влияет на доверие. Квартиры оплачиваются разово; офис арендуется за 1 200 ₽ за игровой день из капитала фирмы.</p></div><span className="arena-os-count">Сейчас: {currentHousing.name}</span></div><div className="arena-os-housing-grid">{HOUSING.map((home,index)=>{const current=home.id===props.housingId;const locked=props.day<home.minDay||props.reputation<home.minReputation;const canAfford=props.cash>=home.price;return <article key={home.id} className={'arena-os-housing-card'+(current?' current':'')}><div className={'arena-os-housing-art housing-art-'+home.id}><House size={30}/><span>УРОВЕНЬ {index+1}</span></div><div className="arena-os-housing-copy"><h3>{home.name}</h3><p>{home.description}</p><div className="arena-os-housing-stats"><span>Комфорт <b>+{home.comfort}</b></span><span>Первое впечатление <b>{home.firstImpression>0?'+':''}{home.firstImpression}</b></span></div><strong className="arena-os-housing-price">{home.price===0?'Стартовое жильё':money(home.price)}</strong><small>{current?'Ты уже здесь':locked?'Откроется на '+home.minDay+' дне при репутации '+home.minReputation+'.':canAfford?'Можно переехать сейчас':'Не хватает '+money(home.price-props.cash)}</small><button className={current?'arena-os-secondary':'arena-os-primary'} disabled={current||locked||!canAfford} onClick={()=>{if(current||locked||!canAfford)return;props.setCash(value=>value-home.price);props.setHousingId(home.id);setNotice('Переезд оформлен. Сейчас ты автоматически переместишься в новое жильё.')}}>{current?'Текущее жильё':locked?'Пока закрыто':canAfford?'Переехать':'Нужно накопить'}</button></div></article>})}</div><div className="arena-os-note"><House size={18}/><p>Текущее жильё: <b>{currentHousing.name}</b>. Его влияние на первое впечатление учитывается в переговорах. После закрытия ARENA OS увидишь соответствующий интерьер комнаты. Квартиры не создают ежедневных платежей. Офис — исключение: 1 200 ₽ аренды в конце игрового дня списывается из капитала фирмы. Учитывай это, прежде чем расширять команду.</p></div></section>}
          {activeApp==='tasks' && <section>
            <div className="arena-os-page-heading"><div><span className="arena-os-kicker">ПЛАН КАРЬЕРЫ · ДЕНЬ {props.day}</span><h1>Что делать дальше</h1><p>Каждая задача объясняет цель, награду или пользу и следующий конкретный шаг. Не нужно угадывать, зачем тебе опыт или куда тратить заработанное.</p></div><span className="arena-os-count">{completed} сделок в этой сессии</span></div>
            <div className="arena-os-task-list">
              <article><PhoneCall/><div><b>{completed===0?'Закрыть первую сделку':'Провести следующую качественную сделку'}</b><p>Открой линию, выбери клиента и подбери акцию под его профиль риска. Личный бонус поступит тебе, комиссия — фирме; капитал клиента не является твоим доходом.</p><small>Награда: личный бонус, комиссия фирме, репутация и XP за карьерный прогресс.</small></div><button onClick={()=>setActiveApp('calls')}>Открыть линию</button></article>
              <article><ShoppingBag/><div><b>{props.ownedItems.includes('headset')?'Рабочая связь улучшена':'Улучшить связь и рабочее место'}</b><p>{props.ownedItems.includes('headset')?'Гарнитура уже куплена. Следующий полезный предмет — дополнительный стол за '+money(GEAR.find(item=>item.id==='partner-desk')?.price ?? 5800)+', который открывает найм первого сотрудника.':'Гарнитура стоит '+money(GEAR.find(item=>item.id==='headset')?.price ?? 4500)+' и улучшает качество связи. Дополнительный стол стоит '+money(GEAR.find(item=>item.id==='partner-desk')?.price ?? 5800)+' и открывает найм сотрудника.'}</p><small>Покупки разовые. Сначала оставь резерв на следующие сделки.</small></div><button onClick={()=>setActiveApp('equipment')}>Сравнить товары</button></article>
              <article><Users/><div><b>Развивать клиентскую базу</b><p>Сейчас в CRM {newContacts.length} контактов. После успешной сделки клиент может порекомендовать тебя знакомому; новые люди открываются по мере роста репутации и дня карьеры.</p><small>Польза: больше клиентов и больше возможностей для сделок, а не мгновенная выплата.</small></div><button onClick={()=>setActiveApp('clients')}>Открыть CRM</button></article>
              <article><Building2/><div><b>{nextBusinessAsset?'Следующий этап фирмы: '+nextBusinessAsset.name:'Брокерская сеть построена'}</b><p>{nextBusinessAsset?'Цель стоит '+money(nextBusinessAsset.price)+'. Открывается с '+nextBusinessAsset.minDay+' дня при репутации '+nextBusinessAsset.minReputation+'. Текущий капитал фирмы: '+money(props.firmCapital)+'.':'Фирма прошла основные этапы. Теперь можно вкладывать прибыль в команду и улучшать образ жизни.'}</p><small>Комиссия сделки и ежедневная чистая прибыль активов идут на баланс фирмы, не на личный счёт.</small></div><button onClick={()=>setActiveApp('business')}>Развивать фирму</button></article>
              <article><House/><div><b>{currentHousing.id==='studio'?'Накопить на хорошую квартиру':'Следующий уровень жилья'}</b><p>{currentHousing.id==='studio'?'Хорошая квартира стоит '+money(HOUSING.find(home=>home.id==='city-apartment')?.price ?? 65000)+'. Она улучшит комфорт и первое впечатление клиента. Сейчас: '+money(props.cash)+'.':'Текущее жильё: '+currentHousing.name+'. Более высокий уровень улучшает комфорт и первое впечатление; офис меняет саму локацию, а апартаменты открывают статусный интерьер.'}</p><small>Жильё влияет на атмосферу и доверие, но не заменяет аргументы в переговорах.</small></div><button onClick={()=>setActiveApp('housing')}>Посмотреть жильё</button></article>
            </div>
          </section>}
        </div>

      </main>}
      </div>
      <footer className="arena-os-taskbar"><button className={'arena-os-start '+(startMenuOpen?'active':'')} onClick={()=>setStartMenuOpen(v=>!v)} aria-label="Открыть меню Пуск">⊞</button><span className="arena-os-taskbar-label">АРЕНА ОС</span>{orderedNav.filter(n=>n.id!=='home').map(n=>{const I=n.icon;return <button key={n.id} className={activeApp===n.id?'active':''} title={n.label} onClick={()=>{setActiveApp(n.id);setWindowOpen(true);setWindowMinimized(false)}}><I size={17}/></button>})}<span className="arena-os-taskbar-spacer"/>{soundPanelOpen && <div className="arena-os-volume-panel"><strong>Звук игры</strong><label>Общая громкость <b>{gameVolume}%</b></label><input aria-label="Общая громкость игры" type="range" min="0" max="100" value={gameVolume} onChange={e=>setGameVolume(Number(e.target.value))}/><button className="arena-os-sound-toggle" onClick={()=>props.setSoundEnabled(value=>!value)}>{props.soundEnabled?'Выключить все звуки':'Включить звуки'}</button><small>Громкость и включение звука применяются ко всей игре.</small></div>}<span className="arena-os-tray"><span className="arena-os-online-dot"/> <button className="arena-os-volume-toggle" onClick={()=>setSoundPanelOpen(v=>!v)} aria-label="Настроить громкость" title="Громкость игры">{props.soundEnabled?'🔊':'🔇'}</button><Clock3 size={14}/><b>{gameClockLabel}</b></span></footer>
    </div>
    {startMenuOpen && <div className="arena-os-start-menu"><div className="arena-os-start-menu-heading"><span className="arena-os-mark">A</span><div><b>ARENA OS</b><small>Рабочая станция</small></div></div><div className="arena-os-start-menu-grid">{orderedNav.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>{setActiveApp(item.id);setStartMenuOpen(false);setWindowOpen(true);setWindowMinimized(false)}}><span className={'arena-os-app-icon '+item.id}><Icon size={19}/></span><span>{item.label}</span></button>})}</div><div className="arena-os-start-menu-footer"><span>День {props.day} · {money(props.cash)}</span><button onClick={props.onClose}>Выйти из системы</button></div></div>}
    {notice && <div className="arena-os-toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {incoming && <div className="arena-os-incoming-backdrop"><section className="arena-os-incoming-modal"><div className="arena-os-incoming-icon"><PhoneCall size={25}/></div><span className="arena-os-kicker">БРОКЕРСКАЯ ЛИНИЯ · ВХОДЯЩИЙ ЗВОНОК</span><h2>Тебе звонят.</h2><p>Первый клиент уже на линии. Прими вызов, оцени ситуацию и выбери акцию, которую сможешь защитить аргументами.</p><div className="arena-os-incoming-client"><div className="arena-os-incoming-face"><ClientAvatar2D tier={0} identity="alex-vorontsov" mood="neutral"/></div><div><b>{(CLIENTS.find(c=>c.id==='alex-vorontsov')??CLIENTS[0]).name}</b><small>Первичный контакт · потенциальный клиент</small></div><span className="arena-os-ringing">● ● ●</span></div><button className="arena-os-primary" onClick={()=>{setIncoming(false);setActiveApp('calls');setWindowOpen(true);setWindowMinimized(false);startCall('alex-vorontsov')}}><PhoneCall size={17}/> Принять вызов</button><button className="arena-os-incoming-dismiss" onClick={()=>{setIncoming(false);setActiveApp('calls');setWindowOpen(true);setWindowMinimized(false)}}>Открыть рабочий стол</button></section></div>}
  </div>
}
