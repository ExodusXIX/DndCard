import { createClient } from '@supabase/supabase-js'

// ── SUPABASE CONFIG ────────────────────────────────────────
// Replace these with your actual values from Project Settings → API
const SUPABASE_URL = 'https://cyubmyoowkgmhnjyvsgk.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IcxNyjufHJFPgxYUVPbVUw_zXUsNKkL'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── CHANNEL ───────────────────────────────────────────────
// Both players join the same channel — any event broadcast here
// is received by everyone in the channel instantly
let channel = null

export function joinGame(roomId) {
  channel = supabase.channel(`game-${roomId}`)

  // listen for incoming events from the other player
  channel
    .on('broadcast', { event: 'card_moved' }, ({ payload }) => {
      if (typeof window.onRemoteCardMoved === 'function') {
        window.onRemoteCardMoved(payload)
      }
    })
    .on('broadcast', { event: 'bank_rolled' }, ({ payload }) => {
      if (typeof window.onRemoteBankRolled === 'function') {
        window.onRemoteBankRolled(payload)
      }
    })
    .on('broadcast', { event: 'hp_changed' }, ({ payload }) => {
      if (typeof window.onRemoteHpChanged === 'function') {
        window.onRemoteHpChanged(payload)
      }
    })
    .on('broadcast', { event: 'deck_loaded' }, ({ payload }) => {
      if (typeof window.onRemoteDeckLoaded === 'function') {
        window.onRemoteDeckLoaded(payload)
      }
    })
    .on('broadcast', { event: 'card_drawn' }, ({ payload }) => {
      if (typeof window.onRemoteCardDrawn === 'function') {
        window.onRemoteCardDrawn(payload)
      }
    })
    .on('broadcast', { event: 'field_reset' }, () => {
      if (typeof window.onRemoteFieldReset === 'function') {
        window.onRemoteFieldReset()
      }
    })
    .subscribe()
}

// ── BROADCAST HELPERS ──────────────────────────────────────
// Call these whenever the local player does something

export function broadcastCardMoved(payload) {
  channel?.send({ type: 'broadcast', event: 'card_moved', payload })
}

export function broadcastPlayerJoined(player, name) {
  channel?.send({ type: 'broadcast', event: 'player_joined', payload: { player, name } })
  .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
  if (typeof window.onRemotePlayerJoined === 'function') {
    window.onRemotePlayerJoined(payload)
  }
})
}

export function broadcastBankRolled(value) {
  channel?.send({ type: 'broadcast', event: 'bank_rolled', payload: { value } })
}

export function broadcastHpChanged(player, value) {
  channel?.send({ type: 'broadcast', event: 'hp_changed', payload: { player, value } })
}

export function broadcastDeckLoaded(player, deckName) {
  channel?.send({ type: 'broadcast', event: 'deck_loaded', payload: { player, deckName } })
}

export function broadcastCardDrawn(player) {
  channel?.send({ type: 'broadcast', event: 'card_drawn', payload: { player } })
}

export function broadcastFieldReset() {
  channel?.send({ type: 'broadcast', event: 'field_reset', payload: {} })
}