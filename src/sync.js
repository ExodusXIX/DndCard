import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cyubmyoowkgmhnjyvsgk.supabase.co'
const SUPABASE_KEY = 'sb_publishable_IcxNyjufHJFPgxYUVPbVUw_zXUsNKkL'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

let channel = null

// unique ID for this browser session — used to filter out own broadcasts
const SESSION_ID = Math.random().toString(36).slice(2)

function shouldIgnore(payload) {
  return payload?.senderId === SESSION_ID
}

function tag(payload) {
  return { ...payload, senderId: SESSION_ID }
}

export function leaveGame() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
}

export function joinGame(roomId) {
  leaveGame()

  return new Promise((resolve) => {
    channel = supabase.channel(`game-${roomId}`)

    channel.on('broadcast', { event: 'card_moved' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteCardMoved === 'function') window.onRemoteCardMoved(payload)
    })
    channel.on('broadcast', { event: 'bank_rolled' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteBankRolled === 'function') window.onRemoteBankRolled(payload)
    })
    channel.on('broadcast', { event: 'hp_changed' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteHpChanged === 'function') window.onRemoteHpChanged(payload)
    })
    channel.on('broadcast', { event: 'deck_loaded' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteDeckLoaded === 'function') window.onRemoteDeckLoaded(payload)
    })
    channel.on('broadcast', { event: 'card_drawn' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteCardDrawn === 'function') window.onRemoteCardDrawn(payload)
    })
    channel.on('broadcast', { event: 'field_reset' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteFieldReset === 'function') window.onRemoteFieldReset()
    })
    channel.on('broadcast', { event: 'token_create' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteTokenCreate === 'function') window.onRemoteTokenCreate(payload)
    })
    channel.on('broadcast', { event: 'token_update' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteTokenUpdate === 'function') window.onRemoteTokenUpdate(payload)
    })
    channel.on('broadcast', { event: 'player_joined' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemotePlayerJoined === 'function') window.onRemotePlayerJoined(payload)
    })
    channel.on('broadcast', { event: 'request_names' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      const p = localStorage.getItem('currentPlayer')
      const n = localStorage.getItem(`${p}_name`)
      if (p && n) broadcastPlayerJoined(p, n)
    })
    channel.on('broadcast', { event: 'card_flipped' }, ({ payload }) => {
      if (shouldIgnore(payload)) return
      if (typeof window.onRemoteCardFlipped === 'function') window.onRemoteCardFlipped(payload)
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve()
    })
  })
}

export function broadcastRequestNames() {
  channel?.send({ type: 'broadcast', event: 'request_names', payload: tag({}) })
}

export function broadcastCardMoved(payload) {
  channel?.send({ type: 'broadcast', event: 'card_moved', payload: tag(payload) })
}

export function broadcastTokenCreate(tokenId, tokenData, player) {
  channel?.send({ type: 'broadcast', event: 'token_create', payload: tag({ tokenId, tokenData, player }) })
}

export function broadcastTokenUpdate(tokenId, tokenData) {
  channel?.send({ type: 'broadcast', event: 'token_update', payload: tag({ tokenId, tokenData }) })
}

export function broadcastPlayerJoined(player, name) {
  channel?.send({ type: 'broadcast', event: 'player_joined', payload: tag({ player, name }) })
}

export function broadcastBankRolled(value) {
  channel?.send({ type: 'broadcast', event: 'bank_rolled', payload: tag({ value }) })
}

export function broadcastFlip(player, zoneType, index, faceUp) {
  channel?.send({ type: 'broadcast', event: 'card_flipped', payload: tag({ player, zoneType, index, faceUp }) })
}

export function broadcastHpChanged(player, value) {
  channel?.send({ type: 'broadcast', event: 'hp_changed', payload: tag({ player, value }) })
}

export function broadcastDeckLoaded(player, deckName) {
  channel?.send({ type: 'broadcast', event: 'deck_loaded', payload: tag({ player, deckName }) })
}

export function broadcastCardDrawn(player) {
  channel?.send({ type: 'broadcast', event: 'card_drawn', payload: tag({ player }) })
}

export function broadcastFieldReset() {
  channel?.send({ type: 'broadcast', event: 'field_reset', payload: tag({}) })
}