import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { userAPI } from '../services/api';
import AvatarOrb from '../components/Avatar';

const AVATARS = [
  {
    gender: 'male',
    name: 'Pyro',
    emoji: '🧑',
    tagline: 'Warm, grounded & steadfast',
    traits: ['Calm listener', 'Solution-focused', 'Encouraging'],
    gradient: ['#7c3aed', '#2563eb'],
    glow: 'rgba(124,58,237,0.5)',
  },
  {
    gender: 'female',
    name: 'Luna',
    emoji: '👩',
    tagline: 'Gentle, intuitive & nurturing',
    traits: ['Empathetic', 'Creative thinker', 'Deeply present'],
    gradient: ['#db2777', '#9333ea'],
    glow: 'rgba(219,39,119,0.5)',
  },
];

const STEPS = ['Welcome', 'Choose Companion', 'Personality', 'Ready'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [step, setStep]             = useState(0);
  const [selectedGender, setGender] = useState(null);
  const [personality, setPersonality] = useState('warm');
  const [saving, setSaving]         = useState(false);

  const selected = AVATARS.find((a) => a.gender === selectedGender);

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save avatar + complete onboarding in parallel
      await Promise.all([
        userAPI.updateAvatar({ gender: selectedGender, personality }),
        userAPI.completeOnboarding(),
      ]);
      updateUser({
        onboarded: true,
        avatar: { gender: selectedGender, name: selected?.name || 'Pyro', personality },
      });
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Onboarding save failed:', err);
      // Still navigate even if save fails
      navigate('/home', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060610] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#100528] via-[#060610] to-[#050c1a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgba(109,40,217,0.2),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-violet-400 scale-125' : 'bg-white/20'
              }`} />
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px transition-all duration-500 ${i < step ? 'bg-violet-400' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
              >
                🔥
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Welcome, <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">{user?.name}</span>
              </h1>
              <p className="text-white/50 text-base leading-relaxed mb-8 max-w-sm mx-auto">
                Let's set up your personal AI companion. This will only take a moment.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold shadow-[0_0_30px_rgba(139,92,246,0.4)]"
              >
                Let's Begin →
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 1: Choose companion ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Choose Your Companion
              </h2>
              <p className="text-white/40 text-sm text-center mb-8">
                Who would you like to guide you?
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {AVATARS.map((av) => (
                  <motion.button
                    key={av.gender}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setGender(av.gender)}
                    className={`relative rounded-3xl border p-6 text-left transition-all duration-300 ${
                      selectedGender === av.gender
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                    style={
                      selectedGender === av.gender
                        ? { boxShadow: `0 0 40px ${av.glow}` }
                        : {}
                    }
                  >
                    {selectedGender === av.gender && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-3">
                      <AvatarOrb gender={av.gender} state="idle" size="md" />
                      <div className="text-center">
                        <p className="text-white font-bold text-lg">{av.name}</p>
                        <p className="text-white/40 text-xs mt-1">{av.tagline}</p>
                      </div>
                      <div className="flex flex-col gap-1 w-full mt-1">
                        {av.traits.map((t) => (
                          <div key={t} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                            <span className="text-white/50 text-xs">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-2xl border border-white/10 text-white/50 hover:text-white/80 transition-colors text-sm"
                >
                  ← Back
                </button>
                <motion.button
                  whileHover={selectedGender ? { scale: 1.02 } : {}}
                  whileTap={selectedGender ? { scale: 0.98 } : {}}
                  onClick={() => selectedGender && setStep(2)}
                  disabled={!selectedGender}
                  className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Personality ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                Set the Vibe
              </h2>
              <p className="text-white/40 text-sm text-center mb-8">
                How should {selected?.name} communicate with you?
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { key: 'warm',     label: 'Warm & Caring',    emoji: '🤗', desc: 'Empathetic and nurturing' },
                  { key: 'calm',     label: 'Calm & Steady',    emoji: '🌊', desc: 'Grounded and peaceful' },
                  { key: 'energetic',label: 'Energetic',         emoji: '⚡', desc: 'Upbeat and motivating' },
                  { key: 'wise',     label: 'Wise & Thoughtful', emoji: '🦉', desc: 'Reflective and deep' },
                ].map((p) => (
                  <motion.button
                    key={p.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPersonality(p.key)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                      personality === p.key
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <p className="text-white text-sm font-semibold">{p.label}</p>
                    <p className="text-white/40 text-xs mt-1">{p.desc}</p>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-2xl border border-white/10 text-white/50 hover:text-white/80 transition-colors text-sm"
                >
                  ← Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold"
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Ready ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <AvatarOrb
                  gender={selectedGender}
                  state="speaking"
                  size="xl"
                  showLabel
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Meet <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">{selected?.name}</span>!
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your companion is ready. {selected?.name} will be with you whenever you need support, guidance, or just someone to talk to.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                disabled={saving}
                className="px-12 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(139,92,246,0.5)]"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </div>
                ) : (
                  '✨ Enter Your Space →'
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
