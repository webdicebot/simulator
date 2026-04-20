/**
 * @deprecated simulatorStore is no longer used.
 * Each game now has its own isolated store instance:
 *   - Dice  → import { diceStore }  from '@/store/diceStore.js'
 *   - Limbo → import { limboStore } from '@/store/limboStore.js'
 *
 * This file is kept only for backward-compat; do NOT import it in new code.
 */
import { useSimulator } from '../composables/useSimulator'
export const simulatorStore = useSimulator()
