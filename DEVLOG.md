# Tile Explorer — 开发总结文档

> 三消益智 H5 游戏，Vue3 + Vite，20 关卡，移动端适配（375–430px）

---

## 一、项目概述

| 项目 | 说明 |
|------|------|
| 游戏类型 | 点击消除（同色三消） |
| 关卡数量 | 20 关，逐步解锁 |
| 技术栈 | Vue 3 + Vite + Vue Router（Hash 模式） |
| 目标平台 | H5 WebApp，兼容微信内置浏览器 / Safari |
| 持久化 | localStorage |
| 音频 | BGM：HTML5 Audio；音效：Web Audio API |

**完整页面流程：**

```
首页（HomeView）
  └─ 开始游戏 ──► 游戏页（GameView）
                    ├─ 通关 ──► 胜利页（VictoryView）──► 下一关 / 返回首页
                    └─ 失败 ──► 失败页（FailureView）──► 复活 / 再试 / 返回首页
```

---

## 二、技术架构

### 2.1 目录结构

```
src/
├── main.js               # 入口，挂载 App + Router
├── App.vue               # 根组件，全局 BGM 控制
├── router/index.js       # Hash 路由，4 条路径
├── store/gameStore.js    # 全局响应式状态（无 Pinia）
├── data/levels.js        # 20 关数据，种子随机生成
├── utils/sound.js        # BGM + SFX 音频管理
└── views/
    ├── HomeView.vue      # 首页
    ├── GameView.vue      # 游戏主界面
    ├── VictoryView.vue   # 通关页
    └── FailureView.vue   # 失败页
```

### 2.2 状态管理（gameStore.js）

使用 Vue3 `reactive()` 构建单例 Store，无需 Pinia，避免引入额外依赖。

**持久化字段**（存入 localStorage）：
```js
{ currentLevel, maxUnlockedLevel, coins, soundEnabled, tools, revives }
```

**运行时字段**（不持久化）：
```js
{ gameKey, tiles, slots, history, hintTiles, gameStatus, isAnimating }
```

`gameKey` 是整个状态管理的关键技巧：每次 `startLevel()` 时自增，绑定在游戏板和槽位容器的 `:key` 上，强制 Vue 完整销毁重建 DOM，彻底解决"再试一次"时 transition-group 复用旧节点的问题。

### 2.3 关卡数据（levels.js）

放弃手工录入坐标（计数极易出错），改为**模板 + 种子随机**方案：

```
TEMPLATES（位置模板）× LEVEL_CONFIGS（类型配置）
        ↓ seededRng（线性同余随机）
      buildLevel()  ─→  固定、可复现的关卡
```

- 模板：t12 / t15 / t18 / t21 / t24 / t27 / t30 / t33 / t36 / t42 / t45（按格子数命名）
- 每个模板定义 `[col, row, layer]` 坐标数组
- `LEVEL_CONFIGS` 指定每关使用哪个模板、哪些类型、每类数量（**必须是 3 的倍数**）
- `buildLevel()` 先打乱类型池、再打乱位置，用 `.slice(0, pool.length)` 对齐长度

---

## 三、核心实现思路

### 3.1 图块覆盖检测

三消类游戏的核心难点是判断某块是否被上层图块遮住（无法点击）。

采用**像素空间包围盒重叠**检测，而非格子坐标比较：

```js
function isTileCovered(tile) {
  const TS = 68           // 图块像素尺寸
  const OX = 4, OY = 4    // 每层水平/垂直偏移
  const ax = tile.col * TS + tile.layer * OX
  const ay = tile.row * TS - tile.layer * OY
  return store.tiles.some(b => {
    if (b.id === tile.id || b.removed || b.layer <= tile.layer) return false
    const bx = b.col * TS + b.layer * OX
    const by = b.row * TS - b.layer * OY
    return Math.abs(ax - bx) < TS && Math.abs(ay - by) < TS
  })
}
```

条件：`b.layer > tile.layer`（b 在上层）且两块像素中心距离在 TS 范围内，即视觉上有重叠。

### 3.2 槽位同色自动聚合

需求：点击图块加入槽位时，自动插到已有同色块的右侧，而非追加到末尾。

```js
function insertToSlot(newTile) {
  let insertIdx = -1
  for (let i = store.slots.length - 1; i >= 0; i--) {
    if (store.slots[i].type === newTile.type) {
      insertIdx = i + 1
      break
    }
  }
  if (insertIdx === -1) store.slots.push(newTile)
  else store.slots.splice(insertIdx, 0, newTile)
}
```

