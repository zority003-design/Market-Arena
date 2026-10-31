/** Deterministic day/action budget. */
export function createTimeState(day = 1, minutes = 9 * 60, actions = 0) { return { day, minutes, actions }; }
export function consumeTime(state, { minutes, actionLimit = 8, action = 'действие' }) {
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error('Некорректная длительность действия');
  if (state.actions >= actionLimit) throw new Error('Лимит действий на сегодня исчерпан. Продолжить можно завтра.');
  if (state.minutes + minutes > 19 * 60) throw new Error('Рабочий день окончен. Отдохните и продолжите завтра.');
  return { ...state, minutes: state.minutes + minutes, actions: state.actions + 1, lastAction: action };
}
export function nextDay(state) { return { day: state.day + 1, minutes: 9 * 60, actions: 0 }; }
