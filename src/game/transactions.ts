export type MoneyTransaction = {
  id: string
  day: number
  amount: number
  reason: string
  balanceAfter: number
}

export type MoneyTransactionInput = Omit<MoneyTransaction, 'balanceAfter'>

export type MoneyTransactionResult = {
  ok: boolean
  balance: number
  history: MoneyTransaction[]
  error?: 'invalid-amount' | 'insufficient-funds' | 'duplicate-id'
}

/** Pure, atomic money posting. Negative amounts are debits; positive amounts are credits. */
export function postMoneyTransaction(
  balance: number,
  history: MoneyTransaction[],
  transaction: MoneyTransactionInput,
): MoneyTransactionResult {
  if (!Number.isFinite(transaction.amount) || transaction.amount === 0) {
    return { ok: false, balance, history, error: 'invalid-amount' }
  }
  if (history.some((entry) => entry.id === transaction.id)) {
    return { ok: false, balance, history, error: 'duplicate-id' }
  }
  const nextBalance = balance + transaction.amount
  if (!Number.isFinite(nextBalance) || nextBalance < 0) {
    return { ok: false, balance, history, error: 'insufficient-funds' }
  }
  const entry: MoneyTransaction = { ...transaction, balanceAfter: nextBalance }
  return { ok: true, balance: nextBalance, history: [...history, entry] }
}