**从右向左**扫描，找到最后一个同色块，插入其后。效果验证：

```
初始: [🥭, 🍋]
点击 🥭 → 从右找到 🥭 在 index 0，插入 index 1 → [🥭, 🥭, 🍋]
点击 🥭 → 插入 index 2 → [🥭, 🥭, 🥭, 🍋] → checkMatch 消除 → [🍋] ✓
```

### 3.3 三消检测

```js
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
      checkMatch()   // 递归检查连消
      return
    }
  }
}
```

按类型统计槽位中的块，满 3 个即消除，支持连消递归。

### 3.4 复活系统

失败页逻辑分三个路径：

```
store.revives > 0
  └─ 点击"复活" → revives--，slots 截断到 4 个（释放 3 个空间），返回游戏

store.revives === 0
  ├─ 点击"购买复活" → 弹出确认弹窗
  │    └─ 确认 → coins -= 30，revives++，立即执行 revive()
  └─ 点击"再试一次" → startLevel() 完整重置

coins < 30 时购买按钮置灰（disabled 样式），阻止操作
```

### 3.5 音频架构

```
BGM  ────  HTML5 Audio（/music.mp3，loop=true）
SFX  ────  Web Audio API（纯代码合成 sine 波音效）
```

两套体系分离的原因：
- BGM 需要 MP3 格式、长时间循环，HTML5 Audio 最适配（含 WeChat）
- SFX 需要低延迟精准触发，Web Audio API 的调度器（`currentTime`）优于 Audio 标签

#### BGM 全局单例管理

```js
// App.vue 监听音效开关，统一控制
watch(() => store.soundEnabled, (on) => {
  if (on) startBGM()
  else stopBGM()
})
```

各页面**不再管理 BGM 生命周期**，跨页面切换时音乐连续播放不中断。

#### 自动播放解锁

```js
export function startBGM() {
  const audio = getBGM()
  if (!audio.paused) return          // 已在播放，不重启
  const p = audio.play()
  if (p && typeof p.catch === 'function') {
    p.catch(() => { pendingPlay = true })   // 浏览器拦截，标记等待
  }
}

// 任意用户手势触发解锁
function tryUnlock() {
  ensureRunning()  // 恢复 AudioContext
  if (pendingPlay && isEnabled()) {
    pendingPlay = false
    getBGM().play().catch(() => {})
  }
}
['touchstart', 'touchend', 'click'].forEach(e =>
  document.addEventListener(e, tryUnlock, { capture: true, passive: true, once: true })
)
document.addEventListener('WeixinJSBridgeReady', tryUnlock, { once: true })
```

---

## 四、遇到的问题与解决方案

### 问题 1：背景音乐完全不播放

**现象**：音效开关已打开，进入游戏无 BGM。

**根因**：最初用 Web Audio API 做 BGM，`scheduleBGM()` 在 `ctx.state !== 'running'` 时直接 return，没有调用 `ctx.resume()`，导致 AudioContext 挂起后永不恢复。

**解决**：
1. 改用 HTML5 Audio 元素播放 BGM（格式兼容性更好）
2. `startBGM()` 调用 `audio.play()` 时捕获 Promise rejection，设 `pendingPlay = true`
3. 用户首次手势（touchstart/click）时调用 `tryUnlock()` 补播

---

### 问题 2：微信内置浏览器无法自动播放

**现象**：普通浏览器解锁成功，但微信 WebView 仍静音。

**根因**：微信屏蔽了标准的 `touchstart` 早期捕获，需要监听微信专属事件。

**解决**：
```js
document.addEventListener('WeixinJSBridgeReady', tryUnlock, { once: true })
```

微信在 JS Bridge 就绪后触发此事件，此时 `tryUnlock()` 执行即可解锁。

---

### 问题 3：切换页面 / 关卡时 BGM 重启

**现象**：进入下一关或返回首页时，音乐会重头开始播放。

**根因**：每个页面在 `onMounted` 调用 `startBGM()`，但 `startBGM()` 之前会先 `stopBGM()` 重置 `currentTime`，导致每次进页面都从 0 秒重放。

