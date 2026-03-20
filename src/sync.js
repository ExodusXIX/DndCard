import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cyubmyoowkgmhnjyvsgk.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IcxNyjufHJFPgxYUVPbVUw_zXUsNKkL'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

let channel = null

export function joinGame(roomId) {
  channel = supabase.channel(`game-${roomId}`)

  // each listener registered separately — no chaining
  channel.on('broadcast', { event: 'card_moved' }, ({ payload }) => {
    if (typeof window.onRemoteCardMoved === 'function') window.onRemoteCardMoved(payload)
  })
  channel.on('broadcast', { event: 'bank_rolled' }, ({ payload }) => {
    if (typeof window.onRemoteBankRolled === 'function') window.onRemoteBankRolled(payload)
  })
  channel.on('broadcast', { event: 'hp_changed' }, ({ payload }) => {
    if (typeof window.onRemoteHpChanged === 'function') window.onRemoteHpChanged(payload)
  })
  channel.on('broadcast', { event: 'deck_loaded' }, ({ payload }) => {
    if (typeof window.onRemoteDeckLoaded === 'function') window.onRemoteDeckLoaded(payload)
  })
  channel.on('broadcast', { event: 'card_drawn' }, ({ payload }) => {
    if (typeof window.onRemoteCardDrawn === 'function') window.onRemoteCardDrawn(payload)
  })
  channel.on('broadcast', { event: 'field_reset' }, () => {
    if (typeof window.onRemoteFieldReset === 'function') window.onRemoteFieldReset()
  })
  channel.on('broadcast', { event: 'player_joined' }, ({ payload }) => {
    if (typeof window.onRemotePlayerJoined === 'function') window.onRemotePlayerJoined(payload)
  })
  channel.on('broadcast', { event: 'request_names' }, () => {
  // re-broadcast our own name so the new joiner can see it
  const player = localStorage.getItem('currentPlayer')
  const name = localStorage.getItem(`${player}_name`)
  if (player && name) broadcastPlayerJoined(player, name)
  })
  channel.subscribe()
}
export function broadcastRequestNames() {
  channel?.send({ type: 'broadcast', event: 'request_names', payload: {} })
}
export function broadcastCardMoved(payload) {
  channel?.send({ type: 'broadcast', event: 'card_moved', payload })
}

export function broadcastPlayerJoined(player, name) {
  channel?.send({ type: 'broadcast', event: 'player_joined', payload: { player, name } })
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
