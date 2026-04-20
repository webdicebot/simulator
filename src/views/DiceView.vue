<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import GameLayout from '@/layouts/GameLayout.vue'
import DiceBoard from '@/components/DiceBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import { diceStore } from '@/store/diceStore.js'
import { useBetController } from '@/composables/useBetController.js'

const layoutRef = ref(null)
const simulator = diceStore

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

  // ── API Reference Log ──────────────────────────────────────────────────
  console.log(
    '%c🎲 Web DiceBot Simulator — Dice API Ready',
    'background:#1d9bf0;color:#fff;font-weight:800;font-size:14px;padding:4px 12px;border-radius:6px'
  )
  console.log(
    '%c  window.DiceSim  is available in the console. Use it to inject bot scripts.',
    'color:#94a3b8;font-size:12px'
  )

  console.group('%c📦 Properties (read/write)', 'color:#3fb950;font-weight:700;font-size:12px')
  console.table({
    'DiceSim.balance':     { type: 'number (get)',       description: 'Current balance' },
    'DiceSim.silent':      { type: 'boolean (get/set)',  description: 'Silent mode — skips UI updates for speed' },
    'DiceSim.fastMode':    { type: 'boolean (get/set)',  description: 'Fast mode toggle' },
    'DiceSim.nonce':       { type: 'number (get)',        description: 'Current nonce counter' },
    'DiceSim.clientSeed':  { type: 'string (get)',        description: 'Active client seed' },
    'DiceSim.serverSeed':  { type: 'string (get)',        description: 'Active server seed' },
    'DiceSim.lastResult':  { type: 'object (get)',        description: 'Last bet result object' },
    'DiceSim.decimal':     { type: 'number (get)',        description: 'Decimal precision for display' },
  })
  console.groupEnd()

  console.group('%c⚡ Methods', 'color:#f0a500;font-weight:700;font-size:12px')
  console.table({
    'DiceSim.bet(amount, target, side)': { description: 'Place a single bet. side: "over"|"under"', returns: 'Promise<result>' },
    'DiceSim.setBalance(amount)':        { description: 'Override current balance',                  returns: 'void' },
    'DiceSim.setDelay(seconds)':         { description: 'Set delay between auto bets (seconds)',      returns: 'void' },
    'DiceSim.setHouseEdge(pct)':         { description: 'Set house edge % (default 1)',              returns: 'void' },
    'DiceSim.rotateSeed()':              { description: 'Rotate to a new random client seed',        returns: 'void' },
    'DiceSim.getConfig()':               { description: 'Get full config snapshot object',           returns: 'object' },
  })
  console.groupEnd()

  console.group('%c📋 Quick Start Examples', 'color:#1d9bf0;font-weight:700;font-size:12px')
  console.log('%cManual single bet:', 'color:#94a3b8;font-size:11px')
  console.log('%c  const r = await DiceSim.bet(1, 49.5, "under")\n  console.log(r.win, r.profit, r.balance)', 'color:#e6edf3;font-family:monospace;font-size:11px')
  console.log('%cSimple Martingale loop:', 'color:#94a3b8;font-size:11px')
  console.log(
    '%c  DiceSim.silent = true\n' +
    '  let base = 1\n' +
    '  for (let i = 0; i < 100; i++) {\n' +
    '    const r = await DiceSim.bet(base, 49.5, "under")\n' +
    '    base = r.win ? 1 : base * 2\n' +
    '  }\n' +
    '  DiceSim.silent = false',
    'color:#e6edf3;font-family:monospace;font-size:11px'
  )
  console.groupEnd()

  console.log('%c  window.FastMode = true/false  ← shortcut for DiceSim.fastMode', 'color:#475569;font-size:11px')
})

onUnmounted(() => {
  stopAuto()
  delete window.DiceSim
  delete window.FastMode
})
</script>

<template>
  <GameLayout ref="layoutRef" :simulator="simulator">
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
