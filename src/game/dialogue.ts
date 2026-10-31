import type { ClientProfile } from './economy'

type DialogueStock = {
  name: string
  ticker: string
  upside: string
  downside: string
  catalyst: string
  redFlags: string
}

type DialogueResult = { delta: number; reply: string; equipmentPenalty?: number }

const normalize = (value: string) => value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()

function clientVoice(client: ClientProfile) {
  const temperament = normalize(client.temperament)
  if (/осторож|недовер|скептич/.test(temperament)) return 'skeptic'
  if (/любозн|любопыт/.test(temperament)) return 'curious'
  if (/требователь|аналит|дотош|холодно/.test(temperament)) return 'analyst'
  if (/занят|прямолин|нетерпел/.test(temperament)) return 'busy'
  if (/импульсив|эмоцион|азарт/.test(temperament)) return 'impulsive'
  if (/торгу/.test(temperament)) return 'bargainer'
  if (/статус/.test(temperament)) return 'status'
  return 'dry'
}

function equipmentIssue(client: ClientProfile, ownedItems: string[], turn: number) {
  const clientName = client.name || 'Клиент'
  const hasMic = ownedItems.includes('headset') || ownedItems.includes('pro-mic')
  const hasCamera = ownedItems.includes('hd-camera')
  const hasBackground = ownedItems.includes('neutral-backdrop') || ownedItems.includes('chromakey-kit')
  const hasLight = ownedItems.includes('desk-lamp') || ownedItems.includes('ring-light')
  const issues: Array<{ key: string; line: string; penalty: number }> = []
  if (!hasMic) issues.push({ key: 'mic', penalty: client.tier >= 2 ? 4 : 2, line: [
    '«Простите, вы сказали “денежный поток” или “денежный кот”? У меня в наушниках сейчас финансовый джаз».',
    '«Я слышу вас так, будто вы звоните из стиральной машины. Можно цифры ещё раз, но уже из цивилизации?»',
    '«Звук хрипит. Если это специальный эффект для разговора о рисках — получилось слишком убедительно».',
  ][(clientName.length + turn) % 3] })
  if (!hasCamera) issues.push({ key: 'camera', penalty: client.tier >= 2 || client.statusSensitive ? 4 : 2, line: [
    '«Камера показывает вас в разрешении “свидетель под защитой”. Для крупной сделки хотелось бы увидеть лицо, а не легенду».',
    '«У вас лицо распалось на пиксели. Надеюсь, финансовая модель собрана лучше, чем изображение».',
    '«Картинка такая мыльная, что я уже не уверен, вы брокер или воспоминание о брокере».',
  ][(clientName.length + turn + 1) % 3] })
  if (!hasBackground && (client.tier >= 2 || client.statusSensitive)) issues.push({ key: 'background', penalty: 2, line: [
    '«На заднем плане сушится полотенце. Это диверсификация интерьера или часть инвестиционной стратегии?»',
    '«Вижу сушилку, коробки и, кажется, финансовую независимость. Давайте хотя бы начнём с цифр».',
    '«Обстановка домашняя. Я не против удалёнки, но кот на шкафу выглядит старшим партнёром вашей фирмы».',
  ][(clientName.length + turn + 2) % 3] })
  if (!hasLight && client.tier >= 3) issues.push({ key: 'light', penalty: 1, line: '«У вас лицо в тени. Это драматическая подача риска или просто пора купить лампу?»' })
  if (!issues.length) return null
  // Missing equipment matters, but it should not interrupt every single turn.
  const chosen = issues[(clientName.length + turn) % issues.length]
  if (turn === 0 || (turn + clientName.length) % 3 !== 0) return null
  return chosen
}

