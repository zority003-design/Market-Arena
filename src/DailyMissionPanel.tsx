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
  cash: number
  reputation: number
  housingId: string
  onOpenResearch?: () => void
}

const MISSION_QUOTES = [
  '«У нас не проблема с рисками. У нас есть презентация, в которой они выглядят управляемыми».',
  '«Не обещай клиенту Луну. Сначала уточни, оформлена ли она на нашу холдинговую компанию».',
  '«Профессионал не скрывает слабые места. Он первым называет их и объясняет, почему клиент всё ещё слушает».',
  '«План продаж — это не просьба. Это число, которое завтра будет смотреть на тебя с экрана начальника».',
]

export default function DailyMissionPanel({ company, day, quotaShares, quotaAmount, soldShares, soldAmount, cash, reputation, housingId, onOpenResearch }: DailyMissionProps) {
  const progress = Math.min(100, Math.round((soldShares / Math.max(1, quotaShares)) * 100))
  const remaining = Math.max(0, quotaShares - soldShares)
  const quote = MISSION_QUOTES[(day - 1) % MISSION_QUOTES.length]
  const careerMilestone = reputation < 25
    ? { title: 'Заработай доверие первых клиентов', detail: 'Говори о рисках честно и доведи репутацию минимум до 25.' }
    : housingId === 'dorm'
      ? { title: 'Переезжай из общежития', detail: 'Отложи 12 000 ₽ на комнату в общей квартире. Помни: жильё увеличит ежедневные расходы.' }
      : reputation < 40
        ? { title: 'Открой клиентов среднего уровня', detail: 'Подними репутацию до 40, чтобы перейти к более крупным сделкам.' }
        : cash < 135000
          ? { title: 'Накопи на хорошую квартиру', detail: 'Цель — 135 000 ₽. Не трать весь капитал на одежду: оборудование помогает переговорам.' }
          : reputation < 65
            ? { title: 'Стань брокером высокого уровня', detail: 'Доведи репутацию до 65 и удерживай стабильные результаты по плану.' }
            : cash < 480000
              ? { title: 'Собери капитал для премиального уровня', detail: 'Крупные клиенты ждут уверенности, но дорогой образ не заменяет цифры.' }
              : { title: 'Следующая вершина — собственный офис', detail: 'Ты уже накопил серьёзный капитал. Дальнейшая карьерная цель — открыть собственную брокерскую фирму.' }
  return (
    <section className="daily-mission-panel" aria-label="Задание на рабочий день">
      <div className="daily-mission-topline">
        <span className="daily-mission-stamp">ЗАДАНИЕ №{String(day).padStart(2, '0')}</span>
        <span className="daily-mission-priority"><i /> ПЛАН ОТДЕЛА ПРОДАЖ</span>
      </div>
      <div className="daily-mission-heading">
        <div>
          <div className="daily-mission-kicker">ЦЕЛЬ НА СЕГОДНЯ</div>
          <h3>Продать {quotaShares.toLocaleString('ru-RU')} акций «{company.name}»</h3>
          <p>Не просто уговори клиента. Разберись в бизнесе, используй сильные стороны и не развались на первом вопросе о рисках.</p>
        </div>
        <div className="daily-mission-target"><strong>{quotaAmount.toLocaleString('ru-RU')} ₽</strong><span>ПЛАНОВЫЙ ОБОРОТ</span></div>
      </div>
      <div className="daily-mission-progress">
        <div className="daily-mission-progress-copy"><span>Выполнено: <b>{soldShares} / {quotaShares} акций</b></span><span>{progress}%</span></div>
        <div className="daily-mission-track"><span style={{ width: progress + '%' }} /></div>
        <div className="daily-mission-foot"><span>Осталось продать: <b>{remaining} шт.</b></span><span>Оборот: {soldAmount.toLocaleString('ru-RU')} ₽</span></div>
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
      <div className="career-roadmap" aria-label="Долгосрочная цель карьеры">
        <div className="career-roadmap-heading"><span>ДОЛГОСРОЧНАЯ ЦЕЛЬ</span><strong>Из маленькой комнаты — в собственный брокерский офис</strong></div>
        <div className="career-roadmap-path"><span className={housingId === 'dorm' ? 'active' : 'complete'}>Комната</span><i>→</i><span className={housingId === 'shared-flat' ? 'active' : ['studio','city-apartment','premium-apartment'].includes(housingId) ? 'complete' : ''}>Отдельное жильё</span><i>→</i><span className={reputation >= 40 ? 'complete' : reputation >= 25 ? 'active' : ''}>Крупные клиенты</span><i>→</i><span className={cash >= 480000 && reputation >= 65 ? 'active' : ''}>Свой офис</span></div>
        <div className="career-roadmap-next"><span>СЛЕДУЮЩИЙ РУБЕЖ</span><strong>{careerMilestone.title}</strong><p>{careerMilestone.detail}</p></div>
        <small className="career-roadmap-note">Офис — финальная цель карьерной системы; покупка и управление офисом будут отдельной игровой механикой.</small>
      </div>
    </section>
  )
}
