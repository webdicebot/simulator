<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- Logo -->
      <div class="logo-area">
        <!-- <img src="/logo.png" alt="Dice Simulator" class="logo-img" /> -->
        <div class="logo-text">
          <div class="since-badge">Since 2019</div>
          <h2 class="logo-name">Web DiceBot <span>Simulator</span></h2>
          <span class="logo-badge">Product of webdicebot.net</span>
        </div>
      </div>

      <!-- Live bet ticker -->
      <div class="ticker-wrapper" aria-label="Recent results ticker">
        <TransitionGroup name="ticker" tag="div" class="ticker-list">
          <div v-for="roll in recentRolls.slice(0, 8)" :key="roll.nonce" class="ticker-item"
            :class="roll.win ? 'win' : 'lose'">
            <template v-if="roll.game === 'limbo'">
              {{ roll.resultMultiplier.toFixed(2) }}x
            </template>
            <template v-else>
              {{ roll.resultNumber.toFixed(2) }}
            </template>
          </div>
        </TransitionGroup>
      </div>

      <!-- Actions -->
      <div class="header-actions">
        <div class="rtp-badge">
          <Icon icon="mdi:percent" :width="14" />
          RTP {{ rtp }}%
        </div>
        <button id="btn-fastmode" class="icon-btn" :class="{ active: fastMode }" title="Fast Mode"
          @click="$emit('toggle-fast')">
          <Icon icon="mdi:lightning-bolt" :width="20" />
        </button>
        <button id="btn-help" class="icon-btn" title="Help" @click="showHelp = true">
          <Icon icon="mdi:help-circle-outline" :width="20" />
        </button>
        <button class="icon-btn" title="Settings" @click="$emit('show-settings')">
          <Icon icon="mdi:cog-outline" :width="20" />
        </button>
      </div>
    </div>
  </header>

  <!-- Help Modal -->
  <Transition name="help-modal">
    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="help-box">
        <div class="help-header">
          <div class="help-title">
            <Icon icon="mdi:information-outline" :width="20" />
            About Dice Simulator
          </div>
          <button class="help-close" @click="showHelp = false">
            <Icon icon="mdi:close" :width="18" />
          </button>
        </div>

        <div class="help-body">
          <div class="help-icon-wrap">
            <Icon icon="mdi:dice-6" :width="48" />
          </div>

          <p class="help-message">
            A tool for testing your script. It only supports the script testing process and does not reflect actual
            profits when applied to real dice sites.
          </p>

          <!-- <div class="help-api-box">
            <div class="help-api-title">
              <Icon icon="mdi:code-braces" :width="14" />
              Bot API
            </div>
            <code class="help-api-code">const result = await window.DiceSim.bet(amount, target, 'over')</code>
          </div> -->

          <div class="help-tags">
            <span class="tag">Client-side only</span>
            <span class="tag">Provably Fair</span>
            <span class="tag">HMAC-SHA512</span>
          </div>
        </div>

        <button class="help-ok-btn" @click="showHelp = false">Got it!</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  recentRolls: {
    type: Array,
    default: () => [],
  },
  houseEdge: {
    type: Number,
    default: 1,
  },
  fastMode: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['show-settings', 'toggle-fast'])

const showHelp = ref(false)
const rtp = computed(() => (100 - props.houseEdge).toFixed(2))
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(22, 27, 34, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  height: 60px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Logo */
.logo-area {
  padding-top: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-img {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}


.logo-name {
  color: #ffffff;
}

.logo-name span {
  color: #ff9100;
}

.since-badge {
  font-size: 0.55rem;
  font-weight: 800;
  color: #00ffc3;
  border: 1px solid #00ffc3;
  border-radius: 4px;
  padding: 1px 4px;
  width: fit-content;
}

.logo-badge {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Ticker */
.ticker-wrapper {
  flex: 1;
  overflow: hidden;
}

.ticker-list {
  display: flex;
  gap: 6px;
  overflow: hidden;
}

.ticker-item {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
  transition: var(--transition);
}

.ticker-item.win {
  background: var(--color-green-glow);
  color: var(--color-green);
  border: 1px solid rgba(63, 185, 80, 0.3);
}

.ticker-item.lose {
  background: var(--color-red-glow);
  color: var(--color-red);
  border: 1px solid rgba(248, 81, 73, 0.3);
}

/* Ticker animation */
.ticker-enter-active {
  transition: all 0.3s ease;
}

.ticker-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rtp-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--color-green-glow);
  color: var(--color-green);
  border: 1px solid rgba(63, 185, 80, 0.3);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
}

.icon-btn {
  width: 34px;
  height: 34px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.icon-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-blue);
}

.icon-btn.active {
  background: var(--color-blue-glow);
  color: var(--color-blue);
  border-color: var(--color-blue);
}

@media (max-width: 640px) {
  .ticker-wrapper {
    display: none;
  }

  .logo-text {
    display: none;
  }

  .rtp-badge span {
    display: none;
  }
}

/* Help Modal */
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.help-box {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.help-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.help-close {
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.help-close:hover {
  border-color: var(--color-red);
  color: var(--color-red);
}

.help-body {
  padding: 24px 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.help-icon-wrap {
  width: 80px;
  height: 80px;
  background: var(--color-blue-glow);
  border: 1px solid rgba(29, 155, 240, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-blue);
}

.help-message {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 340px;
}

.help-api-box {
  width: 100%;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  text-align: left;
}

.help-api-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.help-api-code {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: var(--color-green);
  word-break: break-all;
  line-height: 1.5;
}

.help-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  padding: 4px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.help-ok-btn {
  display: block;
  width: calc(100% - 40px);
  margin: 0 20px 20px;
  padding: 11px;
  background: var(--color-gradient-blue);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}

.help-ok-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Modal transition */
.help-modal-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.help-modal-leave-active {
  transition: all 0.2s ease;
}

.help-modal-enter-from,
.help-modal-leave-to {
  opacity: 0;
}

.help-modal-enter-from .help-box,
.help-modal-leave-to .help-box {
  transform: scale(0.92) translateY(16px);
}
</style>
