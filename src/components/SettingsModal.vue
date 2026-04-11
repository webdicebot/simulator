<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            <Icon icon="mdi:cog-outline" :width="18" />
            Settings
          </h3>
          <button class="close-btn" @click="$emit('close')">
            <Icon icon="mdi:close" :width="20" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Balance -->
          <div class="setting-group">
            <label class="setting-label">Balance</label>
            <div class="input-row">
              <input
                id="cfg-balance"
                type="number"
                class="setting-input"
                :value="localConfig.balance"
                min="0.00000001"
                step="1"
                @input="localConfig.balance = Number($event.target.value)"
              />
              <button class="action-btn" @click="resetBalance">Reset</button>
            </div>
          </div>

          <!-- Decimal -->
          <div class="setting-group">
            <label class="setting-label">
              Decimal Places
              <span class="help-tip">Display precision for amounts</span>
            </label>
            <select
              class="setting-input"
              :value="localConfig.decimal"
              @change="localConfig.decimal = Number($event.target.value)"
            >
              <option v-for="d in [2, 4, 6, 8]" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <!-- House Edge -->
          <div class="setting-group">
            <label class="setting-label">
              House Edge
              <span class="rtp-display">RTP: {{ (100 - localConfig.houseEdge).toFixed(2) }}%</span>
            </label>
            <div class="input-row">
              <input
                id="cfg-house-edge"
                type="number"
                class="setting-input"
                :value="localConfig.houseEdge"
                min="0"
                max="20"
                step="0.01"
                @input="localConfig.houseEdge = Number($event.target.value)"
              />
              <span class="unit">%</span>
            </div>
          </div>

          <!-- Delay -->
          <div class="setting-group">
            <label class="setting-label">Bet Delay</label>
            <div class="input-row">
              <input
                id="cfg-delay"
                type="number"
                class="setting-input"
                :value="localConfig.delay"
                min="0"
                step="0.1"
                @input="localConfig.delay = Number($event.target.value)"
              />
              <span class="unit">seconds</span>
            </div>
          </div>

          <!-- Seeds -->
          <div class="setting-group">
            <label class="setting-label">Client Seed</label>
            <div class="input-row">
              <input
                id="cfg-client-seed"
                type="text"
                class="setting-input mono"
                :value="localConfig.clientSeed"
                @input="localConfig.clientSeed = $event.target.value"
              />
              <button class="action-btn" @click="randomClient">Rotate</button>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Server Seed</label>
            <div class="input-row">
              <input
                id="cfg-server-seed"
                type="text"
                class="setting-input mono"
                :value="localConfig.serverSeed"
                @input="localConfig.serverSeed = $event.target.value"
              />
              <button class="action-btn" @click="randomServer">Rotate</button>
            </div>
          </div>

          <div class="nonce-row">
            <Icon icon="mdi:counter" :width="14" />
            Nonce: <strong>{{ localConfig.nonce }}</strong>
          </div>
        </div>

        <div class="modal-footer">
          <button class="close-modal-btn" @click="save">Done</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  config: { type: Object, required: true },
})

const emit = defineEmits(['close', 'random-client', 'random-server', 'update-config'])

// Local state to avoid mutating props
const localConfig = reactive({ ...props.config })

// Keep local state in sync with prop if it changes outside
watch(
  () => props.config,
  (newVal) => {
    Object.assign(localConfig, newVal)
  },
  { deep: true },
)

function save() {
  emit('update-config', { ...localConfig })
  emit('close')
}

function resetBalance() {
  localConfig.balance = 1000
}

function randomClient() {
  emit('random-client')
}

function randomServer() {
  emit('random-server')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-box {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border);
}
.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.close-btn {
  width: 32px;
  height: 32px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}
.close-btn:hover {
  color: var(--color-red);
  border-color: var(--color-red);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.setting-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.help-tip {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 400;
}
.rtp-display {
  font-size: 11px;
  color: var(--color-green);
  font-weight: 600;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.setting-input {
  flex: 1;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0;
}
.setting-input.mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
.setting-input:focus {
  border-color: var(--color-blue);
}

.unit {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.action-btn {
  padding: 10px 14px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: var(--transition);
  white-space: nowrap;
}
.action-btn:hover {
  border-color: var(--color-blue);
  color: var(--color-blue);
}

.nonce-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 12px;
  background: var(--color-bg-input);
  border-radius: var(--radius-md);
}
.nonce-row strong {
  color: var(--color-text-primary);
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
}
.close-modal-btn {
  width: 100%;
  padding: 10px;
  background: var(--color-gradient-blue);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}
.close-modal-btn:hover {
  opacity: 0.9;
}

/* Modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  transform: scale(0.9) translateY(20px);
}
</style>
