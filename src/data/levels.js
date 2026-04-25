// Tile types with emoji icons
export const TILE_TYPES = {
  mango:      { icon: '🥭', color: '#FF8C00' },
  lemon:      { icon: '🍋', color: '#FFD700' },
  sunflower:  { icon: '🌻', color: '#FFA500' },
  flower:     { icon: '🌸', color: '#FF69B4' },
  leaf:       { icon: '🍃', color: '#32CD32' },
  strawberry: { icon: '🍓', color: '#FF4500' },
  blueberry:  { icon: '🫐', color: '#4169E1' },
  orange:     { icon: '🍊', color: '#FF6347' }
}

// tile descriptor: [col, row, layer, type]
// Board: 5 cols (0-4), rows vary, layers 0-3
// Tile visual pos: x = col*72 + layer*4, y = row*72 - layer*4
// Counts per type MUST be divisible by 3

function makeTiles(descriptors) {
  return descriptors.map(([col, row, layer, type], id) => ({
    id, col, row, layer, type, removed: false
  }))
}

// ──────────────────────────────────────────────
// Stage 1: 新手 (levels 1-5)
// ──────────────────────────────────────────────

// Level 1: 12 tiles, 2 types, 1 layer
const level1 = makeTiles([
  [0,1,0,'mango'], [1,1,0,'mango'], [2,1,0,'lemon'],
  [0,2,0,'lemon'], [1,2,0,'mango'], [2,2,0,'lemon'],
  [0,3,0,'mango'], [1,3,0,'lemon'], [2,3,0,'mango'],
  [3,2,0,'lemon'], [4,2,0,'lemon'], [3,3,0,'lemon'],
  // extra pad: ensure 6 mango, 6 lemon
  // mango: 0,0 1,0 1,1 1,2 0,3 2,3 = 6 -> need recount
])
// Recount: mango=(0,1)(1,1)(1,2)(0,3)(2,3)(3,... no
// Let me rewrite cleanly:

const LEVEL1_TILES = [
  [0,1,0,'mango'],[1,1,0,'lemon'],[2,1,0,'mango'],
  [0,2,0,'lemon'],[1,2,0,'mango'],[2,2,0,'lemon'],
  [3,1,0,'lemon'],[4,1,0,'mango'],[3,2,0,'mango'],
  [4,2,0,'lemon'],[3,3,0,'lemon'],[4,3,0,'mango'],
  // mango: cols 0,2/row1; 1/row2; 4/row1; 3,2/row2,3 = (0,1)(2,1)(1,2)(4,1)(3,2)(4,3) = 6 ✓
  // lemon: (1,1)(0,2)(2,2)(3,1)(4,2)(3,3) = 6 ✓
]

// Level 2: 15 tiles, 3 types, mostly 1 layer
const LEVEL2_TILES = [
  [0,1,0,'mango'],[1,1,0,'mango'],[2,1,0,'lemon'],
  [0,2,0,'lemon'],[1,2,0,'mango'],[2,2,0,'sunflower'],
  [3,1,0,'sunflower'],[4,1,0,'lemon'],[3,2,0,'mango'],
  [4,2,0,'lemon'],[0,3,0,'mango'],[1,3,0,'lemon'],
  [2,3,0,'sunflower'],[3,3,0,'lemon'],[4,3,0,'mango'],
  // mango: (0,1)(1,1)(1,2)(3,2)(0,3)(4,3) = 6 ✓
  // lemon: (2,1)(0,2)(4,1)(4,2)(1,3)(3,3) = 6 ✓
  // sunflower: (2,2)(3,1)(2,3) = 3 ✓
]

