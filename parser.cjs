const fs = require('fs')
const path = require('path')

// ── CONFIG ─────────────────────────────────────────────────
// Input: your plain text card file
// Output: cardLibrary.js ready to drop into src/
const INPUT_FILE = 'cards.txt'
const OUTPUT_FILE = path.join('src', 'cardLibrary.js')

// ── READ FILE ──────────────────────────────────────────────
const raw = fs.readFileSync(INPUT_FILE, 'utf-8')

// split into blocks by blank line
const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)

const cards = {}

blocks.forEach((block, i) => {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return

  // first line is the card name
  const name = lines[0]

  const card = {
    name,
    type: 'monster',
    attack: 0,
    defense: 0,
    cost: 0,
    effect: ''
  }

  lines.slice(1).forEach(line => {
    const [key, ...rest] = line.split(':')
    const value = rest.join(':').trim()

    switch (key.trim().toLowerCase()) {
      case 'type':    card.type = value; break
      case 'attribute': card.attribute = value; break
      case 'attack':  card.attack = parseInt(value) || 0; break
      case 'defense': card.defense = parseInt(value) || 0; break
      case 'cost':    card.cost = parseInt(value) || 0; break
      case 'effect':  card.effect = value; break
    }
  })

  if (!card.name) {
    console.warn(`⚠ Block ${i + 1} has no name — skipping`)
    return
  }

  cards[name] = card
})

// ── BUILD OUTPUT ───────────────────────────────────────────
const entries = Object.values(cards).map(card => {
  return `  "${card.name}": { name: "${card.name}", type: "${card.type}", attack: ${card.attack}, defense: ${card.defense}, cost: ${card.cost}, effect: "${card.effect.replace(/"/g, '\\"')}" }`
}).join(',\n')

const output = `export const cardLibrary = {\n${entries}\n}\n`

fs.writeFileSync(OUTPUT_FILE, output, 'utf-8')
console.log(`✅ Parsed ${Object.keys(cards).length} cards → ${OUTPUT_FILE}`)