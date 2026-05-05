import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';

const floats = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 1,
  delay: Math.random() * 4,
  dur: Math.random() * 6 + 5,
}));

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, register, isAuthenticated, user } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → redirect
  if (isAuthenticated && user) {
    const dest = user.onboarded ? '/home' : '/onboarding';
    navigate(dest, { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (isRegister && (!form.name || form.name.trim().length < 2)) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let loggedInUser;
      if (isRegister) {
        loggedInUser = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        loggedInUser = await login({
          email: form.email.trim(),
          password: form.password,
        });
      }

      const from = location.state?.from?.pathname;
      navigate(loggedInUser.onboarded ? (from || '/home') : '/onboarding', { replace: true });
    } catch (err) {
      const fromServer = err.response?.data?.message;
      const network =
        err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Unable to complete sign-in right now. Please try again.'
          : null;
      const msg =
        fromServer || network || err.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060610]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#100528] via-[#060610] to-[#050c1a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(109,40,217,0.22),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_90%,rgba(29,78,216,0.14),transparent)]" />

      {/* Particles */}
      {floats.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-300/25"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -28, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ delay: p.delay, duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="absolute w-[600px] h-[600px] rounded-full bg-violet-700/8 blur-[120px] pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-5"
      >
        <div className="relative rounded-[2.2rem] border border-white/10 bg-white/[0.035] backdrop-blur-2xl p-10 shadow-[0_40px_100px_rgba(0,0,0,0.65)]">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 16 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.55)]"
          >
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M16 6C11 6 7 10 7 15c0 3 1.5 5.5 4 7l1 4h8l1-4c2.5-1.5 4-4 4-7 0-5-4-9-9-9z" fill="white" fillOpacity="0.2"/>
              <path d="M13 14l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="7" r="2" fill="white" fillOpacity="0.5"/>
            </svg>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-center mb-7"
          >
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-violet-400/70 mb-2">
              Pyro-Morph
            </p>
            <h1 className="text-2xl font-bold text-white leading-snug">
              {isRegister ? 'Create your ' : 'Welcome back to '}
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                {isRegister ? 'safe space' : 'safe space'}
              </span>
            </h1>
            <p className="text-white/35 text-sm mt-2 leading-relaxed">
              {isRegister
                ? 'Start your journey with your AI companion.'
                : 'Your AI companion is here whenever you need to talk.'}
            </p>
          </motion.div>

          {/* Toggle tabs */}
          <div className="flex rounded-2xl bg-white/5 border border-white/8 p-1 mb-6">
            {['Sign In', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                onClick={() => { setIsRegister(i === 1); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  (i === 1) === isRegister
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="What should I call you?"
                    maxLength={50}
                    className="w-full bg-white/7 border border-white/12 rounded-2xl px-5 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/60 focus:bg-white/10 transition-all duration-200"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-white/7 border border-white/12 rounded-2xl px-5 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/60 focus:bg-white/10 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full bg-white/7 border border-white/12 rounded-2xl px-5 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/60 focus:bg-white/10 transition-all duration-200"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <span className="text-red-400 text-sm">⚠️ {error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold text-base shadow-[0_0_30px_rgba(139,92,246,0.45)] hover:shadow-[0_0_50px_rgba(139,92,246,0.65)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{isRegister ? 'Creating account…' : 'Signing in…'}</span>
                </div>
              ) : (
                isRegister ? 'Create Account →' : 'Sign In →'
              )}
            </motion.button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-white/20 text-[10px] mt-6"
          >
            🔒 End-to-end encrypted · Your data stays private
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
