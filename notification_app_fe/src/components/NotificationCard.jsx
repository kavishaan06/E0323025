import {
  Card, CardActionArea, CardContent,
  Box, Typography, Tooltip, Chip,
} from '@mui/material'
import FiberNewIcon      from '@mui/icons-material/FiberNew'
import DoneAllIcon       from '@mui/icons-material/DoneAll'
import AccessTimeIcon    from '@mui/icons-material/AccessTime'
import TypeChip from './TypeChip'

function formatTs(raw) {
  if (!raw) return ''
  const d = new Date(raw.replace(' ', 'T'))
  return isNaN(d) ? raw : d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function NotificationCard({ notification, isRead, onRead, rank }) {
  const { ID, Type, Message, Timestamp } = notification

  return (
    <Card
      id={`notif-${ID}`}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isRead ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.4)',
        bgcolor: isRead ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.06)',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(99,102,241,0.15)',
        },
      }}
    >
      {/* Unread dot */}
      {!isRead && (
        <Box
          sx={{
            position: 'absolute', top: 12, left: -5,
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(99,102,241,0.3)',
          }}
        />
      )}

      <CardActionArea onClick={() => onRead(ID)} sx={{ borderRadius: 'inherit' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            {/* Left: rank + message */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
              {rank != null && (
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'primary.main', color: 'white', fontSize: 13, fontWeight: 700,
                  }}
                >
                  {rank}
                </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body1"
                  fontWeight={isRead ? 400 : 600}
                  color={isRead ? 'text.secondary' : 'text.primary'}
                  sx={{ mb: 0.5, wordBreak: 'break-word' }}
                >
                  {Message}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled', fontSize: 12 }}>
                  <AccessTimeIcon sx={{ fontSize: 13 }} />
                  <Typography variant="caption">{formatTs(Timestamp)}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <TypeChip type={Type} />
              <Tooltip title={isRead ? 'Read' : 'Unread'}>
                <Chip
                  size="small"
                  icon={isRead ? <DoneAllIcon /> : <FiberNewIcon />}
                  label={isRead ? 'Read' : 'New'}
                  color={isRead ? 'default' : 'primary'}
                  variant={isRead ? 'outlined' : 'filled'}
                  sx={{ fontWeight: 600 }}
                />
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
