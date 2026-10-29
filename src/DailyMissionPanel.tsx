type MissionCompany = {
  ticker: string
  name: string
  sector: string
  description: string
  advantages: string
  risks: string
  price: string
  risk: string
}

type DailyMissionProps = {
  company: MissionCompany
  day: number
  quotaShares: number
  quotaAmount: number
  soldShares: number
  soldAmount: number
  onOpenResearch?: () => void
}

const MISSION_QUOTES = [
  '«У нас не проблема с рисками. У нас есть презентация, в которой они выглядят управляемыми».',
  '«Не обещай клиенту Луну. Сначала уточни, оформлена ли она на нашу холдинговую компанию».',
  '«Профессионал не скрывает слабые места. Он первым называет их и объясняет, почему клиент всё ещё слушает».',
  '«План продаж — это не просьба. Это число, которое завтра будет смотреть на тебя с экрана начальника».',
]

export default function DailyMissionPanel({ company, day, quotaShares, quotaAmount, soldShares, soldAmount, onOpenResearch }: DailyMissionProps) {
  const progress = Math.min(100, Math.round((soldShares / Math.max(1, quotaShares)) * 100))
  const remaining = Math.max(0, quotaShares - soldShares)
  const quote = MISSION_QUOTES[(day - 1) % MISSION_QUOTES.length]
  return (
    <section className="daily-mission-panel" aria-label="Задание на рабочий день">
      <div className="daily-mission-topline">
        <span className="daily-mission-stamp">ЗАДАНИЕ №{String(day).padStart(2, '0')}</span>
        <span className="daily-mission-priority"><i /> ПЛАН ОТДЕЛА ПРОДАЖ</span>
      </div>
      <div className="daily-mission-heading">
        <div>
          <div className="daily-mission-kicker">ЦЕЛЬ НА СЕГОДНЯ</div>
          <h3>Фокус дня: {company.name}</h3>
          <p>Изучи эту компанию перед звонками. Ориентир по объёму — {quotaShares.toLocaleString('ru-RU')} акций, а премия зависит от общего оборота по всем успешным сделкам.</p>
        </div>
        <div className="daily-mission-target"><strong>{quotaAmount.toLocaleString('ru-RU')} ₽</strong><span>ПЛАНОВЫЙ ОБОРОТ</span></div>
      </div>
      <div className="daily-mission-progress">
        <div className="daily-mission-progress-copy"><span>Общий объём: <b>{soldShares} / {quotaShares} акций</b></span><span>{progress}%</span></div>
        <div className="daily-mission-track"><span style={{ width: progress + '%' }} /></div>
        <div className="daily-mission-foot"><span>До ориентира осталось: <b>{remaining} шт.</b></span><span>Оборот: {soldAmount.toLocaleString('ru-RU')} ₽</span></div>
      </div>
      <div className="daily-mission-company">
        <div className="daily-mission-company-mark">{company.ticker.slice(0, 2)}</div>
        <div className="daily-mission-company-copy"><strong>{company.name} <small>{company.ticker}</small></strong><span>{company.sector} · риск: {company.risk.toLowerCase()}</span><p>{company.description}</p></div>
        {onOpenResearch && <button type="button" className="daily-mission-research" onClick={onOpenResearch}>Изучить компанию ↗</button>}
      </div>
      <div className="daily-mission-brief-grid">
        <div className="daily-mission-brief-pro"><span>АРГУМЕНТЫ В ТВОЮ ПОЛЬЗУ</span><p>{company.advantages}</p></div>
        <div className="daily-mission-brief-con"><span>ВОЗРАЖЕНИЯ, КОТОРЫЕ ЖДЁМ</span><p>{company.risks}</p></div>
      </div>
      <div className="daily-mission-boss-quote"><span>СЛОВА РУКОВОДИТЕЛЯ</span><p>{quote}</p></div>
      <div className="daily-mission-steps">
        <div><b>01</b><span><strong>Подготовься</strong><small>Запомни 2 сильных аргумента и 1 реальный риск</small></span></div>
        <div><b>02</b><span><strong>Установи контакт</strong><small>Пойми, чего клиент боится и что ему важно</small></span></div>
        <div><b>03</b><span><strong>Закрой сделку</strong><small>Отвечай по делу — пустые гарантии вредят репутации</small></span></div>
      </div>
    </section>
  )
}
