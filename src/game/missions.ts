export type DailyMissionBrief = {
  ticker: string
  title: string
  briefing: string
  pitchAngle: string
  riskToOwn: string
  challengeTitle: string
  challenge: string
  deskJoke: string
}

type MissionSeed = Omit<DailyMissionBrief, 'ticker' | 'challengeTitle' | 'challenge' | 'deskJoke'>

const COMPANY_MISSIONS: Record<string, MissionSeed> = {
  KOTL: {
    title: 'Роботы на словах, прибыль потом',
    briefing: 'Клиент видел новость о тестировании 800 роботов. Контракт ещё не подписан: продай перспективу, но не выдавай переговоры за гарантированный заказ.',
    pitchAngle: 'Рост заказов и возможность масштабировать доставку без пропорционального роста расходов.',
    riskToOwn: 'Чистый убыток, затраты на обслуживание и зависимость от крупного неподтверждённого контракта.',
  },
  OGUR: {
    title: 'Огурец без золотой кожуры',
    briefing: 'Клиенту надоели обещания «иксов». Покажи, почему прибыльный производитель напитков может быть полезен спокойному портфелю, не называя его безрисковым.',
    pitchAngle: 'Положительная прибыль, узнаваемая линейка и повторяющиеся каналы продаж.',
    riskToOwn: 'Подорожание сырья и упаковки, конкуренция за полку и умеренный рост.',
  },
  TAPK: {
    title: 'Умные тапочки, глупые возвраты',
    briefing: 'В новостях растут возвраты, а руководство обещает обновление. Клиент хочет понять, не пытаешься ли ты продать ему проблему в красивой коробке.',
    pitchAngle: 'Низкая цена входа и шанс на улучшение продукта после подтверждённого исправления.',
    riskToOwn: 'Большой убыток, возвраты и отсутствие доказательств, что новая версия решит проблему.',
  },
  DUST: {
    title: 'Пыль, контракты и не слишком быстрый рост',
    briefing: 'Клиент считает уборку скучным бизнесом. Объясни ценность долгосрочных контрактов, но не путай стабильный спрос с быстрым ростом котировки.',
    pitchAngle: 'Положительная прибыль и долгосрочные контракты на обслуживание.',
    riskToOwn: 'Медленный рост и давление зарплат и себестоимости на маржу.',
  },
  BTRAN: {
    title: 'Банан Транс: не всё золото, что на заправке',
    briefing: 'Сеть расширяется, но закупочные цены топлива скачут. Убедительно раздели выручку от топлива, магазинов и сервисов — количество вывесок само по себе не равно прибыли.',
    pitchAngle: 'Широкая сеть, повторяющийся спрос и дополнительные продажи в магазинах и сервисах.',
    riskToOwn: 'Сжатие маржи, расходы на станции и конкуренция со стороны новых видов транспорта.',
  },
}

const CHALLENGES = [
  {
    title: 'Признай слабость первым',
    description: 'Назови один конкретный риск и объясни, какой показатель заставит пересмотреть инвестиционную идею.',
  },
  {
    title: 'Продавай человеку, а не тикеру',
    description: 'Свяжи преимущество компании с целью этого клиента. Одинаковая презентация не подходит всем.',
  },
  {
    title: 'Никаких золотых гор',
    description: 'Не обещай доходность. Объясни, что может пойти не так и почему клиент всё равно может рассмотреть эту идею.',
  },
]

const DESK_JOKES = [
  'Правило начальника: если график выглядит как кардиограмма после трёх эспрессо, сначала проверь новости.',
  'В переговорной побеждают факты. Харизма помогает только донести их, а не заменить.',
  'Помни: слово «гарантированно» уже один раз обанкротило кофемашину в соседнем отделе.',
]

/**
 * The daily ticker is assigned by the shift, not chosen in the call screen.
 * The brief is deterministic so the player can plan and reload a saved career
 * without receiving a different assignment for the same day.
 */
export function getDailyMission(day: number, ticker: string): DailyMissionBrief {
  const seed = COMPANY_MISSIONS[ticker] ?? COMPANY_MISSIONS.KOTL
  const cycle = Math.max(0, Math.floor((day - 1) / 5))
  const challenge = CHALLENGES[(day - 1) % CHALLENGES.length]
  const suffix = cycle === 0 ? 'Первичный питч' : cycle === 1 ? 'Повторный контакт' : 'Проверка на прочность'

  return {
    ...seed,
    ticker: COMPANY_MISSIONS[ticker] ? ticker : 'KOTL',
    title: seed.title + ' · ' + suffix,
    challengeTitle: challenge.title,
    challenge: challenge.description,
    deskJoke: DESK_JOKES[(day - 1) % DESK_JOKES.length],
  }
}
