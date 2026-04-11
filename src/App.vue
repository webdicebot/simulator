<template>
  <div class="app-root">
    <!-- Header -->
    <AppHeader 
      :recent-rolls="recentRolls" 
      :house-edge="config.houseEdge" 
      :fast-mode="config.fastMode"
      @toggle-fast="config.fastMode = !config.fastMode"
      @show-settings="showSettings = true" 
    />

    <!-- Main Content -->
    <main class="main-content">
      <div class="game-layout">
        <!-- Left: Stats -->
        <aside class="sidebar-left">
          <StatsPanel :stats="stats" :decimal="config.decimal" :recent-rolls="recentRolls" @reset="resetStats" />
        </aside>

        <!-- Center: Game Board -->
        <section class="center-column">
          <DiceBoard
            :target="config.silent ? uiTarget : bet.target"
            :side="config.silent ? uiSide : bet.side"
            :multiplier="config.silent ? uiMultiplier : multiplier"
            :win-chance="config.silent ? uiWinChance : winChance"
            :last-result="lastResult"
            :is-rolling="isRolling"
            :disabled="isRolling"
            @update:target="(val) => (bet.target = val)"
            @update:side="(val) => (bet.side = val)"
          />

          <BetPanel
            :amount="config.silent ? uiBetAmount : bet.amount"
            :balance="config.silent ? uiBalance : config.balance"
            :decimal="config.decimal"
            :profit-on-win="config.silent ? uiProfitOnWin : profitOnWin"
            :is-rolling="isRolling"
            :is-auto-running="isAutoRunning"
            @update:amount="(val) => (bet.amount = val)"
            @bet="handleManualBet"
            @set-bet="setBet"
            @auto-start="startAuto"
            @auto-stop="stopAuto"
            @reset-balance="resetBalance"
          />
        </section>

        <!-- Right: History -->
        <aside class="sidebar-right">
          <BetHistory :rolls="recentRolls" :decimal="config.decimal" />
        </aside>
      </div>
    </main>

    <!-- Settings Modal -->
    <SettingsModal
      :show="showSettings"
      :config="config"
      @close="showSettings = false"
      @update-config="updateConfig"
      @random-client="randomizeClientSeed"
      @random-server="randomizeServerSeed"
    />

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-notification" :class="toast.type">
        <Icon :icon="toast.type === 'win' ? 'mdi:check-circle' : 'mdi:close-circle'" :width="18" />
        {{ toast.message }}
      </div>
    </Transition>

    <!-- Floating Balance (mobile) -->
    <div class="mobile-balance">
      <Icon icon="cryptocurrency-color:btc" :width="14" />
      {{ (config.silent ? uiBalance : config.balance).toFixed(4) }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useSimulator } from '@/composables/useSimulator.js'

import AppHeader from '@/components/AppHeader.vue'
import DiceBoard from '@/components/DiceBoard.vue'
import BetPanel from '@/components/BetPanel.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import BetHistory from '@/components/BetHistory.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const {
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
  randomizeClientSeed,
  randomizeServerSeed,
  resetStats,
  placeBet,
} = useSimulator()

// UI state
const showSettings = ref(false)
const isRolling = ref(false)
const isAutoRunning = ref(false)

// Toast
const toast = reactive({ show: false, message: '', type: 'win' })
let toastTimer = null

function showToast(message, type = 'win') {
  if (config.silent) return // Không hiện toast khi ở chế độ im lặng
  if (toastTimer) clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.show = true
  toastTimer = setTimeout(() => {
    toast.show = false
  }, 2000)
}

// Auto bet state
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
  isRolling.value = true
  try {
    const result = await placeBet()
    if (result.error) {
      showToast(result.error, 'lose')
    } else {
      const msg = result.win ? `WIN! +${result.profit.toFixed(6)}` : `LOSS: -${Math.abs(result.profit).toFixed(6)}`
      showToast(msg, result.win ? 'win' : 'lose')
    }
  } finally {
    isRolling.value = false
  }
}

async function startAuto(conf) {
  if (isAutoRunning.value) return
  isAutoRunning.value = true
  isRunning.value = true
  autoConf = conf
  autoRemaining = conf.count === 0 ? Infinity : conf.count
  initialBet = bet.amount

  async function tick() {
    if (!isAutoRunning.value) return
    if (autoRemaining <= 0) {
      stopAuto()
      return
    }

    // Check stop conditions
    if (autoConf.stopProfit > 0 && stats.totalProfit >= autoConf.stopProfit) {
      stopAuto()
      return
    }
    if (autoConf.stopLoss > 0 && stats.totalProfit <= -autoConf.stopLoss) {
      stopAuto()
      return
    }

    isRolling.value = true
    try {
      const result = await placeBet()
      if (result.error) {
        stopAuto()
        return
      }

      if (autoRemaining !== Infinity) autoRemaining -= 1

      // Adjust bet
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

      // Clamp bet to balance
      if (bet.amount > config.balance) bet.amount = config.balance
      if (bet.amount <= 0) {
        stopAuto()
        return
      }
    } finally {
      isRolling.value = false
    }

    const delay = config.delay * 1000 || 50
    autoTimer = setTimeout(tick, delay)
  }

  tick()
}

