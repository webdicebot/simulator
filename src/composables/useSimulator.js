import { ref, reactive, computed, watch } from 'vue'
import { rollDice, randomSeed, calcMultiplier, calcWinChance, calcLimboWinChance, calcLimboMultiplier } from '@/utils/diceEngine.js'
import { useStats } from './useStats.js'
import { useBetHistory } from './useBetHistory.js'

export function useSimulator() {
  // ─── Sub-composables ──────────────────────────────────────────────────────
  const { stats, recordResult, resetStats: _resetStats } = useStats()
  const {
    recentRolls, limboHistory, lastResult,
    uiBalance, uiBetAmount, uiProfitOnWin,
    uiTarget, uiSide, uiMultiplier, uiWinChance, uiLimboTarget,
    recordHistory, syncUI, initUI, resetHistory,
  } = useBetHistory()

  // ─── Config state ─────────────────────────────────────────────────────────
  const config = reactive({
    currentGame: 'dice', // 'dice' | 'limbo'
    balance: 1000,
    decimal: 8,
    delay: 0,
    houseEdge: 1,
    silent: false,
    fastMode: localStorage.getItem('fastMode') === 'true',
    clientSeed: randomSeed(16),
    serverSeed: randomSeed(64),
    nonce: 0,
  })

  // Persist Fast Mode preference
  watch(() => config.fastMode, (newVal) => {
    localStorage.setItem('fastMode', newVal)
  })

  // ─── Bet state ────────────────────────────────────────────────────────────
  const bet = reactive({
    amount: 1,
    // Dice specific
    target: 49.5,
    side: 'under', // 'under' | 'over'
    // Limbo specific
    limboTarget: 2.00,
  })

  // ─── Rolling flag ─────────────────────────────────────────────────────────
  const isRolling = ref(false)

  // ─── Computed ─────────────────────────────────────────────────────────────
  const multiplier = computed(() => {
    if (config.currentGame === 'dice') {
      return calcMultiplier(bet.target, bet.side, config.houseEdge)
    } else {
      return bet.limboTarget
    }
  })

  const winChance = computed(() => {
    if (config.currentGame === 'dice') {
      return calcWinChance(bet.target, bet.side)
    } else {
      return calcLimboWinChance(bet.limboTarget, config.houseEdge)
    }
  })

  const profitOnWin = computed(() => bet.amount * multiplier.value - bet.amount)

  const displayBalance = computed(() => {
    const val = config.silent ? uiBalance.value : config.balance
    return val.toFixed(config.decimal)
  })

  // ─── Helper: build UI snapshot from current live values ───────────────────
  function _uiSnapshot() {
    return {
      balance: config.balance,
      betAmount: bet.amount,
      profitOnWin: profitOnWin.value,
      target: bet.target,
      side: bet.side,
      multiplier: multiplier.value,
      winChance: winChance.value,
      limboTarget: bet.limboTarget,
    }
  }

  // Initialise UI display on first load
  initUI(_uiSnapshot())

  // ─── Actions ──────────────────────────────────────────────────────────────
  function randomizeClientSeed() {
    config.clientSeed = randomSeed(16)
    config.nonce = 0
  }

  function randomizeServerSeed() {
    config.serverSeed = randomSeed(64)
    config.nonce = 0
  }

  function resetStats() {
    _resetStats()
    resetHistory(_uiSnapshot())
  }

  async function placeBet() {
    isRolling.value = true

    if (bet.amount <= 0) {
      isRolling.value = false
      return { error: 'Amount must be > 0' }
    }

    if (config.currentGame === 'dice') {
      if (bet.target <= 0 || bet.target > 99) {
        isRolling.value = false
        return { error: 'Target must be 1–99' }
      }
    } else {
      if (bet.limboTarget < 1.01) {
        isRolling.value = false
        return { error: 'Target must be >= 1.01' }
      }
    }

    if (config.balance < bet.amount) {
      isRolling.value = false
      return { error: 'Insufficient balance' }
    }

    config.nonce += 1

    const resultNumber = rollDice(config.serverSeed, config.clientSeed, config.nonce)

    let win = false
    let currentMultiplier = 0
    let resultMultiplier = 0

    if (config.currentGame === 'dice') {
      if (bet.side === 'over') {
        win = resultNumber > bet.target
      } else {
        win = resultNumber < bet.target
      }
      currentMultiplier = multiplier.value
    } else {
      // Limbo logic
      const chance = calcLimboWinChance(bet.limboTarget, config.houseEdge)
      win = resultNumber < chance
      currentMultiplier = bet.limboTarget
      resultMultiplier = calcLimboMultiplier(resultNumber, config.houseEdge)
    }

    const profit = win ? bet.amount * currentMultiplier - bet.amount : -bet.amount

    config.balance += profit

    // Silent Mode: skip stats & history updates for maximum speed
    if (!config.silent) {
      const result = {
        game: config.currentGame,
        nonce: config.nonce,
        resultNumber,
        resultMultiplier: config.currentGame === 'limbo' ? resultMultiplier : null,
        target: config.currentGame === 'dice' ? bet.target : bet.limboTarget,
        side: config.currentGame === 'dice' ? bet.side : null,
        win,
        profit,
        balance: config.balance,
        multiplier: currentMultiplier,
        amount: bet.amount,
        clientSeed: config.clientSeed,
        serverSeed: config.serverSeed,
      }

      // Delegate to sub-composables
      recordResult({ win, profit, amount: bet.amount })
      recordHistory(result)
      syncUI(_uiSnapshot())

      isRolling.value = false
      return result
    }

    // Silent mode: build minimal result (no history/stats side-effects)
    const result = {
      game: config.currentGame,
      nonce: config.nonce,
      resultNumber,
      resultMultiplier: config.currentGame === 'limbo' ? resultMultiplier : null,
      target: config.currentGame === 'dice' ? bet.target : bet.limboTarget,
      side: config.currentGame === 'dice' ? bet.side : null,
      win,
      profit,
      balance: config.balance,
      multiplier: currentMultiplier,
      amount: bet.amount,
      clientSeed: config.clientSeed,
      serverSeed: config.serverSeed,
    }

    isRolling.value = false
    return result
  }

  return {
    // Core
    config,
    bet,
    isRolling,
    // History (from useBetHistory)
    lastResult,
    recentRolls,
    limboHistory,
    // UI display (from useBetHistory)
    uiBalance,
    uiBetAmount,
    uiProfitOnWin,
    uiTarget,
    uiSide,
    uiMultiplier,
    uiWinChance,
    uiLimboTarget,
    // Stats (from useStats)
    stats,
    // Computed
    multiplier,
    winChance,
    profitOnWin,
    displayBalance,
    // Actions
    randomizeClientSeed,
    randomizeServerSeed,
    resetStats,
    placeBet,
  }
}
