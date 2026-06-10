import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Stack, ToggleButton, ToggleButtonGroup,
  Button, Alert, CircularProgress, Skeleton, Divider,
  Pagination, Chip, Tooltip, IconButton,
} from '@mui/material'
import RefreshIcon       from '@mui/icons-material/Refresh'
import DoneAllIcon       from '@mui/icons-material/DoneAll'
import NotificationsIcon from '@mui/icons-material/Notifications'
import FilterListIcon    from '@mui/icons-material/FilterList'

import { fetchNotifications } from '../api/notificationsApi'
import { useReadTracker }     from '../hooks/useReadTracker'
import NotificationCard       from '../components/NotificationCard'

const TYPES  = ['All', 'Placement', 'Result', 'Event']
const LIMIT  = 10

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [typeFilter, setTypeFilter]       = useState('All')
  const [page, setPage]                   = useState(1)
  const [totalPages, setTotalPages]       = useState(1)

  const { isRead, markRead, markAllRead } = useReadTracker()

  const load = useCallback(async (type, pg) => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: LIMIT, page: pg }
      if (type !== 'All') params.notification_type = type
      const data = await fetchNotifications(params)
      setNotifications(data)
      // Estimate total pages: if we get a full page there may be more
      setTotalPages(data.length === LIMIT ? pg + 1 : pg)
    } catch (e) {
      setError(e.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(typeFilter, page) }, [typeFilter, page, load])

  const handleTypeChange = (_, val) => {
    if (!val) return
    setTypeFilter(val)
    setPage(1)
  }

  const handleMarkAll = () => markAllRead(notifications.map(n => n.ID))

  const unreadCount = notifications.filter(n => !isRead(n.ID)).length

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NotificationsIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5">All Notifications</Typography>
            <Typography variant="caption" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up ✓'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Chip label={unreadCount} color="primary" size="small" sx={{ fontWeight: 700 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Mark all as read">
            <span>
              <Button
                id="mark-all-read-btn"
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAll}
                disabled={unreadCount === 0}
                variant="outlined"
              >
                Mark all read
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton id="refresh-btn" onClick={() => load(typeFilter, page)} size="small" color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Filter ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <FilterListIcon color="action" fontSize="small" />
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Filter by type:</Typography>
        <ToggleButtonGroup
          id="type-filter-group"
          value={typeFilter}
          exclusive
          onChange={handleTypeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'text.secondary',
              px: 2,
              '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main' },
            },
          }}
        >
          {TYPES.map(t => (
            <ToggleButton key={t} value={t} id={`filter-${t.toLowerCase()}`}>{t}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* ── Content ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {loading ? (
        <Stack spacing={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={84} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          ))}
        </Stack>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No notifications found for this filter.</Typography>
        </Box>
      ) : (
        <>
          <Stack spacing={1.5} id="notifications-list">
            {notifications.map(n => (
              <NotificationCard
                key={n.ID}
                notification={n}
                isRead={isRead(n.ID)}
                onRead={markRead}
              />
            ))}
          </Stack>

          {/* ── Pagination ── */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              id="notifications-pagination"
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Box>
  )
}
