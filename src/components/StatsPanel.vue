<template>
  <div class="stats-panel">
    <div class="panel-title">
      <Icon icon="mdi:chart-line" :width="16" />
      Session Stats
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-val">{{ stats.totalBets }}</div>
        <div class="stat-card-key">Total Bets</div>
      </div>
      <div class="stat-card win-card">
        <div class="stat-card-val text-green">{{ stats.wins }}</div>
        <div class="stat-card-key">Wins</div>
      </div>
      <div class="stat-card lose-card">
        <div class="stat-card-val text-red">{{ stats.losses }}</div>
        <div class="stat-card-key">Losses</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-val" :class="stats.totalProfit >= 0 ? 'text-green' : 'text-red'">
          {{ stats.totalProfit >= 0 ? '+' : '' }}{{ stats.totalProfit.toFixed(decimal) }}
        </div>
        <div class="stat-card-key">Net Profit</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="detail-list">
      <div class="detail-row">
        <span class="detail-key">
          <Icon icon="mdi:trending-up" :width="14" />
          Win Rate
        </span>
        <span class="detail-val">
          {{ stats.totalBets > 0 ? ((stats.wins / stats.totalBets) * 100).toFixed(1) : '0.0' }}%
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-key">
          <Icon icon="mdi:cash-multiple" :width="14" />
          Total Wagered
        </span>
        <span class="detail-val">{{ stats.totalWagered.toFixed(decimal) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">
          <Icon icon="mdi:trophy-outline" :width="14" />
          Highest Win
        </span>
        <span class="detail-val text-green">+{{ stats.highestWin.toFixed(decimal) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">
          <Icon icon="mdi:fire" :width="14" />
          Best Streak
        </span>
        <span class="detail-val text-green">{{ stats.longestWinStreak }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">
          <Icon icon="mdi:skull-outline" :width="14" />
          Worst Streak
        </span>
        <span class="detail-val text-red">{{ stats.longestLoseStreak }}</span>
      </div>
    </div>

    <!-- Profit Chart (mini) -->
    <div class="divider"></div>
    <div class="chart-area">
      <div class="chart-title">Profit Trend</div>
      <svg class="profit-chart" :viewBox="`0 0 240 60`" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="chartColor" stop-opacity="0.3" />
            <stop offset="100%" :stop-color="chartColor" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path v-if="chartPath" :d="chartAreaPath" fill="url(#chartGradient)" />
        <path v-if="chartPath" :d="chartPath" fill="none" :stroke="chartColor" stroke-width="2" />
      </svg>
    </div>

    <button id="btn-reset-stats" class="reset-btn" @click="$emit('reset')">
      <Icon icon="mdi:refresh" :width="14" />
      Reset Stats
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  stats: { type: Object, required: true },
  decimal: { type: Number, default: 8 },
  recentRolls: { type: Array, default: () => [] },
})

defineEmits(['reset'])

const chartColor = computed(() => {
  return props.stats.totalProfit >= 0 ? '#3fb950' : '#f85149'
})

const chartPath = computed(() => {
  const rolls = [...props.recentRolls].reverse().slice(-30)
  if (rolls.length < 2) return null

  // Compute cumulative profit
  let running = 0
  const profits = rolls.map((r) => {
    running += r.profit
    return running
  })

  const min = Math.min(...profits)
  const max = Math.max(...profits)
  const range = max - min || 1

  const w = 240
  const h = 60
  const pad = 4

  const points = profits.map((p, i) => {
    const x = (i / (profits.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((p - min) / range) * (h - pad * 2)
    return [x, y]
  })

  return points.reduce((acc, [x, y], i) => {
    return acc + (i === 0 ? `M ${x},${y}` : ` L ${x},${y}`)
  }, '')
})

const chartAreaPath = computed(() => {
  if (!chartPath.value) return null
  const rolls = [...props.recentRolls].reverse().slice(-30)
  if (rolls.length < 2) return null

  const h = 60
  const w = 240
  const pad = 4

  // Get first and last x points
  const firstX = pad
  const lastX = w - pad

  return chartPath.value + ` L ${lastX},${h} L ${firstX},${h} Z`
})
</script>

<style scoped>
.stats-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-card);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-card {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-card-val {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
.stat-card-key {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
}

.divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 0 -4px;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.detail-key {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.detail-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
}

/* Chart */
.chart-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chart-title {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 1px;
}
.profit-chart {
  width: 100%;
  height: 60px;
  background: var(--color-bg-input);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

/* Reset */
.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.reset-btn:hover {
  border-color: var(--color-red);
  color: var(--color-red);
  background: var(--color-red-glow);
}
</style>
