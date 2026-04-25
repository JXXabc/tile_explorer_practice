import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import VictoryView from '../views/VictoryView.vue'
import FailureView from '../views/FailureView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/game', component: GameView },
  { path: '/victory', component: VictoryView },
  { path: '/failure', component: FailureView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
