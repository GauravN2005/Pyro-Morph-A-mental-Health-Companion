import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────
   AvatarOrb
   Props:
     gender      'male' | 'female' | null
     state       'idle' | 'speaking' | 'listening' | 'thinking'
     emotion     string  (e.g. 'happy', 'sad', 'calm')
     size        'sm' | 'md' | 'lg' | 'xl'
     showLabel   boolean
───────────────────────────────────────────────────────────────*/

const SIZES = {
  sm:  { orb: 'w-12 h-12',   emoji: 'text-2xl',  ring: 'inset-[-6px]'  },
  md:  { orb: 'w-20 h-20',   emoji: 'text-4xl',  ring: 'inset-[-8px]'  },
  lg:  { orb: 'w-40 h-40',   emoji: 'text-6xl',  ring: 'inset-[-12px]' },
  xl:  { orb: 'w-64 h-64',   emoji: 'text-8xl',  ring: 'inset-[-18px]' },
};

const AVATAR_CONFIG = {
  male: {
    emoji:      '🧑',
    altEmoji:   '👨',
    color:      ['#7c3aed', '#2563eb'],  // violet → blue
    glow:       'rgba(124,58,237,0.6)',
    glowSoft:   'rgba(124,58,237,0.2)',
    name:       'Pyro',
    label:      'Your AI Companion',
  },
  female: {
    emoji:      '👩',
    altEmoji:   '🧕',
    color:      ['#db2777', '#9333ea'],  // pink → purple
    glow:       'rgba(219,39,119,0.6)',
    glowSoft:   'rgba(219,39,119,0.2)',
    name:       'Luna',
    label:      'Your AI Companion',
  },
  null: {
    emoji:      '🔥',
    altEmoji:   '✨',
    color:      ['#7c3aed', '#06b6d4'],  // violet → cyan
    glow:       'rgba(124,58,237,0.6)',
    glowSoft:   'rgba(124,58,237,0.2)',
    name:       'Pyro',
    label:      'Your AI Companion',
  },
};

const EMOTION_OVERLAYS = {
  happy:    { emoji: '😊', tint: 'rgba(34,197,94,0.08)'  },
  sad:      { emoji: '😔', tint: 'rgba(59,130,246,0.08)' },
  anxious:  { emoji: '😰', tint: 'rgba(234,179,8,0.08)'  },
  angry:    { emoji: '😤', tint: 'rgba(239,68,68,0.08)'  },
  calm:     { emoji: '😌', tint: 'rgba(99,102,241,0.08)' },
  tired:    { emoji: '😴', tint: 'rgba(107,114,128,0.08)'},
  neutral:  { emoji: null, tint: 'transparent'            },
};

export default function AvatarOrb({
  gender   = null,
  state    = 'idle',
  emotion  = 'neutral',
  size     = 'lg',
  showLabel = false,
  className = '',
}) {
  const cfg    = AVATAR_CONFIG[gender] ?? AVATAR_CONFIG[null];
  const sz     = SIZES[size] ?? SIZES.lg;
  const emo    = EMOTION_OVERLAYS[emotion] ?? EMOTION_OVERLAYS.neutral;
  const isTalking   = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking  = state === 'thinking';

  const borderColor = isTalking
    ? cfg.glow.replace('0.6', '0.85')
    : isListening
      ? 'rgba(16,185,129,0.7)'
      : 'rgba(124,58,237,0.3)';

  const boxShadow = isTalking
    ? `0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glowSoft}`
    : isListening
      ? '0 0 50px rgba(16,185,129,0.4)'
      : `0 0 30px ${cfg.glowSoft}`;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        {/* ── Pulse ring when speaking ─── */}
        <AnimatePresence>
          {isTalking && (
            <>
              <motion.div
                key="ring1"
                className={`absolute ${sz.ring} rounded-full pointer-events-none`}
                style={{ background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)` }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.7, 0], scale: [1, 1.6] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                key="ring2"
                className={`absolute ${sz.ring} rounded-full pointer-events-none`}
                style={{ background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)` }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.4, 0], scale: [1, 1.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── Listening ring ─── */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              key="listen-ring"
              className={`absolute ${sz.ring} rounded-full border-2 border-emerald-400/60 pointer-events-none`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* ── Main orb ─── */}
        <motion.div
          className={`${sz.orb} rounded-full flex items-center justify-center relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, rgba(20,20,50,0.95), rgba(10,10,30,0.98))`,
            border: `2px solid ${borderColor}`,
            boxShadow,
            transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          }}
          animate={
            isTalking
              ? { scale: [1, 1.03, 1, 1.02, 1] }
              : isThinking
                ? { rotate: [0, 2, -2, 0] }
                : { y: [0, -4, 0] }
          }
          transition={
            isTalking
              ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
              : isThinking
                ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, ${cfg.color[0]}55, ${cfg.color[1]}55)`,
            }}
          />

          {/* Emotion tint */}
          {emo.tint !== 'transparent' && (
            <div className="absolute inset-0" style={{ background: emo.tint }} />
          )}

          {/* Avatar emoji */}
          <motion.span
            className={`${sz.emoji} relative z-10 select-none`}
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
            animate={isTalking ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            {cfg.emoji}
          </motion.span>

          {/* Thinking dots overlay */}
          <AnimatePresence>
            {isThinking && (
              <motion.div
                className="absolute bottom-3 flex gap-1 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-300"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Status indicator dot ─── */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#070711] transition-colors duration-300"
          style={{
            background: isTalking
              ? '#a855f7'
              : isListening
                ? '#10b981'
                : isThinking
                  ? '#f59e0b'
                  : '#10b981',
          }}
        />
      </div>

      {/* ── Label / state text ─── */}
      {showLabel && (
        <div className="text-center">
          <p className="text-white font-semibold text-sm">{cfg.name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {isTalking
              ? '💬 Speaking...'
              : isListening
                ? '👂 Listening...'
                : isThinking
                  ? '🤔 Thinking...'
                  : '✨ Ready to listen'}
          </p>
          {emo.emoji && (
            <motion.p
              key={emotion}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-violet-300 text-xs mt-1"
            >
              {emo.emoji} Sensing your mood
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
}
