<template>
  <div class="history-panel">
    <div class="panel-header">
      <div class="panel-title">
        <Icon icon="mdi:history" :width="16" />
        Bet History
      </div>
      <span class="count-badge">{{ rolls.length }}</span>
    </div>

    <div v-if="rolls.length === 0" class="empty-state">
      <Icon icon="mdi:dice-multiple-outline" :width="36" />
      <p>No bets yet. Start rolling!</p>
    </div>

    <div v-else class="history-list">
      <div class="history-head">
        <span>#</span>
        <span>Result</span>
        <span>Target</span>
        <span>Profit</span>
        <span>Balance</span>
        <span></span>
      </div>
      <TransitionGroup name="history" tag="div" class="history-rows">
        <div
          v-for="roll in rolls.slice(0, 50)"
          :key="roll.nonce"
          class="history-row"
          :class="roll.win ? 'row-win' : 'row-lose'"
        >
          <span class="col-nonce">{{ roll.nonce }}</span>
          <span class="col-result" :class="roll.win ? 'win-val' : 'lose-val'">
            <template v-if="roll.game === 'limbo'">
              {{ roll.resultMultiplier.toFixed(2) }}x
            </template>
            <template v-else>
              {{ roll.resultNumber.toFixed(2) }}
              <span class="side-tag">{{ roll.side === 'under' ? '↓' : '↑' }}</span>
            </template>
          </span>
          <span class="col-target">{{ roll.target }}</span>
          <span class="col-profit" :class="roll.win ? 'win-val' : 'lose-val'">
            {{ roll.win ? '+' : '' }}{{ roll.profit.toFixed(6) }}
          </span>
          <span class="col-balance">{{ roll.balance.toFixed(6) }}</span>
          <span class="col-action">
            <button class="verify-btn" title="Verify provably fair hash" @click="openVerify(roll)">
              <Icon icon="mdi:shield-check-outline" :width="13" />
            </button>
          </span>
        </div>
      </TransitionGroup>
    </div>
  </div>

  <!-- Verify Modal -->
  <Transition name="verify-modal">
    <div v-if="verifyRoll" class="verify-overlay" @click.self="verifyRoll = null">
      <div class="verify-box">
        <!-- Header -->
        <div class="verify-header">
          <div class="verify-title">
            <Icon icon="mdi:shield-check-outline" :width="18" />
            Provably Fair Verification
          </div>
          <button class="verify-close" @click="verifyRoll = null">
            <Icon icon="mdi:close" :width="18" />
          </button>
        </div>

        <!-- Body -->
        <div class="verify-body">
          <!-- Status badge -->
          <div class="verify-status" :class="verifyStatus">
            <Icon
              :icon="
                verifyStatus === 'checking'
                  ? 'mdi:loading'
                  : verifyStatus === 'valid'
                    ? 'mdi:check-circle'
                    : 'mdi:close-circle'
              "
              :width="20"
              :class="{ spin: verifyStatus === 'checking' }"
            />
            <span>{{
              verifyStatus === 'checking'
                ? 'Verifying...'
                : verifyStatus === 'valid'
                  ? `Valid — rolled ${computedResult}`
                  : 'Mismatch!'
            }}</span>
          </div>

          <!-- Bet info -->
          <div class="verify-grid">
            <div class="vfield">
              <label>Nonce</label>
              <code>{{ verifyRoll.nonce }}</code>
            </div>
            <div class="vfield">
              <label>Result</label>
              <code :class="verifyRoll.win ? 'val-green' : 'val-red'">
                <template v-if="verifyRoll.game === 'limbo'">
                  {{ verifyRoll.resultMultiplier.toFixed(2) }}x
                </template>
                <template v-else>
                  {{ verifyRoll.resultNumber.toFixed(2) }}
                </template>
                {{ verifyRoll.win ? '✓ WIN' : '✗ LOSS' }}
              </code>
            </div>
            <div class="vfield full">
              <label>Client Seed – Nonce</label>
              <code class="seed-code">{{ verifyRoll.clientSeed }}-{{ verifyRoll.nonce }}</code>
            </div>
            <div class="vfield full">
              <label>Server Seed (HMAC key)</label>
              <code class="seed-code">{{ verifyRoll.serverSeed }}</code>
            </div>
          </div>

          <!-- Hash output -->
          <div v-if="computedHash" class="hash-section">
            <label class="hash-label">
              <Icon icon="mdi:lock-outline" :width="13" />
              HMAC-SHA512 Output (first 5 hex chars used)
            </label>
            <div class="hash-display">
              <span class="hash-highlight">{{ computedHash.slice(0, 5) }}</span>
              <span class="hash-rest">{{ computedHash.slice(5) }}</span>
            </div>
            <div class="hash-calc">
              <span class="calc-step">0x{{ computedHash.slice(0, 5) }}</span>
              <span class="calc-op">= {{ parseInt(computedHash.slice(0, 5), 16) }}</span>
              <template v-if="verifyRoll.game === 'limbo'">
                <span class="calc-op">% 10000 / 100 → resultNumber</span>
                <span class="calc-op">99 / resultNumber</span>
                <span class="calc-result">= {{ computedResultMultiplier.toFixed(2) }}x</span>
              </template>
              <template v-else>
                <span class="calc-op">% 10000 / 100</span>
                <span class="calc-result">= {{ computedResult.toFixed(2) }}</span>
              </template>
            </div>
          </div>
        </div>

        <button class="verify-ok-btn" @click="verifyRoll = null">Close</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineProps({
  rolls: {
    type: Array,
    default: () => [],
  },
  decimal: {
    type: Number,
    default: 8,
  },
})