**解决**：
1. 所有页面**移除** BGM 生命周期钩子
2. BGM 只在 `App.vue` 全局管理（监听 `soundEnabled` 开关）
3. `startBGM()` 加检查：`if (!audio.paused) return`，已在播放则不重置
4. `stopBGM()` 不重置 `currentTime`，保留播放进度

---

### 问题 4：首次进入需要"关一下再开"才有声音

**现象**：首次打开页面，音效开关显示已开，但无 BGM，必须手动关掉再打开才生效。

**根因**：浏览器自动播放策略（Autoplay Policy）阻止了页面加载时的 `audio.play()`，返回的 Promise 被 reject，但没有任何提示。

**解决**：首页增加启动画面（Splash Screen），用户点击"开始"时作为首次用户手势，在该手势回调中调用 `startBGM()`：

```js
// HomeView.vue
function dismissSplash() {
  sessionStorage.setItem(SPLASH_KEY, '1')
  showSplash.value = false
  startBGM()   // 首次手势，解锁音频
}
```

同时 `sound.js` 监听全局手势事件兜底，确保任意点击都能触发解锁。

---

### 问题 5："再试一次"没有完整重置游戏

**现象**：点击"再试一次"后，之前留在槽位中的图块仍然存在，或旧图块动画状态残留。

**根因**：Vue 的 `transition-group` 默认按 `:key` 复用 DOM 节点。图块 id 从 0 开始递增，再开一局时 id 相同，Vue 认为是同一个元素，保留了旧的 DOM 状态和动画。

**解决**：在 Store 中引入 `gameKey: 0`，每次 `startLevel()` 时自增，绑定到游戏板和槽位容器的 `:key`：

```html
<!-- GameView.vue -->
<div class="board" :key="store.gameKey">
<div class="slot-track" :key="store.gameKey">
```

```js
// gameStore.js
export function startLevel(levelNum) {
  store.gameKey++   // 强制完整重建 DOM
  store.tiles = deepClone(data.tiles)
  store.slots = []
  // ...
}
```

---

### 问题 6：关卡 13–15 出现 undefined 类型图块

**现象**：进入第 13–15 关后，部分图块显示 ❓ 图标（类型为 `undefined`）。

**根因**：模板 `t36` 最初有 37 个位置，而 Level 13 的 `LEVEL_CONFIGS` 配置总数为 36 块，`buildLevel()` 中 `positions` 比 `pool` 多 1 项，导致 `shuffledTypes[36]` 取到 `undefined`。

**解决**：
1. 将 `t36` 模板从 37 个位置删减到 36 个（移除重复项）
2. `buildLevel()` 加防御性截断：
```js
const shuffledPos = shuffle(positions, rng).slice(0, pool.length)
```
确保位置数永远不超过类型池大小。

---

### 问题 7：金币在游戏中自动增加（需改为纯购买）

**现象**：消除图块或通关后，金币会自动增加（+10、+50）。

**需求变更**：金币仅通过用户付费购买获得，游戏行为不产生金币。

**解决**：删除 `checkMatch()` 中的 `store.coins += 10` 和 `checkGameOver()` 中的 `store.coins += 50`，注释说明：

```js
// 消除不奖励金币，金币仅通过购买获得
// 通关不奖励金币
```

---

## 五、关键设计决策

| 决策 | 方案 | 原因 |
|------|------|------|
| 状态管理 | `reactive()` 单例 | 无需 Pinia，减少依赖，结构更简单 |
| 关卡数据 | 模板 + 种子随机 | 手工计数极易出错；种子保证可复现 |
| BGM 引擎 | HTML5 Audio | 微信 / Safari 兼容性最好 |
| SFX 引擎 | Web Audio API | 低延迟，不依赖音频文件 |
| 路由模式 | Hash History | H5 部署无需服务器配置，微信分享链接可用 |
| DOM 重置 | `gameKey` 自增 | 解决 transition-group 节点复用问题 |
| 图块覆盖 | 像素包围盒 | 支持任意偏移叠层，无需转换为格子坐标 |

---

## 六、可能的后续优化方向

- **关卡编辑器**：可视化拖拽图块，生成 LEVEL_CONFIGS 配置
- **可解性验证**：`buildLevel()` 后运行 BFS 模拟检查是否必定可通关
- **广告变现**：失败页"看广告复活"替代金币购买，接入 uni-app 广告 SDK
- **云存档**：将 localStorage 存档同步到服务端，防止清缓存丢失进度
- **音效精细化**：为每种图块类型定制不同音高的点击音效
