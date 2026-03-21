import { cardLibrary } from './cardLibrary.js'

let currentDeck = []
let currentExtraDeck = []
let selectedCard = null

export function initDeckEditor() {
  renderLibrary()
  renderDeck()
  renderExtraDeck()
  setupSearch()
  renderSavedDecks()
}

function renderLibrary(filter = '') {
  const container = document.getElementById('library-cards')
  container.innerHTML = ''

  Object.values(cardLibrary).forEach(card => {
    if (filter && !card.name.toLowerCase().includes(filter.toLowerCase()) &&
        !card.type.toLowerCase().includes(filter.toLowerCase()) &&
        !(card.attribute || '').toLowerCase().includes(filter.toLowerCase())) return

    const attrHtml = card.attribute
      ? `<span class="card-item-attr attr-${card.attribute.toLowerCase()}">${card.attribute}</span>`
      : ''

    const el = document.createElement('div')
    el.className = 'card-item'
    el.dataset.cardName = card.name
    el.innerHTML = `
      <div class="card-item-info">
        <span class="card-item-name">${card.name}</span>
        <div class="card-item-meta">
          <span class="card-item-type ${card.type}">${card.type}</span>
          ${attrHtml}
          <span class="card-item-cost">Cost: ${card.cost}</span>
        </div>
      </div>
      <button class="zone-btn add-main-btn" style="margin-left:auto;white-space:nowrap">+ Main</button>
      <button class="zone-btn add-extra-btn" style="margin-left:4px;white-space:nowrap">+ Extra</button>
    `
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return
      showEditorCardDetail(card.name)
    })
    el.querySelector('.add-main-btn').addEventListener('click', () => {
      currentDeck.push(card.name)
      renderDeck()
    })
    el.querySelector('.add-extra-btn').addEventListener('click', () => {
      currentExtraDeck.push(card.name)
      renderExtraDeck()
    })
    container.appendChild(el)
  })
}

function renderDeck() {
  const container = document.getElementById('deck-cards')
  container.innerHTML = ''

  currentDeck.forEach((cardName, index) => {
    const card = cardLibrary[cardName]
    const attrHtml = card.attribute
      ? `<span class="card-item-attr attr-${card.attribute.toLowerCase()}">${card.attribute}</span>`
      : ''
    const el = document.createElement('div')
    el.className = 'card-item'
    el.dataset.cardName = cardName
    el.innerHTML = `
      <div class="card-item-info">
        <span class="card-item-name">${card.name}</span>
        <div class="card-item-meta">
          <span class="card-item-type ${card.type}">${card.type}</span>
          ${attrHtml}
          <span class="card-item-cost">Cost: ${card.cost}</span>
        </div>
      </div>
      <button class="remove-card-btn" onclick="removeFromDeck(${index})">✕</button>
    `
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return
      showEditorCardDetail(cardName)
    })
    container.appendChild(el)
  })

  const label = document.getElementById('main-deck-count')
  if (label) label.textContent = `(${currentDeck.length})`
}

function renderExtraDeck() {
  const container = document.getElementById('extra-deck-cards')
  if (!container) return
  container.innerHTML = ''

  currentExtraDeck.forEach((cardName, index) => {
    const card = cardLibrary[cardName]
    const attrHtml = card.attribute
      ? `<span class="card-item-attr attr-${card.attribute.toLowerCase()}">${card.attribute}</span>`
      : ''
    const el = document.createElement('div')
    el.className = 'card-item'
    el.dataset.cardName = cardName
    el.innerHTML = `
      <div class="card-item-info">
        <span class="card-item-name">${card.name}</span>
        <div class="card-item-meta">
          <span class="card-item-type ${card.type}">${card.type}</span>
          ${attrHtml}
          <span class="card-item-cost">Cost: ${card.cost}</span>
        </div>
      </div>
      <button class="remove-card-btn" onclick="removeFromExtraDeck(${index})">✕</button>
    `
    el.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return
      showEditorCardDetail(cardName)
    })
    container.appendChild(el)
  })

  const label = document.getElementById('extra-deck-count')
  if (label) label.textContent = `(${currentExtraDeck.length})`
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
    const saved = allDecks[name]
    const mainCount = Array.isArray(saved) ? saved.length : (saved.main || []).length
    const extraCount = Array.isArray(saved) ? 0 : (saved.extra || []).length
    const el = document.createElement('div')
    el.className = 'card-item'
    el.innerHTML = `
      <span class="card-item-name">${name}</span>
      <span class="card-item-cost">${mainCount} main · ${extraCount} extra</span>
      <button class="remove-card-btn" onclick="loadDeckForEdit('${name}')">Edit</button>
      <button class="remove-card-btn" onclick="deleteDeck('${name}')">✕</button>
    `
    container.appendChild(el)
  })
}

export function setupDeckDropzone() {
  const deckContainer = document.getElementById('deck-cards')
  if (deckContainer) {
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

  const extraContainer = document.getElementById('extra-deck-cards')
  if (extraContainer) {
    extraContainer.addEventListener('dragover', e => e.preventDefault())
    extraContainer.addEventListener('drop', e => {
      e.preventDefault()
      const cardName = e.dataTransfer.getData('cardName')
      const source = e.dataTransfer.getData('source')
      if (source === 'library') {
        currentExtraDeck.push(cardName)
        renderExtraDeck()
      }
    })
  }
}

window.removeFromDeck = function(index) {
  currentDeck.splice(index, 1)
  renderDeck()
}

window.removeFromExtraDeck = function(index) {
  currentExtraDeck.splice(index, 1)
  renderExtraDeck()
}

window.saveDeck = function() {
  const deckName = document.getElementById('deck-name-input').value.trim()
  if (!deckName) {
    alert('Please name your deck first!')
    return
  }
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  allDecks[deckName] = { main: currentDeck, extra: currentExtraDeck }
  localStorage.setItem('savedDecks', JSON.stringify(allDecks))
  renderSavedDecks()
  alert(`Deck "${deckName}" saved!`)
}

window.loadDeckForEdit = function(name) {
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  const saved = allDecks[name]
  if (Array.isArray(saved)) {
    currentDeck = [...saved]
    currentExtraDeck = []
  } else {
    currentDeck = [...(saved.main || [])]
    currentExtraDeck = [...(saved.extra || [])]
  }
  document.getElementById('deck-name-input').value = name
  renderDeck()
  renderExtraDeck()
}

window.deleteDeck = function(name) {
  const allDecks = JSON.parse(localStorage.getItem('savedDecks') || '{}')
  delete allDecks[name]
  localStorage.setItem('savedDecks', JSON.stringify(allDecks))
  renderSavedDecks()
}