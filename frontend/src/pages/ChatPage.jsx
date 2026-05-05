import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { userAPI } from '../services/api';
import {
  ConversationContext,
  CrisisDetector,
  OpenAIChatService,
  TextEmotionAnalyzer,
  loadChatbotSettings,
  saveChatbotSettings,
} from '../services/chatbotEngine';
import AvatarOrb from '../components/Avatar';
import ChatBubble from '../components/ChatBubble';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const EMOTION_LABELS = {
  sad:     '😔 Sensing sadness',
  anxious: '😰 Sensing anxiety',
  happy:   '😊 Sensing positivity',
  angry:   '😤 Sensing frustration',
  distressed: '🫂 Sensing distress',
  calm:    '😌 Sensing calmness',
  neutral: null,
};

// Fallback responses if API is unavailable
const FALLBACK_RESPONSES = [
  "I hear you. It sounds like things have been really heavy lately. You don't have to carry that alone.",
  "That's completely valid to feel that way. Can you tell me more about what's been going on?",
  "You're being really brave by opening up. I'm here, and I'm not going anywhere.",
  "It's okay to feel overwhelmed. Let's take this one step at a time together.",
  "I'm so glad you reached out today. What would feel most helpful right now?",
  "Sometimes just putting it into words helps. You're doing great by talking about it.",
  "I'm truly sorry you've been going through this. Your feelings matter deeply.",
];

