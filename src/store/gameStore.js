import { reactive, computed } from 'vue'
import { getLevelData } from '../data/levels.js'

const SAVE_KEY = 'tile_explorer_save'

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return null
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const saved = loadSave()

export const REVIVE_COST = 30   // 购买一次复活消耗的金币

export const store = reactive({
  currentLevel: saved?.currentLevel ?? 1,
  maxUnlockedLevel: saved?.maxUnlockedLevel ?? 1,
  coins: saved?.coins ?? 0,
  soundEnabled: saved?.soundEnabled ?? true,
  tools: saved?.tools ?? { undo: 3, hint: 3, shuffle: 2 },
  revives: saved?.revives ?? 3,  // 全局复活次数，初始 3 次

  // runtime game state
  gameKey: 0,          // 每次 startLevel 递增，强制 GameView 完整重建
  tiles: [],
  slots: [],
  history: [],
  hintTiles: [],
  gameStatus: 'idle', // idle | playing | victory | failure
  isAnimating: false,
  failureCountdown: 5
})

export function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    currentLevel: store.currentLevel,
    maxUnlockedLevel: store.maxUnlockedLevel,
    coins: store.coins,
    soundEnabled: store.soundEnabled,
    tools: store.tools,
    revives: store.revives
  }))
}

export function startLevel(levelNum) {
  const data = getLevelData(levelNum)
  store.currentLevel = levelNum
  store.gameKey++                        // 强制游戏板完整重建
  store.tiles = deepClone(data.tiles)
  store.slots = []
  store.history = []
  store.hintTiles = []
  store.gameStatus = 'playing'
  store.isAnimating = false
}

export function isTileCovered(tile) {
  if (tile.removed) return true
  const TS = 68
  const OX = 4, OY = 4
  const ax = tile.col * TS + tile.layer * OX
  const ay = tile.row * TS - tile.layer * OY
  return store.tiles.some(b => {
    if (b.id === tile.id || b.removed || b.layer <= tile.layer) return false
    const bx = b.col * TS + b.layer * OX
    const by = b.row * TS - b.layer * OY
    return Math.abs(ax - bx) < TS && Math.abs(ay - by) < TS
  })
}

export function clickTile(tile) {
  if (store.isAnimating) return
  if (tile.removed) return
  if (isTileCovered(tile)) return
  if (store.slots.length >= 7) return
  if (store.gameStatus !== 'playing') return

  store.history.push({
    tiles: deepClone(store.tiles),
    slots: deepClone(store.slots),
    coins: store.coins
  })
  if (store.history.length > 20) store.history.shift()

  tile.removed = true
  store.hintTiles = []

  const slotTile = { ...tile, slotId: Date.now() + Math.random() }
  insertToSlot(slotTile)

  checkMatch()
  checkGameOver()
}

// 同色块自动靠拢：新块插入到槽位中最后一个同色块的后面
function insertToSlot(newTile) {
  let insertIdx = -1
  for (let i = store.slots.length - 1; i >= 0; i--) {
    if (store.slots[i].type === newTile.type) {
      insertIdx = i + 1
      break
    }
  }
  if (insertIdx === -1) {
    store.slots.push(newTile)        // 无同色，追加到末尾
  } else {
    store.slots.splice(insertIdx, 0, newTile)  // 插入到最后一个同色块之后
  }
}

function checkMatch() {
  const counts = {}
  store.slots.forEach(t => {
    counts[t.type] = counts[t.type] || []
    counts[t.type].push(t)
  })
  for (const type in counts) {
    if (counts[type].length >= 3) {
      const toRemove = counts[type].slice(0, 3)
      const removeIds = new Set(toRemove.map(t => t.slotId))
      store.slots = store.slots.filter(t => !removeIds.has(t.slotId))
      // 消除不奖励金币，金币仅通过购买获得
      checkMatch()   // 递归检查连消
      return
    }
  }
}

function checkGameOver() {
  const allRemoved = store.tiles.every(t => t.removed)
  if (allRemoved && store.slots.length === 0) {
    store.gameStatus = 'victory'
    // 通关不奖励金币
    if (store.currentLevel >= store.maxUnlockedLevel) {
      store.maxUnlockedLevel = store.currentLevel + 1
    }
    saveGame()
    return
  }
  if (store.slots.length >= 7) {
    const canMatch = canSlotsMatch()
    if (!canMatch) {
      store.gameStatus = 'failure'
    }
  }
}

function canSlotsMatch() {
  const counts = {}
  store.slots.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1 })
  return Object.values(counts).some(c => c >= 3)
}

export function useUndo() {
  if (store.tools.undo <= 0) return
  if (store.history.length === 0) return
  const snap = store.history.pop()
  store.tiles = snap.tiles
  store.slots = snap.slots
  store.coins = snap.coins
  store.tools.undo--
  store.gameStatus = 'playing'
  store.hintTiles = []
  saveGame()
}

export function useHint() {
  if (store.tools.hint <= 0) return
  store.hintTiles = []
  const accessible = store.tiles.filter(t => !t.removed && !isTileCovered(t))
  const counts = {}
  accessible.forEach(t => { counts[t.type] = (counts[t.type] || []).concat(t) })

  const slotCounts = {}
  store.slots.forEach(t => { slotCounts[t.type] = (slotCounts[t.type] || 0) + 1 })

  let best = null
  for (const type in counts) {
    const inSlot = slotCounts[type] || 0
    const accessible2 = counts[type].length
    if (inSlot + accessible2 >= 3) {
      best = counts[type].slice(0, Math.max(1, 3 - inSlot))
      break
    }
  }
  if (!best && accessible.length > 0) best = [accessible[0]]

  store.hintTiles = (best || []).map(t => t.id)
  store.tools.hint--
  saveGame()
}

export function useShuffle() {
  if (store.tools.shuffle <= 0) return
  const accessible = store.tiles.filter(t => !t.removed && !isTileCovered(t))
  const types = accessible.map(t => t.type)
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]]
  }
  accessible.forEach((t, i) => { t.type = types[i] })
  store.tools.shuffle--
  store.hintTiles = []
  saveGame()
}
