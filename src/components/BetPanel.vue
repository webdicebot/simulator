<template>
  <div class="bet-panel">
    <!-- Balance Display -->
    <div class="balance-row">
      <div class="balance-info">
        <Icon icon="cryptocurrency-color:btc" :width="20" class="currency-icon" />
        <div class="balance-values">
          <span class="balance-amount">{{ formattedBalance }}</span>
          <span class="balance-label">Balance</span>
        </div>
      </div>
      <div class="balance-actions">
        <button class="quick-btn" title="Half" @click="$emit('set-bet', balance / 2)">½</button>
        <button class="quick-btn" title="Max" @click="$emit('set-bet', balance)">Max</button>
        <button class="quick-btn" title="Double" @click="$emit('set-bet', amount * 2)">2x</button>
      </div>
    </div>

    <!-- Bet Input Row -->
    <div class="bet-row">
      <div class="input-group bet-input-group">
        <div class="input-prefix">
          <Icon icon="cryptocurrency-color:btc" :width="16" />
        </div>
        <input
          id="bet-amount"
          type="number"
          class="bet-input"
          :value="amount"
          min="0.00000001"
          step="0.00000001"
          @input="$emit('update:amount', Number($event.target.value))"
        />
        <div class="input-currency">BTC</div>
      </div>

      <!-- BET Button -->
      <button
        id="btn-manual-bet"
        class="bet-button"
        :class="{ 'is-loading': isRolling }"
        :disabled="isRolling || balance <= 0"
        @click="$emit('bet')"
      >
        <span v-if="isRolling" class="loading-dots"> <span></span><span></span><span></span> </span>
        <span v-else class="bet-btn-content">
          <Icon icon="mdi:lightning-bolt" :width="16" />
          BET
        </span>
        <div v-if="profitOnWin > 0 && !isRolling" class="bet-profit-hint">
          Profit on win: +{{ profitOnWin.toFixed(8) }} BTC
        </div>
      </button>
    </div>

    <!-- Broke Overlay -->
    <Transition name="broke">
      <div v-if="isBroke" class="broke-overlay">
        <div class="broke-icon">
          <Icon icon="mdi:emoticon-dead-outline" :width="40" />
        </div>
        <div class="broke-text">
          <span class="broke-title">You're Broke!</span>
          <span class="broke-sub">Balance has run out</span>
        </div>
        <button id="btn-reset-balance" class="reset-balance-btn" @click="$emit('reset-balance')">
          <Icon icon="mdi:refresh" :width="18" />
          Reset Balance
        </button>
      </div>
    </Transition>

    <!-- Auto Bet Controls -->
    <div class="auto-section">
      <div class="auto-header" @click="toggleAuto">
        <div class="auto-title">
          <Icon icon="mdi:robot-outline" :width="16" />
          Auto Bet
        </div>
        <div class="auto-toggle" :class="{ active: autoExpanded }">
          <Icon icon="mdi:chevron-down" :width="16" />
        </div>
      </div>

      <Transition name="auto-expand">
        <div v-if="autoExpanded" class="auto-body">
          <div class="auto-field">
            <label>Number of Bets</label>
            <div class="input-row">
              <input
                id="auto-count"
                type="number"
                class="mini-input"
                :value="autoConfig.count"
                min="1"
                @input="autoConfig.count = Number($event.target.value)"
              />
              <button class="chip-btn" title="Infinite" @click="autoConfig.count = 0">∞</button>
            </div>
          </div>

          <div class="auto-field">
            <label>On Win</label>
            <select class="mini-select" :value="autoConfig.onWin" @change="autoConfig.onWin = $event.target.value">
              <option value="reset">Reset bet</option>
              <option value="increase">Increase by %</option>
              <option value="stop">Stop</option>
            </select>
            <input
              v-if="autoConfig.onWin === 'increase'"
              v-model="autoConfig.winPct"
              type="number"
              class="mini-input"
              min="0"
              placeholder="%"
            />
          </div>

          <div class="auto-field">
            <label>On Loss</label>
            <select class="mini-select" :value="autoConfig.onLoss" @change="autoConfig.onLoss = $event.target.value">
              <option value="reset">Reset bet</option>
              <option value="increase">Increase by %</option>
              <option value="stop">Stop</option>
            </select>
            <input
              v-if="autoConfig.onLoss === 'increase'"
              v-model="autoConfig.lossPct"
              type="number"
              class="mini-input"
              min="0"
              placeholder="%"
            />
          </div>

          <div class="auto-field two-col">
            <div>
              <label>Stop on Profit</label>
              <input v-model="autoConfig.stopProfit" type="number" class="mini-input" min="0" placeholder="0" />
            </div>
            <div>
              <label>Stop on Loss</label>
              <input v-model="autoConfig.stopLoss" type="number" class="mini-input" min="0" placeholder="0" />
            </div>
          </div>

          <div class="auto-actions">
            <button
              v-if="!isAutoRunning"
              id="btn-auto-start"
              class="auto-start-btn"
              @click="$emit('auto-start', autoConfig)"
            >
              <Icon icon="mdi:play" :width="16" />
              Start Auto Bet
            </button>
            <button v-else id="btn-auto-stop" class="auto-stop-btn" @click="$emit('auto-stop')">
              <Icon icon="mdi:stop" :width="16" />
              Stop
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  amount: { type: Number, default: 1 },
  balance: { type: Number, default: 1000 },
  decimal: { type: Number, default: 8 },
  profitOnWin: { type: Number, default: 0 },
  isRolling: { type: Boolean, default: false },
  isAutoRunning: { type: Boolean, default: false },
})