function stopAuto() {
  isAutoRunning.value = false
  isRunning.value = false
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
  isRolling.value = false
}

function updateConfig(newConfig) {
  Object.assign(config, newConfig)
  uiBalance.value = config.balance
}

onMounted(() => {
  /**
   * window.DiceSim — Global API for bot scripts
   *
   * Bot scripts call this exactly like a real dice site API:
   *   const result = await window.DiceSim.bet(amount, target, side)
   *
   * Properties (reactive, always up-to-date):
   *   window.DiceSim.balance     — current balance
   *   window.DiceSim.nonce       — current nonce
   *   window.DiceSim.clientSeed  — client seed
   *   window.DiceSim.serverSeed  — server seed
   *   window.DiceSim.lastResult  — last bet result object
   *
   * Methods:
   *   .bet(amount, target, side)  → Promise<{ profit, resultNumber, nonce, win, balance, multiplier }>
   *   .setBalance(amount)         — override balance directly
   *   .setDelay(seconds)          — set delay between auto bets
   *   .rotateSeed()               — randomize client seed (resets nonce)
   *   .getConfig()                → current config snapshot
   */
  window.DiceSim = {
    // --- Live reactive getters ---
    get balance() {
      return config.balance
    },
    get nonce() {
      return config.nonce
    },
    get clientSeed() {
      return config.clientSeed
    },
    get serverSeed() {
      return config.serverSeed
    },
    get lastResult() {
      return lastResult.value
    },
    get decimal() {
      return config.decimal
    },
    get uiBalance() {
      return uiBalance.value
    },
    get uiBetAmount() {
      return uiBetAmount.value
    },
    get uiProfitOnWin() {
      return uiProfitOnWin.value
    },
    get uiTarget() {
      return uiTarget.value
    },
    get uiSide() {
      return uiSide.value
    },
    get uiMultiplier() {
      return uiMultiplier.value
    },
    get uiWinChance() {
      return uiWinChance.value
    },
    get silent() {
      return config.silent
    },
    set silent(v) {
      config.silent = !!v
    },
    get fastMode() {
      return config.fastMode
    },
    set fastMode(v) {
      config.fastMode = !!v
    },

    // --- Core bet method (mirrors real dice API) ---
    async bet(amount, target, side) {
      // Override bet params from bot script
      bet.amount = Number(amount)
      bet.target = Number(target)
      bet.side = side || bet.side

      isRolling.value = true
      try {
        const result = await placeBet()
        return result
      } finally {
        isRolling.value = false
      }
    },

    // --- Utility methods ---
    setBalance(amount) {
      config.balance = Number(amount)
    },

    setDelay(seconds) {
      config.delay = Number(seconds)
    },

    setHouseEdge(pct) {
      config.houseEdge = Number(pct)
    },

    rotateSeed() {
      randomizeClientSeed()
    },

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

  console.log('%c[DiceSim] Global API ready → window.DiceSim', 'color:#1d9bf0;font-weight:bold;font-size:13px')
  console.log('Usage: const result = await window.DiceSim.bet(amount, target, "over")')

  // Expose window.FastMode for user scripts
  Object.defineProperty(window, 'FastMode', {
    get() {
      return config.fastMode
    },
    set(v) {
      config.fastMode = !!v
    },
    configurable: true
  })
})

onUnmounted(() => {
  stopAuto()
  if (toastTimer) clearTimeout(toastTimer)
  delete window.DiceSim
  delete window.FastMode
})
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.game-layout {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  gap: 16px;
  align-items: start;
}

.center-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.toast-notification.win {
  background: rgba(63, 185, 80, 0.95);
  color: white;
}
.toast-notification.lose {
  background: rgba(248, 81, 73, 0.95);
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Mobile balance floating bar */
.mobile-balance {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 1100px) {
  .game-layout {
    grid-template-columns: 220px 1fr;
    grid-template-areas:
      'left center'
      'right right';
  }
  .sidebar-left {
    grid-area: left;
  }
  .center-column {
    grid-area: center;
  }
  .sidebar-right {
    grid-area: right;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 12px 12px 70px;
  }
  .game-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'center'
      'left'
      'right';
  }
  .mobile-balance {
    display: flex;
  }
}
</style>
