<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import GameLayout from '@/layouts/GameLayout.vue'
import MinesBoard from '@/components/MinesBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import { minesStore } from '@/store/minesStore.js'
import { useBetController } from '@/composables/useBetController.js'
import { placeBetUnified } from '@/utils/betUnified.js'

const layoutRef = ref(null)
const simulator = minesStore
const {
  config,
  bet,
  isRolling,
  lastResult,
  uiBalance,
  uiBetAmount,
  uiProfitOnWin,
  uiMinesTarget,
  uiMinesPicks,
  uiMultiplier,
  uiWinChance,
  profitOnWin,
  randomizeClientSeed,
  minesRound,
  startMinesRound,
  openMinesTile: openRoundTile,
  cashoutMinesRound,
} = simulator

const { isAutoRunning, setBet, resetBalance, startAuto, stopAuto } =
  useBetController(simulator, (msg, type) => layoutRef.value?.showToast(msg, type))

const cashoutAmount = computed(() => minesRound.wager * minesRound.multiplier)

function handleStart() {
  const result = startMinesRound()
  if (result.error) layoutRef.value?.showToast(result.error, 'lose')
}

function handleOpenTile(tile) {
  const result = openRoundTile(tile)
  if (result.error) {
    layoutRef.value?.showToast(result.error, 'lose')
  } else if (result.game === 'mines') {
    const message = result.win
      ? `WIN! +${result.profit.toFixed(6)}`
      : `BOOM: -${Math.abs(result.profit).toFixed(6)}`
    layoutRef.value?.showToast(message, result.win ? 'win' : 'lose')
  }
}

function handleCashout() {
  const result = cashoutMinesRound()
  if (result.error) {
    layoutRef.value?.showToast(result.error, 'lose')
    return
  }
  layoutRef.value?.showToast(`CASHED OUT! +${result.profit.toFixed(6)}`, 'win')
}

function handleAutoStart(config) {
  if (minesRound.active) {
    layoutRef.value?.showToast('Finish the active Mines round first', 'lose')
    return
  }
  if (bet.minesPicks.length === 0) bet.minesPicks = [1, 5, 10, 15, 20]
  startAuto(config)
}

onMounted(() => {
  config.currentGame = 'mines'

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
    get uiMinesTarget() { return uiMinesTarget.value },
    get uiMinesPicks() { return [...uiMinesPicks.value] },
    get uiMultiplier() { return uiMultiplier.value },
    get uiWinChance() { return uiWinChance.value },
    get silent() { return config.silent },
    set silent(value) { config.silent = !!value },
    get fastMode() { return config.fastMode },
    set fastMode(value) { config.fastMode = !!value },

    async bet(amount, target, game = 'mines', sideOrPicks) {
      return await placeBetUnified(amount, target, game, sideOrPicks)
    },
    startMines() { return startMinesRound() },
    openMinesTile(tile) { return openRoundTile(tile) },
    cashoutMines() { return cashoutMinesRound() },
    setMinesPicks(picks) { bet.minesPicks = Array.isArray(picks) ? picks.map(Number) : [] },
    setBalance(amount) {
      if (minesRound.active) return { error: 'Cannot change balance during an active round' }
      config.balance = Number(amount)
    },
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
        minesTarget: bet.minesTarget,
        minesPicks: [...bet.minesPicks],
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
    <MinesBoard
      :bomb-count="config.silent ? uiMinesTarget : bet.minesTarget"
      :opened-picks="minesRound.openedPicks"
      :round-active="minesRound.active"
      :round-multiplier="minesRound.multiplier"
      :last-result="lastResult"
      :is-rolling="isRolling"
      @update:bomb-count="(value) => (bet.minesTarget = value)"
      @open-tile="handleOpenTile"
    />

    <BetPanel
      current-game="mines"
      :amount="config.silent ? uiBetAmount : bet.amount"
      :balance="config.silent ? uiBalance : config.balance"
      :decimal="config.decimal"
      :profit-on-win="minesRound.active ? profitOnWin : 0"
      :is-rolling="isRolling"
      :is-auto-running="isAutoRunning"
      :round-active="minesRound.active"
      :can-cashout="minesRound.openedPicks.length > 0"
      :cashout-amount="cashoutAmount"
      @update:amount="(value) => (bet.amount = value)"
      @bet="handleStart"
      @cashout="handleCashout"
      @set-bet="setBet"
      @auto-start="handleAutoStart"
      @auto-stop="stopAuto"
      @reset-balance="resetBalance"
    />
  </GameLayout>
</template>
