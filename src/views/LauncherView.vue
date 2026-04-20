<script setup>
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const games = [
  {
    id: 'dice',
    name: 'Dice',
    description: 'Predict the outcome of the roll and win based on your choice.',
    icon: 'mdi:dice-6',
    color: '#1d9bf0',
    path: '/dice'
  },
  {
    id: 'limbo',
    name: 'Limbo',
    description: 'Set your target and watch the multiplier fly to the moon.',
    icon: 'mdi:rocket-launch',
    color: '#f01d1d',
    path: '/limbo'
  }
]

const launchGame = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="launcher-container">
    <div class="launcher-content">
      <header class="launcher-header">
        <img src="/logo.png" alt="Logo" class="launcher-logo" v-if="true" />
        <h1 class="launcher-title">Web DiceBot <span>Simulator</span></h1>
        <p class="launcher-subtitle">Choose a game to start your simulation</p>
      </header>

      <div class="game-grid">
        <div 
          v-for="game in games" 
          :key="game.id" 
          class="game-card"
          @click="launchGame(game.path)"
        >
          <div class="game-card-icon" :style="{ backgroundColor: game.color + '22', color: game.color }">
            <Icon :icon="game.icon" width="48" />
          </div>
          <div class="game-card-info">
            <h2 class="game-name">{{ game.name }}</h2>
            <p class="game-desc">{{ game.description }}</p>
          </div>
          <button class="launch-btn" :style="{ backgroundColor: game.color }">
            Launch Game
            <Icon icon="mdi:chevron-right" width="20" />
          </button>
        </div>
      </div>

      <footer class="launcher-footer">
        <p>Product of webdicebot.net</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.launcher-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, #1a1c24, #0f1116);
  padding: 2rem;
  color: #fff;
}

.launcher-content {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

.launcher-header {
  margin-bottom: 3rem;
  animation: fadeInDown 0.8s ease-out;
}

.launcher-logo {
  height: 60px;
  margin-bottom: 1rem;
}

.launcher-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
}

.launcher-title span {
  color: #ff9100;
  background: linear-gradient(90deg, #ff9100, #ff5f00);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.launcher-subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.game-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
}

.game-card:hover {
  transform: translateY(-10px);
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.game-card-icon {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}

.game-card:hover .game-card-icon {
  transform: scale(1.1) rotate(5deg);
}

.game-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.game-desc {
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.launch-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: filter 0.3s ease;
}

.launch-btn:hover {
  filter: brightness(1.2);
}

.launcher-footer {
  margin-top: 4rem;
  color: #475569;
  font-size: 0.85rem;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
