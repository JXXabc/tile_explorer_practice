<template>
  <div class="home-screen">
    <!-- Background landscape -->
    <div class="bg-sky"></div>
    <div class="bg-mountains"></div>
    <div class="bg-field"></div>

    <!-- Top bar -->
    <div class="top-bar">
      <div class="top-left">
        <button class="icon-btn" @click="toggleSound">
          <span>{{ store.soundEnabled ? '🔊' : '🔇' }}</span>
        </button>
        <button class="icon-btn" @click="showMap">
          <span>🗺️</span>
        </button>
      </div>
      <div class="top-right">
        <div class="coin-display">
          <span class="coin-icon">🪙</span>
          <span class="coin-count">{{ store.coins }}</span>
        </div>
        <button class="shop-btn">
          <span>🛒</span>
          <span class="shop-badge">特卖</span>
        </button>
      </div>
    </div>

    <!-- Logo area -->
    <div class="logo-area">
      <div class="bird-container">
        <div class="bird-float">🐦</div>
      </div>
      <div class="logo-wrapper">
        <div class="logo-globe">🌍</div>
        <div class="logo-text">
          <span class="logo-tile">TILE</span>
          <span class="logo-explorer">Explorer</span>
        </div>
      </div>
    </div>

    <!-- Start button -->
    <div class="bottom-area">
      <button class="start-btn" @click="startGame">
        关卡 {{ store.currentLevel }}
      </button>
    </div>

    <!-- 首次进入启动遮罩，点击即解锁音频 -->
    <transition name="splash-fade">
      <div v-if="showSplash" class="splash-overlay" @click="dismissSplash">
        <div class="splash-hint">
          <div class="splash-icon">🎵</div>
          <div class="splash-text">轻触屏幕开始</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store, startLevel, saveGame } from '../store/gameStore.js'
import { startBGM, setBGMEnabled } from '../utils/sound.js'

const router = useRouter()
const SPLASH_KEY = 'tile_splash_done'
let splashDone = false
try { splashDone = !!sessionStorage.getItem(SPLASH_KEY) } catch (_) {}
const showSplash = ref(!splashDone)

function dismissSplash() {
  showSplash.value = false
  try { sessionStorage.setItem(SPLASH_KEY, '1') } catch (_) {}
  if (store.soundEnabled) startBGM()   // 首次手势 → 启动 BGM
}

function startGame() {
  startLevel(store.currentLevel)
  router.push('/game')
}

function toggleSound() {
  store.soundEnabled = !store.soundEnabled
  saveGame()
  setBGMEnabled(store.soundEnabled)
}

function showMap() {}
</script>

<style scoped>
.home-screen {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: var(--font);
}

/* Background image */
.bg-sky {
  position: absolute; inset: 0;
  background: url('/bg.jpg') center center / cover no-repeat;
}
.bg-mountains { display: none; }
.bg-field {
  /* 底部渐变遮罩，让开始按钮区域更易读 */
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 35%;
  background: linear-gradient(to top, rgba(180,120,200,0.55) 0%, transparent 100%);
  z-index: 1;
}

/* Top bar */
.top-bar {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
}

.top-left, .top-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 44px; height: 44px;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 12px;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.1s;
}
.icon-btn:active { transform: scale(0.92); }

.coin-display {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.85);
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.coin-icon { font-size: 18px; }
.coin-count {
  font-size: 16px;
  font-weight: 800;
  color: #333;
}

.shop-btn {
  position: relative;
  width: 44px; height: 44px;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 12px;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center;
}
.shop-badge {
  position: absolute;
  top: -4px; right: -4px;
  background: #ff4444;
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 4px;
  border-radius: 8px;
}

/* Logo area */
.logo-area {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
}

.bird-container {
  margin-bottom: -20px;
  z-index: 2;
}
.bird-float {
  font-size: 48px;
  animation: birdFloat 2s ease-in-out infinite;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}
@keyframes birdFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.logo-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo-globe {
  font-size: 70px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
  margin-bottom: -10px;
}
.logo-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #FF8C00, #FF6200);
  padding: 8px 24px 12px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
}
.logo-tile {
  font-size: 42px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 6px;
  text-shadow: 0 3px 0 rgba(0,0,0,0.2);
  line-height: 1;
}
.logo-explorer {
  font-size: 28px;
  font-weight: 800;
  color: #FFE066;
  text-shadow: 0 2px 0 rgba(0,0,0,0.2);
  margin-top: 2px;
}

/* Bottom area */
.bottom-area {
  position: absolute;
  bottom: 60px;
  left: 0; right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.start-btn {
  background: linear-gradient(180deg, #6be36b 0%, #3db83d 50%, #2a9f2a 100%);
  color: white;
  font-size: 26px;
  font-weight: 800;
  font-family: var(--font);
  border: none;
  border-radius: 50px;
  padding: 18px 60px;
  cursor: pointer;
  box-shadow:
    0 6px 0 #1a7a1a,
    0 8px 20px rgba(0,0,0,0.3);
  transition: transform 0.1s, box-shadow 0.1s;
  min-width: 240px;
  letter-spacing: 2px;
}
.start-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #1a7a1a, 0 4px 10px rgba(0,0,0,0.2);
}

/* 启动遮罩 */
.splash-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.splash-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: splashPulse 1.8s ease-in-out infinite;
}
.splash-icon {
  font-size: 52px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
}
.splash-text {
  font-size: 18px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  letter-spacing: 2px;
  font-family: var(--font);
}
@keyframes splashPulse {
  0%, 100% { transform: scale(1);    opacity: 0.9; }
  50%       { transform: scale(1.08); opacity: 1;   }
}
.splash-fade-leave-active { transition: opacity 0.4s ease; }
.splash-fade-leave-to     { opacity: 0; }
</style>
