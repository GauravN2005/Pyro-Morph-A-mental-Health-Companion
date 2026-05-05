import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, ArrowRight, Shield, Zap, Heart, Github } from 'lucide-react'

const stagger = { animate: { transition: { staggerChildren: 0.09 } } }
const item = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

const FEATURES = [
  { icon: Shield, label: 'Private & Encrypted',  color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)'  },
  { icon: Zap,    label: 'Always Available',      color: 'text-amber-400',   bg: 'rgba(245,158,11,0.08)'  },
  { icon: Heart,  label: 'Emotionally Aware',     color: 'text-rose-400',    bg: 'rgba(244,63,94,0.08)'   },
]

const STATS = [
  { value: 'AI',    label: 'Powered',           sub: 'Claude AI at the core',    color: 'text-violet-300',  border: 'rgba(139,92,246,0.3)' },
  { value: '100%',  label: 'Private',           sub: 'End-to-end encrypted',     color: 'text-cyan-300',    border: 'rgba(6,182,212,0.3)'  },
  { value: '24/7',  label: 'Available',         sub: 'Always here for you',      color: 'text-emerald-300', border: 'rgba(16,185,129,0.3)' },
]

const FEATURES_GRID = [
  { emoji:'💬', title:'AI Chat Companion',  desc:'Emotionally aware conversations powered by Claude AI. Detects your mood and responds with empathy.',              tag:'Live',        tagColor:'text-emerald-400', tagBg:'rgba(16,185,129,0.1)',   tagBorder:'rgba(16,185,129,0.3)'  },
  { emoji:'🧑', title:'Avatar System',      desc:'Choose a male or female AI companion. Watch them animate, speak, listen, and react in real time.',                tag:'Live',        tagColor:'text-emerald-400', tagBg:'rgba(16,185,129,0.1)',   tagBorder:'rgba(16,185,129,0.3)'  },
  { emoji:'📊', title:'Mood Tracker',       desc:'Log your emotional state daily. Visualize patterns and notice trends in your mental wellness journey.',           tag:'New',         tagColor:'text-cyan-300',    tagBg:'rgba(6,182,212,0.1)',    tagBorder:'rgba(6,182,212,0.3)'   },
  { emoji:'🎙️', title:'Voice Mode',         desc:'Speak to your companion naturally. Built for moments when typing just feels like too much.',                      tag:'Coming Soon', tagColor:'text-violet-300',  tagBg:'rgba(124,58,237,0.1)',   tagBorder:'rgba(124,58,237,0.3)'  },
  { emoji:'📹', title:'Video Session',      desc:'Face-to-face sessions with your AI companion. Full avatar animation, captions, and waveform feedback.',           tag:'New',         tagColor:'text-cyan-300',    tagBg:'rgba(6,182,212,0.1)',    tagBorder:'rgba(6,182,212,0.3)'   },
  { emoji:'🔐', title:'Secure Accounts',    desc:'JWT-authenticated accounts with bcrypt password hashing. Your data is encrypted and private.',                    tag:'Live',        tagColor:'text-emerald-400', tagBg:'rgba(16,185,129,0.1)',   tagBorder:'rgba(16,185,129,0.3)'  },
]

// Typing animation
function useTypingText(texts, speed=60, pause=2200) {
  const [displayed, setDisplayed] = useState('')
  const [textIdx, setTextIdx]     = useState(0)
  const [charIdx, setCharIdx]     = useState(0)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    let timer
    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx(c => c + 1), speed)
    } else if (!deleting && charIdx === current.length) {
      timer = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx(c => c - 1), speed / 2)
    } else if (deleting && charIdx === 0) {
      setDeleting(false)
      setTextIdx(i => (i + 1) % texts.length)
    }
    setDisplayed(texts[textIdx].slice(0, charIdx))
    return () => clearTimeout(timer)
  }, [charIdx, deleting, textIdx, texts, speed, pause])

  return displayed
}

