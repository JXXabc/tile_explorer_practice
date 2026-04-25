<template>
  <div class="game-screen">
    <!-- Background -->
    <div class="bg-sky"></div>
    <div class="bg-mountains"></div>
    <div class="bg-field"></div>
    <!-- 半透明遮罩，让图块区域更易读 -->
    <div class="bg-overlay"></div>

    <!-- Top bar -->
    <div class="top-bar">
      <button class="back-btn" @click="goHome">←</button>
      <div class="level-label">关卡 {{ store.currentLevel }}</div>
      <div class="coin-mini">🪙 {{ store.coins }}</div>
    </div>

    <!-- Slot bar -->
    <div class="slot-bar">
      <div class="slot-track" :key="store.gameKey">
        <div
          v-for="i in 7"
          :key="i"
          class="slot-cell"
          :class="{ filled: slots[i-1] }"
        >
          <transition name="slot-in">
            <div v-if="slots[i-1]" class="slot-tile" :data-type="slots[i-1].type">
              <span class="tile-icon">{{ getTileIcon(slots[i-1].type) }}</span>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Game board：gameKey 变化时完整重建，确保再试一次干净重置 -->
    <div class="board-wrapper" ref="boardRef">
      <div class="board" :key="store.gameKey" :style="boardStyle">
        <transition-group name="tile-remove" tag="div" class="tile-layer">
          <div
            v-for="tile in visibleTiles"
            :key="tile.id"
            class="tile-card"
            :class="{
              covered: isCovered(tile),
              hint: store.hintTiles.includes(tile.id),
              flying: flyingTileId === tile.id
            }"
            :style="getTileStyle(tile)"
            @click="onTileClick(tile)"
          >
            <div class="tile-inner">
              <span class="tile-icon">{{ getTileIcon(tile.type) }}</span>
            </div>
            <div v-if="isCovered(tile)" class="tile-overlay"></div>
          </div>
        </transition-group>
      </div>
    </div>

    <!-- Tool bar -->
    <div class="tool-bar">
      <button
        class="tool-btn"
        :class="{ locked: store.tools.undo <= 0 }"
        @click="onUndo"
      >
        <span class="tool-icon">↩️</span>
        <span class="tool-label">撤回</span>
        <span class="tool-count">{{ store.tools.undo }}</span>
        <span v-if="store.tools.undo <= 0" class="tool-lock">🔒</span>
      </button>
      <button
        class="tool-btn"
        :class="{ locked: store.tools.hint <= 0 }"
        @click="onHint"
      >
        <span class="tool-icon">💡</span>
        <span class="tool-label">提示</span>
        <span class="tool-count">{{ store.tools.hint }}</span>
        <span v-if="store.tools.hint <= 0" class="tool-lock">🔒</span>
      </button>
      <button
        class="tool-btn"
        :class="{ locked: store.tools.shuffle <= 0 }"
        @click="onShuffle"
      >
        <span class="tool-icon">🔀</span>
        <span class="tool-label">洗牌</span>
        <span class="tool-count">{{ store.tools.shuffle }}</span>
        <span v-if="store.tools.shuffle <= 0" class="tool-lock">🔒</span>
      </button>
    </div>

    <!-- Victory / Failure overlay -->
    <transition name="fade">
      <div v-if="store.gameStatus === 'victory'" class="result-overlay" @click="goVictory">
        <div class="result-card victory-card">
          <div class="result-bird">🎺</div>
          <div class="result-title">太棒了！</div>
          <div class="result-sub">继续前进！</div>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="store.gameStatus === 'failure'" class="result-overlay" @click="goFailure">
        <div class="result-card failure-card">
          <div class="result-bird failure-bird">😢</div>
          <div class="result-title failure-title">挑战失败</div>
          <div class="result-sub">再试一次？</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { store, isTileCovered, clickTile, useUndo, useHint, useShuffle } from '../store/gameStore.js'
import { TILE_TYPES } from '../data/levels.js'
import { playClick, playMatch, playVictory, playFailure } from '../utils/sound.js'

const router = useRouter()
const boardRef = ref(null)
const flyingTileId = ref(null)

const TILE_SIZE = 68
const LAYER_OFFSET = 4

const slots = computed(() => {
  const arr = new Array(7).fill(null)
  store.slots.forEach((t, i) => { arr[i] = t })
  return arr
})

const visibleTiles = computed(() => store.tiles.filter(t => !t.removed))

function getTileIcon(type) {
  return TILE_TYPES[type]?.icon ?? '❓'
}

function isCovered(tile) {
  return isTileCovered(tile)
}

// Calculate board bounding box to center it
const boardStyle = computed(() => {
  if (!store.tiles.length) return {}
  let maxCol = 0, maxRow = 0, maxLayer = 0
  store.tiles.forEach(t => {
    if (t.col > maxCol) maxCol = t.col
    if (t.row > maxRow) maxRow = t.row
    if (t.layer > maxLayer) maxLayer = t.layer
  })
  const w = (maxCol + 1) * TILE_SIZE + maxLayer * LAYER_OFFSET + 4
  const h = (maxRow + 1) * TILE_SIZE + maxLayer * LAYER_OFFSET + 4
  return { width: w + 'px', height: h + 'px' }
})

function getTileStyle(tile) {
  const x = tile.col * TILE_SIZE + tile.layer * LAYER_OFFSET
  const y = tile.row * TILE_SIZE - tile.layer * LAYER_OFFSET
  return {
    left: x + 'px',
    top: y + 'px',
    zIndex: tile.layer * 10 + (tile.col + tile.row * 5),
    width: TILE_SIZE + 'px',
    height: TILE_SIZE + 'px',
  }
}

