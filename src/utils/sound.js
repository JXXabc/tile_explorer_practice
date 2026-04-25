// ── BGM（HTML5 Audio，兼容微信/Safari）────────────────────────

let bgm = null
let pendingPlay = false   // play() 被浏览器拦截时置 true，等手势后补播

function getBGM() {
  if (!bgm) {
    bgm = new Audio('/music.mp3')
    bgm.loop = true
    bgm.volume = 0.5
  }
  return bgm
}

export function startBGM() {
  if (!isEnabled()) return
  const audio = getBGM()
  if (!audio.paused) return          // 已在播放，什么都不做
  const p = audio.play()
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      pendingPlay = true             // 被浏览器拦截，等手势后补播
    })
  }
}

export function stopBGM() {
  pendingPlay = false
  if (!bgm) return
  bgm.pause()
  // 不重置 currentTime，保留播放进度
}

export function setBGMEnabled(on) {
  if (on) startBGM()
  else stopBGM()
}

// ── 工具 ──────────────────────────────────────────────────────

function isEnabled() {
  try {
    const s = localStorage.getItem('tile_explorer_save')
    if (s) return JSON.parse(s).soundEnabled !== false
  } catch (_) {}
  return true
}

// ── AudioContext（仅用于音效 SFX）────────────────────────────

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function ensureRunning() {
  const c = getCtx()
  if (c.state === 'running') return Promise.resolve(c)
  return c.resume().then(() => c)
}

// 首次用户手势：解锁 AudioContext（SFX），同时补播被拦截的 BGM
function tryUnlock() {
  ensureRunning().catch(() => {})
  if (pendingPlay && isEnabled()) {
    pendingPlay = false
    const audio = getBGM()
    const p = audio.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }
}
if (typeof window !== 'undefined') {
  ;['touchstart', 'touchend', 'click'].forEach(e => {
    document.addEventListener(e, tryUnlock, { capture: true, passive: true, once: true })
  })
  document.addEventListener('WeixinJSBridgeReady', tryUnlock, { once: true })
}

function noteOn(dest, freq, start, dur, vol, type = 'sine') {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const g   = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    const atk = Math.min(0.12, dur * 0.25)
    const rel = Math.min(0.35, dur * 0.40)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.linearRampToValueAtTime(vol, start + atk)
    g.gain.setValueAtTime(vol, start + dur - rel)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(g)
    g.connect(dest)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  } catch (_) {}
}

function sfx(fn) {
  if (!isEnabled()) return
  ensureRunning().then(c => fn(c)).catch(() => {})
}

// ── SFX ───────────────────────────────────────────────────────

export function playClick() {
  sfx(c => {
    const t = c.currentTime, d = c.destination
    noteOn(d, 880,  t,       0.08, 0.22, 'sine')
    noteOn(d, 1100, t+0.05,  0.06, 0.10, 'sine')
  })
}

export function playMatch() {
  sfx(c => {
    const t = c.currentTime, d = c.destination
    noteOn(d, 523, t,       0.18, 0.26, 'sine')
    noteOn(d, 659, t+0.15,  0.18, 0.26, 'sine')
    noteOn(d, 784, t+0.30,  0.30, 0.30, 'sine')
  })
}

export function playVictory() {
  sfx(c => {
    const t = c.currentTime, d = c.destination
    ;[523, 659, 784, 1047].forEach((f, i) =>
      noteOn(d, f, t + i*0.14, 0.35, 0.28, 'sine'))
    noteOn(d, 1047, t+0.60, 0.60, 0.32, 'sine')
  })
}

export function playFailure() {
  sfx(c => {
    const t = c.currentTime, d = c.destination
    noteOn(d, 440, t,       0.28, 0.26, 'sine')
    noteOn(d, 370, t+0.25,  0.28, 0.26, 'sine')
    noteOn(d, 311, t+0.50,  0.40, 0.26, 'sine')
  })
}
