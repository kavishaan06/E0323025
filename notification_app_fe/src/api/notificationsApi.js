import axios from 'axios'

// All requests go through the Vite proxy (/api → http://4.224.186.213/evaluation-service)
// This avoids browser CORS issues since the proxy call is server-side.
const BASE = '/api'

// ── Auth ─────────────────────────────────────────────────────────────────────
// Pre-seeded with a valid token; getToken() will re-auth automatically if this expires.
let _token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrYXZpc2hhYW4yOEBnbWFpbC5jb20iLCJleHAiOjE3ODEwNzM3MjQsImlhdCI6MTc4MTA3MjgyNCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjA4NWNiYzNmLTU5MGMtNDc5MS1hOWE2LWYxZDBlNjBjMDMwNyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImxvZ2FuIGthdmlzaGFhbiIsInN1YiI6ImY1ZmJlYjM3LWU1NzUtNDlhZi1hM2MyLTViNzhlYmU2OGM3ZSJ9LCJlbWFpbCI6ImthdmlzaGFhbjI4QGdtYWlsLmNvbSIsIm5hbWUiOiJsb2dhbiBrYXZpc2hhYW4iLCJyb2xsTm8iOiJlMDMyMzAyNSIsImFjY2Vzc0NvZGUiOiJEdndFRFoiLCJjbGllbnRJRCI6ImY1ZmJlYjM3LWU1NzUtNDlhZi1hM2MyLTViNzhlYmU2OGM3ZSIsImNsaWVudFNlY3JldCI6Im5LQWFucFRZdFJKQ0hCU24ifQ.aebg7vDi9gcBmKo39BzVUUyBm6KZ23YKfXqcO-t6TmU'

const CREDENTIALS = {
  email:        'kavishaan28@gmail.com',
  name:         'logan kavishaan',
  rollNo:       'e0323025',
  accessCode:   'DvwEDZ',
  clientID:     'f5fbeb37-e575-49af-a3c2-5b78ebe68c7e',
  clientSecret: 'nKAanpTYtRJCHBSn',
}

async function getToken() {
  if (_token) return _token
  try {
    const res = await axios.post(`${BASE}/auth`, CREDENTIALS)
    _token = res.data.access_token
    return _token
  } catch (err) {
    console.error('Auth failed:', err.message)
    return null
  }
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

// ── Notifications ─────────────────────────────────────────────────────────────
/**
 * @param {{ limit?: number, page?: number, notification_type?: string }} params
 */
export async function fetchNotifications(params = {}) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const query = new URLSearchParams()
  if (params.limit)             query.set('limit',             String(params.limit))
  if (params.page)              query.set('page',              String(params.page))
  if (params.notification_type) query.set('notification_type', params.notification_type)

  const url = `${BASE}/notifications${query.toString() ? '?' + query : ''}`
  const res = await axios.get(url, { headers: authHeader(token) })

  const body = res.data
  return (
    body.notifications ??
    body.data ??
    (Array.isArray(body) ? body : [])
  )
}

// ── Scoring (mirrors priority_inbox.js) ──────────────────────────────────────
const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 }

function parseTs(raw) {
  if (!raw) return 0
  return new Date(raw.replace(' ', 'T')).getTime() || 0
}

export function scoreNotification(n) {
  const w = TYPE_WEIGHT[n.Type] ?? 0
  return w * 10_000_000_000_000 + parseTs(n.Timestamp)
}

export class MinHeap {
  constructor(cap) { this.cap = cap; this.data = [] }
  get size() { return this.data.length }
  _swap(i, j) { [this.data[i], this.data[j]] = [this.data[j], this.data[i]] }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.data[p].s > this.data[i].s) { this._swap(p, i); i = p } else break
    }
  }
  _down(i) {
    const n = this.data.length
    while (true) {
      let m = i, l = 2*i+1, r = 2*i+2
      if (l < n && this.data[l].s < this.data[m].s) m = l
      if (r < n && this.data[r].s < this.data[m].s) m = r
      if (m === i) break; this._swap(i, m); i = m
    }
  }
  push(notif, s) {
    if (this.size < this.cap) { this.data.push({ notif, s }); this._up(this.data.length - 1) }
    else if (s > this.data[0].s) { this.data[0] = { notif, s }; this._down(0) }
  }
  sorted() { return [...this.data].sort((a,b) => b.s - a.s).map(x => x.notif) }
}

export async function fetchPriorityNotifications(topN = 10, typeFilter = '') {
  const raw = await fetchNotifications({ limit: 50, notification_type: typeFilter || undefined })
  const heap = new MinHeap(topN)
  raw.forEach(n => heap.push(n, scoreNotification(n)))
  return heap.sorted()
}