let prevSlotLen = 0
function onTileClick(tile) {
  if (isCovered(tile)) return
  flyingTileId.value = tile.id
  setTimeout(() => { flyingTileId.value = null }, 300)
  prevSlotLen = store.slots.length
  playClick()
  clickTile(tile)
}

watch(() => store.slots.length, (newLen) => {
  if (newLen < prevSlotLen) playMatch()
  prevSlotLen = newLen
})

watch(() => store.gameStatus, (val) => {
  if (val === 'victory') {
    playVictory()
    setTimeout(goVictory, 1200)
  } else if (val === 'failure') {
    playFailure()
    setTimeout(goFailure, 1000)
  }
})

function goHome() {
  store.gameStatus = 'idle'
  router.push('/')
}
function goVictory() {
  router.push('/victory')
}
function goFailure() {
  router.push('/failure')
}

function onUndo() { useUndo() }
function onHint() { useHint() }
function onShuffle() { useShuffle() }
</script>

<style scoped>
.game-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
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
.bg-field { display: none; }
.bg-overlay {
  position: absolute; inset: 0;
  background: rgba(255, 245, 255, 0.22);
  z-index: 1;
}

/* Top bar */
.top-bar {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  padding-top: max(10px, env(safe-area-inset-top));
}

.back-btn {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.85);
  border: none; border-radius: 10px;
  font-size: 20px; font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.level-label {
  font-size: 20px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.4);
  letter-spacing: 1px;
}
.coin-mini {
  font-size: 14px;
  font-weight: 700;
  color: white;
  background: rgba(0,0,0,0.25);
  padding: 4px 10px;
  border-radius: 12px;
}

/* Slot bar */
.slot-bar {
  position: relative;
  z-index: 20;
  padding: 8px 12px;
}
.slot-track {
  display: flex;
  gap: 4px;
  background: rgba(30,30,50,0.75);
  border-radius: 16px;
  padding: 6px 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
}
.slot-cell {
  flex: 1;
  height: 52px;
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.slot-cell.filled { background: transparent; }

.slot-tile {
  width: 48px; height: 48px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.slot-tile .tile-icon { font-size: 28px; }

.slot-in-enter-active { animation: slotBounce 0.25s ease-out; }
@keyframes slotBounce {
  0% { transform: scale(0.3); opacity: 0; }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

/* Board */
.board-wrapper {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
}
.board {
  position: relative;
}
.tile-layer {
  position: absolute;
  inset: 0;
}

/* Tile card */
.tile-card {
  position: absolute;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
}
.tile-card:not(.covered):active {
  transform: scale(0.9);
}
.tile-inner {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: var(--tile-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 0 #b0b0b0,
    0 5px 10px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.tile-inner::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 40%;
  background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%);
  border-radius: var(--tile-radius) var(--tile-radius) 0 0;
  pointer-events: none;
}
.tile-icon { font-size: 36px; line-height: 1; }

.tile-card.covered .tile-inner {
  background: #d8d8e8;
  box-shadow: 0 2px 0 #a0a0b0, 0 3px 6px rgba(0,0,0,0.15);
}
.tile-card.covered .tile-icon { opacity: 0.5; }
.tile-overlay {
  position: absolute;
  inset: 0;
  background: rgba(100,100,130,0.35);
  border-radius: var(--tile-radius);
  pointer-events: none;
}

.tile-card.hint .tile-inner {
  box-shadow: 0 0 0 3px #FFD700, 0 4px 0 #b0b0b0, 0 5px 10px rgba(0,0,0,0.2);
  animation: hintPulse 1s ease-in-out infinite;
}
@keyframes hintPulse {
  0%, 100% { box-shadow: 0 0 0 3px #FFD700, 0 4px 0 #b0b0b0; }
  50% { box-shadow: 0 0 0 5px #FFD700, 0 0 15px #FFD700, 0 4px 0 #b0b0b0; }
}

.tile-card.flying .tile-inner {
  animation: flyToSlot 0.25s ease-in forwards;
}
@keyframes flyToSlot {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(0.7); opacity: 0.5; }
}

.tile-remove-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
}
.tile-remove-leave-to {
  transform: scale(0);
  opacity: 0;
}

/* Tool bar */
.tool-bar {
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px 20px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

.tool-btn {
  position: relative;
  width: 72px; height: 72px;
  background: rgba(30,30,60,0.75);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: transform 0.1s;
}
.tool-btn:not(.locked):active { transform: scale(0.9); }
.tool-btn.locked { opacity: 0.6; }

.tool-icon { font-size: 26px; line-height: 1; }
.tool-label { font-size: 10px; color: rgba(255,255,255,0.8); font-weight: 700; }
.tool-count {
  font-size: 11px;
  color: #FFD700;
  font-weight: 800;
  position: absolute;
  top: 6px; right: 8px;
}
.tool-lock {
  position: absolute;
  bottom: 4px; right: 6px;
  font-size: 14px;
}

/* Result overlay */
.result-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.result-card {
  background: white;
  border-radius: 24px;
  padding: 40px 50px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  animation: cardPop 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes cardPop {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.victory-card { background: linear-gradient(135deg, #fff9e6, #fffde0); }
.failure-card { background: linear-gradient(135deg, #1a1a3e, #2d2d60); }

.result-bird { font-size: 60px; margin-bottom: 12px; }
.result-title {
  font-size: 28px;
  font-weight: 900;
  color: #FF8C00;
  font-family: var(--font);
}
.failure-title { color: #FFD700; }
.result-sub { font-size: 16px; color: #888; margin-top: 8px; font-weight: 700; }
.failure-bird { animation: cry 0.5s ease-in-out infinite alternate; }
@keyframes cry {
  from { transform: rotate(-10deg); }
  to { transform: rotate(10deg); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
