import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Heart, Activity, Smile, ChevronRight, Plus } from 'lucide-react'

const MOODS = [
  { emoji:'🌟', label:'Amazing', value:5, color:'#7c3aed' },
  { emoji:'😊', label:'Good',    value:4, color:'#06b6d4' },
  { emoji:'😐', label:'Okay',    value:3, color:'#f59e0b' },
  { emoji:'😔', label:'Low',     value:2, color:'#f43f5e' },
  { emoji:'😢', label:'Bad',     value:1, color:'#ef4444' },
]

const WEEK_DATA = [
  { day:'Mon', score:4, emoji:'😊', note:'Had a good morning routine',         sessions:2 },
  { day:'Tue', score:3, emoji:'😐', note:'Work was stressful',                 sessions:1 },
  { day:'Wed', score:2, emoji:'😔', note:'Overwhelmed with deadlines',         sessions:3 },
  { day:'Thu', score:4, emoji:'😊', note:'Talked to Pyro, felt much better',   sessions:2 },
  { day:'Fri', score:5, emoji:'🌟', note:'Great day overall',                  sessions:1 },
  { day:'Sat', score:4, emoji:'😊', note:'Relaxed weekend morning',            sessions:1 },
  { day:'Sun', score:3, emoji:'😐', note:'Anxious about the upcoming week',    sessions:2 },
]

const MONTH_DATA = Array.from({ length: 28 }, (_, i) => ({
  day: i+1,
  score: Math.max(1, Math.min(5, Math.round(3 + Math.sin(i*0.7)*1.5 + (Math.random()-0.5)))),
}))

const MOOD_COLORS = { 5:'#7c3aed', 4:'#06b6d4', 3:'#f59e0b', 2:'#f43f5e', 1:'#ef4444' }
const MOOD_EMOJIS = { 5:'🌟', 4:'😊', 3:'😐', 2:'😔', 1:'😢' }
const MOOD_LABELS = { 5:'Amazing', 4:'Good', 3:'Okay', 2:'Low', 1:'Bad' }

const INSIGHTS = [
  { icon:'💬', title:'Talk sessions help', desc:'You feel 40% better after each chat session with Pyro.' },
  { icon:'🌙', title:'Evening check-ins work', desc:'Your mood is consistently higher when you check in before 9pm.' },
  { icon:'📈', title:'Week-over-week trend', desc:'Your average mood improved by 0.6 points vs last week.' },
]