const verifyRoll = ref(null)
const verifyStatus = ref('checking') // 'checking' | 'valid' | 'invalid'
const computedHash = ref('')
const computedResult = ref(null)
const computedResultMultiplier = ref(null)

function openVerify(roll) {
  verifyRoll.value = roll
  verifyStatus.value = 'checking'
  computedHash.value = ''
  computedResult.value = null
  computedResultMultiplier.value = null
  runVerify(roll)
}

function runVerify(roll) {
  const serverSeed = roll.serverSeed
  const clientSeed = roll.clientSeed
  const nonce = roll.nonce

  // Use the SAME fast hash as diceEngine.js
  let hashVal = 0n
  const combined = serverSeed + clientSeed + '-' + nonce
  for (let i = 0; i < combined.length; i++) {
    hashVal = hashVal * 31n + BigInt(combined.charCodeAt(i))
    hashVal = (hashVal ^ (hashVal >> 11n)) * 0x45d9f3b335b369ebn
    hashVal = (hashVal ^ (hashVal >> 13n)) * 0x8a92aa03a8936997n
    hashVal = hashVal ^ (hashVal >> 16n)
  }

  const hex = (hashVal & 0xffffffffffffffffn).toString(16).padStart(16, '0').padEnd(128, '0')
  computedHash.value = hex

  const first5 = hex.substring(0, 5)
  const decimal = parseInt(first5, 16)
  const result = (decimal % 10000) / 100

  computedResult.value = result
  
  if (roll.game === 'limbo') {
    // resultMultiplier = 99 / resultNumber (clamped)
    const chance = Math.max(0.01, result)
    computedResultMultiplier.value = 99 / chance
    verifyStatus.value = Math.abs(computedResultMultiplier.value - roll.resultMultiplier) < 0.0001 ? 'valid' : 'invalid'
  } else {
    verifyStatus.value = result === roll.resultNumber ? 'valid' : 'invalid'
  }
}
</script>

