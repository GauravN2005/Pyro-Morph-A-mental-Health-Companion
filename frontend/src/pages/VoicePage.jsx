import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react'

const PHRASES = [
  "I'm here with you…",
  "Take a deep breath…",
  "You're safe here…",
  "I'm listening…",
  "Speak freely…",
]

const WAVE_HEIGHTS = [12, 20, 32, 24, 40, 28, 44, 32, 48, 36, 44, 28, 40, 22, 32, 18, 28, 14, 20, 10]

const EMOTION_REPLY = {
  angry: "I hear a lot of intensity in your voice. Let's slow down together for one breath.",
  disgust: "Something feels really off for you right now. I'm here and listening.",
  fear: "I can hear worry in your tone. You're safe here with me.",
  happy: "I can hear more lightness in your voice. I love hearing that.",
  neutral: "Thank you for sharing that. Want to tell me a little more?",
  sad: "I can hear heaviness in your voice. You're not carrying this alone.",
  surprise: "That sounds like it landed strongly for you. What stood out most?",
}

export default function VoicePage() {
  const videoApiUrl = import.meta.env.VITE_VIDEO_API_URL || 'http://127.0.0.1:5001'

  const [listening, setListening]   = useState(false)
  const [phraseIdx, setPhraseIdx]   = useState(0)
  const [transcript, setTranscript] = useState(null)
  const [history, setHistory]       = useState([])
  const [liveText, setLiveText]     = useState('')
  const [processing, setProcessing] = useState(false)
  const [status, setStatus]         = useState('Idle')

  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)
  const finalTextRef = useRef('')
  const audioRef = useRef(null)

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  const canRecord = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined'

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i+1) % PHRASES.length), 3200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const stopRecognition = () => {
    if (!recognitionRef.current) return
    try { recognitionRef.current.stop() } catch {}
    recognitionRef.current = null
  }

  const encodeWAV = (pcmData, sampleRate = 16000) => {
    const numChannels = 1
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = numChannels * bytesPerSample

    // Calculate buffer size
    const dataLength = pcmData.length * bytesPerSample
    const fileSize = 36 + dataLength
    const buffer = new ArrayBuffer(44 + dataLength)
    const view = new DataView(buffer)

    // RIFF header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    writeString(0, 'RIFF')
    view.setUint32(4, fileSize, true)
    writeString(8, 'WAVE')

    // fmt subchunk
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true) // audioFormat (1 for PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true) // byteRate
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)

    // data subchunk
    writeString(36, 'data')
    view.setUint32(40, dataLength, true)

    // Write PCM data
    let offset = 44
    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }

    return new Blob([buffer], { type: 'audio/wav' })
  }

  const stopRecorder = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return null

    return new Promise((resolve) => {
      const finish = async () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: mimeType }) : null
        chunksRef.current = []

        // Convert to WAV for reliable processing
        if (blob && blob.size > 0) {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const arrayBuffer = await blob.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
            const pcmData = audioBuffer.getChannelData(0)
            const wavBlob = encodeWAV(pcmData, audioBuffer.sampleRate)
            resolve(wavBlob)
          } catch (error) {
            console.warn('WAV encoding failed, using original blob:', error)
            resolve(blob)
          }
        } else {
          resolve(blob)
        }
      }

      recorder.onstop = finish
      if (recorder.state !== 'inactive') {
        try { recorder.stop() } catch { finish() }
      } else {
        finish()
      }
    })
  }

  const analyzeVoice = async (audioBlob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice.wav')

    const response = await fetch(`${videoApiUrl.replace(/\/$/, '')}/voice/analyze`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Voice API error: ${response.status}`)
    }

    return response.json()
  }

  const stopBotAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const playBotAudio = async (data, replyText) => {
    stopBotAudio()

    if (data?.audioBase64 && data?.audioMimeType) {
      const audio = new Audio(`data:${data.audioMimeType};base64,${data.audioBase64}`)
      audioRef.current = audio

      try {
        await audio.play()
        return true
      } catch (error) {
        console.warn('Autoplay failed, falling back to speech synthesis:', error)
      }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(replyText)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
      return true
    }

    return false
  }

  const buildReply = (emotion, confidence) => {
    const base = EMOTION_REPLY[emotion] || EMOTION_REPLY.neutral
    const pct = Number.isFinite(confidence) ? Math.round(confidence * 100) : 0
    return `${base} (Detected emotion: ${emotion}, confidence ${pct}%)`
  }

  const startSession = async () => {
    if (!canRecord) {
      setStatus('Microphone recording is not supported in this browser')
      return
    }

    setProcessing(false)
    setTranscript(null)
    setLiveText('')
    finalTextRef.current = ''

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      mediaStreamRef.current = stream

      const preferred = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ]
      const selectedMime = preferred.find(m => MediaRecorder.isTypeSupported(m)) || ''
      const recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.start(200)
      mediaRecorderRef.current = recorder

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.continuous = true

        recognition.onresult = (event) => {
          let interim = ''
          let finals = finalTextRef.current

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const text = event.results[i][0]?.transcript || ''
            if (event.results[i].isFinal) {
              finals = `${finals} ${text}`.trim()
            } else {
              interim += text
            }
          }

          finalTextRef.current = finals
          setLiveText(`${finals} ${interim}`.trim())
        }

        recognition.start()
        recognitionRef.current = recognition
      }

      setListening(true)
      setStatus('Recording')
    } catch (error) {
      console.error('Voice session start failed:', error)
      setStatus('Microphone unavailable')
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
    }
  }

  const stopSession = async () => {
    setListening(false)
    setProcessing(true)
    setStatus('Processing')

    stopRecognition()
    const audioBlob = await stopRecorder()

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    const userText = (finalTextRef.current || liveText || 'I needed to talk for a moment.').trim()

    try {
      let emotion = 'neutral'
      let confidence = 0
      let replyText = EMOTION_REPLY.neutral
      let audioPlayed = false

      if (audioBlob && audioBlob.size > 0) {
        const data = await analyzeVoice(audioBlob)
        emotion = data?.emotion || 'neutral'
        confidence = Number(data?.confidence || 0)
        replyText = data?.replyText || buildReply(emotion, confidence)
        audioPlayed = await playBotAudio(data, replyText)
      } else {
        audioPlayed = await playBotAudio(null, replyText)
      }

      const tx = {
        user: userText,
        bot: replyText,
      }
      setTranscript(tx)
      setHistory(h => [...h, tx])
      setStatus(audioPlayed ? `Done · ${emotion} · audio played` : `Done · ${emotion}`)
    } catch (error) {
      console.error('Voice model analysis failed:', error)
      const tx = {
        user: userText,
        bot: `${EMOTION_REPLY.neutral} (Voice model unavailable right now.)`,
      }
      setTranscript(tx)
      setHistory(h => [...h, tx])
      setStatus('Voice API offline')
    } finally {
      setProcessing(false)
      finalTextRef.current = ''
      setLiveText('')
    }
  }

  const toggle = () => {
    if (!listening) {
      startSession()
    } else {
      stopSession()
    }
  }

  const reset = () => {
    stopBotAudio()
    setHistory([])
    setTranscript(null)
    setLiveText('')
    finalTextRef.current = ''
    setStatus('Idle')
  }

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col lg:flex-row overflow-hidden">

      {/* ── LEFT: VOICE STAGE ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-between py-12 px-8 relative">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width:500, height:500, background:listening ? 'radial-gradient(circle,rgba(244,63,94,0.1) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)', transition:'background 1s ease' }} />
        </div>

        {/* Top status */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background:'rgba(15,15,40,0.8)', border:'1px solid rgba(139,92,246,0.2)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: listening ? '#f43f5e' : '#7c3aed' }} />
            <span className="text-xs font-mono" style={{ color:'var(--txt-secondary)' }}>
              {listening ? 'Recording…' : processing ? 'Analyzing…' : 'Voice Session'}
            </span>
          </div>
          <button onClick={reset} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color:'var(--txt-muted)', border:'1px solid var(--border)' }}>
            <RotateCcw size={13}/>
          </button>
        </div>

        {/* ── CENTER ORB + WAVE ─── */}
        <div className="flex flex-col items-center gap-10 z-10">
          <div className="flex flex-col items-center gap-6">

            {/* Orb */}
            <div className="relative flex items-center justify-center w-56 h-56">
              {/* Outer glow ring */}
              {listening && (
                <>
                  <div className="absolute inset-0 rounded-full" style={{ background:'rgba(244,63,94,0.08)', animation:'ripple 2s linear infinite' }} />
                  <div className="absolute inset-0 rounded-full" style={{ background:'rgba(244,63,94,0.05)', animation:'ripple 2s linear infinite', animationDelay:'1s' }} />
                </>
              )}

              <div className="w-44 h-44 rounded-full flex items-center justify-center relative"
                style={{
                  background:'linear-gradient(135deg, rgba(20,20,50,0.9), rgba(10,10,31,0.95))',
                  border: `2px solid ${listening ? 'rgba(244,63,94,0.5)' : 'rgba(124,58,237,0.3)'}`,
                  boxShadow: listening
                    ? '0 0 80px rgba(244,63,94,0.3), 0 0 160px rgba(124,58,237,0.1)'
                    : '0 0 40px rgba(124,58,237,0.2)',
                  transition:'all 0.6s ease',
                }}>

                {/* Wave bars */}
                <div className="flex items-center justify-center gap-0.5">
                  {WAVE_HEIGHTS.map((h, i) => (
                    <div key={i} className="wave-bar"
                      style={{
                        height: h,
                        animationDelay:`${i*0.07}s`,
                        animationPlayState: listening ? 'running' : 'paused',
                        opacity: listening ? 1 : 0.2,
                        background: listening
                          ? `linear-gradient(180deg, #f43f5e, #7c3aed)`
                          : 'linear-gradient(180deg, #8b5cf6, #06b6d4)',
                        transition:'opacity 0.5s ease, background 0.5s ease',
                      }}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Phrase */}
            <AnimatePresence mode="wait">
              <motion.p key={phraseIdx}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.45 }}
                className="font-display text-2xl italic text-center"
                style={{ color:'var(--txt-primary)' }}>
                {PHRASES[phraseIdx]}
              </motion.p>
            </AnimatePresence>

            <p className="text-sm text-center max-w-xs" style={{ color:'var(--txt-muted)' }}>
              {canRecord
                ? (SpeechRecognition
                  ? 'Speak freely — we capture your voice and emotion in real time.'
                  : 'Speak freely — emotion analysis works even without speech-to-text support.')
                : 'Your browser does not support microphone recording for Voice Mode.'}
            </p>

            {liveText && listening && (
              <p className="text-xs text-center max-w-sm" style={{ color:'var(--txt-muted)' }}>
                {liveText}
              </p>
            )}
          </div>

          {/* Mic button */}
          <div className="flex flex-col items-center gap-3">
            <motion.button
              whileHover={{ scale:1.06 }} whileTap={{ scale:0.93 }}
              onClick={toggle}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background: listening
                  ? 'linear-gradient(135deg,#dc2626,#f43f5e)'
                  : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                boxShadow: listening
                  ? '0 0 50px rgba(220,38,38,0.5), 0 0 100px rgba(220,38,38,0.2)'
                  : '0 0 40px rgba(124,58,237,0.45), 0 0 80px rgba(124,58,237,0.2)',
              }}>
              {listening ? <MicOff size={28} className="text-white"/> : <Mic size={28} className="text-white"/>}
            </motion.button>
            <p className="text-sm" style={{ color:'var(--txt-muted)' }}>
              {listening ? 'Tap to stop' : processing ? 'Processing…' : 'Tap to speak'}
            </p>
            <p className="text-[11px]" style={{ color:'var(--txt-ghost)' }}>{status}</p>
          </div>
        </div>

        {/* Volume indicator */}
        <div className="flex items-center gap-2 z-10">
          <Volume2 size={14} style={{ color:'var(--txt-muted)' }}/>
          <div className="h-1 w-24 rounded-full" style={{ background:'var(--elevated)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: listening ? '60%' : processing ? '35%' : '0%', background:'linear-gradient(90deg,#7c3aed,#06b6d4)' }}/>
          </div>
          <span className="text-xs" style={{ color:'var(--txt-muted)' }}>Audio live</span>
        </div>
      </div>


    </div>
  )
}
