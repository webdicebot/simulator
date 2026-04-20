import { useSimulator } from '../composables/useSimulator'

/**
 * diceStore - Isolated simulator instance for the Dice game.
 * Stats, history, balance, seeds are all independent from Limbo.
 */
export const diceStore = useSimulator()

// Lock this store to dice mode
diceStore.config.currentGame = 'dice'
