import { useSimulator } from '../composables/useSimulator'

/**
 * limboStore - Isolated simulator instance for the Limbo game.
 * Stats, history, balance, seeds are all independent from Dice.
 */
export const limboStore = useSimulator()

// Lock this store to limbo mode
limboStore.config.currentGame = 'limbo'
