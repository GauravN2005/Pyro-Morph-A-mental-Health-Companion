import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  Mic, Video, Bell, Moon, Shield, HelpCircle, ChevronRight,
  LogOut, Star, User, Palette, Globe, Lock, Zap, Download
} from 'lucide-react'

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all duration-300"
      style={{ background: on ? 'linear-gradient(90deg,#7c3aed,#4f46e5)' : 'var(--elevated)', boxShadow: on ? '0 0 12px rgba(124,58,237,0.4)' : 'none' }}>
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type:'spring', stiffness:500, damping:30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"/>
    </button>
  )
}

function Section({ title, children, delay=0 }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.45 }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
        style={{ color:'var(--txt-muted)' }}>{title}</p>
      <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(15,15,40,0.8)', border:'1px solid var(--border)', backdropFilter:'blur(20px)' }}>
        {children}
      </div>
    </motion.div>
  )
}

function ToggleRow({ icon:Icon, label, desc, color, bg, on, onChange, last }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] ${!last ? 'border-b' : ''}`}
      style={{ borderColor:'rgba(139,92,246,0.08)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}>
        <Icon size={16} className={color}/>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color:'var(--txt-primary)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color:'var(--txt-muted)' }}>{desc}</p>}
      </div>
      <Toggle on={on} onChange={onChange}/>
    </div>
  )
}

function LinkRow({ icon:Icon, label, sub, color, bg, last, badge }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-white/[0.03] group ${!last ? 'border-b' : ''}`}
      style={{ borderColor:'rgba(139,92,246,0.08)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:bg }}>
        <Icon size={16} className={color}/>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color:'var(--txt-primary)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color:'var(--txt-muted)' }}>{sub}</p>}
      </div>
      {badge && <span className="text-[11px] px-2 py-0.5 rounded-full mr-2"
        style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.3)' }}>{badge}</span>}
      <ChevronRight size={15} className="opacity-30 group-hover:opacity-70 transition-opacity" style={{ color:'var(--txt-secondary)' }}/>
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const [s, setS] = useState({
    voiceChat:true, videoChat:false, notifications:true, darkMode:true,
    animations:true, sounds:false, privacy:true,
  })
  const set = (k) => (v) => setS(p => ({ ...p, [k]:v }))

  return (
    <div className="p-6 lg:p-8 max-w-screen-lg space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color:'var(--txt-primary)' }}>Settings</h1>
        <p style={{ color:'var(--txt-secondary)' }}>Customize your Pyro-Morph experience.</p>
      </motion.div>

      {/* Profile card */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05, duration:0.45 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background:'rgba(15,15,40,0.8)', border:'1px solid rgba(139,92,246,0.25)', backdropFilter:'blur(30px)' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.7),rgba(6,182,212,0.4),transparent)' }}/>

        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow:'0 0 30px rgba(124,58,237,0.4)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2"
              style={{ borderColor:'var(--depth)' }}/>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold" style={{ color:'var(--txt-primary)' }}>{user?.name || 'User'}</h2>
            <p className="text-sm" style={{ color:'var(--txt-secondary)' }}>{user?.email || 'Logged in'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.3)' }}>Free Plan</span>

            </div>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'white' }}>
            Upgrade to Pro
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          <Section title="Session Modes" delay={0.1}>
            <ToggleRow icon={Mic}   label="Voice Chat"  desc="Enable real-time voice conversations" color="text-violet-300" bg="rgba(124,58,237,0.1)"  on={s.voiceChat}      onChange={set('voiceChat')}/>
            <ToggleRow icon={Video} label="Video Call"  desc="Enable face-to-face AI sessions"      color="text-cyan-300"   bg="rgba(6,182,212,0.1)"   on={s.videoChat}      onChange={set('videoChat')} last/>
          </Section>

          <Section title="Notifications & Sound" delay={0.15}>
            <ToggleRow icon={Bell} label="Push Notifications" desc="Daily check-in reminders" color="text-amber-300" bg="rgba(245,158,11,0.1)" on={s.notifications} onChange={set('notifications')}/>
            <ToggleRow icon={Zap}  label="Sound Effects"       desc="UI and session sounds"   color="text-rose-300"  bg="rgba(244,63,94,0.1)"  on={s.sounds}         onChange={set('sounds')} last/>
          </Section>

          <Section title="Appearance" delay={0.2}>
            <ToggleRow icon={Moon}    label="Dark Mode"    desc="Optimised for low-light use"      color="text-indigo-300" bg="rgba(79,70,229,0.1)"  on={s.darkMode}    onChange={set('darkMode')}/>
            <ToggleRow icon={Palette} label="Animations"   desc="Smooth transitions and effects"   color="text-violet-300" bg="rgba(124,58,237,0.1)" on={s.animations}  onChange={set('animations')} last/>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Section title="Privacy & Security" delay={0.12}>
            <ToggleRow icon={Lock}  label="Enhanced Privacy" desc="Extra data protection layer" color="text-emerald-300" bg="rgba(16,185,129,0.1)" on={s.privacy} onChange={set('privacy')}/>
            <LinkRow icon={Shield}  label="Privacy Policy"   sub="How we handle your data" color="text-emerald-300" bg="rgba(16,185,129,0.08)"/>
            <LinkRow icon={Download} label="Export My Data"  sub="Download your conversation history" color="text-blue-300" bg="rgba(59,130,246,0.08)" last/>
          </Section>

          <Section title="Support & Feedback" delay={0.18}>
            <LinkRow icon={HelpCircle} label="Help Center"        sub="FAQs, guides and documentation"   color="text-blue-300"   bg="rgba(59,130,246,0.08)"/>
            <LinkRow icon={Star}       label="Rate Pyro-Morph"    sub="Share your experience"            color="text-amber-300"  bg="rgba(245,158,11,0.08)" badge="⭐ 4.9"/>
            <LinkRow icon={Globe}      label="Community"          sub="Join others on their journey"     color="text-violet-300" bg="rgba(124,58,237,0.08)" last/>
          </Section>

          <Section title="Account" delay={0.22}>
            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-red-500/[0.04] group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(239,68,68,0.1)' }}>
                <LogOut size={16} className="text-red-400"/>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Clear All Data</p>
                <p className="text-xs mt-0.5" style={{ color:'var(--txt-muted)' }}>Permanently erase all session history</p>
              </div>
              <ChevronRight size={15} className="opacity-30 group-hover:opacity-70 transition-opacity text-red-400"/>
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
        className="text-center pb-4 space-y-1">
        <p className="text-xs font-mono" style={{ color:'var(--txt-ghost)' }}>Pyro-Morph v1.0.0</p>
        <p style={{ color:'var(--txt-ghost)', fontSize:11 }}>Built with 💜 · Private by design · Your data, always yours</p>
      </motion.div>
    </div>
  )
}
