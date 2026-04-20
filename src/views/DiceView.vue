<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import GameLayout from '@/layouts/GameLayout.vue'
import DiceBoard from '@/components/DiceBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import { simulatorStore } from '@/store/simulatorStore.js'
import { useBetController } from '@/composables/useBetController.js'

const layoutRef = ref(null)
const simulator = simulatorStore

const {
  config,
  bet,
  isRolling,
  lastResult,
  uiBalance,
  uiBetAmount,
  uiProfitOnWin,
  uiTarget,
  uiSide,
  uiMultiplier,
  uiWinChance,
  multiplier,
  winChance,
  profitOnWin,
  placeBet,
  randomizeClientSeed,
} = simulator

const {
  isAutoRunning,
  setBet,
  resetBalance,
  handleManualBet,
  startAuto,
  stopAuto,
} = useBetController(simulator, (msg, type) => layoutRef.value?.showToast(msg, type))

onMounted(() => {
  config.currentGame = 'dice'

  // Setup Global API for bot scripts
  window.DiceSim = {
    get balance() { return config.balance },
    get nonce() { return config.nonce },
    get clientSeed() { return config.clientSeed },
    get serverSeed() { return config.serverSeed },
    get lastResult() { return lastResult.value },
    get decimal() { return config.decimal },
    get uiBalance() { return uiBalance.value },
    get uiBetAmount() { return uiBetAmount.value },
    get uiProfitOnWin() { return uiProfitOnWin.value },
    get uiTarget() { return uiTarget.value },
    get uiSide() { return uiSide.value },
    get uiMultiplier() { return uiMultiplier.value },
    get uiWinChance() { return uiWinChance.value },
    get silent() { return config.silent },
    set silent(v) { config.silent = !!v },
    get fastMode() { return config.fastMode },
    set fastMode(v) { config.fastMode = !!v },

    async bet(amount, target, side) {
      bet.amount = Number(amount)
      bet.target = Number(target)
      bet.side = side || bet.side
      return await placeBet()
    },

    setBalance(amount) { config.balance = Number(amount) },
    setDelay(seconds) { config.delay = Number(seconds) },
    setHouseEdge(pct) { config.houseEdge = Number(pct) },
    rotateSeed() { randomizeClientSeed() },
    getConfig() {
      return {
        balance: config.balance,
        nonce: config.nonce,
        clientSeed: config.clientSeed,
        serverSeed: config.serverSeed,
        houseEdge: config.houseEdge,
        decimal: config.decimal,
        delay: config.delay,
        silent: config.silent,
        fastMode: config.fastMode,
      }
    },
  }

  Object.defineProperty(window, 'FastMode', {
    get() { return config.fastMode },
    set(v) { config.fastMode = !!v },
    configurable: true,
  })

  console.log('%c[DiceSim] Global API ready → window.DiceSim', 'color:#1d9bf0;font-weight:bold;font-size:13px')
})

onUnmounted(() => {
  stopAuto()
  delete window.DiceSim
  delete window.FastMode
})
</script>

<template>
  <GameLayout ref="layoutRef">
    <DiceBoard
      :target="config.silent ? uiTarget : bet.target"
      :side="config.silent ? uiSide : bet.side"
      :multiplier="config.silent ? uiMultiplier : multiplier"
      :win-chance="config.silent ? uiWinChance : winChance"
      :last-result="lastResult"
      :is-rolling="isRolling"
      @update:target="(val) => (bet.target = val)"
      @update:side="(val) => (bet.side = val)"
    />

    <BetPanel
      current-game="dice"
      :amount="config.silent ? uiBetAmount : bet.amount"
      :balance="config.silent ? uiBalance : config.balance"
      :decimal="config.decimal"
      :profit-on-win="config.silent ? uiProfitOnWin : profitOnWin"
      :is-rolling="isRolling"
      :is-auto-running="isAutoRunning"
      :win-chance="config.silent ? uiWinChance : winChance"
      @update:amount="(val) => (bet.amount = val)"
      @bet="handleManualBet"
      @set-bet="setBet"
      @auto-start="startAuto"
      @auto-stop="stopAuto"
      @reset-balance="resetBalance"
    />
  </GameLayout>
</template>
