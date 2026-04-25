<template>
  <div class="victory-screen">
    <!-- Dark landscape bg -->
    <div class="bg-dark-sky"></div>
    <div class="bg-dark-mountains"></div>
    <div class="bg-dark-field"></div>

    <!-- Celebration content -->
    <div class="celebration">
      <!-- Bird with trumpets -->
      <div class="bird-area">
        <div class="trumpet left-trumpet">📯</div>
        <div class="bird-celebrate">🐦</div>
        <div class="trumpet right-trumpet">📯</div>
      </div>

      <!-- Banner -->
      <div class="banner">
        <div class="banner-ribbon">
          <span class="banner-text">太棒了！</span>
        </div>
      </div>

      <!-- Coins earned -->
      <div class="reward-area">
        <div class="coins-earned">
          <span class="coin-icon">🪙</span>
          <span class="coin-amount">+50</span>
        </div>

        <!-- Progress bar -->
        <div class="progress-area">
          <div class="progress-label">仅剩 <span class="highlight">{{ remainingLevels }}</span> 关！</div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-segments">
                <div v-for="i in segmentCount" :key="i" class="segment-divider"></div>
              </div>
            </div>
            <div class="gift-icon">🎁</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Next level button -->
    <div class="bottom-area">
      <button class="next-btn" @click="nextLevel">
        关卡 {{ nextLevelNum }}
      </button>
      <button class="home-btn" @click="goHome">返回首页</button>
    </div>

    <!-- Confetti -->
    <div class="confetti-container">
      <div v-for="i in 20" :key="i" class="confetti" :style="confettiStyle(i)"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { store, startLevel, saveGame } from '../store/gameStore.js'
import { getTotalLevels } from '../data/levels.js'

const router = useRouter()
const total = getTotalLevels()

const nextLevelNum = computed(() => Math.min(store.currentLevel + 1, total))
const remainingLevels = computed(() => Math.max(0, total - store.currentLevel))
const progressPercent = computed(() => (store.currentLevel / total) * 100)
const segmentCount = computed(() => Math.min(5, total))

function nextLevel() {
  const next = nextLevelNum.value
  store.currentLevel = next
  saveGame()
  startLevel(next)
  router.push('/game')
}

function goHome() {
  store.currentLevel = nextLevelNum.value
  saveGame()
  router.push('/')
}

function confettiStyle(i) {
  const colors = ['#FF6B6B','#FFD700','#6BCB77','#4D96FF','#FF69B4','#FF8C00']
  const color = colors[i % colors.length]
  const left = (i * 5.2 + Math.sin(i) * 10) % 100
  const delay = (i * 0.15) % 2
  const dur = 2 + (i % 3) * 0.5
  return {
    left: left + '%',
    background: color,
    animationDelay: delay + 's',
    animationDuration: dur + 's',
    width: (6 + i % 4) + 'px',
    height: (6 + i % 4) + 'px',
  }
}
</script>

<style scoped>
.victory-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  font-family: var(--font);
}

.bg-dark-sky {
  position: absolute; inset: 0;
  background: url('/bg.jpg') center center / cover no-repeat;
  filter: brightness(0.55) saturate(0.8);
}
.bg-dark-mountains { display: none; }
.bg-dark-field { display: none; }

.celebration {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: max(20px, env(safe-area-inset-top));
  gap: 20px;
}

/* Bird with trumpets */
.bird-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: -20px;
  z-index: 2;
}
.bird-celebrate {
  font-size: 56px;
  animation: celebrateBird 0.6s ease-in-out infinite alternate;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
}
@keyframes celebrateBird {
  from { transform: scale(1) rotate(-5deg); }
  to { transform: scale(1.1) rotate(5deg); }
}
.trumpet {
  font-size: 44px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
.left-trumpet { transform: scaleX(-1) rotate(20deg); animation: trumpetLeft 0.5s ease-in-out infinite alternate; }
.right-trumpet { transform: rotate(-20deg); animation: trumpetRight 0.5s ease-in-out infinite alternate; }
@keyframes trumpetLeft {
  from { transform: scaleX(-1) rotate(20deg); }
  to { transform: scaleX(-1) rotate(10deg) translateY(-4px); }
}
@keyframes trumpetRight {
  from { transform: rotate(-20deg); }
  to { transform: rotate(-10deg) translateY(-4px); }
}

/* Banner */
.banner {
  position: relative;
}
.banner-ribbon {
  background: linear-gradient(135deg, #4db8ff, #1a8fff);
  padding: 14px 50px;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
.banner-ribbon::before,
.banner-ribbon::after {
  content: '';
  position: absolute;
  bottom: -14px;
  width: 20px; height: 20px;
  background: #0d6eba;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}
.banner-ribbon::before { left: 0; transform: rotate(-15deg) translateX(-4px); }
.banner-ribbon::after { right: 0; transform: rotate(15deg) translateX(4px); }
.banner-text {
  font-size: 32px;
  font-weight: 900;
  color: #FFD700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  font-family: var(--font);
}

/* Reward */
.reward-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
}
.coins-earned {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,215,0,0.15);
  padding: 8px 20px;
  border-radius: 20px;
  border: 2px solid rgba(255,215,0,0.4);
}
.coin-icon { font-size: 24px; }
.coin-amount { font-size: 24px; font-weight: 900; color: #FFD700; }

.progress-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.progress-label {
  font-size: 15px;
  color: rgba(255,255,255,0.85);
  font-weight: 700;
}
.highlight { color: #6BCB77; font-size: 18px; }

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 260px;
}
.progress-bar {
  flex: 1;
  height: 22px;
  background: rgba(255,255,255,0.1);
  border-radius: 11px;
  overflow: hidden;
  position: relative;
  border: 2px solid rgba(255,255,255,0.2);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6BCB77, #4CAF50);
  border-radius: 9px;
  transition: width 1s ease-out;
  box-shadow: 0 0 8px rgba(76,175,80,0.5);
}
.progress-segments {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}
.segment-divider {
  flex: 1;
  border-right: 2px solid rgba(0,0,0,0.2);
}
.gift-icon { font-size: 28px; }

/* Buttons */
.bottom-area {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-bottom: max(30px, env(safe-area-inset-bottom));
}
.next-btn {
  background: linear-gradient(180deg, #6be36b 0%, #3db83d 50%, #2a9f2a 100%);
  color: white;
  font-size: 24px;
  font-weight: 800;
  font-family: var(--font);
  border: none;
  border-radius: 50px;
  padding: 16px 60px;
  cursor: pointer;
  box-shadow: 0 6px 0 #1a7a1a, 0 8px 20px rgba(0,0,0,0.3);
  min-width: 240px;
  transition: transform 0.1s, box-shadow 0.1s;
}
.next-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #1a7a1a; }

.home-btn {
  background: transparent;
  color: rgba(255,255,255,0.7);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50px;
  padding: 10px 30px;
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
}

/* Confetti */
.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}
.confetti {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confettiFall linear infinite;
}
@keyframes confettiFall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
}
</style>
