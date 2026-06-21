import { useSimulator } from '../composables/useSimulator'
import { useMinesRound } from '../composables/useMinesRound'

export const minesStore = useSimulator()
minesStore.config.currentGame = 'mines'
Object.assign(minesStore, useMinesRound(minesStore))
