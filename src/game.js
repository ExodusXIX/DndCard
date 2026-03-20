import { cardLibrary } from './cardLibrary.js'

let gameState = {
  bank: 0,
}

export const playerA = {
  bankSpent: 0,
}

export const playerB = {
  bankSpent: 0,
}

export function rollBank() {
  gameState.bank = Math.floor(Math.random() * 6) + 1
  playerA.bankSpent = 0
  playerB.bankSpent = 0
  return gameState.bank
}

export function getRemainingBank(player) {
  return gameState.bank - player.bankSpent
}

export function spendFromBank(player, cost) {
  if (cost <= getRemainingBank(player)) {
    player.bankSpent += cost
    return true
  }
  return false
}

export { cardLibrary, gameState }