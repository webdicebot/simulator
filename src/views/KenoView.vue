<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import GameLayout from '@/layouts/GameLayout.vue'
import KenoBoard from '@/components/KenoBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import { kenoStore } from '@/store/kenoStore.js'
import { useBetController } from '@/composables/useBetController.js'
import { placeBetUnified } from '@/utils/betUnified.js'

const layoutRef = ref(null)
const simulator = kenoStore
const {
  config, bet, isRolling, lastResult,
  uiBalance, uiBetAmount, uiKenoRisk, uiKenoNumbers,
  randomizeClientSeed,
} = simulator

const { isAutoRunning, setBet, resetBalance, handleManualBet, startAuto, stopAuto } =
  useBetController(simulator, (message, type) => layoutRef.value?.showToast(message, type))

function clearKenoBoard() {
  bet.kenoNumbers = []
  uiKenoNumbers.value = []
  lastResult.value = null
}

onMounted(() => {
  config.currentGame = 'keno'
  window.DiceSim = {
    get balance() { return config.balance },
    get nonce() { return config.nonce },
    get clientSeed() { return config.clientSeed },
    get serverSeed() { return config.serverSeed },
    get lastResult() { return lastResult.value },
    get decimal() { return config.decimal },
    get uiBalance() { return uiBalance.value },
    get uiBetAmount() { return uiBetAmount.value },
    get uiKenoRisk() { return uiKenoRisk.value },
    get uiKenoNumbers() { return [...uiKenoNumbers.value] },
    get silent() { return config.silent },
    set silent(value) { config.silent = !!value },
    get fastMode() { return config.fastMode },
    set fastMode(value) { config.fastMode = !!value },
    async bet(amount, risk, game = 'keno', numbers) {
      return await placeBetUnified(amount, risk, game, numbers)
    },
    setKenoNumbers(numbers) { bet.kenoNumbers = Array.isArray(numbers) ? numbers.map(Number) : [] },
    setBalance(amount) { config.balance = Number(amount) },
    setDelay(seconds) { config.delay = Number(seconds) },
    setHouseEdge(percent) { config.houseEdge = Number(percent) },
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
        kenoRisk: bet.kenoRisk,
        kenoNumbers: [...bet.kenoNumbers],
      }
    },
  }
  Object.defineProperty(window, 'FastMode', {
    get() { return config.fastMode },
    set(value) { config.fastMode = !!value },
    configurable: true,
  })
})

onUnmounted(() => {
  stopAuto()
  delete window.DiceSim
  delete window.FastMode
})
</script>

<template>
  <GameLayout ref="layoutRef" :simulator="simulator">
    <KenoBoard
      :selected-numbers="config.silent ? uiKenoNumbers : bet.kenoNumbers"
      :risk="config.silent ? uiKenoRisk : bet.kenoRisk"
      :last-result="lastResult"
      :is-rolling="isRolling"
      @update:selected-numbers="(value) => (bet.kenoNumbers = value)"
      @update:risk="(value) => (bet.kenoRisk = value)"
      @clear="clearKenoBoard"
    />
    <BetPanel
      current-game="keno"
      :amount="config.silent ? uiBetAmount : bet.amount"
      :balance="config.silent ? uiBalance : config.balance"
      :decimal="config.decimal"
      :profit-on-win="0"
      :is-rolling="isRolling"
      :is-auto-running="isAutoRunning"
      @update:amount="(value) => (bet.amount = value)"
      @bet="handleManualBet"
      @set-bet="setBet"
      @auto-start="startAuto"
      @auto-stop="stopAuto"
      @reset-balance="resetBalance"
    />
  </GameLayout>
</template>
