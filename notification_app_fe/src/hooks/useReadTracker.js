import { useState, useCallback } from 'react'

const STORAGE_KEY = 'notifhub_read_ids'

function getRead() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function saveRead(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function useReadTracker() {
  const [readIds, setReadIds] = useState(getRead)

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveRead(next)
      return next
    })
  }, [])

  const markAllRead = useCallback((ids) => {
    setReadIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      saveRead(next)
      return next
    })
  }, [])

  const isRead = useCallback((id) => readIds.has(id), [readIds])

  return { isRead, markRead, markAllRead }
}
