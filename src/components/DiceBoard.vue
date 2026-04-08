<template>
  <div class="dice-board">
    <!-- Result Display -->
    <div class="result-display">
      <!-- Prediction -->
      <div class="result-box prediction-box">
        <div class="result-number">
          {{ target.toString().padStart(2, '0') }}
        </div>
        <div class="result-label">PREDICTION</div>
      </div>

      <!-- Dice Icon with Animation -->
      <div class="dice-center">
        <div
          class="dice-wrap"
          :class="{
            rolling: isRolling,
            win: lastResult?.win === true,
            lose: lastResult?.win === false,
          }"
        >
          <Icon icon="mdi:dice-6-outline" :width="56" class="dice-icon" />
        </div>
        <div v-if="lastResult" class="result-flash" :class="lastResult.win ? 'win-flash' : 'lose-flash'">
          {{ lastResult.win ? 'WIN' : 'LOSS' }}
        </div>
      </div>

      <!-- Lucky Number -->
      <div
        class="result-box lucky-box"
        :class="{
          'win-result': lastResult?.win === true,
          'lose-result': lastResult?.win === false,
        }"
      >
        <div class="result-number lucky-number">
          <span v-if="lastResult" class="animate-number">
            {{ lastResult.resultNumber.toString().padStart(2, '0') }}
          </span>
          <span v-else>--</span>
        </div>
        <div class="result-label">LUCKY NUMBER</div>
      </div>
    </div>

    <!-- Roll Controls Bar -->
    <div class="controls-bar">
      <!-- Under Button -->
      <button
        id="btn-roll-under"
        class="roll-btn under-btn"
        :class="{ active: side === 'under' }"
        @click="$emit('update:side', 'under')"
      >
        <Icon icon="mdi:arrow-down-bold" :width="18" />
        ROLL UNDER
      </button>

      <!-- Stats Center -->
      <div class="stats-center">
        <div class="stat-item">
          <span class="stat-label">Multiplier</span>
          <span class="stat-value">x{{ multiplier.toFixed(4) }}</span>
        </div>
        <div class="stat-separator"></div>
        <div class="stat-item">
          <span class="stat-label">Win Chance</span>
          <span class="stat-value highlight-blue">{{ winChance.toFixed(2) }}%</span>
        </div>
      </div>

      <!-- Over Button -->
      <button
        id="btn-roll-over"
        class="roll-btn over-btn"
        :class="{ active: side === 'over' }"
        @click="$emit('update:side', 'over')"
      >
        ROLL OVER
        <Icon icon="mdi:arrow-up-bold" :width="18" />
      </button>
    </div>

    <!-- Slider -->
    <div class="slider-section">
      <div class="slider-track-wrap">
        <!-- Blue track (under zone) -->
        <div class="track-fill track-blue" :style="{ width: sliderPct + '%' }"></div>
        <!-- Red track (over zone) -->
        <div class="track-fill track-red" :style="{ width: 100 - sliderPct + '%', left: sliderPct + '%' }"></div>

        <!-- Handle -->
        <input
          id="target-slider"
          type="range"
          class="slider-input"
          :value="target"
          min="1"
          max="99"
          step="1"
          @input="onSliderInput"
        />

        <!-- Tick marks -->
        <div class="tick-marks">
          <span v-for="tick in [0, 25, 50, 75, 99]" :key="tick" class="tick">
            {{ tick !== 0 && tick !== 99 ? tick : tick === 0 ? '' : '99' }}
          </span>
        </div>
      </div>

      <!-- Slider value display -->
      <div class="slider-value-badge" :style="{ left: sliderPct + '%' }">
        {{ target }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  target: { type: Number, default: 5000 },
  side: { type: String, default: 'over' },
  multiplier: { type: Number, default: 1 },
  winChance: { type: Number, default: 49.5 },
  lastResult: { type: Object, default: null },
  isRolling: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:target', 'update:side'])

const sliderPct = computed(() => (props.target / 99) * 100)

function onSliderInput(e) {
  emit('update:target', Number(e.target.value))
}
</script>

<style scoped>
.dice-board {
  background: var(--color-gradient-board);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

/* ---- Result Display ---- */
.result-display {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 32px 32px 20px;
  background: var(--color-gradient-result);
}

.result-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prediction-box {
  align-items: flex-start;
}
.lucky-box {
  align-items: flex-end;
}

.result-number {
  font-size: 64px;
  font-weight: 900;
  color: var(--color-text-primary);
  line-height: 1;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s ease;
}

.lucky-box.win-result .result-number {
  color: var(--color-green);
}
.lucky-box.lose-result .result-number {
  color: var(--color-red);
}

.result-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--color-text-muted);
}

