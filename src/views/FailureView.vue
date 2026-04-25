<template>
  <div class="failure-screen">
    <div class="bg-deep"></div>

    <div class="failure-content">
      <!-- Countdown -->
      <div class="countdown-wrapper">
        <div class="countdown-pill"></div>
        <div class="countdown-number" :class="{ urgent: countdown <= 2 }">
          {{ countdown > 0 ? countdown : '💀' }}
        </div>
      </div>

      <!-- Survival stat -->
      <div class="survival-text">
        仅有 <span class="survival-pct">{{ survivalPct }}%</span> 的人在本轮存活
      </div>

      <!-- Crying bird -->
      <div class="cry-bird">😭</div>

      <!-- 复活按钮（有次数时） -->
      <template v-if="store.revives > 0">
        <button class="revive-btn" @click="revive">
          <span class="revive-icon">💊</span>
          复活
          <span class="revive-badge">剩余 {{ store.revives }} 次</span>
        </button>
      </template>

      <!-- 次数用尽：购买或再试 -->
      <template v-else>
        <div class="no-revive-tip">复活次数已用完</div>
        <button class="buy-btn" :class="{ disabled: store.coins < REVIVE_COST }" @click="buyRevive">
          <span>🪙</span>
          花费 {{ REVIVE_COST }} 金币购买复活
          <span class="coin-hint">（当前 {{ store.coins }} 金币）</span>
        </button>
      </template>

      <button class="retry-btn" @click="retry">再试一次</button>
      <button class="home-btn" @click="goHome">返回首页</button>
    </div>

    <!-- 购买确认弹窗 -->
    <transition name="modal-fade">
      <div v-if="showBuyModal" class="modal-mask" @click.self="showBuyModal = false">
        <div class="modal-card">
          <div class="modal-title">💊 购买复活</div>
          <div class="modal-body">
            消耗 <span class="modal-cost">{{ REVIVE_COST }} 🪙</span> 购买一次复活机会？<br/>
            <span class="modal-balance">当前金币：{{ store.coins }}</span>
          </div>
          <div class="modal-actions">
            <button class="modal-cancel" @click="showBuyModal = false">取消</button>
            <button class="modal-confirm" @click="confirmBuy">确认购买</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { store, startLevel, saveGame, REVIVE_COST } from '../store/gameStore.js'

const router = useRouter()
const countdown = ref(5)
const survivalPct = ref(Math.floor(10 + Math.random() * 30))
const showBuyModal = ref(false)

let timer = null

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    // 倒计时结束只停止，不自动复活
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

function revive() {
  if (store.revives <= 0) return
  if (timer) { clearInterval(timer); timer = null }
  store.revives--
  store.slots = store.slots.slice(0, 4)
  store.gameStatus = 'playing'
  saveGame()
  router.push('/game')
}

function buyRevive() {
  if (store.coins < REVIVE_COST) return
  showBuyModal.value = true
}

function confirmBuy() {
  if (store.coins < REVIVE_COST) return
  store.coins -= REVIVE_COST
  store.revives++
  saveGame()
  showBuyModal.value = false
  revive()
}

function retry() {
  if (timer) { clearInterval(timer); timer = null }
  startLevel(store.currentLevel)
  router.push('/game')
}

function goHome() {
  if (timer) { clearInterval(timer); timer = null }
  store.gameStatus = 'idle'
  router.push('/')
}
</script>

<style scoped>
.failure-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: var(--font);
}

.bg-deep {
  position: absolute; inset: 0;
  background: url('/bg.jpg') center center / cover no-repeat;
  filter: brightness(0.35) saturate(0.6);
}

.failure-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px;
  width: 100%;
}

/* Countdown */
.countdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.countdown-pill {
  width: 60px; height: 28px;
  background: rgba(100,180,255,0.3);
  border-radius: 14px;
  border: 2px solid rgba(100,180,255,0.5);
  position: absolute;
  top: -8px;
}
.countdown-number {
  font-size: 88px;
  font-weight: 900;
  color: white;
  text-shadow: 0 0 30px rgba(100,180,255,0.5), 0 4px 8px rgba(0,0,0,0.6);
  line-height: 1;
  transition: color 0.3s;
}
.countdown-number.urgent { color: #ff6b6b; text-shadow: 0 0 20px rgba(255,80,80,0.7); }

.survival-text {
  font-size: 16px;
  color: rgba(255,255,255,0.85);
  font-weight: 700;
}
.survival-pct { color: #FF6B6B; font-size: 19px; font-weight: 900; }

.cry-bird {
  font-size: 80px;
  animation: cryBounce 0.8s ease-in-out infinite alternate;
}
@keyframes cryBounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-8px); }
}

/* 复活按钮 */
.revive-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(180deg, #6be36b 0%, #3db83d 50%, #2a9f2a 100%);
  color: white;
  font-size: 20px;
  font-weight: 800;
  font-family: var(--font);
  border: none;
  border-radius: 50px;
  padding: 14px 40px;
  cursor: pointer;
  box-shadow: 0 5px 0 #1a7a1a, 0 7px 16px rgba(0,0,0,0.4);
  min-width: 220px;
  justify-content: center;
  transition: transform 0.1s, box-shadow 0.1s;
}
.revive-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #1a7a1a; }
.revive-icon { font-size: 22px; }
.revive-badge {
  position: absolute;
  top: -8px; right: 8px;
  background: #ff9800;
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
}

/* 次数用尽 */
.no-revive-tip {
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  font-weight: 700;
}
.buy-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: linear-gradient(180deg, #f5a623 0%, #e8890a 100%);
  color: white;
  font-size: 16px;
  font-weight: 800;
  font-family: var(--font);
  border: none;
  border-radius: 50px;
  padding: 14px 28px;
  cursor: pointer;
  box-shadow: 0 4px 0 #a85f00, 0 6px 14px rgba(0,0,0,0.4);
  min-width: 220px;
  transition: transform 0.1s, box-shadow 0.1s;
}
.buy-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #a85f00; }
.buy-btn.disabled { opacity: 0.5; cursor: not-allowed; }
.coin-hint { font-size: 11px; opacity: 0.8; font-weight: 600; }

.retry-btn {
  background: rgba(255,255,255,0.12);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50px;
  padding: 11px 36px;
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  min-width: 180px;
}
.retry-btn:active { background: rgba(255,255,255,0.2); }

.home-btn {
  background: transparent;
  color: rgba(255,255,255,0.45);
  border: none;
  padding: 6px;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  text-decoration: underline;
}

/* 购买弹窗 */
.modal-mask {
  position: fixed; inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-card {
  background: white;
  border-radius: 20px;
  padding: 28px 24px;
  width: 100%;
  max-width: 320px;
  text-align: center;
  animation: modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes modalPop {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
.modal-title {
  font-size: 20px;
  font-weight: 900;
  color: #333;
  margin-bottom: 12px;
  font-family: var(--font);
}
.modal-body {
  font-size: 15px;
  color: #555;
  line-height: 1.7;
  margin-bottom: 20px;
}
.modal-cost { color: #e8890a; font-weight: 900; font-size: 17px; }
.modal-balance { color: #888; font-size: 13px; }
.modal-actions { display: flex; gap: 10px; }
.modal-cancel {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: white;
  font-size: 15px;
  font-weight: 700;
  color: #888;
  cursor: pointer;
  font-family: var(--font);
}
.modal-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(180deg, #f5a623, #e8890a);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  font-family: var(--font);
  box-shadow: 0 3px 0 #a85f00;
}
.modal-confirm:active { transform: translateY(2px); box-shadow: none; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
