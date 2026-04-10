import { ref, reactive, computed } from 'vue'
import { rollDice, randomSeed, calcMultiplier, calcWinChance } from '@/utils/diceEngine.js'

export function useSimulator() {
  // Config state
  const config = reactive({
    balance: 1000,
    decimal: 8,
    delay: 0,
    houseEdge: 1,
    silent: false, // Thêm chế độ im lặng (Silent Mode)
    fastMode: false, // Chế độ Fast Mode (Tốc độ cao)
    clientSeed: randomSeed(16),
    serverSeed: randomSeed(64),
    nonce: 0,
  })

  // Bet state
  const bet = reactive({
    amount: 1,
    target: 49.5,
    side: 'under', // 'under' | 'over'
  })

  // Game state
  const isRunning = ref(false)
  const lastResult = ref(null)
  const recentRolls = ref([]) // last 10 results

  // UI Display state (for Silent Mode)
  const uiBalance = ref(config.balance)
  const uiBetAmount = ref(bet.amount)
  const uiProfitOnWin = ref(0)
  const uiTarget = ref(bet.target)
  const uiSide = ref(bet.side)
  const uiMultiplier = ref(0)
  const uiWinChance = ref(0)

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
  const multiplier = computed(() => calcMultiplier(bet.target, bet.side, config.houseEdge))
  const winChance = computed(() => calcWinChance(bet.target, bet.side))
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
    uiBalance.value = config.balance
    uiBetAmount.value = bet.amount
    uiProfitOnWin.value = profitOnWin.value
    uiTarget.value = bet.target
    uiSide.value = bet.side
    uiMultiplier.value = multiplier.value
    uiWinChance.value = winChance.value
  }

  async function placeBet() {
    if (bet.amount <= 0) return { error: 'Amount must be > 0' }
    if (bet.target <= 0 || bet.target > 99) return { error: 'Target must be 1–99' }
    if (config.balance < bet.amount) return { error: 'Insufficient balance' }

    config.nonce += 1

    const resultNumber = await rollDice(config.serverSeed, config.clientSeed, config.nonce)

    let win = false
    if (bet.side === 'over') {
      win = resultNumber > bet.target
    } else {
      win = resultNumber < bet.target
    }

    const mult = multiplier.value
    const profit = win ? bet.amount * mult - bet.amount : -bet.amount

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
    }

    const result = {
      nonce: config.nonce,
      resultNumber,
      target: bet.target,
      side: bet.side,
      win,
      profit,
      balance: config.balance,
      multiplier: mult,
      amount: bet.amount,
      // Seeds for provably fair verification
      clientSeed: config.clientSeed,
      serverSeed: config.serverSeed,
    }

    // Chỉ cập nhật hiển thị kết quả cuối (Lucky number & Win/Loss) khi không im lặng
    if (!config.silent) {
      lastResult.value = result
      recentRolls.value.unshift(result)
      if (recentRolls.value.length > 100) recentRolls.value.pop()
    }

    return result
  }

  return {
    config,
    bet,
    isRunning,
    lastResult,
    recentRolls,
    uiBalance,
    uiBetAmount,
    uiProfitOnWin,
    uiTarget,
    uiSide,
    uiMultiplier,
    uiWinChance,
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
