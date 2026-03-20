const fs = require('fs')
const path = require('path')

const INPUT_FILE = 'cards.txt'
const OUTPUT_FILE = path.join('src', 'cardLibrary.js')

const raw = fs.readFileSync(INPUT_FILE, 'utf-8')

const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)

const cards = {}

blocks.forEach((block, i) => {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return

  const name = lines[0]

  const card = {
    name,
    type: 'monster',
    attribute: '',
    attack: 0,
    defense: 0,
    cost: 0,
    effect: ''
  }

  lines.slice(1).forEach(line => {
    const [key, ...rest] = line.split(':')
    const value = rest.join(':').trim()

    switch (key.trim().toLowerCase()) {
      case 'type':      card.type = value.replace(/[""]/g, '').trim(); break
      case 'attribute': card.attribute = value.replace(/[""]/g, '').trim(); break
      case 'attack':    card.attack = parseInt(value) || 0; break
      case 'defense':   card.defense = parseInt(value) || 0; break
      case 'cost':      card.cost = parseInt(value) || 0; break
      case 'effect':    card.effect = value.replace(/[""]/g, '"').trim(); break
    }
  })

  if (!card.name) {
    console.warn(`⚠ Block ${i + 1} has no name — skipping`)
    return
  }

  cards[name] = card
})

const entries = Object.values(cards).map(card => {
  // sanitize all string fields — strip curly quotes, escape straight quotes
  const safeName = card.name.replace(/[""]/g, '').replace(/"/g, '\\"')
  const safeAttr = (card.attribute || '').replace(/[""]/g, '').replace(/"/g, '\\"')
  const safeEffect = (card.effect || '').replace(/[""]/g, '"').replace(/"/g, '\\"')
  return `  "${safeName}": { name: "${safeName}", type: "${card.type}", attribute: "${safeAttr}", attack: ${card.attack}, defense: ${card.defense}, cost: ${card.cost}, effect: "${safeEffect}" }`
}).join(',\n')

const output = `export const cardLibrary = {\n${entries}\n}\n`

fs.writeFileSync(OUTPUT_FILE, output, 'utf-8')
console.log(`✅ Parsed ${Object.keys(cards).length} cards → ${OUTPUT_FILE}`)