import { createRouter, createWebHistory } from 'vue-router'
import LauncherView from '../views/LauncherView.vue'
import DiceView from '../views/DiceView.vue'
import LimboView from '../views/LimboView.vue'

const routes = [
  {
    path: '/',
    name: 'launcher',
    component: LauncherView
  },
  {
    path: '/dice',
    name: 'dice',
    component: DiceView
  },
  {
    path: '/limbo',
    name: 'limbo',
    component: LimboView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