export default function MoodPage() {
  const [selected, setSelected] = useState(null)
  const [todayMood, setTodayMood] = useState(null)

  const avg = (WEEK_DATA.reduce((a,d) => a+d.score, 0) / WEEK_DATA.length).toFixed(1)

  return (
    <div className="p-6 lg:p-8 max-w-screen-2xl space-y-6">

      {/* ── HEADER + MOOD CHECK-IN ──────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <h1 className="font-display text-3xl font-bold mb-1" style={{ color:'var(--txt-primary)' }}>
              Mood Tracker
            </h1>
            <p style={{ color:'var(--txt-secondary)' }}>
              Track your emotional health over time and discover patterns.
            </p>
          </motion.div>
        </div>

        {/* Today's check-in card */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15, duration:0.5 }}
          className="rounded-2xl p-5"
          style={{ background:'rgba(15,15,40,0.8)', border:'1px solid rgba(139,92,246,0.25)', backdropFilter:'blur(20px)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"/>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--txt-muted)' }}>
              How do you feel today?
            </p>
          </div>
          <div className="flex justify-between gap-1 mb-3">
            {MOODS.map(m => (
              <button key={m.value}
                onClick={() => setTodayMood(m.value)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                style={{
                  background: todayMood === m.value ? `${m.color}25` : 'transparent',
                  border: `1px solid ${todayMood === m.value ? m.color : 'transparent'}`,
                  transform: todayMood === m.value ? 'scale(1.08)' : 'scale(1)',
                }}>
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px]" style={{ color: todayMood === m.value ? m.color : 'var(--txt-muted)' }}>{m.label}</span>
              </button>
            ))}
          </div>
          {todayMood && (
            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              className="text-center">
              <p className="text-xs" style={{ color:'var(--txt-secondary)' }}>
                Logged: {MOOD_LABELS[todayMood]} {MOOD_EMOJIS[todayMood]}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── STATS ROW ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Weekly Average',   value:avg,    icon:TrendingUp, color:'text-violet-400', bg:'rgba(124,58,237,0.1)', badge:'+0.6' },
          { label:'Sessions this wk', value:'12',   icon:Activity,   color:'text-cyan-400',   bg:'rgba(6,182,212,0.1)',  badge:'+3'   },
          { label:'Best mood streak', value:'3 days', icon:Smile,    color:'text-emerald-400',bg:'rgba(16,185,129,0.1)', badge:'🔥'   },
          { label:'Mood log streak',  value:'14 days',icon:Calendar, color:'text-amber-400',  bg:'rgba(245,158,11,0.1)', badge:'✓'    },
        ].map(({ label, value, icon:Icon, color, bg, badge }, i) => (
          <motion.div key={label}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05*i+0.1, duration:0.45 }}
            className="rounded-2xl p-5"
            style={{ background:'rgba(15,15,40,0.7)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:bg }}>
                <Icon size={17} className={color}/>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{ background:'rgba(16,185,129,0.1)', color:'#34d399' }}>{badge}</span>
            </div>
            <p className="text-2xl font-bold font-mono mb-1" style={{ color:'var(--txt-primary)' }}>{value}</p>
            <p className="text-xs" style={{ color:'var(--txt-muted)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS ROW ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Weekly bar chart */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.5 }}
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background:'rgba(15,15,40,0.8)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-lg font-semibold" style={{ color:'var(--txt-primary)' }}>This Week</h2>
              <p className="text-xs mt-0.5" style={{ color:'var(--txt-muted)' }}>Daily mood scores (1–5 scale)</p>
            </div>
            <select className="text-xs px-3 py-1.5 rounded-xl outline-none"
              style={{ background:'var(--elevated)', border:'1px solid var(--border)', color:'var(--txt-secondary)' }}>
              <option>This week</option><option>Last week</option><option>Last month</option>
            </select>
          </div>

          {/* Bars */}
          <div className="flex items-end justify-between gap-3 h-44 mb-4">
            {WEEK_DATA.map(({ day, score, emoji }, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => setSelected(selected===i ? null : i)}>
                <span className="text-base opacity-0 group-hover:opacity-100 transition-opacity">{emoji}</span>
                <div className="w-full rounded-xl chart-bar transition-all duration-300 group-hover:brightness-125"
                  style={{
                    height:`${(score/5)*100}%`,
                    background: selected===i
                      ? `linear-gradient(180deg, ${MOOD_COLORS[score]}, ${MOOD_COLORS[score]}88)`
                      : `linear-gradient(180deg, ${MOOD_COLORS[score]}cc, ${MOOD_COLORS[score]}55)`,
                    animationDelay:`${i*0.08}s`,
                    boxShadow: selected===i ? `0 0 20px ${MOOD_COLORS[score]}60` : 'none',
                    minHeight:8,
                  }} />
                <span className="text-xs" style={{ color:'var(--txt-muted)' }}>{day}</span>
              </div>
            ))}
          </div>

          {/* Selected day detail */}
          {selected !== null && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)' }}>
              <span className="text-xl">{WEEK_DATA[selected].emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color:'var(--txt-primary)' }}>
                  {WEEK_DATA[selected].day} — {MOOD_LABELS[WEEK_DATA[selected].score]}
                </p>
                <p className="text-xs" style={{ color:'var(--txt-muted)' }}>{WEEK_DATA[selected].note}</p>
              </div>
              <div className="text-xs px-2 py-1 rounded-lg" style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa' }}>
                {WEEK_DATA[selected].sessions} sessions
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Monthly heatmap */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3, duration:0.5 }}
          className="rounded-2xl p-6"
          style={{ background:'rgba(15,15,40,0.8)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
          <h2 className="font-display text-lg font-semibold mb-1" style={{ color:'var(--txt-primary)' }}>This Month</h2>
          <p className="text-xs mb-5" style={{ color:'var(--txt-muted)' }}>Mood heatmap</p>
          <div className="grid grid-cols-7 gap-1.5">
            {MONTH_DATA.map(({ day, score }) => (
              <div key={day}
                title={`Day ${day}: ${MOOD_LABELS[score]}`}
                className="aspect-square rounded-lg cursor-pointer hover:scale-110 transition-transform"
                style={{ background:`${MOOD_COLORS[score]}60`, border:`1px solid ${MOOD_COLORS[score]}40` }}/>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11px]" style={{ color:'var(--txt-muted)' }}>Low</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(v => (
                <div key={v} className="w-4 h-4 rounded" style={{ background:`${MOOD_COLORS[v]}70` }}/>
              ))}
            </div>
            <span className="text-[11px]" style={{ color:'var(--txt-muted)' }}>High</span>
          </div>
        </motion.div>
      </div>

      {/* ── INSIGHTS ───────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4, duration:0.5 }}
        className="rounded-2xl p-6"
        style={{ background:'rgba(15,15,40,0.8)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold" style={{ color:'var(--txt-primary)' }}>Pyro's Insights</h2>
          <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'rgba(124,58,237,0.1)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.2)' }}>
            AI-generated
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {INSIGHTS.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-4 rounded-xl group cursor-pointer transition-colors hover:bg-white/[0.03]"
              style={{ border:'1px solid var(--border)' }}>
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color:'var(--txt-primary)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color:'var(--txt-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