// Level 3: 18 tiles, 3 types, 2 layers
const LEVEL3_TILES = [
  // Layer 0 base
  [0,1,0,'mango'],[1,1,0,'lemon'],[2,1,0,'mango'],[3,1,0,'lemon'],[4,1,0,'mango'],
  [0,2,0,'lemon'],[1,2,0,'sunflower'],[2,2,0,'lemon'],[3,2,0,'sunflower'],[4,2,0,'lemon'],
  [0,3,0,'mango'],[1,3,0,'lemon'],[2,3,0,'mango'],[3,3,0,'sunflower'],
  // Layer 1 (covering center row)
  [1,2,1,'mango'],[2,2,1,'lemon'],[3,2,1,'sunflower'],[2,1,1,'mango'],
  // mango: (0,1)(2,1)(4,1)(0,3)(2,3)(1,2,1)(2,1,1) = 7 ... need recount

  // Let me redo carefully:
]

// I'll rewrite all levels cleanly without intermediate comments:

const levels = [
  // ── Level 1: 12 tiles, 2 types (mango×6, lemon×6), single layer
  {
    id: 1,
    tiles: makeTiles([
      [0,1,0,'mango'],[1,1,0,'lemon'],[2,1,0,'mango'],
      [0,2,0,'lemon'],[1,2,0,'mango'],[2,2,0,'lemon'],
      [3,1,0,'lemon'],[4,1,0,'mango'],[3,2,0,'mango'],
      [4,2,0,'lemon'],[3,3,0,'lemon'],[4,3,0,'mango'],
    ])
  },

  // ── Level 2: 15 tiles, 3 types (mango×6, lemon×6, sunflower×3), 1 layer
  {
    id: 2,
    tiles: makeTiles([
      [0,1,0,'mango'],[1,1,0,'mango'],[2,1,0,'lemon'],
      [0,2,0,'lemon'],[1,2,0,'mango'],[2,2,0,'sunflower'],
      [3,1,0,'sunflower'],[4,1,0,'lemon'],[3,2,0,'mango'],
      [4,2,0,'lemon'],[0,3,0,'mango'],[1,3,0,'lemon'],
      [2,3,0,'sunflower'],[3,3,0,'lemon'],[4,3,0,'mango'],
    ])
  },

  // ── Level 3: 18 tiles, 3 types (mango×6, lemon×6, sunflower×6), 2 layers
  {
    id: 3,
    tiles: makeTiles([
      // layer 0 — 12 tiles
      [0,1,0,'mango'],[1,1,0,'lemon'],[3,1,0,'mango'],[4,1,0,'lemon'],
      [0,2,0,'sunflower'],[1,2,0,'mango'],[3,2,0,'lemon'],[4,2,0,'sunflower'],
      [0,3,0,'lemon'],[1,3,0,'sunflower'],[3,3,0,'sunflower'],[4,3,0,'mango'],
      // layer 1 — 6 tiles (stacked center)
      [1,2,1,'mango'],[2,2,1,'lemon'],[3,2,1,'mango'],
      [1,3,1,'lemon'],[2,3,1,'sunflower'],[3,3,1,'lemon'],
      // mango: (0,1)(3,1)(1,2)(4,3)(1,2,1)(3,2,1) = 6 ✓
      // lemon: (1,1)(4,1)(3,2)(0,3)(2,2,1)(1,3,1)(3,3,1) = 7 ✗ — fix below
    ])
  },

  // ── Level 4: 18 tiles, 4 types, 2 layers
  {
    id: 4,
    tiles: makeTiles([
      [0,1,0,'mango'],[2,1,0,'lemon'],[4,1,0,'flower'],
      [0,2,0,'lemon'],[2,2,0,'flower'],[4,2,0,'mango'],
      [0,3,0,'flower'],[2,3,0,'mango'],[4,3,0,'lemon'],
      [1,1,0,'sunflower'],[3,1,0,'sunflower'],
      [1,2,0,'mango'],[3,2,0,'lemon'],
      [1,3,0,'flower'],[3,3,0,'mango'],
      // layer 1
      [1,2,1,'lemon'],[2,2,1,'sunflower'],[3,2,1,'flower'],
      // mango: (0,1)(4,2)(2,3)(1,2)(3,3) = 5 ✗ — recalc
    ])
  },

  // ── Level 5: 21 tiles, 4 types, 2 layers
  {
    id: 5,
    tiles: makeTiles([
      [0,0,0,'mango'],[2,0,0,'lemon'],[4,0,0,'mango'],
      [0,1,0,'lemon'],[1,1,0,'sunflower'],[2,1,0,'mango'],[3,1,0,'flower'],[4,1,0,'lemon'],
      [0,2,0,'flower'],[1,2,0,'mango'],[2,2,0,'lemon'],[3,2,0,'sunflower'],[4,2,0,'flower'],
      [0,3,0,'sunflower'],[1,3,0,'lemon'],[2,3,0,'flower'],[3,3,0,'mango'],[4,3,0,'sunflower'],
      [1,1,1,'mango'],[2,1,1,'lemon'],[3,1,1,'flower'],
      // mango: (0,0)(4,0)(2,1)(1,2)(3,3)(1,1,1)=6✓ lemon:(2,0)(0,1)(4,1)(2,2)(1,3)(2,1,1)=6✓
      // sunflower:(1,1)(3,2)(0,3)(4,3)=4✗
    ])
  },

  // Stages 2-4: generated below
]

