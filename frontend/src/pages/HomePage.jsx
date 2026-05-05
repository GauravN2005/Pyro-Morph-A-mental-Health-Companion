import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import {
  MessageCircle, Video, Mic, BarChart2, TrendingUp,
  Heart, Sun, Clock, ChevronRight, Flame, Sparkles,
  Activity, Calendar
} from 'lucide-react'

/* ── DATA ─────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    icon: MessageCircle, label: 'Start Chat',       sub: 'Talk via text with Pyro',
    route: '/chat',
    grad: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
    glow: 'rgba(124,58,237,0.35)', border: 'rgba(124,58,237,0.4)',
    badge: 'Most used',
  },
  {
    icon: Video, label: 'Video Session',    sub: 'Face-to-face AI interaction',
    route: '/video',
    grad: 'linear-gradient(135deg,#0891b2 0%,#4f46e5 100%)',
    glow: 'rgba(6,182,212,0.3)', border: 'rgba(6,182,212,0.35)',
    badge: 'Immersive',
  },
  {
    icon: Mic, label: 'Voice Mode',       sub: 'Speak naturally, AI responds',
    route: '/voice',
    grad: 'linear-gradient(135deg,#be185d 0%,#7c3aed 100%)',
    glow: 'rgba(244,63,94,0.3)', border: 'rgba(244,63,94,0.35)',
    badge: 'Natural',
  },
  {
    icon: BarChart2, label: 'Mood Tracker',    sub: 'View your emotional trends',
    route: '/mood',
    grad: 'linear-gradient(135deg,#059669 0%,#0891b2 100%)',
    glow: 'rgba(16,185,129,0.3)', border: 'rgba(16,185,129,0.35)',
    badge: 'New',
  },
]

const STATS = [
  { label: 'Sessions this week', value: '7', icon: Activity, color: 'text-violet-400', bg: 'rgba(124,58,237,0.1)', up: '+2' },
  { label: 'Avg. session length', value: '18m', icon: Clock, color: 'text-cyan-400', bg: 'rgba(6,182,212,0.1)', up: '+3m' },
  { label: 'Mood score',   value: '74%', icon: Heart, color: 'text-rose-400', bg: 'rgba(244,63,94,0.1)', up: '+8%' },
  { label: 'Streak',       value: '12d', icon: Flame, color: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', up: '🔥' },
]

const MOOD_WEEK = [
  { day: 'Mon', mood: 'great', emoji: '🌟', score: 90 },
  { day: 'Tue', mood: 'good',  emoji: '😊', score: 75 },
  { day: 'Wed', mood: 'okay',  emoji: '😐', score: 55 },
  { day: 'Thu', mood: 'low',   emoji: '😔', score: 35 },
  { day: 'Fri', mood: 'good',  emoji: '😊', score: 70 },
  { day: 'Sat', mood: 'great', emoji: '🌟', score: 85 },
  { day: 'Sun', mood: 'good',  emoji: '😊', score: 78 },
]

const MOOD_COLORS = {
  great: '#7c3aed', good: '#06b6d4', okay: '#f59e0b', low: '#f43f5e', bad: '#ef4444'
}

const RECENT_SESSIONS = [
  { type: 'Chat',  duration: '22 min', ago: '2h ago',  mood: '😊', icon: MessageCircle, c: '#7c3aed' },
  { type: 'Voice', duration: '14 min', ago: '1d ago',  mood: '😔', icon: Mic,           c: '#f43f5e' },
  { type: 'Video', duration: '31 min', ago: '2d ago',  mood: '🌟', icon: Video,         c: '#06b6d4' },
  { type: 'Chat',  duration: '18 min', ago: '3d ago',  mood: '😐', icon: MessageCircle, c: '#7c3aed' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.name?.trim() || user?.email?.split('@')?.[0] || 'Friend'

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl">

      {/* ── TOP: greeting + avatar ───────────────────────────── */}
      <div className="flex items-start justify-between mb-8 gap-6">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <p className="text-sm font-mono mb-1" style={{ color:'var(--txt-muted)', letterSpacing:'0.06em' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold" style={{ color:'var(--txt-primary)' }}>
            {greeting}, <span className="text-grad">{displayName}</span> 👋
          </h1>
          <p className="mt-2 text-base" style={{ color:'var(--txt-secondary)' }}>
            You've had a <span className="text-violet-300 font-medium">12-day streak</span> — keep it up. Pyro is ready when you are.
          </p>
        </motion.div>

        {/* Pyro avatar card */}
        <motion.div
          initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.2, duration:0.5 }}
          className="hidden xl:flex flex-col items-center gap-3 rounded-3xl px-8 py-5 flex-shrink-0"
          style={{ background:'rgba(15,15,40,0.8)', border:'1px solid rgba(139,92,246,0.25)', backdropFilter:'blur(30px)' }}
        >
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))', border:'1px solid rgba(124,58,237,0.4)', animation:'pulseGlow 3s ease-in-out infinite,floatY 6s ease-in-out infinite' }}>
            <span className="text-3xl">🔥</span>
            <div className="absolute inset-0 rounded-2xl border border-violet-400/30" style={{ animation:'ripple 2.5s linear infinite' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color:'var(--txt-primary)' }}>Pyro</p>
            <div className="flex items-center gap-1.5 justify-center mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Online</span>
            </div>
          </div>
          <button onClick={() => navigate('/chat')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
            Talk Now →
          </button>
        </motion.div>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon:Icon, color, bg, up }, i) => (
          <motion.div key={label}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.05*i+0.1, duration:0.45 }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background:'rgba(15,15,40,0.7)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}>
                <Icon size={17} className={color} />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{ background:'rgba(16,185,129,0.1)', color:'#34d399' }}>{up}</span>
            </div>
            <p className="text-2xl font-bold font-mono mb-1" style={{ color:'var(--txt-primary)' }}>{value}</p>
            <p className="text-xs" style={{ color:'var(--txt-muted)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Quick actions — 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold" style={{ color:'var(--txt-primary)' }}>Quick Actions</h2>
            <Sparkles size={16} className="text-violet-400" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {QUICK_ACTIONS.map(({ icon:Icon, label, sub, route, grad, glow, border, badge }, i) => (
              <motion.div key={label}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.07, duration:0.45 }}
                onClick={() => navigate(route)}
                whileHover={{ y:-4, boxShadow:`0 20px 60px ${glow}` }}
                whileTap={{ scale:0.98 }}
                className="rounded-2xl p-5 cursor-pointer group relative overflow-hidden transition-all duration-300"
                style={{ background:'rgba(15,15,40,0.8)', border:`1px solid ${border}`, backdropFilter:'blur(20px)' }}>

                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-70"
                  style={{ background:grad }} />

                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background:grad, boxShadow:`0 0 20px ${glow}` }}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-lg"
                    style={{ background:'rgba(255,255,255,0.06)', color:'var(--txt-secondary)' }}>{badge}</span>
                </div>

                <h3 className="font-semibold text-base mb-1" style={{ color:'var(--txt-primary)' }}>{label}</h3>
                <p className="text-sm" style={{ color:'var(--txt-muted)' }}>{sub}</p>

                <div className="mt-4 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color:'var(--txt-secondary)' }}>
                  Start session <ChevronRight size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mood week summary — 1 col */}
        <motion.div
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3, duration:0.5 }}
          className="rounded-2xl p-5"
          style={{ background:'rgba(15,15,40,0.8)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>

          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold" style={{ color:'var(--txt-primary)' }}>Weekly Mood</h2>
            <Calendar size={15} className="text-violet-400" />
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-1 h-28 mb-3">
            {MOOD_WEEK.map(({ day, mood, score }, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg chart-bar" style={{
                  height:`${score}%`, background:MOOD_COLORS[mood],
                  opacity: 0.75 + i*0.03,
                  animationDelay:`${i*0.07}s`,
                  minHeight:6,
                  boxShadow:`0 0 8px ${MOOD_COLORS[mood]}60`,
                }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {MOOD_WEEK.map(({ day }) => (
              <span key={day} className="flex-1 text-center text-[10px]" style={{ color:'var(--txt-muted)' }}>{day}</span>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-5 space-y-2">
            {[
              { emoji:'🌟', label:'Great days',  count:2, color:'#7c3aed' },
              { emoji:'😊', label:'Good days',   count:3, color:'#06b6d4' },
              { emoji:'😐', label:'Okay / Low',  count:2, color:'#f59e0b' },
            ].map(({ emoji, label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs" style={{ color:'var(--txt-secondary)' }}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full" style={{ width:`${count*18}px`, background:color, opacity:0.7 }} />
                  <span className="text-xs font-mono" style={{ color:'var(--txt-muted)' }}>{count}d</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RECENT SESSIONS ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.5 }}
        className="rounded-2xl p-5"
        style={{ background:'rgba(15,15,40,0.8)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold" style={{ color:'var(--txt-primary)' }}>Recent Sessions</h2>
          <button className="text-xs flex items-center gap-1 transition-colors hover:text-white"
            style={{ color:'var(--txt-muted)' }}>View all <ChevronRight size={12} /></button>
        </div>
        <div className="space-y-3">
          {RECENT_SESSIONS.map(({ type, duration, ago, mood, icon:Icon, c }, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/[0.03] cursor-pointer group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:`${c}18`, border:`1px solid ${c}40` }}>
                <Icon size={16} style={{ color:c }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color:'var(--txt-primary)' }}>{type} Session</p>
                <p className="text-xs" style={{ color:'var(--txt-muted)' }}>{duration} · {ago}</p>
              </div>
              <span className="text-xl">{mood}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:'var(--txt-muted)' }} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
