<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import GameLayout from '@/layouts/GameLayout.vue'
import LimboBoard from '@/components/LimboBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import { limboStore } from '@/store/limboStore.js'
import { useBetController } from '@/composables/useBetController.js'
import { placeBetUnified } from '@/utils/betUnified.js'

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

  // Setup Global API for bot scripts
  window.DiceSim = {
    get balance()    { return config.balance },
    get nonce()      { return config.nonce },
    get clientSeed() { return config.clientSeed },
    get serverSeed() { return config.serverSeed },
    get lastResult() { return lastResult.value },
    get decimal()    { return config.decimal },
    get uiBalance()     { return uiBalance.value },
    get uiBetAmount()   { return uiBetAmount.value },
    get uiProfitOnWin() { return uiProfitOnWin.value },
    get uiLimboTarget() { return uiLimboTarget.value },
    get uiWinChance()   { return uiWinChance.value },
    get silent()     { return config.silent },
    set silent(v)    { config.silent = !!v },
    get fastMode()   { return config.fastMode },
    set fastMode(v)  { config.fastMode = !!v },

    /**
     * Unified bet — routes by `game` param.
     * @param {number} amount
     * @param {number} target  - target multiplier for limbo (>= 1.01) | roll threshold for dice (0-99)
     * @param {'dice'|'limbo'} game
     * @param {'over'|'under'} [side]  - dice only, optional (keeps current if omitted)
     */
    async bet(amount, target, game = 'limbo', side) {
      return await placeBetUnified(amount, target, game, side)
    },

    /** Change dice side without placing a bet (for cross-game dice calls). */
    setSide(side) { limboStore.bet.side = side },

    setBalance(amount)   { config.balance  = Number(amount) },
    setDelay(seconds)    { config.delay    = Number(seconds) },
    setHouseEdge(pct)    { config.houseEdge = Number(pct) },
    rotateSeed()         { simulator.randomizeClientSeed() },
    getConfig() {
      return {
        balance:    config.balance,
        nonce:      config.nonce,
        clientSeed: config.clientSeed,
        serverSeed: config.serverSeed,
        houseEdge:  config.houseEdge,
        decimal:    config.decimal,
        delay:      config.delay,
        silent:     config.silent,
        fastMode:   config.fastMode,
      }
    },
  }

  Object.defineProperty(window, 'FastMode', {
    get() { return config.fastMode },
    set(v) { config.fastMode = !!v },
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