export function getEquipmentOpening(client: ClientProfile, ownedItems: string[] = []) {
  const hasMic = ownedItems.includes('headset') || ownedItems.includes('pro-mic')
  const hasCamera = ownedItems.includes('hd-camera')
  const hasBackground = ownedItems.includes('neutral-backdrop') || ownedItems.includes('chromakey-kit')
  const lines: string[] = []
  if (!hasMic) lines.push(client.tier >= 2
    ? 'Клиент: «Звук глухой. Я привык принимать решения по цифрам, а не по археологическим раскопкам в аудиодорожке».'
    : 'Клиент: «У вас микрофон звучит так, будто он должен мне денег. Повторите, пожалуйста, последнее предложение».')
  if (!hasCamera) lines.push(client.tier >= 2 || client.statusSensitive
    ? 'Клиент: «Картинка мыльная. Для крупного капитала хотелось бы видеть собеседника, а не пиксельную реконструкцию».'
    : 'Клиент: «Вы немного размыты. Это видеосвязь или мой прогноз на следующий квартал?»')
  if (!hasBackground && (client.tier >= 2 || client.statusSensitive)) lines.push('Клиент оглядывается: «Вижу домашний офис. Надеюсь, кот за кадром не отвечает за комплаенс».')
  // Keep the opening lively without flooding the chat with three complaints at once.
  return lines.slice(0, client.tier >= 2 ? 2 : 1)
}

export type NegotiationContext = { trust?: number; patience?: number }

function simplifyForBeginner(reply: string, client: ClientProfile, text: string) {
  if (client.tier > 1) return reply
  const s = normalize(text)
  const hasRisk = /риск|долг|убыт|потер|паден|комисс|минус|сниз|налог|просад|не гарант|конкурен|расход|санкц/.test(s)
  const hasBenefit = /рост|прибыл|выруч|спрос|контракт|потенциал|дивиденд|продаж|клиент|проект|продукт|доход|заработ/.test(s)
  const hasPlan = /если|когда|срок|стоп|выход|сравн|провер|отчет|контрол|частями|резерв|продад|план/.test(s)
  const promise = /гарантирую|гарантированно выраст|без риска|не может упасть|верняк|беспроигрыш/.test(s)
  const joke = /шут|ха-ха|хаха|юмор|мем|кот|пиксел|магия|единорог/.test(s)
  if (promise) return 'Клиент: «Не обещай мне, что я точно заработаю. Такого никто не знает. Лучше скажи, что может пойти не так».'
  if (joke) return 'Клиент: «Ха, шутка засчитана! Теперь по делу: почему эта компания может быть хорошей покупкой и что в ней опасно?»'
  if (hasRisk && hasBenefit && hasPlan) return 'Клиент: «Вот так понятнее: ты назвал и пользу, и риск, и план. А что будем делать, если цена пойдёт вниз?»'
  if (hasRisk && hasBenefit) return 'Клиент: «Хорошо, ты рассказал и о хорошем, и о плохом. Как мы поймём, что пора передумать?»'
  if (hasRisk) return 'Клиент: «Спасибо, что не скрываешь плохие стороны. А теперь объясни: почему эта компания вообще может заработать?»'
  if (hasBenefit && hasPlan) return 'Клиент: «Звучит неплохо. Но что может помешать этому плану? Объясни без сложных слов».'
  if (hasBenefit) return 'Клиент: «Интересно. А что может помешать компании добиться этого? Не хочу слышать только хорошие новости».'
  if (hasPlan) return 'Клиент: «План есть. Объясни проще: на чём компания зарабатывает и что может ей помешать?»'
  if (/\?|почему|как |сколько|что если|какой|какая|какие|когда|зачем/.test(s)) return 'Клиент: «Хороший вопрос. Давай разберёмся вместе: что нам нужно узнать перед тем, как вкладывать деньги?»'
  return 'Клиент: «Я не совсем понял. Объясни как другу: чем занимается компания, как она зарабатывает и что может пойти не так?»'
}

export function getNegotiationDifficulty(client: ClientProfile, ownedItems: string[]) {
  const mic = ownedItems.includes('headset') || ownedItems.includes('pro-mic')
  const camera = ownedItems.includes('hd-camera')
  const background = ownedItems.includes('neutral-backdrop') || ownedItems.includes('chromakey-kit')
  const missing = Number(!mic) + Number(!camera) + Number(!background)
  return Math.max(3, Math.min(8, 3 + Math.ceil(client.tier / 1.5) + missing))
}

