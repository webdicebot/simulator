<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import GameLayout from '@/layouts/GameLayout.vue'
import LimboBoard from '@/components/LimboBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import { limboStore } from '@/store/limboStore.js'
import { useBetController } from '@/composables/useBetController.js'

const layoutRef = ref(null)
const simulator = limboStore
const { config, bet, isRolling, lastResult, limboHistory, uiBalance, uiBetAmount, uiProfitOnWin, uiLimboTarget, uiWinChance, profitOnWin, winChance } = simulator

const { 
  isAutoRunning, 
  setBet, 
  resetBalance, 
  handleManualBet, 
  startAuto, 
  stopAuto 
} = useBetController(simulator, (msg, type) => layoutRef.value?.showToast(msg, type))

onMounted(() => {
  config.currentGame = 'limbo'
  
  // Setup Global API
  window.DiceSim = {
    get balance() { return config.balance },
    get nonce() { return config.nonce },
    get lastResult() { return lastResult.value },
    async bet(amount, target) {
      bet.amount = Number(amount)
      bet.limboTarget = Number(target)
      return await simulator.placeBet()
    },
    setBalance(amount) { config.balance = Number(amount) },
    setDelay(seconds) { config.delay = Number(seconds) },
    rotateSeed() { simulator.randomizeClientSeed() }
  }
})

onUnmounted(() => {
  stopAuto()
  delete window.DiceSim
})
</script>

<template>
  <GameLayout ref="layoutRef" :simulator="simulator">
    <LimboBoard
      :history="limboHistory"
      :last-result="lastResult"
      :is-rolling="isRolling"
    />

    <BetPanel
      current-game="limbo"
      :amount="config.silent ? uiBetAmount : bet.amount"
      :balance="config.silent ? uiBalance : config.balance"
      :decimal="config.decimal"
      :profit-on-win="config.silent ? uiProfitOnWin : profitOnWin"
      :is-rolling="isRolling"
      :is-auto-running="isAutoRunning"
      :limbo-target="config.silent ? uiLimboTarget : bet.limboTarget"
      :win-chance="config.silent ? uiWinChance : winChance"
      @update:amount="(val) => (bet.amount = val)"
      @update:limbo-target="(val) => (bet.limboTarget = val)"
      @bet="handleManualBet"
      @set-bet="setBet"
      @auto-start="startAuto"
      @auto-stop="stopAuto"
      @reset-balance="resetBalance"
    />
  </GameLayout>
</template>