export default function LandingPage() {
  const navigate = useNavigate()
  const typed = useTypingText(['deserves care.', 'needs a safe space.', 'matters every day.', 'deserves to be heard.'])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--void)' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 lg:px-16 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow:'0 0 24px rgba(124,58,237,0.5)', animation:'pulseGlow 3s ease-in-out infinite' }}>
            <Flame size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-grad">Pyro-Morph</span>

        </div>
        <div className="flex items-center gap-5">
          <span className="hidden md:flex items-center gap-1.5 text-sm cursor-pointer transition-colors hover:text-white" style={{ color:'var(--txt-muted)' }}>
            <Github size={15} /> GitHub
          </span>
          <button onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-violet-300 transition-all hover:text-white hover:bg-violet-600/20"
            style={{ background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.3)' }}>
            Open App →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section variants={stagger} initial="initial" animate="animate"
        className="relative z-10 max-w-screen-xl mx-auto px-8 lg:px-16 pt-16 pb-24 lg:pt-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-8">
            <motion.div variants={item}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-8"
                style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.25)', color:'var(--txt-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                AI Mental Wellness · Available 24/7
              </div>
              <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.06] tracking-tight">
                <span style={{ color:'var(--txt-primary)' }}>Your mind</span><br />
                <span className="text-grad italic" style={{ minHeight:'1.2em', display:'block' }}>
                  {typed}<span className="animate-pulse">|</span>
                </span>
              </h1>
            </motion.div>

            <motion.p variants={item} className="text-lg leading-relaxed max-w-lg" style={{ color:'var(--txt-secondary)' }}>
              Pyro-Morph is an emotionally intelligent AI companion that listens without judgment,
              understands your mood, and is always here — whenever you need to talk.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-4">
              <motion.button whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }}
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-base"
                style={{ background:'linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#06b6d4 100%)', boxShadow:'0 0 40px rgba(124,58,237,0.45),0 8px 24px rgba(0,0,0,0.3)' }}>
                <Flame size={18} /> Start Talking Now <ArrowRight size={16} />
              </motion.button>
              <button onClick={() => navigate('/login')}
                className="px-7 py-4 rounded-2xl text-sm font-medium transition-all hover:bg-white/5"
                style={{ color:'var(--txt-secondary)', border:'1px solid var(--border-hi)' }}>
                Create Account
              </button>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-3">
              {FEATURES.map(({ icon:Icon, label, color, bg }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background:bg, border:'1px solid rgba(255,255,255,0.05)' }}>
                  <Icon size={13} className={color} />
                  <span style={{ color:'var(--txt-secondary)' }}>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: preview card */}
          <motion.div variants={item} className="relative hidden lg:block">
            <div className="relative rounded-3xl p-8 overflow-hidden"
              style={{ background:'rgba(15,15,40,0.8)', border:'1px solid rgba(139,92,246,0.25)', backdropFilter:'blur(40px)', boxShadow:'0 40px 100px rgba(0,0,0,0.5),0 0 60px rgba(124,58,237,0.1)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.8),rgba(6,182,212,0.5),transparent)' }} />

              {/* Status bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">Live Preview</span>
                </div>

              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4 relative"
                  style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2))', border:'1px solid rgba(124,58,237,0.4)', animation:'pulseGlow 3s ease-in-out infinite,floatY 6s ease-in-out infinite' }}>
                  <span className="text-5xl">🔥</span>
                  <div className="absolute inset-0 rounded-3xl border border-violet-400/30" style={{ animation:'ripple 2.5s linear infinite' }} />
                </div>
                <h3 className="font-display text-xl font-semibold" style={{ color:'var(--txt-primary)' }}>Pyro</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400">Active · Ready to listen</span>
                </div>
              </div>

              {/* Mock chat */}
              <div className="space-y-3">
                {[
                  { bot:true,  text:"Hey, how are you feeling today? 💜" },
                  { bot:false, text:"A bit stressed with deadlines, honestly." },
                  { bot:true,  text:"That's valid. Let's breathe through it together." },
                ].map((msg,i) => (
                  <div key={i} className={`flex ${msg.bot?'justify-start':'justify-end'}`}>
                    <div className="max-w-[82%] px-4 py-2.5 rounded-2xl text-sm"
                      style={msg.bot
                        ? { background:'rgba(26,26,64,0.9)', border:'1px solid rgba(139,92,246,0.2)', color:'var(--txt-primary)' }
                        : { background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff' }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 pl-2 pt-1">
                  <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
                  <span className="text-xs ml-1" style={{ color:'var(--txt-muted)' }}>Pyro is typing…</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)' }}>
                <span className="text-xl">😔</span>
                <div>
                  <p className="text-xs" style={{ color:'var(--txt-muted)' }}>Detected emotion</p>
                  <p className="text-sm font-semibold text-violet-300">Stressed · Offering support</p>
                </div>
              </div>
            </div>

            {/* Honest floating badges */}


            <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:9, repeat:Infinity, ease:'easeInOut', delay:2 }}
              className="absolute -right-10 bottom-20 rounded-2xl px-4 py-3"
              style={{ background:'rgba(10,10,31,0.95)', border:'1px solid rgba(6,182,212,0.3)', backdropFilter:'blur(20px)' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">AI Powered</span>
              </div>
              <p className="text-lg font-bold" style={{ color:'var(--txt-primary)' }}>24 / 7</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--txt-muted)' }}>Always available</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats bar — honest */}
        <motion.div variants={item} className="mt-20">
          <div className="rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
            style={{ background:'rgba(15,15,40,0.6)', border:'1px solid rgba(139,92,246,0.15)', backdropFilter:'blur(20px)' }}>
            {STATS.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl"
                style={{ background: i===1 ? 'rgba(139,92,246,0.04)' : 'transparent' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.border.replace('0.3','0.08'), border:`1px solid ${s.border}` }}>
                  <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm font-semibold" style={{ color:'var(--txt-primary)' }}>{s.label}</p>
                  <p className="text-xs" style={{ color:'var(--txt-muted)' }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div variants={item} className="mt-20">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-8" style={{ color:'var(--txt-muted)' }}>
            What's inside
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES_GRID.map((f, i) => (
              <div key={i} className="rounded-2xl p-6 hover:border-violet-500/30 transition-colors group"
                style={{ background:'rgba(15,15,40,0.6)', border:'1px solid rgba(139,92,246,0.12)', backdropFilter:'blur(20px)' }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{f.emoji}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${f.tagColor}`}
                    style={{ background:f.tagBg, border:`1px solid ${f.tagBorder}` }}>
                    {f.tag}
                  </span>
                </div>
                <p className="font-semibold text-sm mb-2" style={{ color:'var(--txt-primary)' }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color:'var(--txt-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={item} className="mt-20 text-center">
          <div className="inline-block rounded-3xl px-12 py-10"
            style={{ background:'rgba(15,15,40,0.8)', border:'1px solid rgba(139,92,246,0.25)', backdropFilter:'blur(40px)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:'var(--txt-muted)' }}>
              Ready to begin?
            </p>
            <h2 className="font-display text-3xl font-bold mb-3" style={{ color:'var(--txt-primary)' }}>
              Your companion is waiting.
            </h2>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color:'var(--txt-secondary)' }}>
              Create a free account — no credit card, no commitment. Just a safe space to talk.
            </p>
            <motion.button whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.97 }}
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl text-white font-semibold"
              style={{ background:'linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#06b6d4 100%)', boxShadow:'0 0 40px rgba(124,58,237,0.45)' }}>
              <Flame size={18} /> Get Started Free <ArrowRight size={16} />
            </motion.button>
            <p className="text-xs mt-4" style={{ color:'var(--txt-muted)' }}>
              🔒 No credit card needed · Free to get started
            </p>
          </div>
        </motion.div>
      </motion.section>
    </div>
  )
}
