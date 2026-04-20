import { reactive } from 'vue'

/**
 * useStats - Manages session statistics independently.
 * Separated from useSimulator to keep concerns clean:
 * core engine only handles game logic & balance,
 * while this composable owns all stat tracking.
 */
export function useStats() {
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

  /**
   * Record a single bet result into stats.
   * @param {{ win: boolean, profit: number, amount: number }} result
   */
  function recordResult(result) {
    const { win, profit, amount } = result

    stats.totalBets += 1
    stats.totalWagered += amount
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
  }

  /** Reset all stats to zero. */
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
  }

  return {
    stats,
    recordResult,
    resetStats,
  }
}
