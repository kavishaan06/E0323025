import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Stack, Divider, Alert, Skeleton,
  Chip, Slider, Select, MenuItem, FormControl, InputLabel,
  ToggleButtonGroup, ToggleButton, IconButton, Tooltip,
  LinearProgress, Paper,
} from '@mui/material'
import StarIcon          from '@mui/icons-material/Star'
import RefreshIcon       from '@mui/icons-material/Refresh'
import FilterListIcon    from '@mui/icons-material/FilterList'
import EmojiEventsIcon   from '@mui/icons-material/EmojiEvents'

import { fetchPriorityNotifications } from '../api/notificationsApi'
import { useReadTracker }             from '../hooks/useReadTracker'
import NotificationCard               from '../components/NotificationCard'

const TYPES       = ['All', 'Placement', 'Result', 'Event']
const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 }
const TYPE_COLOR  = { Placement: '#22c55e', Result: '#f59e0b', Event: '#22d3ee' }

function ScoreMeter({ type }) {
  const w = TYPE_WEIGHT[type] ?? 0
  const pct = (w / 3) * 100
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      <Typography variant="caption" color="text.disabled" sx={{ minWidth: 56 }}>
        Weight: {w}/3
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          flex: 1, height: 6, borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: TYPE_COLOR[type] ?? 'grey.500', borderRadius: 3 },
        }}
      />
    </Box>
  )
}

export default function PriorityInbox() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [topN, setTopN]                   = useState(10)
  const [typeFilter, setTypeFilter]       = useState('All')

  const { isRead, markRead } = useReadTracker()

  const load = useCallback(async (n, type) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPriorityNotifications(n, type === 'All' ? '' : type)
      setNotifications(data)
    } catch (e) {
      setError(e.message || 'Failed to load priority notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(topN, typeFilter) }, [topN, typeFilter, load])

  const handleTypeChange = (_, val) => { if (val) setTypeFilter(val) }

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StarIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
          <Box>
            <Typography variant="h5">Priority Inbox</Typography>
            <Typography variant="caption" color="text.secondary">
              Top {notifications.length} by type weight &amp; recency
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh">
          <IconButton id="priority-refresh-btn" onClick={() => load(topN, typeFilter)} size="small" color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* ── Legend ── */}
      <Paper
        id="priority-legend"
        elevation={0}
        sx={{ bgcolor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', p: 2, mb: 3, borderRadius: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <EmojiEventsIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600}>Priority Score = (Type Weight × 10¹³) + Timestamp (ms)</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {Object.entries(TYPE_WEIGHT).map(([t]) => (
            <Box key={t} sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: TYPE_COLOR[t] }} />
                <Typography variant="caption" fontWeight={600}>{t}</Typography>
              </Box>
              <ScoreMeter type={t} />
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* ── Controls ── */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Top-N slider */}
        <Box sx={{ minWidth: 220 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Top N notifications</Typography>
            <Chip label={topN} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 36 }} />
          </Box>
          <Slider
            id="top-n-slider"
            value={topN}
            min={5} max={25} step={5}
            marks={[5,10,15,20,25].map(v => ({ value: v, label: String(v) }))}
            onChange={(_, val) => setTopN(val)}
            color="primary"
            sx={{ '& .MuiSlider-markLabel': { fontSize: 11 } }}
          />
        </Box>

        {/* Type filter */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <FilterListIcon color="action" fontSize="small" />
          <Typography variant="body2" color="text.secondary">Filter:</Typography>
          <ToggleButtonGroup
            id="priority-type-filter"
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
              <ToggleButton key={t} value={t} id={`priority-filter-${t.toLowerCase()}`}>{t}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
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
          <StarIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No notifications found.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5} id="priority-notifications-list">
          {notifications.map((n, idx) => (
            <NotificationCard
              key={n.ID}
              notification={n}
              isRead={isRead(n.ID)}
              onRead={markRead}
              rank={idx + 1}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
