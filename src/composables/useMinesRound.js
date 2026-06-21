import { reactive } from 'vue'
import { calcMinesMultiplier, generateMines } from '@/utils/diceEngine.js'

export function useMinesRound(simulator) {
  const { config, bet, isRolling, recordExternalResult } = simulator
  const randomizeClientSeed = simulator.randomizeClientSeed
  const randomizeServerSeed = simulator.randomizeServerSeed
  const minesRound = reactive({
    active: false,
    wager: 0,
    mines: [],
    openedPicks: [],
    multiplier: 1,
    nonce: 0,
    bombCount: 3,
    houseEdge: 1,
    clientSeed: '',
    serverSeed: '',
  })

  function startMinesRound() {
    if (minesRound.active) return { error: 'A Mines round is already active' }
    if (!Number.isFinite(bet.amount) || bet.amount <= 0) return { error: 'Amount must be > 0' }
    if (config.balance < bet.amount) return { error: 'Insufficient balance' }
    if (!Number.isInteger(bet.minesTarget) || bet.minesTarget < 1 || bet.minesTarget > 23) {
      return { error: 'Mines must be an integer from 1 to 23' }
    }

    config.nonce += 1
    config.balance -= bet.amount
    bet.minesPicks = []
    Object.assign(minesRound, {
      active: true,
      wager: bet.amount,
      mines: generateMines(config.serverSeed, config.clientSeed, config.nonce, bet.minesTarget),
      openedPicks: [],
      multiplier: 1,
      nonce: config.nonce,
      bombCount: bet.minesTarget,
      houseEdge: config.houseEdge,
      clientSeed: config.clientSeed,
      serverSeed: config.serverSeed,
    })
    return { active: true, nonce: minesRound.nonce, balance: config.balance }
  }

  function openMinesTile(tile) {
    if (!minesRound.active) return { error: 'Start a Mines round first' }
    const position = Number(tile)
    if (!Number.isInteger(position) || position < 0 || position > 23) {
      return { error: 'Tile number must be from 0 to 23' }
    }
    if (minesRound.openedPicks.includes(position)) return { error: 'Tile is already open' }

    if (minesRound.mines.includes(position)) {
      minesRound.openedPicks.push(position)
      return finishMinesRound(false)
    }

    minesRound.openedPicks.push(position)
    minesRound.openedPicks.sort((a, b) => a - b)
    bet.minesPicks = [...minesRound.openedPicks]
    minesRound.multiplier = calcMinesMultiplier(
      minesRound.bombCount,
      minesRound.openedPicks.length,
      minesRound.houseEdge,
    )

    if (minesRound.openedPicks.length === 24 - minesRound.bombCount) {
      return cashoutMinesRound()
    }

    return {
      active: true,
      tile: position,
      multiplier: minesRound.multiplier,
      payout: minesRound.wager * minesRound.multiplier,
    }
  }

  function cashoutMinesRound() {
    if (!minesRound.active) return { error: 'No active Mines round' }
    if (minesRound.openedPicks.length === 0) return { error: 'Open at least one tile before cashout' }
    return finishMinesRound(true)
  }

  function finishMinesRound(win) {
    const payout = win ? minesRound.wager * minesRound.multiplier : 0
    const profit = payout - minesRound.wager
    config.balance += payout
    bet.minesPicks = [...minesRound.openedPicks]

    const result = {
      game: 'mines',
      nonce: minesRound.nonce,
      resultNumber: null,
      resultMultiplier: null,
      target: [...minesRound.openedPicks],
      side: null,
      minesTarget: minesRound.bombCount,
      minesPicks: [...minesRound.openedPicks],
      picks: [...minesRound.openedPicks],
      mines: [...minesRound.mines],
      win,
      profit,
      balance: config.balance,
      multiplier: win ? minesRound.multiplier : 0,
      amount: minesRound.wager,
      clientSeed: minesRound.clientSeed,
      serverSeed: minesRound.serverSeed,
    }

    minesRound.active = false
    isRolling.value = false
    return recordExternalResult(result)
  }

  function rotateMinesClientSeed() {
    if (minesRound.active) return { error: 'Cannot rotate seed during an active round' }
    return randomizeClientSeed()
  }

  function rotateMinesServerSeed() {
    if (minesRound.active) return { error: 'Cannot rotate seed during an active round' }
    return randomizeServerSeed()
  }

  return {
    minesRound,
    startMinesRound,
    openMinesTile,
    cashoutMinesRound,
    randomizeClientSeed: rotateMinesClientSeed,
    randomizeServerSeed: rotateMinesServerSeed,
  }
}
