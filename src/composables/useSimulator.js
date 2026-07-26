import { ref, reactive, computed, watch } from 'vue'
import {
  rollDice,
  randomSeed,
  calcMultiplier,
  calcWinChance,
  calcLimboWinChance,
  calcLimboMultiplier,
  generateMines,
  calcMinesMultiplier,
  calcMinesWinChance,
  generateKeno,
  calcKenoMultiplier,
} from '@/utils/diceEngine.js'
import { useStats } from './useStats.js'
import { useBetHistory } from './useBetHistory.js'

export function useSimulator() {
  // ─── Sub-composables ──────────────────────────────────────────────────────
  const { stats, recordResult, resetStats: _resetStats } = useStats()
  const {
    recentRolls,
    limboHistory,
    lastResult,
    uiBalance,
    uiBetAmount,
    uiProfitOnWin,
    uiTarget,
    uiSide,
    uiMultiplier,
    uiWinChance,
    uiLimboTarget,
    uiMinesTarget,
    uiMinesPicks,
    uiKenoRisk,
    uiKenoNumbers,
    recordHistory,
    syncUI,
    initUI,
    resetHistory,
  } = useBetHistory()

  // ─── Config state ─────────────────────────────────────────────────────────
  const config = reactive({
    currentGame: 'dice', // 'dice' | 'limbo' | 'mines' | 'keno'
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
  watch(
    () => config.fastMode,
    (newVal) => {
      localStorage.setItem('fastMode', newVal)
    },
  )

  // ─── Bet state ────────────────────────────────────────────────────────────
  const bet = reactive({
    amount: 1,
    // Dice specific
    target: 49.5,
    side: 'under', // 'under' | 'over'
    // Limbo specific
    limboTarget: 2.0,
    // Mines 6x4 specific (tile indexes 0-23)
    minesTarget: 3,
    minesPicks: [1, 5, 10, 15, 20],
    // Keno specific
    kenoRisk: 'classic',
    kenoNumbers: [],
  })

  // ─── Rolling flag ─────────────────────────────────────────────────────────
  const isRolling = ref(false)

  // ─── Computed ─────────────────────────────────────────────────────────────
  const multiplier = computed(() => {
    if (config.currentGame === 'dice') {
      return calcMultiplier(bet.target, bet.side, config.houseEdge)
    } else if (config.currentGame === 'limbo') {
      return bet.limboTarget
    }
    if (config.currentGame === 'mines') {
      return calcMinesMultiplier(bet.minesTarget, bet.minesPicks.length, config.houseEdge)
    }
    return 0
  })

  const winChance = computed(() => {
    if (config.currentGame === 'dice') {
      return calcWinChance(bet.target, bet.side)
    } else if (config.currentGame === 'limbo') {
      return calcLimboWinChance(bet.limboTarget, config.houseEdge)
    }
    if (config.currentGame === 'mines') {
      return calcMinesWinChance(bet.minesTarget, bet.minesPicks.length)
    }
    return 0
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
      minesTarget: bet.minesTarget,
      minesPicks: bet.minesPicks,
      kenoRisk: bet.kenoRisk,
      kenoNumbers: bet.kenoNumbers,
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

  function recordExternalResult(result) {
    if (!config.silent) {
      recordResult({ win: result.win, profit: result.profit, amount: result.amount })
      recordHistory(result)
      syncUI(_uiSnapshot())
    }
    return result
  }

  async function placeBet() {
    isRolling.value = true

    if (bet.amount <= 0) {
      isRolling.value = false
      return { error: 'Amount must be > 0' }
    }

    if (config.currentGame === 'dice') {
      if (bet.target < 0.01 || bet.target > 99.99) {
        isRolling.value = false
        return { error: 'Target must be 0.01-99.99' }
      }
    } else if (config.currentGame === 'limbo') {
      if (bet.limboTarget < 1.01) {
        isRolling.value = false
        return { error: 'Target must be >= 1.01' }
      }
    } else if (config.currentGame === 'mines') {
      const uniquePicks = Array.from(new Set(bet.minesPicks.map(Number)))
      if (!Number.isInteger(bet.minesTarget) || bet.minesTarget < 1 || bet.minesTarget > 23) {
        isRolling.value = false
        return { error: 'Mines must be an integer from 1 to 23' }
      }
      if (uniquePicks.length === 0) {
        isRolling.value = false
        return { error: 'Select at least one tile' }
      }
      if (uniquePicks.some((pick) => !Number.isInteger(pick) || pick < 0 || pick > 23)) {
        isRolling.value = false
        return { error: 'Tile numbers must be from 0 to 23' }
      }
      if (uniquePicks.length > 24 - bet.minesTarget) {
        isRolling.value = false
        return { error: 'Selected tiles exceed available safe tiles' }
      }
      bet.minesPicks = uniquePicks
    } else {
      const uniqueNumbers = Array.from(new Set(bet.kenoNumbers.map(Number))).sort((a, b) => a - b)
      if (uniqueNumbers.length < 1 || uniqueNumbers.length > 10) {
        isRolling.value = false
        return { error: 'Select from 1 to 10 Keno numbers' }
      }
      if (uniqueNumbers.some((number) => !Number.isInteger(number) || number < 1 || number > 40)) {
        isRolling.value = false
        return { error: 'Keno numbers must be from 1 to 40' }
      }
      if (!['classic', 'low', 'medium', 'high'].includes(bet.kenoRisk)) {
        isRolling.value = false
        return { error: 'Invalid Keno risk' }
      }
      bet.kenoNumbers = uniqueNumbers
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
    let mines = null
    let drawnNumbers = null
    let hits = null

    if (config.currentGame === 'dice') {
      if (bet.side === 'over') {
        win = resultNumber > bet.target
      } else {
        win = resultNumber < bet.target
      }
      currentMultiplier = multiplier.value
    } else if (config.currentGame === 'limbo') {
      // Limbo logic
      const chance = calcLimboWinChance(bet.limboTarget, config.houseEdge)
      win = resultNumber < chance
      currentMultiplier = bet.limboTarget
      resultMultiplier = calcLimboMultiplier(resultNumber, config.houseEdge)
    } else if (config.currentGame === 'mines') {
      mines = generateMines(config.serverSeed, config.clientSeed, config.nonce, bet.minesTarget)
      const mineSet = new Set(mines)
      win = bet.minesPicks.every((pick) => !mineSet.has(pick))
      currentMultiplier = multiplier.value
    } else {
      drawnNumbers = generateKeno(config.serverSeed, config.clientSeed, config.nonce)
      const selectedSet = new Set(bet.kenoNumbers)
      hits = drawnNumbers.filter((number) => selectedSet.has(number)).length
      currentMultiplier = calcKenoMultiplier(bet.kenoRisk, hits, config.houseEdge)
      win = currentMultiplier > 1
    }

    const profit =
      config.currentGame === 'keno'
        ? bet.amount * currentMultiplier - bet.amount
        : win
          ? bet.amount * currentMultiplier - bet.amount
          : -bet.amount

    config.balance += profit

    // Silent Mode: skip stats & history updates for maximum speed
    if (!config.silent) {
      const result = {
        game: config.currentGame,
        nonce: config.nonce,
        resultNumber: ['mines', 'keno'].includes(config.currentGame) ? null : resultNumber,
        resultMultiplier: config.currentGame === 'limbo' ? resultMultiplier : null,
        target:
          config.currentGame === 'dice'
            ? bet.target
            : config.currentGame === 'limbo'
              ? bet.limboTarget
              : config.currentGame === 'mines'
                ? [...bet.minesPicks]
                : [...bet.kenoNumbers],
        side: config.currentGame === 'dice' ? bet.side : null,
        minesTarget: config.currentGame === 'mines' ? bet.minesTarget : null,
        minesPicks: config.currentGame === 'mines' ? [...bet.minesPicks] : null,
        picks: config.currentGame === 'mines' ? [...bet.minesPicks] : null,
        mines,
        kenoRisk: config.currentGame === 'keno' ? bet.kenoRisk : null,
        kenoNumbers: config.currentGame === 'keno' ? [...bet.kenoNumbers] : null,
        drawnNumbers,
        hits,
        win,
        profit,
        balance: config.balance,
        multiplier: config.currentGame === 'keno' ? currentMultiplier : win ? currentMultiplier : 0,
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
      resultNumber: ['mines', 'keno'].includes(config.currentGame) ? null : resultNumber,
      resultMultiplier: config.currentGame === 'limbo' ? resultMultiplier : null,
      target:
        config.currentGame === 'dice'
          ? bet.target
          : config.currentGame === 'limbo'
            ? bet.limboTarget
            : config.currentGame === 'mines'
              ? [...bet.minesPicks]
              : [...bet.kenoNumbers],
      side: config.currentGame === 'dice' ? bet.side : null,
      minesTarget: config.currentGame === 'mines' ? bet.minesTarget : null,
      minesPicks: config.currentGame === 'mines' ? [...bet.minesPicks] : null,
      picks: config.currentGame === 'mines' ? [...bet.minesPicks] : null,
      mines,
      kenoRisk: config.currentGame === 'keno' ? bet.kenoRisk : null,
      kenoNumbers: config.currentGame === 'keno' ? [...bet.kenoNumbers] : null,
      drawnNumbers,
      hits,
      win,
      profit,
      balance: config.balance,
      multiplier: config.currentGame === 'keno' ? currentMultiplier : win ? currentMultiplier : 0,
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
    uiMinesTarget,
    uiMinesPicks,
    uiKenoRisk,
    uiKenoNumbers,
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
    recordExternalResult,
    placeBet,
  }
}
