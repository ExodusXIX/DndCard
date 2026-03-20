import './style.css'
import { initDeckEditor, setupDeckDropzone } from './deckEditor.js'
import { playerA, playerB, rollBank, spendFromBank, getRemainingBank, cardLibrary, gameState } from './game.js'
import { setLocalPlayer, showCardDetail, initDragAndDrop, showDeckPicker, shuffleDeck, resetField, loadDeckToBoard, drawCard, renderHand, renderField, board, setRemoteAction } from './board.js'
import { joinGame, broadcastBankRolled, broadcastHpChanged, broadcastCardDrawn, broadcastDeckLoaded, broadcastFieldReset, broadcastPlayerJoined, broadcastRequestNames,broadcastFlip } from './sync.js'

let localPlayer = 'a'
window.broadcastFlip = broadcastFlip
window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(screenId).classList.add('active')
  if (screenId === 'board') {
    initDragAndDrop()
  }
}

window.enterGame = async function() {
  const player = document.getElementById('player-select').value
  const name = document.getElementById('player-name').value || `Player ${player.toUpperCase()}`
  const roomCode = document.getElementById('room-code').value.trim() || 'default'
  localPlayer = player
  localStorage.setItem(`${player}_name`, name)
  localStorage.setItem('currentPlayer', player)
  setLocalPlayer(player)

  document.getElementById(`${player}-name`).textContent = name
  const bankLabel = document.getElementById(`${player}-bank-label`)
  if (bankLabel) bankLabel.textContent = name

  const boardEl = document.getElementById('board')
  if (player === 'b') {
    boardEl.classList.add('perspective-b')
  } else {
    boardEl.classList.remove('perspective-b')
  }

  await joinGame(roomCode)
  broadcastPlayerJoined(player, name)
  broadcastRequestNames()

  showScreen('board')
}

window.changeHp = function(player, amount) {
  const hpEl = document.getElementById(`${player}-hp-value`)
  let current = parseInt(hpEl.textContent)
  const newVal = current + amount
  hpEl.textContent = newVal
  broadcastHpChanged(player, newVal)
}

window.showCardDetail = showCardDetail

// ── BANK ──────────────────────────────────────────────────

window.triggerRollBank = function() {
  const rolled = rollBank()
  // rollBank() already resets bankSpent on both players
  document.getElementById('bank-value').textContent = rolled
  ;['a', 'b'].forEach(p => {
    const remainEl = document.getElementById(`${p}-bank-remaining`)
    const statusEl = document.getElementById(`${p}-bank-status`)
    if (remainEl) remainEl.textContent = rolled
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = '' }
  })
  const orb = document.getElementById('bank-orb')
  if (orb) {
    orb.classList.add('orb-roll')
    setTimeout(() => orb.classList.remove('orb-roll'), 600)
  }
  broadcastBankRolled(rolled)
}

window.onCardPlayed = function(player, cardName) {
  const card = cardLibrary[cardName]
  const target = player === 'a' ? playerA : playerB
  const success = spendFromBank(target, card.cost)
  const statusEl = document.getElementById(`${player}-bank-status`)
  const remainEl = document.getElementById(`${player}-bank-remaining`)
  if (statusEl && remainEl) {
    if (success) {
      remainEl.textContent = getRemainingBank(target)
      statusEl.textContent = `✓ ${card.name} summoned`
      statusEl.style.color = '#70c070'
    } else {
      statusEl.textContent = `✗ ${card.name} too expensive`
      statusEl.style.color = '#e07070'
    }
  }
}

window.canAffordCard = function(player, cardName) {
  const card = cardLibrary[cardName]
  const target = player === 'a' ? playerA : playerB
  return card.cost <= getRemainingBank(target)
}

window.onCardBlocked = function(player, cardName) {
  const card = cardLibrary[cardName]
  const statusEl = document.getElementById(`${player}-bank-status`)
  if (statusEl) {
    statusEl.textContent = `✗ ${card.name} too expensive`
    statusEl.style.color = '#e07070'
  }
}

// ── DECK / SHUFFLE / RESET ────────────────────────────────

window.chooseDeck = function(player) {
  showDeckPicker(player)
}

window.triggerShuffle = function(player) {
  shuffleDeck(player)
  const statusEl = document.getElementById(`${player}-bank-status`)
  if (statusEl) {
    statusEl.textContent = '✓ Deck shuffled'
    statusEl.style.color = '#7090e0'
    setTimeout(() => { statusEl.textContent = '' }, 1500)
  }
}

window.triggerResetField = function() {
  setRemoteAction(true)
  resetField('a')
  resetField('b')
  setRemoteAction(false)
  broadcastFieldReset()
}

// ── REALTIME RECEIVERS ────────────────────────────────────

window.onRemotePlayerJoined = function({ player, name }) {
  document.getElementById(`${player}-name`).textContent = name
  const bankLabel = document.getElementById(`${player}-bank-label`)
  if (bankLabel) bankLabel.textContent = name
}

// ── key fix: sync gameState.bank on the remote device so canAffordCard works
window.onRemoteBankRolled = function({ value }) {
  gameState.bank = value
  playerA.bankSpent = 0
  playerB.bankSpent = 0
  document.getElementById('bank-value').textContent = value
  ;['a', 'b'].forEach(p => {
    const remainEl = document.getElementById(`${p}-bank-remaining`)
    const statusEl = document.getElementById(`${p}-bank-status`)
    if (remainEl) remainEl.textContent = value
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = '' }
  })
  const orb = document.getElementById('bank-orb')
  if (orb) {
    orb.classList.add('orb-roll')
    setTimeout(() => orb.classList.remove('orb-roll'), 600)
  }
}

window.onRemoteHpChanged = function({ player, value }) {
  const hpEl = document.getElementById(`${player}-hp-value`)
  if (hpEl) hpEl.textContent = value
}

window.onRemoteCardDrawn = function({ player }) {
  setRemoteAction(true)
  drawCard(player)
  setRemoteAction(false)
}

window.onRemoteDeckLoaded = function({ player, deckName }) {
  setRemoteAction(true)
  loadDeckToBoard(player, deckName)
  setRemoteAction(false)
}

window.onRemoteFieldReset = function() {
  setRemoteAction(true)
  resetField('a')
  resetField('b')
  setRemoteAction(false)
}
window.onRemoteCardFlipped = function({ player, zoneType, index, faceUp }) {
  const pb = board[`player${player.toUpperCase()}`]
  pb.faceState[`${zoneType}-${index}`] = faceUp
  renderField(player)
}
window.onRemoteCardMoved = function({ fromPlayer, fromZone, fromIndex, toPlayer, toZone, toIndex, cardName }) {
  setRemoteAction(true)

  const src = board[`player${fromPlayer.toUpperCase()}`]
  const dst = board[`player${toPlayer.toUpperCase()}`]

  if (fromZone === 'monster' || fromZone === 'spell') {
    src[fromZone][parseInt(fromIndex)] = null
  } else {
    const i = src[fromZone].indexOf(cardName)
    if (i !== -1) src[fromZone].splice(i, 1)
  }

  if (toZone === 'monster' || toZone === 'spell') {
    if (toIndex !== null && dst[toZone][toIndex] === null) {
      dst[toZone][toIndex] = cardName
    }
  } else {
    dst[toZone].push(cardName)
  }

  renderHand(fromPlayer)
  renderHand(toPlayer)
  renderField(fromPlayer)
  renderField(toPlayer)

  setRemoteAction(false)
}

initDeckEditor()
setupDeckDropzone()