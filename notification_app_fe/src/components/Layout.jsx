import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Box, Toolbar, Typography, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  useMediaQuery, useTheme, Divider, Avatar,
} from '@mui/material'
import NotificationsIcon      from '@mui/icons-material/Notifications'
import StarIcon               from '@mui/icons-material/Star'
import MenuIcon               from '@mui/icons-material/Menu'
import CloseIcon              from '@mui/icons-material/Close'
import HubIcon                from '@mui/icons-material/Hub'

const NAV = [
  { label: 'All Notifications', path: '/',         icon: <NotificationsIcon /> },
  { label: 'Priority Inbox',    path: '/priority', icon: <StarIcon /> },
]

export default function Layout({ children }) {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const NavLinks = () => (
    <>
      {NAV.map(n => (
        <Button
          key={n.path}
          onClick={() => { navigate(n.path); setDrawerOpen(false) }}
          variant={pathname === n.path ? 'contained' : 'text'}
          startIcon={n.icon}
          sx={{ mx: 0.5, color: pathname === n.path ? 'white' : 'grey.300' }}
        >
          {n.label}
        </Button>
      ))}
    </>
  )

  const DrawerContent = () => (
    <Box sx={{ width: 270, pt: 2, pb: 4, px: 2, height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HubIcon color="primary" />
          <Typography variant="h6" color="primary" fontWeight={700}>NotifyHub</Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {NAV.map(n => (
          <ListItem key={n.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={pathname === n.path}
              onClick={() => { navigate(n.path); setDrawerOpen(false) }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{n.icon}</ListItemIcon>
              <ListItemText primary={n.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── AppBar ── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(26,26,46,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <Toolbar>
          <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, mr: 1.5 }}>
            <HubIcon fontSize="small" />
          </Avatar>
          <Typography variant="h6" color="primary" fontWeight={700} sx={{ flexGrow: { xs: 1, md: 0 }, mr: 4 }}>
            NotifyHub
          </Typography>

          {isMobile ? (
            <Box sx={{ ml: 'auto' }}>
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <NavLinks />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <DrawerContent />
      </Drawer>

      {/* ── Page Content ── */}
      <Box component="main" sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
        {children}
      </Box>
    </Box>
  )
}
