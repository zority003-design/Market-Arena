/**
 * Single-source-of-truth economy. Every cash movement must pass through transact().
 * Assets are valued separately; liabilities are never spendable cash.
 */
export const ECONOMY_SCHEMA_VERSION = 2;

export function createEconomy({ cash = 6500, assets = [], liabilities = [], ledger = [], processed = [] } = {}) {
  if (!Number.isFinite(cash) || cash < 0) throw new Error('Некорректный денежный баланс');
  return {
    schemaVersion: ECONOMY_SCHEMA_VERSION,
    cash: Math.round(cash),
    assets: structuredClone(assets),
    liabilities: structuredClone(liabilities),
    ledger: structuredClone(ledger),
    processed: [...processed],
  };
}

export function netWorth(economy) {
  const assetValue = economy.assets.reduce((sum, asset) => sum + Math.max(0, asset.marketValue ?? asset.cost ?? 0), 0);
  const debt = economy.liabilities.reduce((sum, item) => sum + Math.max(0, item.balance), 0);
  return { cash: economy.cash, assets: assetValue, debt, netWorth: economy.cash + assetValue - debt };
}

/** Pure/atomic: returns a new state or throws without mutating the original. */
export function transact(economy, { id, type, amount, description, allowCredit = false, metadata = {} }) {
  if (!id || economy.processed.includes(id)) throw new Error('Операция уже обработана');
  if (!Number.isSafeInteger(amount) || amount === 0) throw new Error('Сумма операции должна быть целым ненулевым числом');
  if (amount < 0 && !allowCredit && economy.cash < -amount) throw new Error('Недостаточно доступных денег');
  const nextCash = economy.cash + amount;
  if (nextCash < 0 && !allowCredit) throw new Error('Отрицательный баланс запрещён');
  const entry = { id, type, amount, description: description ?? type, balanceAfter: nextCash, metadata, createdAt: Date.now() };
  return { ...economy, cash: nextCash, ledger: [...economy.ledger, entry], processed: [...economy.processed, id] };
}

export function buyAsset(economy, asset, operationId) {
  if (economy.assets.some(item => item.id === asset.id)) throw new Error('Актив уже принадлежит игроку');
  if (!Number.isSafeInteger(asset.price) || asset.price <= 0) throw new Error('Некорректная цена актива');
  const paid = transact(economy, { id: operationId, type: 'asset_purchase', amount: -asset.price, description: 'Покупка: ' + asset.name, metadata: { assetId: asset.id } });
  return { ...paid, assets: [...paid.assets, { ...asset, cost: asset.price, marketValue: asset.marketValue ?? asset.price }] };
}

export function sellAsset(economy, assetId, price, operationId) {
  const asset = economy.assets.find(item => item.id === assetId);
  if (!asset) throw new Error('Нельзя продать отсутствующий актив');
  if (!Number.isSafeInteger(price) || price <= 0) throw new Error('Некорректная цена продажи');
  const paid = transact(economy, { id: operationId, type: 'asset_sale', amount: price, description: 'Продажа: ' + asset.name, metadata: { assetId } });
  return { ...paid, assets: paid.assets.filter(item => item.id !== assetId) };
}

export function issueDebt(economy, { id, amount, label, creditLimit = 0 }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Некорректная сумма кредита');
  const currentDebt = economy.liabilities.reduce((sum, item) => sum + item.balance, 0);
  if (currentDebt + amount > creditLimit) throw new Error('Превышен кредитный лимит');
  const next = transact(economy, { id: id + ':issue', type: 'debt_issued', amount, description: 'Получен долг: ' + label });
  return { ...next, liabilities: [...next.liabilities, { id, label, balance: amount }] };
}

export function repayDebt(economy, debtId, amount, operationId) {
  const debt = economy.liabilities.find(item => item.id === debtId);
  if (!debt || !Number.isSafeInteger(amount) || amount <= 0 || amount > debt.balance) throw new Error('Некорректное погашение долга');
  const next = transact(economy, { id: operationId, type: 'debt_repayment', amount: -amount, description: 'Погашение долга: ' + debt.label });
  return { ...next, liabilities: next.liabilities.map(item => item.id === debtId ? { ...item, balance: item.balance - amount } : item).filter(item => item.balance > 0) };
}

export function migrateEconomySave(oldSave = {}) {
  if (oldSave.economy?.schemaVersion === ECONOMY_SCHEMA_VERSION) return structuredClone(oldSave);
  const cash = Math.max(0, Math.round((oldSave.cash ?? 0) + (oldSave.firmCapital ?? 0)));
  const legacy = oldSave.economy ?? {};
  return {
    ...oldSave,
    economy: createEconomy({
      cash,
      assets: legacy.assets ?? [],
      liabilities: legacy.liabilities ?? (oldSave.debt > 0 ? [{ id: 'legacy-debt', label: 'Старые обязательства', balance: Math.round(oldSave.debt) }] : []),
      ledger: legacy.ledger ?? [{ id: 'migration-v2', type: 'migration', amount: cash, description: 'Объединение старых личных денег и капитала фирмы' }],
      processed: legacy.processed ?? ['migration-v2'],
    }),
  };
}
