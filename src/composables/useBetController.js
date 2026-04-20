import { ref, reactive } from 'vue'

export function useBetController(simulator, showToast) {
  const { config, bet, isRolling, stats, placeBet } = simulator
  
  const isAutoRunning = ref(false)
  let autoTimer = null
  let autoRemaining = 0
  let initialBet = 0
  let autoConf = null

  function setBet(amount) {
    bet.amount = Math.max(0.00000001, Number(amount))
  }

  function resetBalance() {
    stopAuto()
    config.balance = 1000
    bet.amount = 1
  }

  async function handleManualBet() {
    if (isRolling.value) return
    await doRoll()
  }

  async function doRoll() {
    try {
      const result = await placeBet()
      if (result.error) {
        showToast(result.error, 'lose')
      } else {
        const msg = result.win ? `WIN! +${result.profit.toFixed(6)}` : `LOSS: -${Math.abs(result.profit).toFixed(6)}`
        showToast(msg, result.win ? 'win' : 'lose')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function startAuto(conf) {
    if (isAutoRunning.value) return
    isAutoRunning.value = true
    autoConf = conf
    autoRemaining = conf.count === 0 ? Infinity : conf.count
    initialBet = bet.amount

    async function tick() {
      if (!isAutoRunning.value) return
      if (autoRemaining <= 0) {
        stopAuto()
        return
      }

      if (autoConf.stopProfit > 0 && stats.totalProfit >= autoConf.stopProfit) {
        stopAuto()
        return
      }
      if (autoConf.stopLoss > 0 && stats.totalProfit <= -autoConf.stopLoss) {
        stopAuto()
        return
      }

      try {
        const result = await placeBet()
        if (result.error) {
          stopAuto()
          return
        }

        if (autoRemaining !== Infinity) autoRemaining -= 1

        if (result.win) {
          if (autoConf.onWin === 'reset') bet.amount = initialBet
          else if (autoConf.onWin === 'increase') bet.amount = bet.amount * (1 + autoConf.winPct / 100)
          else if (autoConf.onWin === 'stop') {
            stopAuto()
            return
          }
        } else {
          if (autoConf.onLoss === 'reset') bet.amount = initialBet
          else if (autoConf.onLoss === 'increase') bet.amount = bet.amount * (1 + autoConf.lossPct / 100)
          else if (autoConf.onLoss === 'stop') {
            stopAuto()
            return
          }
        }

        if (bet.amount > config.balance) bet.amount = config.balance
        if (bet.amount <= 0) {
          stopAuto()
          return
        }
      } catch (err) {
        console.error(err)
        stopAuto()
        return
      }

      const delay = config.delay * 1000 || 50
      autoTimer = setTimeout(tick, delay)
    }

    tick()
  }

  function stopAuto() {
    isAutoRunning.value = false
    if (autoTimer) {
      clearTimeout(autoTimer)
      autoTimer = null
    }
    isRolling.value = false
  }

  return {
    isAutoRunning,
    setBet,
    resetBalance,
    handleManualBet,
    startAuto,
    stopAuto
  }
}
