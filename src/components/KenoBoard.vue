<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  selectedNumbers: { type: Array, default: () => [] },
  risk: { type: String, default: 'classic' },
  lastResult: { type: Object, default: null },
  isRolling: { type: Boolean, default: false },
})

const emit = defineEmits(['update:selected-numbers', 'update:risk', 'clear'])
const numbers = Array.from({ length: 40 }, (_, index) => index + 1)
const risks = ['low', 'classic', 'medium', 'high']
const selectedSet = computed(() => new Set(props.selectedNumbers))
const drawnSet = computed(() => new Set(props.lastResult?.drawnNumbers || []))

function toggleNumber(number) {
  if (props.isRolling) return
  const selected = [...props.selectedNumbers]
  const index = selected.indexOf(number)
  if (index >= 0) selected.splice(index, 1)
  else if (selected.length < 10) selected.push(number)
  emit('update:selected-numbers', selected.sort((a, b) => a - b))
}

function randomizeNumbers() {
  const pool = [...numbers]
  const selected = []
  while (selected.length < 10) {
    selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  emit('update:selected-numbers', selected.sort((a, b) => a - b))
}

function numberState(number) {
  const selected = selectedSet.value.has(number)
  const drawn = drawnSet.value.has(number)
  return { selected, drawn, hit: selected && drawn }
}
</script>

<template>
  <div class="keno-board">
    <div class="keno-toolbar">
      <div class="risk-control">
        <span>Risk</span>
        <div class="risk-options">
          <button
            v-for="option in risks"
            :key="option"
            :class="{ active: risk === option }"
            :disabled="isRolling"
            @click="emit('update:risk', option)"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <div class="keno-metrics">
        <div><span>Selected</span><strong>{{ selectedNumbers.length }}/10</strong></div>
        <div><span>Hits</span><strong>{{ lastResult?.hits ?? 0 }}</strong></div>
        <div><span>Payout</span><strong>{{ (lastResult?.multiplier || 0).toFixed(2) }}x</strong></div>
      </div>

      <div class="keno-actions">
        <button title="Random 10 numbers" :disabled="isRolling" @click="randomizeNumbers">
          <Icon icon="mdi:shuffle-variant" :width="18" />
        </button>
        <button title="Clear numbers and result" :disabled="isRolling" @click="emit('clear')">
          <Icon icon="mdi:eraser" :width="18" />
        </button>
      </div>
    </div>

    <div class="keno-grid" :class="{ rolling: isRolling }">
      <button
        v-for="number in numbers"
        :key="number"
        class="keno-number"
        :class="numberState(number)"
        :disabled="isRolling"
        @click="toggleNumber(number)"
      >
        {{ number }}
      </button>
    </div>

    <div class="keno-result" :class="lastResult?.win ? 'win' : lastResult ? 'lose' : ''">
      <template v-if="lastResult">
        <Icon :icon="lastResult.win ? 'mdi:check-circle' : 'mdi:close-circle'" :width="18" />
        <strong>{{ lastResult.hits }} hits · {{ lastResult.multiplier.toFixed(2) }}x</strong>
        <span>Draw: {{ lastResult.drawnNumbers.join(', ') }}</span>
      </template>
      <template v-else>
        <Icon icon="mdi:numeric-10-box-multiple-outline" :width="18" />
        <span>Keno 1–40</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.keno-board {
  background: var(--color-gradient-board);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.keno-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1.2fr) 1fr auto;
  gap: 12px;
  align-items: end;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
}
.risk-control { display: flex; flex-direction: column; gap: 5px; }
.risk-control > span,
.keno-metrics span {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.risk-options { display: grid; grid-template-columns: repeat(4, 1fr); }
.risk-options button,
.keno-actions button {
  height: 34px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-transform: capitalize;
}
.risk-options button.active {
  color: var(--color-blue);
  border-color: var(--color-blue);
  background: var(--color-blue-glow);
}
.keno-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.keno-metrics div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-input);
}
.keno-metrics strong { color: var(--color-text-primary); font: 700 12px 'Courier New', monospace; }
.keno-actions { display: flex; gap: 6px; }
.keno-actions button { width: 34px; display: grid; place-items: center; border-radius: var(--radius-sm); }
.keno-actions button:hover { color: var(--color-blue); border-color: var(--color-blue); }
.keno-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(44px, 64px));
  justify-content: center;
  gap: 7px;
  padding: 16px;
}
.keno-number {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  font: 700 13px 'Courier New', monospace;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}
.keno-number:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--color-blue); }
.keno-number.selected { color: var(--color-blue); border-color: var(--color-blue); background: var(--color-blue-glow); }
.keno-number.drawn { color: var(--color-red); border-color: rgba(248, 81, 73, 0.4); background: var(--color-red-glow); }
.keno-number.hit { color: var(--color-green); border-color: var(--color-green); background: var(--color-green-glow); box-shadow: var(--shadow-glow-green); }
.keno-grid.rolling .keno-number { animation: pulse 0.5s ease infinite alternate; }
.keno-result {
  min-height: 42px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
}
.keno-result span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.keno-result.win { color: var(--color-green); }
.keno-result.lose { color: var(--color-red); }
@keyframes pulse { to { opacity: 0.5; } }
@media (max-width: 640px) {
  .keno-toolbar { grid-template-columns: 1fr auto; }
  .keno-metrics { grid-column: 1 / -1; grid-row: 2; }
  .keno-grid { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 4px; padding: 10px; }
}
</style>