/* Dice Center */
.dice-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}
.dice-wrap {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: var(--transition-slow);
}
.dice-wrap.rolling {
  animation: diceRoll 0.4s ease infinite alternate;
  border-color: var(--color-blue);
  color: var(--color-blue);
  box-shadow: var(--shadow-glow-blue);
}
.dice-wrap.win {
  border-color: var(--color-green);
  background: var(--color-green-glow);
  color: var(--color-green);
  box-shadow: var(--shadow-glow-green);
  animation: winPulse 0.6s ease;
}
.dice-wrap.lose {
  border-color: var(--color-red);
  background: var(--color-red-glow);
  color: var(--color-red);
  box-shadow: var(--shadow-glow-red);
  animation: losePulse 0.4s ease;
}

@keyframes diceRoll {
  from {
    transform: rotate(-5deg) scale(0.95);
  }
  to {
    transform: rotate(5deg) scale(1.05);
  }
}
@keyframes winPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes losePulse {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(0);
  }
}

.result-flash {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  padding: 3px 8px;
  border-radius: 4px;
  animation: flashIn 0.3s ease;
}
.win-flash {
  background: var(--color-green-glow);
  color: var(--color-green);
}
.lose-flash {
  background: var(--color-red-glow);
  color: var(--color-red);
}

@keyframes flashIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ---- Controls Bar ---- */
.controls-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
}

.roll-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
  box-shadow: var(--shadow-btn);
}
.roll-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.under-btn {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border: 2px solid var(--color-border);
}
.under-btn:hover,
.under-btn.active {
  background: var(--color-gradient-blue);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-blue);
}
.under-btn:active {
  transform: translateY(0);
}

.over-btn {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border: 2px solid var(--color-border);
}
.over-btn:hover,
.over-btn.active {
  background: var(--color-gradient-red);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-red);
}
.over-btn:active {
  transform: translateY(0);
}

.stats-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 20px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-label {
  font-size: 10px;
  color: var(--color-text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
.stat-value.highlight-blue {
  color: var(--color-blue);
}
.stat-separator {
  width: 1px;
  height: 30px;
  background: var(--color-border);
}

/* ---- Slider ---- */
.slider-section {
  position: relative;
  padding: 20px 24px 28px;
}
.slider-track-wrap {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: var(--color-bg-input);
  overflow: visible;
}
.track-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 5px;
  transition: width 0.1s ease;
}
.track-blue {
  left: 0;
  background: var(--color-blue);
}
.track-red {
  background: var(--color-red);
  border-radius: 0 5px 5px 0;
}

.slider-input {
  position: absolute;
  top: -5px;
  left: 0;
  width: 100%;
  height: 20px;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  z-index: 10;
}
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 3px solid var(--color-blue);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition:
    border-color 0.2s,
    transform 0.1s;
}
.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  border-color: var(--color-text-primary);
}
.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 3px solid var(--color-blue);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.tick-marks {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
}
.tick {
  font-size: 10px;
  color: var(--color-text-muted);
}

.slider-value-badge {
  position: absolute;
  top: -2px;
  transform: translateX(-50%);
  background: var(--color-blue);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  pointer-events: none;
}

@media (max-width: 640px) {
  .result-number {
    font-size: 44px;
  }
  .result-display {
    padding: 20px 16px 12px;
    gap: 12px;
  }
  .controls-bar {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  .roll-btn {
    padding: 12px 16px;
    font-size: 13px;
    flex: 1;
  }
  .stats-center {
    order: -1;
    width: 100%;
  }
  .slider-section {
    padding: 16px 16px 24px;
  }
}
</style>
