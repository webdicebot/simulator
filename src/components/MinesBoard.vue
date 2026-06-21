<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  bombCount: { type: Number, required: true },
  openedPicks: { type: Array, default: () => [] },
  roundActive: { type: Boolean, default: false },
  roundMultiplier: { type: Number, default: 1 },
  lastResult: { type: Object, default: null },
  isRolling: { type: Boolean, default: false },
})

const emit = defineEmits(['update:bomb-count', 'open-tile'])
const tiles = Array.from({ length: 24 }, (_, index) => index)
const visiblePicks = computed(() => (props.roundActive ? props.openedPicks : props.lastResult?.minesPicks || []))
const visibleMines = computed(() => (props.roundActive ? [] : props.lastResult?.mines || []))
const openedSet = computed(() => new Set(visiblePicks.value))
const bombSet = computed(() => new Set(visibleMines.value))

function setBombCount(value) {
  const next = Math.min(23, Math.max(1, Number(value)))
  emit('update:bomb-count', next)
}

function openTile(tile) {
  if (!props.roundActive || props.isRolling || openedSet.value.has(tile)) return
  emit('open-tile', tile)
}

function openRandomTile() {
  if (!props.roundActive) return
  const available = tiles.filter((tile) => !openedSet.value.has(tile))
  if (available.length === 0) return
  emit('open-tile', available[Math.floor(Math.random() * available.length)])
}

function tileState(tile) {
  const bomb = bombSet.value.has(tile)
  const opened = openedSet.value.has(tile)
  return {
    opened,
    bomb,
    hit: opened && bomb,
    safe: opened && !bomb,
  }
}
</script>

<template>
  <div class="mines-board">
    <div class="board-toolbar">
      <div class="bomb-control">
        <span class="control-label">Bombs</span>
        <div class="stepper">
          <button title="Fewer mines" :disabled="roundActive || bombCount <= 1" @click="setBombCount(bombCount - 1)">
            <Icon icon="mdi:minus" :width="16" />
          </button>
          <input
            type="number"
            :value="bombCount"
            :disabled="roundActive"
            min="1"
            max="23"
            @change="setBombCount($event.target.value)"
          />
          <button title="More mines" :disabled="roundActive || bombCount >= 23" @click="setBombCount(bombCount + 1)">
            <Icon icon="mdi:plus" :width="16" />
          </button>
        </div>
      </div>

      <div class="board-metrics">
        <div>
          <span>Hits</span><strong>{{ openedPicks.length }}</strong>
        </div>
        <div>
          <span>Payout</span><strong>{{ roundMultiplier.toFixed(4) }}x</strong>
        </div>
      </div>

      <div class="selection-actions">
        <button title="Open random tile" :disabled="!roundActive" @click="openRandomTile">
          <Icon icon="mdi:shuffle-variant" :width="18" />
        </button>
      </div>
    </div>

    <div class="mines-grid" :class="{ rolling: isRolling }">
      <button
        v-for="tile in tiles"
        :key="tile"
        class="mine-tile"
        :class="tileState(tile)"
        :disabled="!roundActive || isRolling || openedSet.has(tile)"
        :title="`Tile ${tile}`"
        @click="openTile(tile)"
      >
        <Icon v-if="tileState(tile).bomb" icon="mdi:mine" :width="24" />
        <Icon v-else-if="tileState(tile).opened" icon="mdi:diamond-stone" :width="22" />
        <span v-else>{{ tile }}</span>
      </button>
    </div>

    <div class="result-strip" :class="roundActive ? 'active' : lastResult?.win ? 'win' : lastResult ? 'lose' : ''">
      <template v-if="roundActive">
        <Icon icon="mdi:progress-clock" :width="18" />
        <strong>ACTIVE</strong>
        <span>{{ openedPicks.length }} hits · {{ roundMultiplier.toFixed(4) }}x</span>
      </template>
      <template v-else-if="lastResult">
        <Icon :icon="lastResult.win ? 'mdi:check-circle' : 'mdi:alert-circle'" :width="18" />
        <strong>{{ lastResult.win ? `${lastResult.multiplier.toFixed(4)}x WIN` : 'BOOM' }}</strong>
        <span>Bombs: {{ lastResult.mines.join(', ') }}</span>
      </template>
      <template v-else>
        <Icon icon="mdi:mine" :width="18" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.mines-board {
  background: var(--color-gradient-board);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.board-toolbar {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 14px;
  align-items: end;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.bomb-control,
.board-metrics div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-label,
.board-metrics span {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.stepper {
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  height: 34px;
}

.stepper button,
.selection-actions button {
  border: 1px solid var(--color-border);
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.stepper button:disabled {
  opacity: 0.4;
  cursor: default;
}

.stepper input {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-left: 0;
  border-right: 0;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  text-align: center;
  font-weight: 700;
}

.board-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(90px, 1fr));
  gap: 8px;
}

.board-metrics div {
  padding: 6px 9px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
}

.board-metrics strong {
  color: var(--color-text-primary);
  font:
    700 13px 'Courier New',
    monospace;
}

.selection-actions {
  display: flex;
  gap: 6px;
}

.selection-actions button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
}

.selection-actions button:hover,
.stepper button:hover:not(:disabled) {
  color: var(--color-blue);
  border-color: var(--color-blue);
}

.selection-actions button:disabled {
  opacity: 0.4;
  cursor: default;
}

.mines-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 82px));
  justify-content: center;
  gap: 8px;
  padding: 18px;
}

.mine-tile {
  aspect-ratio: 1;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-input);
  color: var(--color-text-muted);
  font:
    700 12px 'Courier New',
    monospace;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    transform 0.15s,
    border-color 0.15s,
    background 0.15s;
}

.mine-tile:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--color-blue);
}

.mine-tile.selected {
  color: var(--color-blue);
  border-color: var(--color-blue);
  background: var(--color-blue-glow);
}

.mine-tile.bomb {
  color: var(--color-red);
  border-color: rgba(248, 81, 73, 0.45);
  background: var(--color-red-glow);
}

.mine-tile.safe {
  color: var(--color-green);
  border-color: rgba(63, 185, 80, 0.45);
  background: var(--color-green-glow);
}

.mine-tile.hit {
  box-shadow:
    0 0 0 2px var(--color-red),
    var(--shadow-glow-red);
}

.mines-grid.rolling .mine-tile {
  animation: tilePulse 0.6s ease infinite alternate;
}

.result-strip {
  min-height: 42px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.result-strip span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-strip.win {
  color: var(--color-green);
}
.result-strip.active {
  color: var(--color-blue);
}
.result-strip.lose {
  color: var(--color-red);
}

@keyframes tilePulse {
  to {
    opacity: 0.55;
  }
}

@media (max-width: 640px) {
  .board-toolbar {
    grid-template-columns: 1fr auto;
  }
  .board-metrics {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .mines-grid {
    gap: 5px;
    padding: 12px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
