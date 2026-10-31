/** Local intent recognition and persistent character state; no external model required. */
export const CHARACTER_ARCHETYPES = {
  cautious: { patience: 72, risk: 'low', voice: 'Просит цифры, уточняет худший сценарий и не любит спешку.', trust: 0 },
  impulsive: { patience: 48, risk: 'high', voice: 'Быстро загорается идеей, перебивает и хочет услышать главное.', trust: 0 },
  skeptical: { patience: 62, risk: 'medium', voice: 'Проверяет обещания, замечает противоречия и просит доказательства.', trust: 0 },
  sociable: { patience: 68, risk: 'medium', voice: 'Разговорчив, шутит и охотно делится историями, но путается в цифрах.', trust: 0 },
};

const patterns = [
  ['apology', /извин|ошиб|неправ|виноват|перепутал|простите/u],
  ['refusal', /отказыва|не буду|не соглас|нет, спасибо|не интересно/u],
  ['aggression', /идиот|дурак|заткни|бред|обманщик|мошенн/u],
  ['joke', /шут|ха-ха|))|прикол|смешно|анекдот/u],
  ['question', /\?|почему|зачем|как именно|что если|расскажите|объясните/u],
  ['doubt', /сомнева|не уверен|не верю|подозр|кажется риск/u],
  ['promise', /обеща|гарантир|обязуюсь|точно сделаю/u],
  ['deal', /предлагаю|сделка|договор|компромисс|условия|вложить|купить/u],
  ['persuasion', /выгод|интерес|потенциал|возможност|прибыл|рост/u],
];
export function detectIntent(input) {
  const text = String(input ?? '').trim().toLocaleLowerCase('ru');
  if (text.length < 2) return { intent: 'unclear', confidence: 0 };
  const matches = patterns.map(([intent, regex]) => ({ intent, score: (text.match(new RegExp(regex.source, 'gu')) ?? []).length }))
    .filter(item => item.score > 0).sort((a,b) => b.score-a.score);
  if (!matches.length) return { intent: 'unclear', confidence: 0.2 };
  return { intent: matches[0].intent, confidence: Math.min(0.95, 0.48 + matches[0].score * 0.16) };
}

export function createCharacter({ id, name, archetype = 'cautious', trust = 40, patience, mood = 'neutral' }) {
  const profile = CHARACTER_ARCHETYPES[archetype] ?? CHARACTER_ARCHETYPES.cautious;
  return { id, name, archetype, trust, patience: patience ?? profile.patience, mood, memory: [], promises: [], history: [] };
}
export function remember(character, event) {
  const memory = [...character.memory.filter(item => item.key !== event.key), { ...event, day: event.day ?? 1 }].slice(-24);
  return { ...character, memory };
}
export function resolveDialogue(character, input, day = 1) {
  const { intent, confidence } = detectIntent(input);
  const delta = { apology: 5, question: 2, doubt: 0, promise: 1, deal: 2, persuasion: 1, joke: character.archetype === 'sociable' ? 3 : 0, refusal: -1, aggression: -9, unclear: 0 }[intent];
  const reaction = {
    apology: 'Спасибо, что признали это. Давайте разберём, что именно исправим.',
    question: 'Хороший вопрос. Уточню детали, чтобы не отвечать общими обещаниями.',
    doubt: 'Сомневаться нормально. Какой факт помог бы вам принять решение?',
    promise: 'Я запомню это обещание. Вернёмся к нему, когда будут результаты.',
    deal: 'Обсудим условия и проверим, подходят ли они обеим сторонам.',
    persuasion: 'Звучит интересно, но покажите, на чём основан этот вывод.',
    joke: character.archetype === 'sociable' ? 'Вот теперь разговор пошёл. Но к цифрам всё-таки вернёмся.' : 'Улыбнулся. Теперь серьёзно: что это меняет в предложении?',
    refusal: 'Понял. Давить не буду — зафиксируем паузу.',
    aggression: 'Мне некомфортен такой тон. Давайте продолжим, если сможем говорить спокойно.',
    unclear: 'Кажется, я не совсем понял. Вы хотите уточнить риск, обсудить условия или отказаться?',
  }[intent];
  const next = { ...character, trust: Math.max(0, Math.min(100, character.trust + delta)), patience: Math.max(0, character.patience - (intent === 'unclear' ? 2 : 1)), mood: intent === 'aggression' ? 'angry' : intent === 'joke' ? 'lighter' : character.mood, history: [...character.history, { day, intent }].slice(-30) };
  if (intent === 'promise') next.promises = [...character.promises, { day, text: String(input).slice(0, 180), fulfilled: false }].slice(-12);
  return { character: next, intent, confidence, reaction, consequence: { trust: next.trust, patience: next.patience } };
}