// Because exact hand-crafted counting is error-prone,
// I'll use a reliable programmatic approach for all 20 levels:

function seededRng(seed) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0x100000000
  }
}

function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pre-defined position templates [col, row, layer]
const TEMPLATES = {
  // 12 positions, single layer — two 2x3 clusters
  t12: [
    [0,1,0],[1,1,0],[2,1,0],[0,2,0],[1,2,0],[2,2,0],
    [3,1,0],[4,1,0],[3,2,0],[4,2,0],[3,3,0],[4,3,0]
  ],
  // 15 positions — T-shape + sides
  t15: [
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [1,3,0],[2,3,0],[3,3,0],
    [0,0,0],[4,0,0]
  ],
  // 18 positions — 2 layers
  t18: [
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [1,2,1],[2,2,1],[3,2,1]
  ],
  // 21 positions — pyramid 2 layers
  t21: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [1,1,1],[2,1,1],[3,1,1],
    [0,3,0],[2,3,0],[4,3,0]
  ],
  // 24 positions — 3 layers
  t24: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [1,1,1],[2,1,1],[3,1,1],
    [2,1,2]
  ],
  // 27 positions — 3 layers, wider
  t27: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [1,1,1],[2,1,1],[3,1,1],
    [1,2,1],[2,2,1],[3,2,1],
    [2,2,2]
  ],
  // 30 positions
  t30: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [0,4,0],[1,4,0],[2,4,0],[3,4,0],[4,4,0],
    [1,1,1],[2,1,1],[3,1,1],
    [2,2,1],[2,2,2]
  ],
  // 33 positions
  t33: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [0,4,0],[1,4,0],[2,4,0],[3,4,0],[4,4,0],
    [1,1,1],[2,1,1],[3,1,1],
    [1,2,1],[2,2,1],[3,2,1],
    [1,3,1],[3,3,1]
  ],
  // 36 positions
  t36: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [0,4,0],[1,4,0],[2,4,0],[3,4,0],[4,4,0],
    [1,1,1],[2,1,1],[3,1,1],
    [1,2,1],[2,2,1],[3,2,1],
    [1,3,1],[2,3,1],[3,3,1],
    [2,1,2],[2,2,2]
  ],
  // 42 positions
  t42: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [0,4,0],[1,4,0],[2,4,0],[3,4,0],[4,4,0],
    [0,5,0],[1,5,0],[2,5,0],[3,5,0],[4,5,0],
    [1,1,1],[2,1,1],[3,1,1],
    [1,2,1],[2,2,1],[3,2,1],
    [1,3,1],[2,3,1],[3,3,1],
    [2,1,2],[2,2,2],[2,3,2]
  ],
  // 45 positions
  t45: [
    [0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],
    [0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],
    [0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],
    [0,3,0],[1,3,0],[2,3,0],[3,3,0],[4,3,0],
    [0,4,0],[1,4,0],[2,4,0],[3,4,0],[4,4,0],
    [0,5,0],[1,5,0],[2,5,0],[3,5,0],[4,5,0],
    [1,1,1],[2,1,1],[3,1,1],
    [1,2,1],[2,2,1],[3,2,1],
    [1,3,1],[2,3,1],[3,3,1],
    [1,4,1],[2,4,1],[3,4,1],
    [2,2,2],[2,3,2],[2,2,3]
  ]
}

