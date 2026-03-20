import { cardLibrary } from './cardLibrary.js'
import { broadcastCardMoved, broadcastDeckLoaded, broadcastCardDrawn } from './sync.js'
window.closeDeckPicker = function() {
  const el = document.getElementById('deck-picker')
  if (el) el.classList.add('hidden')
}
let isRemoteAction = false

export function setRemoteAction(val) {
  isRemoteAction = val
}

export const board = {
  playerA: {
    monster: [null, null, null],
    spell: [null, null, null],
    deck: [],
    hand: [],
    gallows: [],
    extraDeck: []
  },
  playerB: {
    monster: [null, null, null],
    spell: [null, null, null],
    deck: [],
    hand: [],
    gallows: [],
    extraDeck: []
  }
}

let localPlayer = 'a'
const loadedDeckNames = { a: '', b: '' }

export function setLocalPlayer(p) {
  localPlayer = p
}

// ── DRAG AND DROP ──────────────────────────────────────────

export function initDragAndDrop() {
  document.querySelectorAll('.droptarget').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault()
      zone.classList.add('drag-over')
    })
    zone.addEventListener('dragleave', e => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over')
      }
    })
    zone.addEventListener('drop', e => {
      e.preventDefault()
      zone.classList.remove('drag-over')
      const cardName = e.dataTransfer.getData('cardName')
      const fromZone = e.dataTransfer.getData('fromZone')
      const fromIndex = e.dataTransfer.getData('fromIndex')
      const fromPlayer = e.dataTransfer.getData('fromPlayer')
      const toZone = zone.dataset.zone
      const toPlayer = zone.dataset.player
      const toIndex = zone.dataset.index !== undefined ? parseInt(zone.dataset.index) : null
      if (!cardName || !toZone || !toPlayer) return
      moveCard(fromPlayer, fromZone, fromIndex, toPlayer, toZone, toIndex, cardName)
    })
  })
}

function moveCard(fromPlayer, fromZone, fromIndex, toPlayer, toZone, toIndex, cardName) {
  const src = board[`player${fromPlayer.toUpperCase()}`]
  const dst = board[`player${toPlayer.toUpperCase()}`]

  // remove from source
  if (fromZone === 'monster' || fromZone === 'spell') {
    src[fromZone][parseInt(fromIndex)] = null
  } else {
    const i = src[fromZone].indexOf(cardName)
    if (i !== -1) src[fromZone].splice(i, 1)
  }

  // place in destination
  if (toZone === 'monster' || toZone === 'spell') {
    if (toIndex !== null && dst[toZone][toIndex] === null) {
      if (fromZone === 'hand') {
        const canAfford = typeof window.canAffordCard === 'function'
          ? window.canAffordCard(toPlayer, cardName)
          : true
        if (canAfford) {
          dst[toZone][toIndex] = cardName
          if (typeof window.onCardPlayed === 'function') {
            window.onCardPlayed(toPlayer, cardName)
          }
        } else {
          src.hand.push(cardName)
          if (typeof window.onCardBlocked === 'function') {
            window.onCardBlocked(toPlayer, cardName)
          }
        }
      } else {
        dst[toZone][toIndex] = cardName
      }
    } else {
      src.hand.push(cardName)
    }
  } else {
    dst[toZone].push(cardName)
  }

  renderAll(fromPlayer)
  if (fromPlayer !== toPlayer) renderAll(toPlayer)
  updateAllCounts(fromPlayer)
  updateAllCounts(toPlayer)

  if (!isRemoteAction) {
    broadcastCardMoved({ fromPlayer, fromZone, fromIndex, toPlayer, toZone, toIndex, cardName })
  }
}

function renderAll(player) {
  renderHand(player)
  renderField(player)
  renderPile(player, 'gallows')
  renderPile(player, 'extraDeck')
}

// ── FIELD ──────────────────────────────────────────────────

export function renderField(player) {
  const pb = board[`player${player.toUpperCase()}`]
  ;['monster', 'spell'].forEach(zoneType => {
    pb[zoneType].forEach((cardName, i) => {
      const el = document.getElementById(`${player}-${zoneType}-${i}`)
      if (!el) return
      el.innerHTML = ''
      if (cardName) {
        const card = cardLibrary[cardName]
        const cardEl = document.createElement('div')
        cardEl.className = `field-card ${card.type}`
        cardEl.draggable = true
        cardEl.addEventListener('click', () => showCardDetail(cardName))
        cardEl.addEventListener('dragstart', e => {
          e.stopPropagation()
          e.dataTransfer.setData('cardName', cardName)
          e.dataTransfer.setData('fromZone', zoneType)
          e.dataTransfer.setData('fromIndex', String(i))
          e.dataTransfer.setData('fromPlayer', player)
        })

        const nameEl = document.createElement('div')
        nameEl.className = 'field-card-name'
        nameEl.textContent = card.name
        cardEl.appendChild(nameEl)

        // ATK/DEF only on monster zones
        if (zoneType === 'monster') {
          const statsEl = document.createElement('div')
          statsEl.className = 'field-card-stats'
          statsEl.textContent = `${card.attack} / ${card.defense}`
          cardEl.appendChild(statsEl)
        }

        el.appendChild(cardEl)
      } else {
        const label = document.createElement('span')
        label.className = 'zone-label'
        label.textContent = zoneType
        el.appendChild(label)
      }
    })
  })
}

