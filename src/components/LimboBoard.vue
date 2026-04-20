<template>
  <div class="limbo-board">
    <!-- Main Display -->
    <div class="main-display">
      <!-- Multiplier Result -->
      <div v-if="!isRolling && lastResult" class="multiplier-container" :class="{ 'is-win': lastResult?.win, 'is-loss': lastResult?.win === false }">
        <div class="multiplier-value">
          {{ displayMultiplier.toFixed(2) }}<span class="x-label">x</span>
        </div>
      </div>

      <!-- Spaceship Scene -->
      <div class="scene">
        <div class="stars" :class="{ 'speed-up': isRolling }"></div>
        <div class="spaceship-wrap" :class="{ 'launching': isRolling, 'crashed': lastResult && !lastResult.win && !isRolling }">
          <div class="spaceship">
            <Icon icon="mdi:rocket-launch" :width="120" class="rocket-icon" />
            <div class="engine-flame" v-if="isRolling"></div>
          </div>
        </div>
        <div class="ground-glow"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  history: { type: Array, default: () => [] },
  lastResult: { type: Object, default: null },
  isRolling: { type: Boolean, default: false },
})

const displayMultiplier = ref(1.00)

// Update number only when rolling ends
watch(() => props.isRolling, (newVal) => {
  if (!newVal && props.lastResult) {
    displayMultiplier.value = props.lastResult.resultMultiplier || 1.00
  }
})

watch(() => props.lastResult, (newVal) => {
  if (newVal && !props.isRolling) {
    displayMultiplier.value = newVal.resultMultiplier || 1.00
  }
})


</script>

<style scoped>
.limbo-board {
  background: var(--color-gradient-board);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  height: 300px;
  position: relative;
}


/* Main Display */
.main-display {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.multiplier-container {
  z-index: 10;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.multiplier-container.is-win {
  transform: scale(1.1);
  filter: drop-shadow(0 0 20px var(--color-green));
}
.multiplier-container.is-loss {
  transform: scale(0.95);
  opacity: 0.8;
}

.multiplier-value {
  font-size: 84px;
  font-weight: 900;
  color: var(--color-text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
.is-win .multiplier-value { color: var(--color-green); }
.is-loss .multiplier-value { color: var(--color-red); }

.x-label {
  font-size: 32px;
  margin-left: 4px;
  opacity: 0.7;
}

/* Scene */
.scene {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: 0.3;
  transition: transform 0.5s ease;
}
.stars.speed-up {
  animation: warpDrive 0.5s linear infinite;
}

@keyframes warpDrive {
  from { transform: translateY(0); }
  to { transform: translateY(200px); }
}

.spaceship-wrap {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.spaceship {
  position: relative;
  color: var(--color-text-primary);
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2));
}

.spaceship-wrap.launching {
  animation: spaceshipShake 0.1s infinite;
  transform: translateX(-50%) translateY(-20px);
}

.spaceship-wrap.crashed {
  transform: translateX(-50%) translateY(10px) rotate(15deg);
  opacity: 0.5;
  filter: grayscale(1) brightness(0.5);
}

@keyframes spaceshipShake {
  0%, 100% { transform: translateX(-50%) translateY(-20px) rotate(0); }
  25% { transform: translateX(-51%) translateY(-21px) rotate(-1deg); }
  75% { transform: translateX(-49%) translateY(-19px) rotate(1deg); }
}

.engine-flame {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 60px;
  background: linear-gradient(to bottom, var(--color-blue), transparent);
  border-radius: 50%;
  filter: blur(10px);
  animation: flamePulse 0.1s infinite alternate;
}

@keyframes flamePulse {
  from { height: 60px; opacity: 0.8; }
  to { height: 80px; opacity: 1; }
}

.ground-glow {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 100px;
  background: radial-gradient(ellipse at center, rgba(29, 155, 240, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.animate-bump {
  animation: bump 0.2s ease-out;
}

@keyframes bump {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 640px) {
  .multiplier-value { font-size: 60px; }
  .limbo-board { height: 320px; }
}
</style>
