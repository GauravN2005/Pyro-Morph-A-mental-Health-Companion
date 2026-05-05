import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, MessageCircle, Video, Mic, BarChart2,
  Settings, Flame, ChevronLeft, ChevronRight,
  Bell, Search, Moon, Sparkles, LogOut
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

/* ── NAV ITEMS ─────────────────────────────────────────────── */
const NAV = [
  { to: '/home',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat',     icon: MessageCircle,   label: 'Chat'       },
  { to: '/video',    icon: Video,           label: 'Video Call' },
  { to: '/voice',    icon: Mic,             label: 'Voice Mode' },
  { to: '/mood',     icon: BarChart2,       label: 'Mood Tracker' },
  { to: '/settings', icon: Settings,        label: 'Settings'   },
]

const MOOD_EMOJI = { great: '🌟', good: '😊', okay: '😐', low: '😔', bad: '😢' }

/* ── SIDEBAR ────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(7,7,26,0.95)',
        borderRight: '1px solid rgba(139,92,246,0.1)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px] flex-shrink-0 relative">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            boxShadow: '0 0 20px rgba(124,58,237,0.5)',
            animation: 'pulseGlow 3s ease-in-out infinite',
          }}
        >
          <Flame size={18} className="text-white" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col leading-none"
            >
              <span className="font-display font-bold text-base text-grad">Pyro-Morph</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--txt-muted)', letterSpacing: '0.08em' }}>
                AI COMPANION
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors"
          style={{
            background: 'var(--elevated)',
            border: '1px solid var(--border-hi)',
            color: 'var(--txt-muted)',
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Session status pill */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-4"
          >
            <div
              className="rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-xs text-emerald-400 font-medium">Session active · 12 min</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <NavLink key={to} to={to}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative
                  ${active ? 'nav-active' : 'hover:bg-white/[0.04]'}
                `}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    active
                      ? 'bg-violet-600/30 text-violet-300'
                      : 'text-[color:var(--txt-muted)] group-hover:text-[color:var(--txt-secondary)] group-hover:bg-white/5'
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2 : 1.7} />
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`text-sm font-medium truncate ${
                        active ? 'text-violet-200' : 'text-[color:var(--txt-secondary)] group-hover:text-[color:var(--txt-primary)]'
                      }`}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active dot for collapsed */}
                {active && collapsed && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-violet-500" />
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom: user profile + logout */}
      <div
        className="flex-shrink-0 p-3 space-y-1"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                boxShadow: '0 0 12px rgba(124,58,237,0.4)',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#07071a]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-[color:var(--txt-primary)] truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-[color:var(--txt-muted)] truncate">{user?.email || ''}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}

/* ── TOP BAR ────────────────────────────────────────────────── */
function TopBar({ collapsed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const pageTitles = {
    '/home':     'Dashboard',
    '/chat':     'Chat with Pyro',
    '/video':    'Video Session',
    '/voice':    'Voice Mode',
    '/mood':     'Mood Tracker',
    '/settings': 'Settings',
  }
  const title = pageTitles[location.pathname] || 'Pyro-Morph'
  const marginLeft = collapsed ? 72 : 260

  return (
    <motion.header
      animate={{ marginLeft }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6"
      style={{
        height: 72,
        background: 'rgba(7,7,26,0.85)',
        backdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(139,92,246,0.1)',
      }}
    >
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-xl font-semibold text-[color:var(--txt-primary)]">
          {title}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-[color:var(--txt-muted)] hover:text-[color:var(--txt-secondary)] hover:bg-white/5 transition-all"
          style={{ border: '1px solid var(--border)' }}
        >
          <Search size={14} />
          <span className="hidden md:block">Search…</span>
          <kbd className="hidden md:block text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--elevated)', color: 'var(--txt-muted)' }}>⌘K</kbd>
        </button>

        {/* Notification */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[color:var(--txt-muted)] hover:text-[color:var(--txt-secondary)] hover:bg-white/5 transition-all"
          style={{ border: '1px solid var(--border)' }}
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
        </button>

        {/* Mood badge */}
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        >
          <Sparkles size={13} className="text-amber-400" />
          <span className="text-xs text-[color:var(--txt-secondary)]">Feeling calm today</span>
        </div>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            boxShadow: '0 0 14px rgba(124,58,237,0.4)',
          }}
        >
          R
        </div>
      </div>
    </motion.header>
  )
}

/* ── MASTER LAYOUT ──────────────────────────────────────────── */
export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const marginLeft = collapsed ? 72 : 260

  return (
    <div className="min-h-screen" style={{ background: 'var(--void)' }}>
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <TopBar collapsed={collapsed} />

      {/* Main content */}
      <motion.main
        animate={{ marginLeft }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
        style={{ paddingTop: 72, minHeight: '100vh' }}
      >
        {children}
      </motion.main>
    </div>
  )
}
