<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { simulatorStore } from '@/store/simulatorStore.js'

import AppHeader from '@/components/AppHeader.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import BetHistory from '@/components/BetHistory.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const router = useRouter()

const {
  config,
  recentRolls,
  stats,
  uiBalance,
  resetStats,
  randomizeClientSeed,
  randomizeServerSeed,
} = simulatorStore

const showSettings = ref(false)

// Toast logic
const toast = reactive({ show: false, message: '', type: 'win' })
let toastTimer = null

function showToast(message, type = 'win') {
  if (config.silent) return
  if (toastTimer) clearTimeout(toastTimer)
  toast.message = message
  toast.type = type
  toast.show = true
  toastTimer = setTimeout(() => {
    toast.show = false
  }, 2000)
}

function updateConfig(newConfig) {
  Object.assign(config, newConfig)
  uiBalance.value = config.balance
}

function goHome() {
  router.push('/')
}

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

defineExpose({ showToast })
</script>

<template>
  <div class="app-root">
    <!-- Header -->
    <AppHeader
      :recent-rolls="recentRolls"
      :house-edge="config.houseEdge"
      :fast-mode="config.fastMode"
      @toggle-fast="config.fastMode = !config.fastMode"
      @show-settings="showSettings = true"
      @go-home="goHome"
    />

    <!-- Main Content -->
    <main class="main-content">
      <div class="game-layout">
        <!-- Left: Stats -->
        <aside class="sidebar-left">
          <StatsPanel :stats="stats" :decimal="config.decimal" :recent-rolls="recentRolls" @reset="resetStats" />
        </aside>

        <!-- Center: Game Board (Slot for Dice/Limbo) -->
        <section class="center-column">
          <slot></slot>
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
