import { diceStore } from '@/store/diceStore.js'
import { limboStore } from '@/store/limboStore.js'

/**
 * Unified bet function — routes to the correct game engine.
 *
 * @param {number} amount            - Wager amount
 * @param {number} target            - Roll threshold (Dice: 0–99) | target multiplier (Limbo: >= 1.01)
 * @param {'dice'|'limbo'} game      - Which game to simulate
 * @param {'over'|'under'} [side]    - Dice only: 'over' or 'under'. Omit to keep current store value.
 * @returns {Promise<object>}        - Bet result from the corresponding store
 *
 * Examples:
 *   placeBetUnified(1, 49.5, 'dice', 'over')   // roll > 49.5
 *   placeBetUnified(1, 49.5, 'dice', 'under')  // roll < 49.5
 *   placeBetUnified(1, 49.5, 'dice')           // use current side
 *   placeBetUnified(1, 2.0,  'limbo')          // limbo 2x multiplier
 *
 * Notes:
 *   - Each game has its own independent balance, stats, and history.
 *   - Limbo ignores the `side` parameter entirely.
 */
export async function placeBetUnified(amount, target, game, side) {
  if (game === 'dice') {
    const store = diceStore
    store.bet.amount = Number(amount)
    store.bet.target = Number(target)
    if (side === 'over' || side === 'under') {
      store.bet.side = side
    }
    return await store.placeBet()
  }

  if (game === 'limbo') {
    const store = limboStore
    store.bet.amount = Number(amount)
    store.bet.limboTarget = Number(target)
    return await store.placeBet()
  }

  return { error: `Unknown game: "${game}". Use "dice" or "limbo".` }
}