<style scoped>
.history-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.count-badge {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.history-list {
  overflow: hidden;
}

.history-head {
  display: grid;
  grid-template-columns: 36px 54px 54px 1fr 1fr 28px;
  gap: 4px;
  padding: 8px 14px;
  background: var(--color-bg-input);
  border-bottom: 1px solid var(--color-border-light);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.history-rows {
  max-height: 380px;
  overflow-y: auto;
}

.history-row {
  display: grid;
  grid-template-columns: 36px 54px 54px 1fr 1fr 28px;
  gap: 4px;
  align-items: center;
  padding: 7px 14px;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 12px;
  transition: background 0.15s;
}
.history-row:last-child {
  border-bottom: none;
}
.history-row:hover {
  background: var(--color-bg-hover);
}
.history-row.row-win {
  border-left: 2px solid var(--color-green);
}
.history-row.row-lose {
  border-left: 2px solid var(--color-red);
}

.col-nonce {
  color: var(--color-text-muted);
  font-size: 11px;
}
.col-result {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 3px;
}
.side-tag {
  font-size: 10px;
  opacity: 0.7;
}
.col-target {
  color: var(--color-text-secondary);
}
.col-profit,
.col-balance {
  font-family: 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
}
.col-balance {
  color: var(--color-text-secondary);
}

.win-val {
  color: var(--color-green);
}
.lose-val {
  color: var(--color-red);
}

/* Verify button */
.col-action {
  display: flex;
  justify-content: center;
}
.verify-btn {
  width: 22px;
  height: 22px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;
}
.verify-btn:hover {
  border-color: var(--color-blue);
  color: var(--color-blue);
  background: var(--color-blue-glow);
}

/* History animation */
.history-enter-active {
  transition: all 0.3s ease;
}
.history-enter-from {
  opacity: 0;
  transform: translateX(-10px);
  background: rgba(29, 155, 240, 0.05);
}

/* ===== VERIFY MODAL ===== */
.verify-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.verify-box {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.verify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}
.verify-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.verify-close {
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
.verify-close:hover {
  border-color: var(--color-red);
  color: var(--color-red);
}

.verify-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Status badge */
.verify-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
}
.verify-status.checking {
  background: rgba(29, 155, 240, 0.1);
  border: 1px solid rgba(29, 155, 240, 0.3);
  color: var(--color-blue);
}
.verify-status.valid {
  background: var(--color-green-glow);
  border: 1px solid rgba(63, 185, 80, 0.3);
  color: var(--color-green);
}
.verify-status.invalid {
  background: var(--color-red-glow);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: var(--color-red);
}
.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Grid fields */
.verify-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.vfield {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.vfield.full {
  grid-column: 1 / -1;
}
.vfield label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.vfield code {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--color-text-primary);
  word-break: break-all;
  line-height: 1.4;
}
.seed-code {
  font-size: 10px;
  color: var(--color-text-secondary);
}
.val-green {
  color: var(--color-green) !important;
}
.val-red {
  color: var(--color-red) !important;
}

/* Hash section */
.hash-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hash-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.hash-display {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.6;
  word-break: break-all;
  max-height: 72px;
  overflow-y: auto;
}
.hash-highlight {
  background: rgba(29, 155, 240, 0.25);
  color: var(--color-blue);
  border-radius: 2px;
  padding: 0 2px;
  font-weight: 700;
}
.hash-rest {
  color: var(--color-text-muted);
}

.hash-calc {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  padding: 8px 12px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.calc-step {
  color: var(--color-blue);
  font-weight: 700;
}
.calc-op {
  color: var(--color-text-muted);
}
.calc-result {
  color: var(--color-green);
  font-weight: 800;
  font-size: 14px;
}

.verify-ok-btn {
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
.verify-ok-btn:hover {
  opacity: 0.9;
}

/* Modal transition */
.verify-modal-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.verify-modal-leave-active {
  transition: all 0.2s ease;
}
.verify-modal-enter-from,
.verify-modal-leave-to {
  opacity: 0;
}
.verify-modal-enter-from .verify-box,
.verify-modal-leave-to .verify-box {
  transform: scale(0.92) translateY(16px);
}
</style>
