import { ref } from 'vue'

/**
 * useBetHistory - Manages bet history and UI display state independently.
 * Separated from useSimulator so that:
 *   - silent mode can skip history updates for speed
 *   - history & UI state have a clear single owner
 */
export function useBetHistory() {
  // History lists
  const recentRolls = ref([])      // last 100 bet results (all games)
  const limboHistory = ref([])     // last 20 limbo raw multipliers
  const lastResult = ref(null)

  // UI display state (mirrors real values during normal mode,
  // frozen during Silent Mode to avoid heavy reactive updates)
  const uiBalance = ref(0)
  const uiBetAmount = ref(0)
  const uiProfitOnWin = ref(0)
  const uiTarget = ref(0)
  const uiSide = ref('under')
  const uiMultiplier = ref(0)
  const uiWinChance = ref(0)
  const uiLimboTarget = ref(2.0)

  /**
   * Record a completed bet result into history.
   * Call this only when NOT in silent mode.
   * @param {object} result - full result object from placeBet()
   */
  function recordHistory(result) {
    lastResult.value = result

    recentRolls.value.unshift(result)
    if (recentRolls.value.length > 100) recentRolls.value.pop()

    if (result.game === 'limbo') {
      limboHistory.value.unshift(result.resultMultiplier)
      if (limboHistory.value.length > 20) limboHistory.value.pop()
    }
  }

  /**
   * Sync UI display values from current live values.
   * Call after each bet when NOT in silent mode.
   * @param {object} snapshot - { balance, betAmount, profitOnWin, target, side, multiplier, winChance, limboTarget }
   */
  function syncUI(snapshot) {
    uiBalance.value = snapshot.balance
    uiBetAmount.value = snapshot.betAmount
    uiProfitOnWin.value = snapshot.profitOnWin
    uiTarget.value = snapshot.target
    uiSide.value = snapshot.side
    uiMultiplier.value = snapshot.multiplier
    uiWinChance.value = snapshot.winChance
    uiLimboTarget.value = snapshot.limboTarget
  }

  /**
   * Initialize UI values (call once on setup or after reset).
   */
  function initUI(snapshot) {
    syncUI(snapshot)
  }

  /** Clear all history and reset UI to a fresh snapshot. */
  function resetHistory(snapshot) {
    lastResult.value = null
    recentRolls.value = []
    limboHistory.value = []
    if (snapshot) syncUI(snapshot)
  }

  return {
    // History
    recentRolls,
    limboHistory,
    lastResult,
    // UI display
    uiBalance,
    uiBetAmount,
    uiProfitOnWin,
    uiTarget,
    uiSide,
    uiMultiplier,
    uiWinChance,
    uiLimboTarget,
    // Actions
    recordHistory,
    syncUI,
    initUI,
    resetHistory,
  }
}
