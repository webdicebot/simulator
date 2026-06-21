import { diceStore } from '@/store/diceStore.js'
import { limboStore } from '@/store/limboStore.js'
import { minesStore } from '@/store/minesStore.js'
import { kenoStore } from '@/store/kenoStore.js'

/**
 * Unified bet function — routes to the correct game engine.
 *
 * @param {number} amount            - Wager amount
 * @param {number} target            - Roll threshold (Dice: 0–99) | target multiplier (Limbo: >= 1.01)
 * @param {'dice'|'limbo'|'mines'} game - Which game to simulate
 * @param {'over'|'under'|number[]} [sideOrPicks] - Dice side or Mines tile indexes.
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
export async function placeBetUnified(amount, target, game, sideOrPicks) {
  if (game === 'dice') {
    const store = diceStore
    store.bet.amount = Number(amount)
    store.bet.target = Number(target)
    if (sideOrPicks === 'over' || sideOrPicks === 'under') {
      store.bet.side = sideOrPicks
    }
    return await store.placeBet()
  }

  if (game === 'limbo') {
    const store = limboStore
    store.bet.amount = Number(amount)
    store.bet.limboTarget = Number(target)
    return await store.placeBet()
  }

  if (game === 'mines') {
    const store = minesStore
    if (store.minesRound.active) return { error: 'Finish the active Mines round first' }
    store.bet.amount = Number(amount)
    store.bet.minesTarget = Number(target)
    if (Array.isArray(sideOrPicks)) store.bet.minesPicks = sideOrPicks.map(Number)
    return await store.placeBet()
  }

  if (game === 'keno') {
    const store = kenoStore
    store.bet.amount = Number(amount)
    store.bet.kenoRisk = String(target || 'classic').toLowerCase()
    if (Array.isArray(sideOrPicks)) store.bet.kenoNumbers = sideOrPicks.map(Number)
    return await store.placeBet()
  }

  return { error: `Unknown game: "${game}". Use "dice", "limbo", "mines", or "keno".` }
}