// Level configs: [templateKey, typeList, countsPerType]
// totalTiles = sum(counts), all counts divisible by 3
const LEVEL_CONFIGS = [
  { id:1,  tmpl:'t12', types:['mango','lemon'],                           counts:[6,6] },
  { id:2,  tmpl:'t15', types:['mango','lemon','sunflower'],                counts:[6,6,3] },
  { id:3,  tmpl:'t18', types:['mango','lemon','sunflower'],                counts:[6,6,6] },
  { id:4,  tmpl:'t18', types:['mango','lemon','sunflower','flower'],       counts:[6,6,3,3] },
  { id:5,  tmpl:'t21', types:['mango','lemon','sunflower','flower'],       counts:[6,6,6,3] },
  { id:6,  tmpl:'t24', types:['mango','lemon','sunflower','flower'],       counts:[6,6,6,6] },
  { id:7,  tmpl:'t27', types:['mango','lemon','sunflower','flower','leaf'],counts:[6,6,6,6,3] },
  { id:8,  tmpl:'t27', types:['mango','lemon','sunflower','flower','leaf'],counts:[6,6,6,3,6] },
  { id:9,  tmpl:'t30', types:['mango','lemon','sunflower','flower','leaf'],counts:[6,6,6,6,6] },
  { id:10, tmpl:'t30', types:['mango','lemon','sunflower','flower','leaf','strawberry'], counts:[6,6,6,3,6,3] },
  { id:11, tmpl:'t33', types:['mango','lemon','sunflower','flower','leaf','strawberry'], counts:[6,6,6,6,6,3] },
  { id:12, tmpl:'t33', types:['mango','lemon','sunflower','flower','leaf','strawberry'], counts:[6,6,3,6,6,6] },
  { id:13, tmpl:'t36', types:['mango','lemon','sunflower','flower','leaf','strawberry'], counts:[6,6,6,6,6,6] },
  { id:14, tmpl:'t36', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry'], counts:[6,6,6,6,3,6,3] },
  { id:15, tmpl:'t36', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry'], counts:[6,3,6,6,6,6,3] },
  { id:16, tmpl:'t42', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry'], counts:[6,6,6,6,6,6,6] },
  { id:17, tmpl:'t42', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry','orange'], counts:[6,6,6,6,6,6,3,3] },
  { id:18, tmpl:'t42', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry','orange'], counts:[6,6,6,6,3,6,6,3] },
  { id:19, tmpl:'t45', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry','orange'], counts:[6,6,6,6,6,6,6,3] },
  { id:20, tmpl:'t45', types:['mango','lemon','sunflower','flower','leaf','strawberry','blueberry','orange'], counts:[6,6,6,6,6,6,6,3] },
]

function buildLevel(cfg) {
  const rng = seededRng(cfg.id * 31337 + 1234567)
  const positions = TEMPLATES[cfg.tmpl]

  // build type pool
  const pool = []
  cfg.types.forEach((type, i) => {
    for (let c = 0; c < cfg.counts[i]; c++) pool.push(type)
  })

  const shuffledTypes = shuffle(pool, rng)
  const shuffledPos = shuffle(positions, rng).slice(0, pool.length)

  return {
    id: cfg.id,
    tiles: shuffledPos.map(([col, row, layer], idx) => ({
      id: idx,
      col, row, layer,
      type: shuffledTypes[idx],
      removed: false
    }))
  }
}

const LEVELS = LEVEL_CONFIGS.map(buildLevel)

export function getLevelData(levelNum) {
  const idx = Math.max(0, Math.min(levelNum - 1, LEVELS.length - 1))
  // deep clone to avoid mutation
  return JSON.parse(JSON.stringify(LEVELS[idx]))
}

export function getTotalLevels() {
  return LEVELS.length
}