// ── PILE ZONES (gallows, extraDeck) ────────────────────────

function renderPile(player, zone) {
  const pb = board[`player${player.toUpperCase()}`]
  const containerId = `${player}-${zone === 'extraDeck' ? 'extradeck' : zone}`
  const container = document.getElementById(containerId)
  if (!container) return
  container.querySelectorAll('.pile-card').forEach(el => el.remove())

  const cards = pb[zone]
  if (cards.length > 0) {
    const topCard = cardLibrary[cards[cards.length - 1]]
    const cardEl = document.createElement('div')
    cardEl.className = `pile-card field-card ${topCard.type}`
    cardEl.textContent = topCard.name
    cardEl.draggable = true
    cardEl.addEventListener('click', e => {
      e.stopPropagation()
      openPileViewer(player, zone)
    })
    cardEl.addEventListener('dragstart', e => {
      e.stopPropagation()
      const dragCardName = cards[cards.length - 1]
      e.dataTransfer.setData('cardName', dragCardName)
      e.dataTransfer.setData('fromZone', zone)
      e.dataTransfer.setData('fromIndex', '-1')
      e.dataTransfer.setData('fromPlayer', player)
    })
    container.appendChild(cardEl)
  }
}

// ── PILE VIEWER ────────────────────────────────────────────

function openPileViewer(player, zone) {
  const pb = board[`player${player.toUpperCase()}`]
  const cards = pb[zone]
  const title = document.getElementById('pile-viewer-title')
  const list = document.getElementById('pile-viewer-list')
  const zoneName = zone === 'extraDeck' ? 'Extra Deck' : 'Gallows'
  title.textContent = `${zoneName} — ${cards.length} cards`
  list.innerHTML = ''

  if (cards.length === 0) {
    list.innerHTML = '<p class="setup-label">Empty.</p>'
  } else {
    cards.forEach((cardName, index) => {
      const card = cardLibrary[cardName]
      const el = document.createElement('div')
      el.className = 'card-item'
      el.innerHTML = `
        <span class="card-item-name">${card.name}</span>
        <span class="card-item-type ${card.type}">${card.type}</span>
        <span class="card-item-cost">Cost: ${card.cost}</span>
        <button class="zone-btn" style="margin-left:auto">To Hand</button>
      `
      el.querySelector('button').addEventListener('click', () => {
        pb[zone].splice(index, 1)
        pb.hand.push(cardName)
        updateAllCounts(player)
        renderAll(player)
        openPileViewer(player, zone)
      })
      el.querySelector('.card-item-name').addEventListener('click', () => showCardDetail(cardName))
      list.appendChild(el)
    })
  }

  document.getElementById('pile-viewer').classList.remove('hidden')
}

window.closePileViewer = function() {
  document.getElementById('pile-viewer').classList.add('hidden')
}

window.openPileViewerGlobal = function(player, zone) {
  openPileViewer(player, zone)
}

// ── HAND ──────────────────────────────────────────────────

export function renderHand(player) {
  const pb = board[`player${player.toUpperCase()}`]
  const container = document.getElementById(`${player}-hand`)
  if (!container) return
  container.innerHTML = ''

  pb.hand.forEach((cardName) => {
    const card = cardLibrary[cardName]
    const el = document.createElement('div')

    if (player === localPlayer) {
      el.className = 'hand-card'
      el.textContent = card.name
      el.draggable = true
      el.addEventListener('click', () => showCardDetail(cardName))
      el.addEventListener('dragstart', e => {
        e.stopPropagation()
        e.dataTransfer.setData('cardName', cardName)
        e.dataTransfer.setData('fromZone', 'hand')
        e.dataTransfer.setData('fromIndex', '-1')
        e.dataTransfer.setData('fromPlayer', player)
      })
    } else {
      el.className = 'hand-card face-down'
    }

    container.appendChild(el)
  })
}

// ── DECK ──────────────────────────────────────────────────

export function loadDeckToBoard(player, deckName) {
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  if (!allDecks[deckName]) return
  board[`player${player.toUpperCase()}`].deck = [...allDecks[deckName]]
  loadedDeckNames[player] = deckName
  updateAllCounts(player)
  closeDeckPicker()
  if (!isRemoteAction) {
    broadcastDeckLoaded(player, deckName)
  }
}

