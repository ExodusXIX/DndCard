import './style.css'
import { initDeckEditor, setupDeckDropzone } from './deckEditor.js'
import { playerA, playerB, rollBank, spendFromBank, getRemainingBank, cardLibrary, gameState } from './game.js'
import { setLocalPlayer, showCardDetail, initDragAndDrop, showDeckPicker, shuffleDeck, resetField, loadDeckToBoard, drawCard, renderHand, renderField, renderPile, board, setRemoteAction, addTokenToHand, registerToken, resetBoard } from './board.js'
import { joinGame, leaveGame, broadcastBankRolled, broadcastHpChanged, broadcastCardDrawn, broadcastDeckLoaded, broadcastFieldReset, broadcastPlayerJoined, broadcastRequestNames, broadcastFlip } from './sync.js'

let localPlayer = 'a'
let dragDropInitialized = false

window.broadcastFlip = broadcastFlip

window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(screenId).classList.add('active')

  if (screenId === 'board' && !dragDropInitialized) {
    initDragAndDrop()
    dragDropInitialized = true
  }

  if (screenId === 'home') {
    leaveGame()
    resetBoard()
    dragDropInitialized = false
    ;['a', 'b'].forEach(p => {
      const hp = document.getElementById(`${p}-hp-value`)
      if (hp) hp.textContent = '10'
      const remain = document.getElementById(`${p}-bank-remaining`)
      if (remain) remain.textContent = '—'
      const status = document.getElementById(`${p}-bank-status`)
      if (status) status.textContent = ''
    })
    const bankVal = document.getElementById('bank-value')
    if (bankVal) bankVal.textContent = '—'
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

// ── TOKEN ──────────────────────────────────────────────────

window.addToken = function(player) {
  addTokenToHand(player)
}

window.broadcastTokenCreate = function(tokenId, tokenData, player) {
  import('./sync.js').then(m => m.broadcastTokenCreate(tokenId, tokenData, player))
}

window.broadcastTokenUpdate = function(tokenId, tokenData) {
  import('./sync.js').then(m => m.broadcastTokenUpdate(tokenId, tokenData))
}

window.onRemoteTokenCreate = function({ tokenId, tokenData, player }) {
  setRemoteAction(true)
  registerToken(tokenId, tokenData)
  const pb = board[`player${player.toUpperCase()}`]
  pb.hand.push(tokenId)
  renderHand(player)
  setRemoteAction(false)
}

window.onRemoteTokenUpdate = function({ tokenId, tokenData }) {
  registerToken(tokenId, tokenData)
  renderField('a')
  renderField('b')
  renderHand('a')
  renderHand('b')
}

// ── BANK ──────────────────────────────────────────────────

window.triggerRollBank = function() {
  const rolled = rollBank()
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
  if (!card) return
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
  if (!card) return true
  const target = player === 'a' ? playerA : playerB
  return card.cost <= getRemainingBank(target)
}

window.onCardBlocked = function(player, cardName) {
  const card = cardLibrary[cardName]
  if (!card) return
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
  if (!confirm('Reset the field? All cards will be sent to the Gallows.')) return
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

window.onRemoteCardMoved = function({ fromPlayer, fromZone, fromIndex, toPlayer, toZone, toIndex, cardName, tokenData, faceUp }) {
  setRemoteAction(true)

  if (tokenData) {
    registerToken(cardName, tokenData)
  }

  const src = board[`player${fromPlayer.toUpperCase()}`]
  const dst = board[`player${toPlayer.toUpperCase()}`]

  if (fromZone === 'monster' || fromZone === 'spell') {
    src[fromZone][parseInt(fromIndex)] = null
    delete src.faceState[`${fromZone}-${fromIndex}`]
  } else {
    const i = src[fromZone].indexOf(cardName)
    if (i !== -1) src[fromZone].splice(i, 1)
  }

  if (toZone === 'monster' || toZone === 'spell') {
    if (toIndex !== null && dst[toZone][toIndex] === null) {
      dst[toZone][toIndex] = cardName
      if (faceUp !== undefined) {
        dst.faceState[`${toZone}-${toIndex}`] = faceUp
      }
    }
  } else {
    dst[toZone].push(cardName)
  }

  // render everything so counts, piles, hands and fields all update
  renderHand(fromPlayer)
  renderHand(toPlayer)
  renderField(fromPlayer)
  renderField(toPlayer)
  renderPile(fromPlayer, 'gallows')
  renderPile(fromPlayer, 'extraDeck')
  renderPile(toPlayer, 'gallows')
  renderPile(toPlayer, 'extraDeck')

  // update counts manually since we skipped moveCard
  const updateCounts = (p) => {
    const pb = board[`player${p.toUpperCase()}`]
    const idMap = { deck: 'deck', gallows: 'gallows', extraDeck: 'extradeck' }
    ;['deck', 'gallows', 'extraDeck'].forEach(zone => {
      const el = document.getElementById(`${p}-${idMap[zone]}-count`)
      if (el) el.textContent = pb[zone].length
    })
  }
  updateCounts(fromPlayer)
  updateCounts(toPlayer)

  setRemoteAction(false)
}

// ── PATCH NOTES ───────────────────────────────────────────

async function loadPatchNotes() {
  const list = document.getElementById('patch-notes-list')
  if (!list) return
  try {
    const res = await fetch('https://api.github.com/repos/exodusxix/DndCard/commits?per_page=20')
    if (!res.ok) throw new Error('Failed to fetch')
    const commits = await res.json()
    list.innerHTML = ''
    commits.forEach(commit => {
      const msg = commit.commit.message.split('\n')[0]
      const author = commit.commit.author.name
      const date = new Date(commit.commit.author.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
      const el = document.createElement('div')
      el.className = 'patch-note-item'
      el.innerHTML = `
        <span class="patch-note-msg">${msg}</span>
        <span class="patch-note-meta">${author} · ${date}</span>
      `
      list.appendChild(el)
    })
  } catch (e) {
    list.innerHTML = '<p class="patch-notes-loading">Could not load patch notes.</p>'
  }
}
// ── VICTOR ────────────────────────────────────────────────
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1484709551013101720/rsNpjbtvZnwqbe_9aZNnBTd0sBjANK2g9Ou5L4H1j0kITV8hyMaA3lhx4Bb8MOAFGOw2'

window.openVictorPopup = function() {
  // populate buttons with current player names
  const nameA = document.getElementById('a-name').textContent
  const nameB = document.getElementById('b-name').textContent
  document.getElementById('victor-btn-a').textContent = `🏆 ${nameA}`
  document.getElementById('victor-btn-b').textContent = `🏆 ${nameB}`
  document.getElementById('victor-popup').classList.remove('hidden')
}

window.declareVictor = async function(player) {
  const name = document.getElementById(`${player}-name`).textContent
  document.getElementById('victor-popup').classList.add('hidden')

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⚔️ **${name}** has won the duel!`
      })
    })
  } catch (e) {
    console.error('Failed to post to Discord:', e)
  }
}

loadPatchNotes()

initDeckEditor()
setupDeckDropzone()