export function evaluateFreeReply(
  text: string, client: ClientProfile, stock: DialogueStock | null, turn = 0,
  ownedItems: string[] = [], context: NegotiationContext = {},
): DialogueResult {
  const clientName = client.name || 'Клиент'
  const s = normalize(text)
  const temperament = normalize(client.temperament)
  const voice = clientVoice(client)
  const hasRisk = /риск|долг|убыт|потер|волат|гарант|паден|комисс|минус|сниз|сценари|ликвид|ограничен|нестабил|непредсказ|резерв|налог|просад|не обещ|не гарант|конкурен|расход|возврат|санкц|зависим|дефицит|неудач/.test(s)
  const hasUpside = /рост|вырос|прибыл|выруч|спрос|контракт|потенциал|развити|дивиденд|рынок|продаж|расшир|драйвер|преимущ|долгосроч|увелич|клиент|проект|продукт|марж|денежн|эффектив|рентабель|стабиль|сокращ|новый заказ|катализатор|доход/.test(s)
  const hasPlan = /если|когда|порог|лимит|доля|срок|пересмотр|стоп|выход|сравн|провер|отчет|контрол|раздел|частями|резерв|диверсиф|при услов|не подтверд|зафиксир|продад|ограничим|каждый квартал|раз в месяц|план/.test(s)
  const hasQuestion = /\?|почему|как |сколько|что если|какой|какая|какие|когда|зачем/.test(s)
  const rejectsGuarantee = /не\s+(?:гарантир|обещ)|никаких гарантий|гарантий нет|не могу обещать|не обещаю/.test(s)
  const promises = !rejectsGuarantee && /гарантирую|гарантированно выраст|точно вырастет|без риска|не может упасть|железно|сто процентов|100\s*%|удвоим|верняк|беспроигрыш|гарантированн(?:ый|ая|ое) доход/.test(s)
  const nonsense = /инопланет|космос|ляля|бред|единорог|попугай|магия|проклят|сатан|похорон|морг|кладбищ|труп|покойник|золотой унитаз|котол[её]т|единорог|ждун|шаман|космич/.test(s)
  const joke = /шут|ха-ха|хаха|юмор|мем|похорон|морг|кладбищ|труп|покойник|котол[её]т|золотой унитаз|кот|сушилк|стиральн|пиксел/.test(s)
  const concrete = /\d|%|руб|₽|миллион|тысяч|срок|отч[её]т|выруч|долг|марж|прибыл|контракт|квартал|месяц|год|пункт/.test(s)
  const goal = normalize(client.goal)
  const needsLiquidity = /быстро|ликвид|замороз|понадоб|оборотн|вернуть|снять/.test(goal + ' ' + normalize(client.quote))
  const needsSafety = /сохран|не потер|резерв|риск|налог|комисс|худш|провал/.test(goal + ' ' + normalize(client.quote))
  let delta = -3
  let reply = ''

  if (!s) return { delta: -2, reply: '«Алло? Связь есть, аргумента пока нет. Я пока не списываю это в убыток, но секундомер уже начал нервничать».' }

  if (promises) {
    delta = -16
    reply = [
      '«Гарантированная доходность? Красный флаг в золотой рамке. Осталось гарантировать, что мой бухгалтер не расплачется. Покажите риск и условия выхода».',
      '«Рынок не подписывал с вами договор о росте. Уберите магию из презентации и назовите сценарий убытка».',
      '«Слово “гарантирую” прозвучало громче сирены. Кто покрывает убыток и где это написано?»',
    ][Math.abs(turn) % 3]
  } else if (nonsense && !(hasUpside && hasRisk)) {
    delta = joke ? -4 : -7
    reply = [
      '«Шутка принята. Финансовый директор внутри моей головы сейчас просит вызвать взрослого. Вернёмся к бизнесу».',
      '«Это звучит как питч после трёх энергетиков и одного очень странного сна. Где выручка, риск и план?»',
      '«Ставлю шутке 8/10, инвестиционному обоснованию — “приложите документ”. Что приносит компании деньги?»',
      '«Креатив засчитан. Но я вкладываю деньги, а не подписываюсь на сезон вашего подкаста. Где факты?»',
    ][Math.abs(turn + clientName.length) % 4]
  } else if (hasRisk && hasUpside && hasPlan) {
    delta = concrete ? 13 : 10
    const proof = stock ? stock.catalyst : 'квартальные отчёты и денежный поток'
    const failure = stock ? stock.redFlags : 'ухудшение выручки и рост долга'
    reply = voice === 'analyst'
      ? `«Вот это уже можно занести в таблицу, а не в книгу пожеланий. Проверяем ${proof.toLowerCase()}, а при ${failure.toLowerCase()} пересматриваем тезис. Какой показатель контролируем первым?»`
      : voice === 'busy'
        ? `«Коротко, конкретно, с планом выхода — вы только что сэкономили мне кофе-брейк. Проверяем ${proof.toLowerCase()}; при ${failure.toLowerCase()} пересматриваем позицию. Срок контроля?»`
        : `«Есть драйвер, риск и план, а не молитва котировке. Проверяем ${proof.toLowerCase()}, а при ${failure.toLowerCase()} меняем решение. Какой срок контроля ставим?»`
  } else if (hasRisk && hasUpside) {
    delta = concrete ? 10 : 8
    reply = voice === 'skeptic'
      ? `«Наконец-то вы не продаёте мне бессмертие в рассрочку. ${stock ? stock.name + ': ' + stock.catalyst : 'Теперь нужен проверяемый катализатор'}. А что первым сломает эту историю: ${stock ? stock.downside.toLowerCase() : 'какой конкретный риск'}?»`
      : `«Потенциал и обратная сторона в одном разговоре — редкий вид финансовой брокерской фауны. ${stock ? stock.name + ': ' + stock.catalyst : 'Теперь нужен проверяемый катализатор'}. Что заставит вас признать, что тезис не работает?»`
  } else if (hasRisk && hasPlan) {
    delta = 8
    reply = needsLiquidity
      ? '«План выхода есть — хорошо. Мне бы хотелось, чтобы деньги не оказались в отпуске без обратного билета. За какой срок проверим результат и как быстро можно выйти?»'
      : `«Вы хотя бы предусмотрели аварийный выход — уже лучше, чем “держим, пока не позеленеет”. ${stock ? stock.catalyst : 'Какой показатель должен улучшиться'}? Что делаем, если он ухудшится?»`
  } else if (hasUpside && hasPlan) {
    delta = 8
    reply = `«Есть идея и план, но не хватает честной обратной стороны. ${stock ? stock.name + ' может столкнуться с тем, что ' + stock.downside.toLowerCase() : 'Что именно способно сорвать прогноз?'} Назовите условие, при котором вы измените рекомендацию».`
  } else if (hasRisk) {
    delta = 5
    reply = voice === 'curious'
      ? `«Спасибо, что не прячете риск под ковёр. А теперь расскажите, за счёт чего идея вообще может сработать: ${stock ? stock.upside : 'какой здесь главный драйвер'}?»`
      : `«Риск назван — это плюс. Но одним тормозом машину не разгонишь. ${stock ? stock.name + ': ' + stock.upside : 'За счёт чего идея может сработать'} Что здесь главный драйвер?»`
  } else if (hasUpside) {
    delta = concrete ? 6 : 4
    reply = needsSafety
      ? `«Потенциал услышал, но моя цель — не потерять контроль над деньгами. ${stock ? stock.name + ': риск в том, что ' + stock.downside.toLowerCase() : 'Назовите наиболее вероятный способ потерять деньги'}. Как ограничим ущерб?»`
      : `«Рост выручки — хорошая новость, но котировка не обязана аплодировать. ${stock ? 'Красный флаг по ' + stock.name + ': ' + stock.redFlags : 'Какие факты опровергнут идею?'} Что заставит вас передумать?»`
  } else if (hasPlan) {
    delta = 2
    reply = '«План действий есть, но пока это инструкция к шкафу без самого шкафа. Что именно должно улучшиться в бизнесе и почему рынок может этого не заметить?»'
  } else if (joke) {
    delta = voice === 'dry' ? 0 : -2
    reply = voice === 'impulsive'
      ? '«Ха! Ладно, вы хотя бы живой человек. Теперь серьёзно: где деньги, где риск и как не купить билет на финансовые американские горки без ремня?»'
      : '«Улыбнулся. Комиссию за стендап не плачу, но шанс на второй раунд дам. Свяжите шутку с выручкой, риском и проверяемым фактом».'
  } else if (hasQuestion) {
    delta = 0
    reply = `«Вопрос хороший — но я нанял брокера не для того, чтобы мы вместе искали ответы в интернете. Моя цель: ${client.goal.toLowerCase()}. Как эта идея помогает и где её слабое место?»`
  } else {
    delta = -2
    reply = [
      `«Я услышал слова, но не инвестиционную мысль. Моя цель — ${client.goal.toLowerCase()}. Объясните, почему ${stock ? stock.name : 'эта компания'} может сработать и что способно испортить план».`,
      `«Сейчас это было похоже на трейлер к фильму: интрига есть, сюжета пока нет. Моя цель — ${client.goal.toLowerCase()}. Дайте главный аргумент и главный риск».`,
      `«Я записал это в категорию “звучит уверенно”. Теперь нужна категория “можно проверить”. Моя цель — ${client.goal.toLowerCase()}; что вы предлагаете?»`,
    ][Math.abs(turn + clientName.length) % 3]
  }



  if (stock && /конкур|клиент|продукт|спрос|контракт|выруч|рынок|марж|денежн/.test(s) && hasUpside) delta += 1
  if ((voice === 'skeptic') && !hasRisk) delta -= 2
  if ((voice === 'busy') && text.length > 280) {
    delta -= 2
    reply = `«Я просил две фразы, а получил аудиокнигу с бонусной главой. Моя цель — ${client.goal.toLowerCase()}. Главный аргумент и главный риск — коротко».`
  }
  if ((voice === 'analyst') && !concrete) delta -= 2
  if (voice === 'impulsive' && hasRisk && hasPlan) delta += 2

  if (!promises && !nonsense) {
    const opening =
      temperament.includes('осторож') ? 'Давайте без обещаний: ' :
      temperament.includes('соревнов') ? 'Сравню результат с рынком: ' :
      temperament.includes('аналит') || temperament.includes('холодно') ? 'Зафиксирую допущения: ' :
      temperament.includes('дотош') ? 'Запишу это в расчёт: ' :
      temperament.includes('требователь') ? 'Зафиксирую критерии: ' :
      temperament.includes('занят') ? 'Коротко, пожалуйста: ' :
      temperament.includes('любозн') || temperament.includes('любопыт') ? 'Хочу понять механику: ' :
      temperament.includes('деловая') ? 'Мне важен практический результат: ' :
      temperament.includes('статус') ? 'Мне нужен отчёт для партнёров: ' :
      temperament.includes('торгу') ? 'А теперь к условиям: ' : ''
    if (opening) reply = reply.replace(/^«/, '«' + opening)
  }

  // Repeated turns ask a new, client-relevant question instead of appending the same lecture.
  if (!promises && !nonsense && turn > 0) {
    const followUps = [
      stock ? `И контрольный вопрос: ${stock.downside} Какой сигнал покажет, что риск уже материализуется?` : 'Какой сигнал покажет, что главный риск уже материализуется?',
      `С учётом цели «${client.goal.toLowerCase()}», какую часть капитала разумно оставить в резерве?`,
      stock ? `Что должно произойти, чтобы подтвердился катализатор: ${stock.catalyst.toLowerCase()}?` : 'Какой факт подтвердит, что идея работает?',
      stock ? `Назовите красный флаг: ${stock.redFlags.toLowerCase()}. При каком условии вы откажетесь от рекомендации?` : 'При каком условии вы откажетесь от рекомендации?',
      'А если у конкурента окажется предложение дешевле и проще — почему клиенту останется смысл в этой идее?',
    ]
    const followUp = followUps[Math.abs(turn + clientName.length) % followUps.length]
    const lastQuestion = reply.lastIndexOf('?')
    // Replace the previous generic question instead of stacking two questions into a wall of text.
    reply = lastQuestion >= 0
      ? reply.slice(0, lastQuestion).trimEnd() + ' ' + followUp + '»'
      : reply.replace(/[»”]$/, '') + ' ' + followUp + '»'
  }

  const trust = Math.max(0, Math.min(100, context.trust ?? client.baseTrust))
  const patience = Math.max(0, Math.min(100, context.patience ?? client.patience))
  if (trust < 30 && !hasRisk) { delta -= 3; reply = reply.replace(/[»”]$/, '') + ' «После прошлых ответов я пока не готов верить на слово. Назовите риск и конкретный сигнал, по которому мы заметим, что он реализуется».»' }
  else if (trust >= 65 && hasRisk && hasPlan) delta += 2
  if (client.ticket >= 10000 || client.budget >= 50000) {
    if (!concrete) delta -= 2
    if (turn >= 2 && !(hasRisk && hasPlan)) reply = reply.replace(/[»”]$/, '') + ' «Для такой суммы мне недостаточно общего впечатления. Сравните идею с альтернативой, назовите цену ошибки и объясните, при каком факте вы сами откажетесь от сделки».»'
  }
  if (patience < 25 && text.length > 160) { delta -= 2; reply = reply.replace(/[»”]$/, '') + ' «Я теряю терпение. Ответьте на последнее возражение в паре ясных предложений».»' }

  // A small "conversation memory" layer adds occasional company-specific satire.
  // It deliberately runs only on selected later turns so the joke never replaces the actual negotiation logic.
  if (!promises && !nonsense && turn > 0 && turn % 3 === 2) {
    const ticker = normalize(stock?.ticker ?? '')
    const company = normalize(stock?.name ?? '')
    const companyAsides: Record<string, string[]> = {
      kotl: [
        '«У застройщика даже воздух продаётся по плану рассрочки. Проверим, не включили ли в прогноз ещё и балконы соседнего дома».',
        '«У проекта три этажа долга и один этаж обещаний. Давайте посмотрим, что уже построено в отчётности».',
        '«Красивый рендер не платит проценты банку. Это, к сожалению, пока не признали отдельным классом активов».',
      ],
      vect: [
        '«Подписка на медицину полезна, пока пациент возвращается и клиника получает свою долю».',
        '«Данные о здоровье — не обычная таблица. Ошибка безопасности может стоить дороже рекламной кампании».',
        '«Платформа растёт, но проверьте, не держится ли она на двух крупных клиниках».',
      ],
      dust: [
        '«Дата-центр может быть заполнен серверами и всё равно недозагружен клиентами».',
        '«Серверы потребляют электричество даже тогда, когда финансовый директор предпочёл бы тишину».',
        '«Капитальные затраты на облако приходят раньше, чем прибыль от подписки».',
      ],
      tapk: [
        '«График смен полезен, если администратор открывает его каждую неделю, а не только на демо».',
        '«Пробный период закончился. Самое интересное — кто продолжил платить».',
        '«Подписной сервис должен экономить время клиента, иначе таблица снова победит».',
      ],
      grov: [
        '«Маркетплейс может продавать всё, кроме отрицательной маржи на доставке».',
        '«Скидка привела покупателя. Теперь проверим, вернулся ли он без скидки».',
        '«Оборот площадки и прибыль площадки — две разные строки отчёта».',
      ],
      grid: [
        '«Сеть служит десятилетиями, а тариф утверждают на конкретный период. Горизонты нужно согласовать».',
        '«Батарея на презентации хранит энергию. В модели она должна хранить ещё и остаточную стоимость».',
        '«Нужная инфраструктура не всегда означает быструю окупаемость».',
      ],
      byte: [
        '«Подписка продлевается, пока продукт решает задачу клиента лучше альтернативы».',
        '«Новая функция не становится выручкой до тех пор, пока клиент не согласился за неё платить».',
        '«Большой контракт выглядит красиво, пока не посчитали внедрение и поддержку».',
      ],
      logi: [
        '«Плотность маршрута часто важнее количества машин на парковке».',
        '«Посылка может доехать вовремя, но прибыль — потеряться на последней миле».',
        '«Сортировочный центр не должен работать на полную мощность только в декабре».',
      ],
      neft: [
        '«Нефть умеет дорожать и дешеветь без согласования с нашим квартальным планом. Заложим это в сценарии».',
        '«Скважина может качать сырьё, но не бесконечный оптимизм аналитического отдела. Нужен денежный поток».',
        '«Геология — наука о слоях. Корпоративный долг тоже иногда открывает новые слои, когда копнёшь глубже».',
      ],
      btran: [
        '«Логистика учит главному: если маршрут прибыльный только без пробок, это не бизнес-модель, а мечта диспетчера».',
        '«Топливо дорожает, шины изнашиваются, а презентация всё ещё обещает вечный рост. Проверим маржу».',
        '«У транспорта есть пробег, у долга — срок погашения. Оба показателя опасно игнорировать до дыма из-под капота».',
      ],
      dust: [
        '«Дата-центр может быть заполнен серверами и всё равно недозагружен клиентами».',
        '«Серверы потребляют электричество даже тогда, когда финансовый директор предпочёл бы тишину».',
        '«Капитальные затраты на облако приходят раньше, чем прибыль от подписки».',
      ],
    }
    const key = ticker.includes('kotl') || company.includes('котол') ? 'kotl'
      : ticker.includes('vect') || company.includes('вектор') ? 'vect'
      : ticker.includes('neft') || company.includes('нефть') ? 'neft'
      : ticker.includes('btran') || company.includes('транс') ? 'btran'
      : ticker.includes('dust') || company.includes('атлас') ? 'dust'
      : ticker.includes('tapk') || company.includes('сменафлоу') ? 'tapk'
      : ticker.includes('grov') || company.includes('маркеткруг') ? 'grov'
      : ticker.includes('grid') || company.includes('вольтсеть') ? 'grid'
      : ticker.includes('byte') || company.includes('кодклауд') ? 'byte'
      : ticker.includes('logi') || company.includes('грузлайн') ? 'logi' : ''
    const voiceAsides: Record<string, string[]> = {
      skeptic: [
        '«Я не против оптимизма. Я против того, чтобы оптимизм был единственным активом на балансе».',
        '«В корпоративной сказке все риски живут за пределами презентации. Давайте пригласим их обратно в комнату».',
        '«Если план держится на слове “обычно”, я хочу увидеть, что происходит в тот самый необычный день».',
      ],
      analyst: [
        '«Отлично, теперь это можно проверить. В отличие от обещания, таблица хотя бы оставляет следы».',
        '«Пожалуйста, без магии в модели: она плохо проходит аудит и ещё хуже объясняется акционерам».',
        '«Самый дорогой корпоративный ритуал — защищать прогноз после того, как факты его опровергли».',
      ],
      busy: [
        '«У меня ещё три звонка и один экзистенциальный кризис. Давайте хотя бы цифры не заставлять ждать».',
        '«Сделайте вывод коротким: у меня календарь забит встречами, на которых все делают вид, что есть время».',
        '«Люблю решения на одной странице. Особенно когда плохие новости не спрятаны на странице сорок семь».',
      ],
      status: [
        '«Совет директоров любит уверенный тон. А потом всё равно спрашивает, почему уверенность не попала в денежный поток».',
        '«На совещании это прозвучит блестяще. Теперь нужна версия, которая переживёт первый вопрос аудитора».',
        '«Статусный актив — это хорошо. Статусный убыток почему-то в пресс-релиз не помещается».',
      ],
      dry: [
        '«Корпоративный юмор: расходы оказались реальными, а синергия — в следующем квартале».',
        '«План выглядит убедительно. Как и прошлый план, который теперь называется “уроки трансформации”».',
        '«Ничто так не объединяет команду, как внезапное обнаружение риска, который был в примечаниях с самого начала».',
      ],
    }
    const bank = companyAsides[key] ?? voiceAsides[voice] ?? voiceAsides.dry
    const aside = bank[Math.abs(turn + clientName.length) % bank.length]
    reply = reply.replace(/[»”]$/, '') + ' ' + aside + '»'
  }

  const issue = equipmentIssue(client, ownedItems, turn)
  if (issue && !promises) {
    delta -= issue.penalty
    reply = reply.replace(/[»”]$/, '') + ' ' + issue.line + '»'
  }

  return { delta: Math.max(-18, Math.min(14, delta)), reply: simplifyForBeginner(reply, client, text), equipmentPenalty: issue?.penalty ?? 0 }
}