export function drawCard(player) {
  const pb = board[`player${player.toUpperCase()}`]
  if (pb.deck.length === 0) return
  const card = pb.deck.shift()
  pb.hand.push(card)
  updateAllCounts(player)
  renderHand(player)
  // only broadcast if local action — prevents infinite loop
  if (!isRemoteAction) {
    broadcastCardDrawn(player)
  }
}

export function shuffleDeck(player) {
  const pb = board[`player${player.toUpperCase()}`]
  for (let i = pb.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pb.deck[i], pb.deck[j]] = [pb.deck[j], pb.deck[i]]
  }
  updateAllCounts(player)
}

export function resetField(player) {
  const pb = board[`player${player.toUpperCase()}`]
  ;['monster', 'spell'].forEach(zone => {
    pb[zone].forEach((cardName, i) => {
      if (cardName) {
        pb.gallows.push(cardName)
        pb[zone][i] = null
      }
    })
  })
  renderAll(player)
  updateAllCounts(player)
}

function updateAllCounts(player) {
  if (!player) return
  const pb = board[`player${player.toUpperCase()}`]
  const zones = ['deck', 'gallows', 'extraDeck']
  const idMap = { deck: 'deck', gallows: 'gallows', extraDeck: 'extradeck' }
  zones.forEach(zone => {
    const el = document.getElementById(`${player}-${idMap[zone]}-count`)
    if (el) el.textContent = pb[zone].length
  })
}

// ── DECK VIEWER ────────────────────────────────────────────

window.viewDeck = function(player) {
  const pb = board[`player${player.toUpperCase()}`]
  const list = document.getElementById('deck-viewer-list')
  const title = document.getElementById('deck-viewer-title')
  const deckName = loadedDeckNames[player] || `${player.toUpperCase()} Deck`
  title.textContent = `${deckName} — ${pb.deck.length} cards`
  list.innerHTML = ''

  if (pb.deck.length === 0) {
    list.innerHTML = '<p class="setup-label">No cards in deck.</p>'
  } else {
    pb.deck.forEach(cardName => {
      const card = cardLibrary[cardName]
      const el = document.createElement('div')
      el.className = 'card-item'
      el.innerHTML = `
        <span class="card-item-name">${card.name}</span>
        <span class="card-item-type ${card.type}">${card.type}</span>
        <span class="card-item-cost">Cost: ${card.cost}</span>
      `
      el.addEventListener('click', () => showCardDetail(cardName))
      list.appendChild(el)
    })
  }

  document.getElementById('deck-viewer').classList.remove('hidden')
}

window.closeDeckViewer = function() {
  document.getElementById('deck-viewer').classList.add('hidden')
}

// ── DECK PICKER ────────────────────────────────────────────

let deckPickerPlayer = 'a'

export function showDeckPicker(player) {
  deckPickerPlayer = player
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  const names = Object.keys(allDecks)
  const list = document.getElementById('deck-picker-list')
  list.innerHTML = ''

  if (names.length === 0) {
    list.innerHTML = '<p class="setup-label">No saved decks found.</p>'
  } else {
    names.forEach(name => {
      const btn = document.createElement('button')
      btn.className = 'menu-btn'
      btn.style.marginBottom = '8px'
      btn.textContent = name
      btn.onclick = () => loadDeckToBoard(player, name)
      list.appendChild(btn)
    })
  }

  document.getElementById('deck-picker').classList.remove('hidden')
}

// ── CARD DETAIL ────────────────────────────────────────────
export function showCardDetail(cardName) {
  const card = cardLibrary[cardName]
  if (!card) return
  document.getElementById('detail-name').textContent = card.name
  document.getElementById('detail-type').textContent = card.type.toUpperCase()
  document.getElementById('detail-attack').textContent = card.attack
  document.getElementById('detail-defense').textContent = card.defense
  document.getElementById('detail-cost').textContent = card.cost

  const effectEl = document.getElementById('detail-effect')
  const effectBlock = document.getElementById('detail-effect-block')
  if (card.effect) {
    effectEl.textContent = card.effect
    effectEl.style.display = 'block'
    effectBlock.style.display = 'flex'
  } else {
    effectEl.style.display = 'none'
    effectBlock.style.display = 'none'
  }

  document.getElementById('card-detail').classList.remove('hidden')
}

window.closeCardDetail = function() {
  document.getElementById('card-detail').classList.add('hidden')
}

window.closeDeckPicker = function() {
  document.getElementById('deck-picker').classList.add('hidden')
}

window.onDeckClick = function(player) {
  const pb = board[`player${player.toUpperCase()}`]
  if (pb.deck.length === 0) {
    showDeckPicker(player)
  } else {
    drawCard(player)
  }
}