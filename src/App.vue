<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { store } from './store/gameStore.js'
import { startBGM, stopBGM } from './utils/sound.js'

const transitionName = ref('fade')

// 全局监听音效开关，统一控制 BGM
watch(() => store.soundEnabled, (on) => {
  if (on) startBGM()
  else stopBGM()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

.app-container {
  width: 100vw;
  height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

:root {
  --primary: #4CAF50;
  --primary-dark: #388E3C;
  --accent: #FF9800;
  --slot-bg: #2c3e50;
  --tile-size: 68px;
  --tile-radius: 12px;
  --font: 'Nunito', sans-serif;
}
</style>