defineEmits(['update:amount', 'bet', 'set-bet', 'auto-start', 'auto-stop', 'reset-balance'])

const isBroke = computed(() => props.balance <= 0)

const autoExpanded = ref(false)
const autoConfig = reactive({
  count: 10,
  onWin: 'reset',
  onLoss: 'increase',
  winPct: 0,
  lossPct: 50,
  stopProfit: 0,
  stopLoss: 0,
})

const formattedBalance = computed(() => {
  if (props.balance <= 0) return '0.' + '0'.repeat(props.decimal)
  return props.balance.toFixed(props.decimal)
})

function toggleAuto() {
  autoExpanded.value = !autoExpanded.value
}
</script>

<style scoped>
.bet-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

/* Balance Row */
.balance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--color-bg-input);
  border-bottom: 1px solid var(--color-border-light);
}
.balance-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.currency-icon {
  flex-shrink: 0;
}
.balance-values {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.balance-amount {
  font-size: 16px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: var(--color-text-primary);
}
.balance-label {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 1px;
}
.balance-actions {
  display: flex;
  gap: 6px;
}
.quick-btn {
  padding: 5px 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.quick-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-blue);
}

/* Bet Row */
.bet-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.input-group {
  display: flex;
  align-items: center;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  flex: 1;
  transition: border-color 0.2s;
}
.input-group:focus-within {
  border-color: var(--color-blue);
}

.input-prefix {
  padding: 0 10px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.bet-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  padding: 10px 0;
  min-width: 0;
}
.input-currency {
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* BET Button */
.bet-button {
  position: relative;
  min-width: 160px;
  background: var(--color-gradient-blue);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: var(--transition);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 16px;
  box-shadow: var(--shadow-glow-blue);
}
.bet-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(29, 155, 240, 0.5);
}
.bet-button:active:not(:disabled) {
  transform: translateY(0);
}
.bet-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bet-btn-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
}
.bet-profit-hint {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.85;
  white-space: nowrap;
}

/* Loading dots */
.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}
.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  animation: dotBounce 0.6s infinite;
}
.loading-dots span:nth-child(2) {
  animation-delay: 0.1s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.2s;
}
@keyframes dotBounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

/* Auto Bet */
.auto-section {
  border-top: 1px solid var(--color-border-light);
}
.auto-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}
.auto-header:hover {
  background: var(--color-bg-hover);
}
.auto-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.auto-toggle {
  color: var(--color-text-muted);
  transition: transform 0.3s;
}
.auto-toggle.active {
  transform: rotate(180deg);
}

.auto-body {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--color-bg-input);
}

.auto-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.auto-field label {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 500;
}
.auto-field.two-col {
  flex-direction: row;
  gap: 12px;
}
.auto-field.two-col > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-row {
  display: flex;
  gap: 6px;
}
.mini-input {
  flex: 1;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  padding: 7px 10px;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0;
}
.mini-input:focus {
  border-color: var(--color-blue);
}

.mini-select {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  padding: 7px 10px;
  outline: none;
  cursor: pointer;
  width: 100%;
}

.chip-btn {
  width: 34px;
  height: 34px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--transition);
}
.chip-btn:hover {
  border-color: var(--color-blue);
  color: var(--color-blue);
}

.auto-actions {
  padding-top: 4px;
}
.auto-start-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: var(--color-green);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}
.auto-start-btn:hover {
  background: var(--color-green-dark);
  transform: translateY(-1px);
}

.auto-stop-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: var(--color-red);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  animation: pulseBorder 1s infinite;
}
@keyframes pulseBorder {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(248, 81, 73, 0);
  }
}

/* Transition */
.auto-expand-enter-active,
.auto-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  overflow: hidden;
}
.auto-expand-enter-from,
.auto-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Broke Overlay */
.broke-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 20px;
  background: linear-gradient(135deg, rgba(248, 81, 73, 0.08) 0%, rgba(248, 81, 73, 0.02) 100%);
  border-top: 2px solid rgba(248, 81, 73, 0.3);
  text-align: center;
}
.broke-icon {
  width: 64px;
  height: 64px;
  background: var(--color-red-glow);
  border: 2px solid rgba(248, 81, 73, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-red);
  animation: brokePulse 2s ease infinite;
}
@keyframes brokePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(248, 81, 73, 0);
  }
}
.broke-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.broke-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-red);
}
.broke-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}
.reset-balance-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #3fb950 0%, #2ea043 100%);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(63, 185, 80, 0.3);
  animation: resetGlow 1.5s ease infinite alternate;
}
.reset-balance-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(63, 185, 80, 0.5);
}
.reset-balance-btn:active {
  transform: translateY(0);
}
@keyframes resetGlow {
  from {
    box-shadow: 0 4px 16px rgba(63, 185, 80, 0.2);
  }
  to {
    box-shadow: 0 4px 24px rgba(63, 185, 80, 0.6);
  }
}

/* Broke transition */
.broke-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.broke-leave-active {
  transition: all 0.3s ease;
}
.broke-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.broke-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
