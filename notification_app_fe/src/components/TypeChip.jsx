import { Chip } from '@mui/material'
import WorkIcon          from '@mui/icons-material/Work'
import SchoolIcon        from '@mui/icons-material/School'
import EventIcon         from '@mui/icons-material/Event'

const CONFIG = {
  Placement: { color: 'success',   icon: <WorkIcon  fontSize="small" /> },
  Result:    { color: 'warning',   icon: <SchoolIcon fontSize="small" /> },
  Event:     { color: 'secondary', icon: <EventIcon fontSize="small" /> },
}

export default function TypeChip({ type, size = 'small' }) {
  const cfg = CONFIG[type] ?? { color: 'default', icon: null }
  return (
    <Chip
      label={type}
      color={cfg.color}
      size={size}
      icon={cfg.icon}
      variant="filled"
    />
  )
}
