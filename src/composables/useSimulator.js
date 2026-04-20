import { ref, reactive, computed, watch } from 'vue'
import { rollDice, randomSeed, calcMultiplier, calcWinChance, calcLimboWinChance, calcLimboMultiplier } from '@/utils/diceEngine.js'

export function useSimulator() {
  // Config state
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

  // Persistence for Fast Mode
  watch(() => config.fastMode, (newVal) => {
    localStorage.setItem('fastMode', newVal)
  })

  // Bet state
  const bet = reactive({
    amount: 1,
    // Dice specific
    target: 49.5,
    side: 'under', // 'under' | 'over'
    // Limbo specific
    limboTarget: 2.00,
  })

  // Game state
  const isRolling = ref(false)
  const lastResult = ref(null)
  const recentRolls = ref([]) // last 100 results
  const limboHistory = ref([]) // last 20 limbo multipliers

  // UI Display state (for Silent Mode)
  const uiBalance = ref(config.balance)
  const uiBetAmount = ref(bet.amount)
  const uiProfitOnWin = ref(0)
  const uiTarget = ref(bet.target)
  const uiSide = ref(bet.side)
  const uiMultiplier = ref(0)
  const uiWinChance = ref(0)
  const uiLimboTarget = ref(bet.limboTarget)

  // Stats
  const stats = reactive({
    totalBets: 0,
    wins: 0,
    losses: 0,
    totalWagered: 0,
    totalProfit: 0,
    highestWin: 0,
    biggestLoss: 0,
    longestWinStreak: 0,
    longestLoseStreak: 0,
    currentWinStreak: 0,
    currentLoseStreak: 0,
  })

  // Computed
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

  // Actions
  function randomizeClientSeed() {
    config.clientSeed = randomSeed(16)
    config.nonce = 0
  }

  function randomizeServerSeed() {
    config.serverSeed = randomSeed(64)
    config.nonce = 0
  }

  function resetStats() {
    Object.assign(stats, {
      totalBets: 0,
      wins: 0,
      losses: 0,
      totalWagered: 0,
      totalProfit: 0,
      highestWin: 0,
      biggestLoss: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      currentWinStreak: 0,
      currentLoseStreak: 0,
    })
    lastResult.value = null
    recentRolls.value = []
    limboHistory.value = []
    uiBalance.value = config.balance
    uiBetAmount.value = bet.amount
    uiProfitOnWin.value = profitOnWin.value
    uiTarget.value = bet.target
    uiSide.value = bet.side
    uiMultiplier.value = multiplier.value
    uiWinChance.value = winChance.value
    uiLimboTarget.value = bet.limboTarget
  }

  async function placeBet() {
    if (isRolling.value) return { error: 'Already rolling' }
    if (bet.amount <= 0) return { error: 'Amount must be > 0' }
    
    if (config.currentGame === 'dice') {
      if (bet.target <= 0 || bet.target > 99) return { error: 'Target must be 1–99' }
    } else {
      if (bet.limboTarget < 1.01) return { error: 'Target must be >= 1.01' }
    }
    
    if (config.balance < bet.amount) return { error: 'Insufficient balance' }

    isRolling.value = true
    
    // Simulate delay for visual effect
    const delay = config.silent ? 50 : 800
    await new Promise(resolve => setTimeout(resolve, delay))

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

    // Chế độ Silent Mode: Bỏ qua cập nhật Thống kê và Lịch sử để tăng tốc độ
    if (!config.silent) {
      stats.totalBets += 1
      stats.totalWagered += bet.amount
      stats.totalProfit += profit

      if (win) {
        stats.wins += 1
        stats.currentWinStreak += 1
        stats.currentLoseStreak = 0
        if (stats.currentWinStreak > stats.longestWinStreak) {
          stats.longestWinStreak = stats.currentWinStreak
        }
        if (profit > stats.highestWin) stats.highestWin = profit
      } else {
        stats.losses += 1
        stats.currentLoseStreak += 1
        stats.currentWinStreak = 0
        if (stats.currentLoseStreak > stats.longestLoseStreak) {
          stats.longestLoseStreak = stats.currentLoseStreak
        }
        if (-profit > stats.biggestLoss) stats.biggestLoss = -profit
      }

      // Cập nhật toàn bộ giao diện khi không ở chế độ im lặng
      uiBalance.value = config.balance
      uiBetAmount.value = bet.amount
      uiProfitOnWin.value = profitOnWin.value
      uiTarget.value = bet.target
      uiSide.value = bet.side
      uiMultiplier.value = multiplier.value
      uiWinChance.value = winChance.value
      uiLimboTarget.value = bet.limboTarget
    }

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

    // Chỉ cập nhật hiển thị kết quả cuối khi không im lặng
    if (!config.silent) {
      lastResult.value = result
      recentRolls.value.unshift(result)
      if (recentRolls.value.length > 100) recentRolls.value.pop()

      if (config.currentGame === 'limbo') {
        limboHistory.value.unshift(resultMultiplier)
        if (limboHistory.value.length > 20) limboHistory.value.pop()
      }
    }

    isRolling.value = false
    return result
  }

  return {
    config,
    bet,
    isRolling,
    lastResult,
    recentRolls,
    limboHistory,
    uiBalance,
    uiBetAmount,
    uiProfitOnWin,
    uiTarget,
    uiSide,
    uiMultiplier,
    uiWinChance,
    uiLimboTarget,
    stats,
    multiplier,
    winChance,
    profitOnWin,
    displayBalance,
    randomizeClientSeed,
    randomizeServerSeed,
    resetStats,
    placeBet,
  }
}
