export type NegotiationClientContext = {
  id: string
  goal: string
  quote: string
  temperament: string
  tier: number
  ticket?: number
  budget?: number
}

export type NegotiationChoice = {
  label: string
  delta: number
  kind: 'pilot' | 'staged' | 'wait'
}

type StrategicChoiceInput = {
  sourceChoices: [string, string, string]
  ticker: string
  companyName: string
  companyRisk: string
  hint: string
  turn: number
  client: NegotiationClientContext
  trust: number
  newsImpact: number
}

const normalize = (value: string) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е')

/**
 * Turns a scenario's three canned answers into three genuinely different
 * investment decisions. Each option has an opportunity cost; no answer is
 * universally optimal and the order is shuffled by the caller.
 */
export function createStrategicChoices(input: StrategicChoiceInput): NegotiationChoice[] {
  const { sourceChoices, ticker, companyName, companyRisk, hint, turn, client, trust, newsImpact } = input
  const profile = normalize(client.goal + ' ' + client.quote + ' ' + client.temperament)
  const risk = normalize(companyRisk)
  const cautious = /сохран|не потер|резерв|безопас|осторож|ликвид|стабиль|сохранить капитал/.test(profile)
  const growthSeeking = /рост|доходност|прибыл|заработ|увелич|агрессив|риск|капитал/.test(profile) && !cautious
  const liquidityNeed = /быстро|срочно|ликвид|снять|вернуть|оборотн|понадоб/.test(profile)
  const highRisk = /высок|очень/.test(risk)
  const lowRisk = /низк/.test(risk)
  const lowTrust = trust < 38
  const expensiveTicket = (client.ticket ?? 0) >= 10000 || (client.budget ?? 0) >= 50000
  const negativeNews = newsImpact <= -1
  const positiveNews = newsImpact >= 1
  const company = companyName || ticker

  const pilotDelta =
    5 +
    (growthSeeking ? 2 : 0) +
    (positiveNews ? 1 : 0) -
    (negativeNews ? 2 : 0) -
    (highRisk && cautious ? 4 : 0) -
    (expensiveTicket && lowTrust ? 2 : 0) -
    (turn === 2 ? 1 : 0)

  const stagedDelta =
    5 +
    (cautious ? 2 : 0) +
    (lowTrust ? 2 : 0) +
    (expensiveTicket ? 1 : 0) +
    (turn === 2 || turn === 3 ? 1 : 0) -
    (positiveNews && growthSeeking ? 1 : 0)

  const waitDelta =
    2 +
    (cautious ? 3 : 0) +
    (negativeNews ? 3 : 0) +
    (liquidityNeed ? 2 : 0) +
    (highRisk && lowTrust ? 2 : 0) -
    (growthSeeking ? 3 : 0) -
    (lowRisk && positiveNews ? 2 : 0)

  return [
    {
      kind: 'pilot',
      delta: clamp(pilotDelta),
      label: `«Открыть небольшую позицию сейчас. ${sourceChoices[0]} Начнём с ограниченной доли капитала: если следующий сигнал подтвердит тезис, увеличим её. Цена решения — часть денег окажется под рыночным риском уже сегодня».`,
    },
    {
      kind: 'staged',
      delta: clamp(stagedDelta),
      label: `«Входить поэтапно. ${sourceChoices[2]} Первую часть разместим сейчас, вторую — только после проверки: ${hint.toLocaleLowerCase('ru')} Это уменьшит цену ошибки, но мы можем купить дороже, если котировка уйдёт вверх».`,
    },
    {
      kind: 'wait',
      delta: clamp(waitDelta),
      label: `«Пока не покупать ${company}. Сначала дождёмся подтверждения: ${hint.toLocaleLowerCase('ru')} Так мы сохраним ликвидность и не будем платить за неопределённость; обратная сторона — можем пропустить рост и остаться без сделки сегодня».`,
    },
  ]
}

function clamp(value: number) {
  return Math.max(-8, Math.min(9, value))
}