export default function ChatPage() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const avatar      = user?.avatar;
  const companionName = avatar?.name || 'Pyro';

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hi there 💜 I'm ${companionName}, your companion. This is a safe space — no judgment, just understanding. How are you feeling today?`,
      isUser: false,
      timestamp: 'Just now',
      emotion: '✨ Ready to listen',
    },
  ]);
  const [input, setInput]           = useState('');
  const [avatarState, setAvState]   = useState('idle');
  const [emotion, setEmotion]       = useState('neutral');
  const [emotionLabel, setEmoLabel] = useState(null);
  const [crisisElevated, setCrisisElevated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [showApiKey, setShowApiKey] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fallbackIdx = useRef(0);
  const contextRef = useRef(new ConversationContext(12));
  const analyzerRef = useRef(new TextEmotionAnalyzer());
  const crisisDetectorRef = useRef(new CrisisDetector());
  const serviceRef = useRef(null);
  const visibleMessages = messages.slice(-8);

  useEffect(() => {
    const settings = loadChatbotSettings();
    setApiKey(settings.apiKey);
    setBaseUrl(settings.baseUrl);
    serviceRef.current = new OpenAIChatService(settings.apiKey, settings.baseUrl);

    return () => {
      serviceRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    contextRef.current.clear();
    messages.forEach((m) => {
      contextRef.current.add({ role: m.isUser ? 'user' : 'assistant', text: m.text });
    });
  }, []);

  const getAIResponse = async (userMessage) => {
    const analysis = analyzerRef.current.analyze(
      userMessage,
      contextRef.current.recentUserTextStubs(4)
    );
    const risk = crisisDetectorRef.current.evaluate(userMessage);
    setEmotion(analysis.primary);
    setEmoLabel(EMOTION_LABELS[analysis.primary] || null);
    setCrisisElevated(risk.isElevated);

    try {
      const response = await serviceRef.current.generateReply({
        history: contextRef.current.toOpenAIHistory(),
        userEmotion: analysis,
        crisisElevated: risk.isElevated,
      });
      return response || null;
    } catch {
      // Graceful fallback
      const fb = FALLBACK_RESPONSES[fallbackIdx.current % FALLBACK_RESPONSES.length];
      fallbackIdx.current++;
      return fb;
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || avatarState === 'thinking') return;

    const userMsg = {
      id: Date.now(),
      text,
      isUser: true,
      timestamp: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
  contextRef.current.add({ role: 'user', text });
    setInput('');
    setAvState('thinking');

    // Track message count for local profile stats (fire and forget)
    userAPI.incrementMessages().catch(() => {});

    const responseText = await getAIResponse(text);

    setAvState('speaking');

    const botMsg = {
      id: Date.now() + 1,
      text: responseText,
      isUser: false,
      timestamp: formatTime(new Date()),
      emotion: EMOTION_LABELS[emotion],
    };

    setMessages((prev) => [...prev, botMsg]);
    contextRef.current.add({ role: 'assistant', text: responseText });

    // Switch to listening after speaking
    setTimeout(() => setAvState('listening'), 2500);
    setTimeout(() => setAvState('idle'), 5000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaveSettings = () => {
    saveChatbotSettings({ apiKey, baseUrl });
    serviceRef.current?.dispose();
    serviceRef.current = new OpenAIChatService(apiKey, baseUrl);
    setSettingsOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#070711] overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 px-4 pt-4 pb-3 border-b border-white/8 bg-[#070711]/80 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Live avatar in header */}
          <AvatarOrb gender={avatar?.gender} state={avatarState} size="sm" />

          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">{companionName}</p>
            <p className="text-xs mt-0.5" style={{
              color: avatarState === 'speaking' ? '#a855f7'
                   : avatarState === 'listening' ? '#10b981'
                   : avatarState === 'thinking' ? '#f59e0b'
                   : '#10b981'
            }}>
              {avatarState === 'speaking' ? '💬 Speaking...'
               : avatarState === 'listening' ? '👂 Listening...'
               : avatarState === 'thinking' ? '🤔 Thinking...'
               : '✨ Always here for you'}
            </p>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/12 text-white/70 text-xs hover:text-white hover:bg-white/12 transition-all"
          >
            Settings
          </button>

          {emotionLabel && (
            <motion.div
              key={emotionLabel}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-semibold"
            >
              {emotionLabel}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden px-4 py-5">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {crisisElevated && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/12 border border-rose-500/25 text-rose-200 text-xs">
              High-risk language detected. If this is an immediate safety issue, contact local emergency services or a crisis helpline now.
            </div>
          )}

          <AnimatePresence>
            {visibleMessages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.text}
                isUser={msg.isUser}
                timestamp={msg.timestamp}
                emotion={!msg.isUser && msg.emotion ? msg.emotion : null}
              />
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {avatarState === 'thinking' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 self-start"
            >
              <AvatarOrb gender={avatar?.gender} state="thinking" size="sm" />
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/8 border border-white/10 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 pb-6 pt-3 border-t border-white/8 bg-[#070711]/80 backdrop-blur-xl"
      >
        <div className="max-w-lg mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind…"
              rows={1}
              autoComplete="off"
              disabled={avatarState === 'thinking'}
              className="w-full appearance-none bg-[#0d1020] border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/45 text-sm resize-none focus:outline-none focus:border-violet-500/70 transition-all leading-relaxed min-h-[46px] max-h-28 overflow-hidden disabled:opacity-50"
              style={{ scrollbarWidth: 'none', color: '#ffffff', caretColor: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={sendMessage}
            disabled={!input.trim() || avatarState === 'thinking'}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
          >
            <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </motion.button>
        </div>

        <p className="text-center text-white/20 text-[10px] mt-3">
          Your conversations are private and encrypted 🔒
        </p>
      </motion.div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#141425] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-base font-semibold">Chatbot Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-white/50 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <label className="block text-white/70 text-xs mb-1">OpenAI API Key</label>
            <div className="relative mb-3">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[#0d1020] border border-white/20 rounded-xl px-3 py-2 pr-16 text-white text-sm placeholder-white/40 outline-none focus:border-violet-500/70"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-2 py-1 rounded-md bg-white/10 text-white/75 hover:text-white"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <label className="block text-white/70 text-xs mb-1">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-[#0d1020] border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder-white/40 mb-4 outline-none focus:border-violet-500/70"
            />

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold text-sm"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
