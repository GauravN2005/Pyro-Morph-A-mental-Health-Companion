import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, MessageCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import AvatarOrb from '../components/Avatar';

export default function VideoCallPage() {
  const { user } = useAuth();
  const avatar = user?.avatar;
  const companionName = avatar?.name || 'Pyro';
  const videoApiUrl = import.meta.env.VITE_VIDEO_API_URL || 'http://127.0.0.1:5001';

  const [micOn, setMicOn]         = useState(true);
  const [videoOn, setVideoOn]     = useState(true);
  const [callEnded, setEnded]     = useState(false);
  const [seconds, setSeconds]     = useState(0);
  const [avatarState, setAvState] = useState('idle');
  const [caption, setCaption]     = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('Connecting camera...');
  const [selfEmotion, setSelfEmotion] = useState('neutral');
  const [selfConfidence, setSelfConfidence] = useState(0);
  const [apiOnline, setApiOnline] = useState(false);
  const [detectionMode, setDetectionMode] = useState('detector');
  const [previewReady, setPreviewReady] = useState(false);

  const CAPTIONS = [
    "I'm here with you. Take a deep breath.",
    "How are you feeling right now?",
    "You're doing really well by showing up today.",
    "I can see you're working through something. I'm listening.",
    "What's been on your mind lately?",
    "Remember — you don't have to face this alone.",
  ];

  const EMOTION_PROMPTS = {
    angry: 'That looks intense. Let’s slow it down together.',
    anxious: 'I’m noticing some tension. I’m right here with you.',
    calm: 'You look steady right now. I’m listening.',
    distressed: 'I can see some distress. We’ll keep this gentle.',
    happy: 'You look brighter just now. That’s good to see.',
    neutral: 'I’m with you. Tell me what’s on your mind.',
    sad: 'I can see some heaviness there. Take your time.',
    surprised: 'Something caught your attention. I’m here.',
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const analysisTimerRef = useRef(null);
  const fallbackTimersRef = useRef([]);
  const speakingIndexRef = useRef(0);
  const requestInFlightRef = useRef(false);

  const clearFallbackTimers = () => {
    fallbackTimersRef.current.forEach((timerId) => {
      clearTimeout(timerId);
      clearInterval(timerId);
    });
    fallbackTimersRef.current = [];
  };

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => clearFallbackTimers();
  }, []);

  useEffect(() => {
    if (!videoOn || !cameraReady) {
      return undefined;
    }

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) {
      return undefined;
    }

    let cancelled = false;

    const attachStream = async () => {
      try {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();

        if (!cancelled) {
          setPreviewReady(true);
        }
      } catch (error) {
        console.warn('Video preview attach failed:', error);
        if (!cancelled) {
          setPreviewReady(false);
        }
      }
    };

    attachStream();

    return () => {
      cancelled = true;
    };
  }, [videoOn, cameraReady]);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setPreviewReady(false);
      setCameraReady(false);
      setApiOnline(false);
    };

    const startCamera = async () => {
      if (!videoOn) {
        stopCamera();
        setAnalysisStatus('Camera off');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setPreviewReady(false);
        setCameraReady(true);
        setAnalysisStatus('Camera ready');
      } catch (error) {
        console.error('Camera access failed:', error);
        stopCamera();
        setAnalysisStatus('Camera unavailable');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [videoOn]);

  useEffect(() => {
    if (!videoOn || !cameraReady) {
      return undefined;
    }

    const captureAndAnalyze = async () => {
      if (requestInFlightRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      requestInFlightRef.current = true;
      try {
        const width = Math.max(640, video.videoWidth || 0, 960);
        const height = Math.max(360, video.videoHeight || 0, 540);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, width, height);

        const image = canvas.toDataURL('image/jpeg', 0.92);
        const response = await fetch(`${videoApiUrl.replace(/\/$/, '')}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        });

        if (!response.ok) {
          throw new Error(`OpenCV API error: ${response.status}`);
        }

        const data = await response.json();
        setApiOnline(true);
        const emotion = data.emotion || 'neutral';
        const confidence = Number(data.confidence || 0);
        const mode = data.detectionMode || (data.faceDetected ? 'detector' : 'fallback-center');
        setSelfEmotion(emotion);
        setSelfConfidence(confidence);
        setDetectionMode(mode);

        const label = `${emotion.toUpperCase()} ${(confidence * 100).toFixed(0)}% · ${mode}`;
        setAnalysisStatus(label);
        setCaption(EMOTION_PROMPTS[emotion] || `OpenCV sees ${emotion} right now.`);

        if (emotion === 'happy' || emotion === 'surprise') {
          setAvState('speaking');
        } else if (emotion === 'sad' || emotion === 'anxious' || emotion === 'distressed' || emotion === 'angry') {
          setAvState('listening');
        } else {
          setAvState('idle');
        }
      } catch (error) {
        console.error('OpenCV analysis failed:', error);
        setApiOnline(false);
        setAnalysisStatus('OpenCV offline');
      } finally {
        requestInFlightRef.current = false;
      }
    };

    analysisTimerRef.current = setInterval(captureAndAnalyze, 1400);
    captureAndAnalyze();

    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    };
  }, [videoOn, cameraReady, videoApiUrl]);

  useEffect(() => {
    if (videoOn && cameraReady) return undefined;

    let captionIdx = speakingIndexRef.current;

    const cycle = () => {
      setAvState('speaking');
      setCaption(CAPTIONS[captionIdx % CAPTIONS.length]);
      captionIdx += 1;
      speakingIndexRef.current = captionIdx;

      const speakDuration = 2000 + Math.random() * 2000;
      const listenDelay = setTimeout(() => {
        setAvState('listening');
        setCaption('');

        const idleDelay = setTimeout(() => {
          setAvState('idle');
        }, 3000 + Math.random() * 2000);

        fallbackTimersRef.current.push(idleDelay);
      }, speakDuration);

      fallbackTimersRef.current.push(listenDelay);
    };

    const first = setTimeout(cycle, 2000);
    const recurring = setInterval(cycle, 10000 + Math.random() * 5000);

    fallbackTimersRef.current.push(first);
    fallbackTimersRef.current.push(recurring);

    return () => {
      clearFallbackTimers();
    };
  }, [videoOn, cameraReady]);

  const fmt = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleEnd = () => {
    setEnded(true);
    setTimeout(() => window.history.back(), 2200);
  };

  return (
    <div
      className="relative h-[calc(100vh-72px)] overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #04040d 0%, #07071a 100%)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
            animation: 'pulseGlow 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── Call ended overlay ── */}
      <AnimatePresence>
        {callEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-4"
          >
            <div className="text-5xl">👋</div>
            <p className="text-white text-xl font-semibold">Call ended</p>
            <p className="text-white/40 text-sm">Duration: {fmt(seconds)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Top bar */}
        <div className="absolute top-4 left-0 right-0 flex items-center justify-center gap-3 px-4 z-10">
          <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/70 text-sm font-mono">{fmt(seconds)}</span>
            <span className="text-white/30 text-xs">· Live Session</span>
          </div>
        </div>

        {/* Central Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <AvatarOrb
            gender={avatar?.gender}
            state={avatarState}
            size="xl"
            showLabel
          />

          {/* Caption bubble */}
          <AnimatePresence>
            {caption && (
              <motion.div
                key={caption}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="max-w-sm px-6 py-3 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm text-center"
              >
                <p className="text-white/80 text-sm leading-relaxed italic">"{caption}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/45">
            <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400' : cameraReady ? 'bg-amber-400' : 'bg-white/20'}`} />
            <span>{analysisStatus}</span>
          </div>

          {/* Waveform bars (visible when speaking) */}
          <AnimatePresence>
            {avatarState === 'speaking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 h-8"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-violet-400/70"
                    animate={{ height: ['8px', `${8 + Math.random() * 20}px`, '8px'] }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.3,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User self-view (bottom right) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 right-4 w-40 h-56 md:w-44 md:h-60 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#0b1020]"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
        >
            {videoOn ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1] bg-black"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!previewReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center px-4">
                      <Video size={18} className="text-white/55 mx-auto mb-2" />
                      <p className="text-white/70 text-[10px] uppercase tracking-[0.2em]">Starting camera</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-[10px] font-semibold leading-none">
                    {previewReady ? `${selfEmotion.toUpperCase()} ${(selfConfidence * 100).toFixed(0)}%` : 'CAMERA STARTING'}
                  </p>
                  <p className="text-white/50 text-[9px] mt-1">OpenCV live</p>
                </div>
              </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <VideoOff size={18} className="text-white/30 mx-auto mb-1" />
                <p className="text-white/30 text-[10px]">Video off</p>
              </div>
            </div>
          )}
          {/* Muted badge */}
          {!micOn && (
            <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
              <MicOff size={10} className="text-white" />
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Controls ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pb-6 px-6 flex justify-center"
      >
        <div className="flex items-center gap-4 px-6 py-4 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10">
          {/* Mic */}
          <ControlBtn
            active={micOn}
            onClick={() => setMicOn((v) => !v)}
            activeIcon={<Mic size={20} />}
            inactiveIcon={<MicOff size={20} />}
            activeClass="bg-white/10 text-white hover:bg-white/20"
            inactiveClass="bg-red-500/20 text-red-400 hover:bg-red-500/30"
          />

          {/* Video */}
          <ControlBtn
            active={videoOn}
            onClick={() => setVideoOn((v) => !v)}
            activeIcon={<Video size={20} />}
            inactiveIcon={<VideoOff size={20} />}
            activeClass="bg-white/10 text-white hover:bg-white/20"
            inactiveClass="bg-red-500/20 text-red-400 hover:bg-red-500/30"
          />

          {/* Volume */}
          <button className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all">
            <Volume2 size={20} />
          </button>

          {/* Chat shortcut */}
          <button className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all">
            <MessageCircle size={20} />
          </button>

          {/* End call */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnd}
            className="w-14 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
          >
            <PhoneOff size={20} />
          </motion.button>
        </div>
      </motion.div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function ControlBtn({ active, onClick, activeIcon, inactiveIcon, activeClass, inactiveClass }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
        active ? activeClass : inactiveClass
      }`}
    >
      {active ? activeIcon : inactiveIcon}
    </motion.button>
  );
}
