import { createRouter, createWebHistory } from 'vue-router'
import LauncherView from '../views/LauncherView.vue'
import DiceView from '../views/DiceView.vue'
import LimboView from '../views/LimboView.vue'
import MinesView from '../views/MinesView.vue'

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
  },
  {
    path: '/mines',
    name: 'mines',
    component: MinesView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
