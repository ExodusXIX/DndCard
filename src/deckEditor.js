import { cardLibrary } from './cardLibrary.js'

let currentDeck = []
let selectedCard = null

export function initDeckEditor() {
  renderLibrary()
  renderDeck()
  setupSearch()
  renderSavedDecks()
}

function renderLibrary(filter = '') {
  const container = document.getElementById('library-cards')
  container.innerHTML = ''

  Object.values(cardLibrary).forEach(card => {
    if (filter && !card.name.toLowerCase().includes(filter.toLowerCase()) &&
        !card.type.toLowerCase().includes(filter.toLowerCase())) return

    const el = document.createElement('div')
    el.className = 'card-item'
    el.dataset.cardName = card.name
    el.innerHTML = `
      <span class="card-item-name">${card.name}</span>
      <span class="card-item-type ${card.type}">${card.type}</span>
      <span class="card-item-cost">Cost: ${card.cost}</span>
      <button class="zone-btn" style="margin-left:auto">+ Add</button>
    `
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return
      showEditorCardDetail(card.name)
    })
    el.querySelector('button').addEventListener('click', () => {
      currentDeck.push(card.name)
      renderDeck()
    })
    container.appendChild(el)
  })
}

function renderDeck() {
  const container = document.getElementById('deck-cards')
  container.innerHTML = ''

  currentDeck.forEach((cardName, index) => {
    const card = cardLibrary[cardName]
    const el = document.createElement('div')
    el.className = 'card-item'
    el.dataset.cardName = cardName
    el.innerHTML = `
      <span class="card-item-name">${card.name}</span>
      <span class="card-item-type ${card.type}">${card.type}</span>
      <span class="card-item-cost">Cost: ${card.cost}</span>
      <button class="remove-card-btn" onclick="removeFromDeck(${index})">✕</button>
    `
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return
      showEditorCardDetail(cardName)
    })
    container.appendChild(el)
  })
}

// ── EDITOR CARD DETAIL PIP ─────────────────────────────────

function showEditorCardDetail(cardName) {
  const card = cardLibrary[cardName]
  if (!card) return
  selectedCard = cardName

  document.getElementById('editor-detail-name').textContent = card.name
  document.getElementById('editor-detail-type').textContent = card.type.toUpperCase()
  document.getElementById('editor-detail-attack').textContent = card.attack
  document.getElementById('editor-detail-defense').textContent = card.defense
  document.getElementById('editor-detail-cost').textContent = card.cost

  // attribute
  const attrEl = document.getElementById('editor-detail-attribute')
  if (attrEl) {
    if (card.attribute) {
      attrEl.textContent = card.attribute.toUpperCase()
      attrEl.className = `card-detail-attribute attr-${card.attribute.toLowerCase()}`
      attrEl.style.display = 'inline-block'
    } else {
      attrEl.style.display = 'none'
    }
  }

  const effectEl = document.getElementById('editor-detail-effect')
  const effectBlock = document.getElementById('editor-detail-effect-block')
  if (card.effect) {
    effectEl.textContent = card.effect
    effectEl.style.display = 'block'
    effectBlock.style.display = 'flex'
  } else {
    effectEl.style.display = 'none'
    effectBlock.style.display = 'none'
  }

  document.getElementById('editor-card-detail').classList.remove('hidden')
}

window.closeEditorCardDetail = function() {
  document.getElementById('editor-card-detail').classList.add('hidden')
}

function setupSearch() {
  const searchBar = document.getElementById('card-search')
  if (searchBar) {
    searchBar.addEventListener('input', e => {
      renderLibrary(e.target.value)
    })
  }
}

function renderSavedDecks() {
  const container = document.getElementById('saved-decks-list')
  if (!container) return
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  const names = Object.keys(allDecks)

  container.innerHTML = names.length
    ? '<p class="setup-label" style="margin-top:16px">Saved Decks</p>'
    : ''

  names.forEach(name => {
    const el = document.createElement('div')
    el.className = 'card-item'
    el.innerHTML = `
      <span class="card-item-name">${name}</span>
      <span class="card-item-cost">${allDecks[name].length} cards</span>
      <button class="remove-card-btn" onclick="loadDeckForEdit('${name}')">Edit</button>
      <button class="remove-card-btn" onclick="deleteDeck('${name}')">✕</button>
    `
    container.appendChild(el)
  })
}

export function setupDeckDropzone() {
  const deckContainer = document.getElementById('deck-cards')
  deckContainer.addEventListener('dragover', e => e.preventDefault())
  deckContainer.addEventListener('drop', e => {
    e.preventDefault()
    const cardName = e.dataTransfer.getData('cardName')
    const source = e.dataTransfer.getData('source')
    if (source === 'library') {
      currentDeck.push(cardName)
      renderDeck()
    }
  })
}

window.removeFromDeck = function(index) {
  currentDeck.splice(index, 1)
  renderDeck()
}

window.saveDeck = function() {
  const deckName = document.getElementById('deck-name-input').value.trim()
  if (!deckName) {
    alert('Please name your deck first!')
    return
  }
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  allDecks[deckName] = currentDeck
  localStorage.setItem('savedDecks', JSON.stringify(allDecks))
  renderSavedDecks()
  alert(`Deck "${deckName}" saved!`)
}

window.loadDeckForEdit = function(name) {
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  currentDeck = [...allDecks[name]]
  document.getElementById('deck-name-input').value = name
  renderDeck()
}

window.deleteDeck = function(name) {
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  delete allDecks[name]
  localStorage.setItem('savedDecks', JSON.stringify(allDecks))
  renderSavedDecks()
}