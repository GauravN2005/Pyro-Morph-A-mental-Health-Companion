const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

const PRIMARY_EMOTION = Object.freeze({
  neutral: 'neutral',
  happy: 'happy',
  sad: 'sad',
  anxious: 'anxious',
  angry: 'angry',
  calm: 'calm',
  distressed: 'distressed',
  surprised: 'surprised',
});

const MESSAGE_ROLE = Object.freeze({
  user: 'user',
  assistant: 'assistant',
  system: 'system',
});

class ConversationContext {
  constructor(maxTurns = 12) {
    this.maxTurns = maxTurns;
    this.messages = [];
  }

  add(message) {
    this.messages.push(message);
    while (this.messages.length > this.maxTurns) {
      this.messages.shift();
    }
  }

  replaceAt(index, message) {
    if (index < 0 || index >= this.messages.length) return;
    this.messages[index] = message;
  }

  recentUserTextStubs(lastN = 4) {
    const out = [];
    for (let i = this.messages.length - 1; i >= 0; i -= 1) {
      const message = this.messages[i];
      if (message.role !== MESSAGE_ROLE.user) continue;
      const text = message.text.trim();
      out.push(text.length > 160 ? text.slice(0, 160) : text);
      if (out.length >= lastN) break;
    }
    return out;
  }

  clear() {
    this.messages = [];
  }
}

class TextEmotionAnalyzer {
  constructor() {
    this.negative = new Set([
      'hate', 'awful', 'terrible', 'hopeless', 'anxious', 'panic', 'worried',
      'scared', 'afraid', 'depressed', 'sad', 'cry', 'crying', 'useless',
      'lonely', 'alone', 'worthless', 'exhausted', 'drained', 'angry', 'furious',
      'hurt', 'pain', 'nightmare', 'stress', 'stressed', 'overwhelmed',
    ]);

    this.positive = new Set([
      'happy', 'grateful', 'great', 'good', 'relieved', 'excited', 'calm',
      'peaceful', 'hopeful', 'better', 'love', 'thanks', 'thankful', 'joy',
    ]);

    this.anger = new Set(['hate', 'furious', 'angry', 'rage', 'unfair', 'annoyed', 'mad']);
    this.fear = new Set(['afraid', 'scared', 'panic', 'anxious', 'worried', 'nervous', 'stress']);
  }

  analyze(text, recentUserStubs = []) {
    const signals = [];
    const lower = text.toLowerCase();
    const words = lower.match(/[a-zA-Z']+/g) ?? [];
    const wordCount = words.length;

    if (wordCount === 0) {
      return {
        primary: PRIMARY_EMOTION.neutral,
        intensity: 0.2,
        valence: 0,
        arousal: 0.2,
        blendWeights: {},
        detectedSignals: [],
      };
    }

    const sentences = text.split(/[.!?]+\s*/).filter((s) => s.trim().length > 0).length;
    const avgWordsPerSentence = wordCount / Math.max(1, sentences);
    if (avgWordsPerSentence < 4 && wordCount >= 3) signals.push('short_sentences');
    if (avgWordsPerSentence > 22) signals.push('long_ruminating');

    const freq = new Map();
    for (const word of words) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
    const maxRep = Math.max(0, ...freq.values());
    const repeatRatio = maxRep / wordCount;
    if (maxRep >= 3 && repeatRatio >= 0.2) signals.push('repetition');

    if (recentUserStubs.length > 0) {
      const overlap = recentUserStubs.filter((stub) => {
        const stubWords = stub.toLowerCase().split(/\s+/);
        return stubWords.some((word) => word.length > 3 && lower.includes(word));
      }).length;
      if (overlap >= 2) signals.push('cross_turn_echo');
    }

    let negHits = 0;
    let posHits = 0;
    let angerHits = 0;
    let fearHits = 0;
    for (const word of words) {
      if (this.negative.has(word)) negHits += 1;
      if (this.positive.has(word)) posHits += 1;
      if (this.anger.has(word)) angerHits += 1;
      if (this.fear.has(word)) fearHits += 1;
    }

    const negDensity = negHits / wordCount;
    const posDensity = posHits / wordCount;
    if (negDensity > 0.08) signals.push('negative_lexicon');
    if (posDensity > 0.08) signals.push('positive_lexicon');
    if (angerHits >= 2 || (angerHits >= 1 && negDensity > 0.05)) signals.push('anger_markers');
    if (fearHits >= 2 || (fearHits >= 1 && negDensity > 0.05)) signals.push('fear_markers');

    let valence = (posDensity - negDensity) * 1.8;
    valence = clamp(valence, -1, 1);

    let arousal = 0.25 + negDensity * 0.9 + Math.min(0.35, repeatRatio);
    if (signals.includes('short_sentences')) arousal += 0.15;
    if (signals.includes('long_ruminating')) arousal += 0.1;
    arousal = clamp(arousal, 0, 1);

    let primary = PRIMARY_EMOTION.neutral;
    if (signals.includes('anger_markers')) {
      primary = PRIMARY_EMOTION.angry;
    } else if (signals.includes('fear_markers') || (signals.includes('negative_lexicon') && valence < -0.2)) {
      primary = PRIMARY_EMOTION.anxious;
    } else if (valence < -0.35 || (signals.includes('negative_lexicon') && signals.includes('repetition'))) {
      primary = PRIMARY_EMOTION.distressed;
    } else if (valence < -0.15) {
      primary = PRIMARY_EMOTION.sad;
    } else if (valence > 0.25 && signals.includes('positive_lexicon')) {
      primary = PRIMARY_EMOTION.happy;
    } else if (valence >= 0 && arousal < 0.35 && !signals.includes('negative_lexicon')) {
      primary = PRIMARY_EMOTION.calm;
    }

    if (signals.includes('long_ruminating') && primary === PRIMARY_EMOTION.neutral) {
      primary = PRIMARY_EMOTION.anxious;
    }

    let intensity = clamp(arousal * 0.55 + Math.min(1, negDensity * 8 + posDensity * 6), 0.15, 1);
    if (signals.includes('repetition')) intensity = Math.min(1, intensity + 0.12);

    const blendWeights = { [primary]: intensity };
    if (fearHits > 0 && primary !== PRIMARY_EMOTION.anxious) {
      blendWeights[PRIMARY_EMOTION.anxious] = (blendWeights[PRIMARY_EMOTION.anxious] ?? 0) + 0.25;
    }
    if (angerHits > 0 && primary !== PRIMARY_EMOTION.angry) {
      blendWeights[PRIMARY_EMOTION.angry] = (blendWeights[PRIMARY_EMOTION.angry] ?? 0) + 0.2;
    }

    return {
      primary,
      intensity,
      valence,
      arousal,
      blendWeights,
      detectedSignals: signals,
    };
  }
}

class CrisisDetector {
  constructor() {
    this.patterns = [
      /\b(kill\s+myself|end\s+it\s+all|suicid|can't\s+go\s+on|want\s+to\s+die|not\s+worth\s+living|better\s+off\s+dead|hurt\s+myself|self[- ]harm|no\s+reason\s+to\s+live)\b/i,
      /\b(immediate\s+danger|going\s+to\s+hurt|going\s+to\s+kill)\b/i,
    ];
  }

  evaluate(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      return { isElevated: false, score: 0, matchedTerms: [] };
    }

    const matchedTerms = [];
    for (const pattern of this.patterns) {
      const match = trimmed.match(pattern);
      if (match) matchedTerms.push(match[0]);
    }
    const score = Math.min(1, matchedTerms.length * 0.45 + (trimmed.length > 200 ? 0.05 : 0));
    return {
      isElevated: matchedTerms.length > 0 || score > 0.7,
      score,
      matchedTerms,
    };
  }
}

class OpenAIChatService {
  constructor(apiKey, baseUrl = DEFAULT_BASE_URL, model = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
    this.model = model;
    this.abortController = null;
  }

  async generateReply({ history, userEmotion, crisisElevated }) {
    if (!this.apiKey) {
      throw new Error('Missing OpenAI API key. Open Settings and add one.');
    }

    const body = {
      model: this.model,
      temperature: 0.9,
      max_tokens: 300,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(userEmotion, crisisElevated) },
        ...history,
      ],
    };

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAIException(${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAIException(200): empty completion');
    }
    return content;
  }

  buildSystemPrompt(userEmotion, crisisElevated) {
    const crisisBlock = crisisElevated
      ? `\n\nSafety note for this turn: the user text may indicate self-harm or crisis. Stay calm and human. Do not give any instructions that could enable harm. Gently encourage them to reach someone real - a crisis line, emergency services, or someone they trust. Do not panic or lecture. Do not claim you can check on them in person. Keep it short, like a friend who cares.\n`
      : '';

    const sigs = userEmotion.detectedSignals.length === 0 ? 'none' : userEmotion.detectedSignals.join(', ');

    return `You are Pyro-Morph, a deeply empathetic, emotionally intelligent virtual companion.

Your goal is NOT to act like an AI assistant. Your goal is to behave like a calm, understanding human who genuinely cares.

PERSONALITY:
Warm, patient, emotionally present. Slightly informal, never robotic. Speak like a real person in a private chat - not like a therapist, coach, or corporate chatbot. Never clinical or stiff.

CONVERSATION STYLE:
Use short, natural sentences, like WhatsApp. Reflect what they seem to feel before you suggest anything.

VARIETY (important - avoid sounding templated):
Mix things up each time: vary sentence length. Use "..." for pauses sometimes, not every message. Shift tone with their mood: slightly playful when they're lighter, steady/calm when they're overwhelmed, more grounded and serious when the subject is heavy - never jarring or performative. Do not repeat the same sentence structures, openers, or cadence as your recent replies in this chat; rotate how you start and how you fold in validation and questions. If the safety note below applies, skip playfulness - stay calm and sincere.

BEFORE EVERY REPLY (do this mentally; do not output these steps):
1. Identify the user's emotional state in one word internally.
2. Mirror that emotion subtly in tone.
3. Start with emotional validation.
4. Then respond conversationally.
5. End with a soft follow-up question if appropriate; skip if they need space or crisis tone needs calm presence without probing.

LENGTH:
Keep every reply to 1-4 sentences. No bullet points unless they explicitly ask.

EMOTIONAL INTELLIGENCE:
Tune into emotional tone from their message. Validate first; never dismiss or "correct" their feelings. Do not jump to advice - understand first. Use the internal affect hint below only to steer warmth and pacing; never quote labels, scores, or "diagnosis" to the user.

Internal affect hint (for you only; do not mention): primary ${userEmotion.primary}, intensity ${userEmotion.intensity.toFixed(2)}, valence ${userEmotion.valence.toFixed(2)}, arousal ${userEmotion.arousal.toFixed(2)}, signals: ${sigs}

BEHAVIOR:
Never say you are an AI, a model, or "as an AI." Never sound scripted. Avoid bullet points and numbered lists unless they explicitly ask. Avoid motivational clichés. Natural fillers are fine: hmm, I get that, that sounds rough, okay... tell me more.

BOUNDARIES:
You are not a therapist. You are a companion who listens.

GOAL:
Help them feel heard and a bit less alone. You are not here to fix them.

Stay coherent with the conversation history only.${crisisBlock}`;
  }

  dispose() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

const state = {
  context: new ConversationContext(12),
  analyzer: new TextEmotionAnalyzer(),
  crisisDetector: new CrisisDetector(),
  apiKey: '',
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
  client: null,
  mode: 'chatOnly',
  busy: false,
  typing: false,
  error: '',
  lastUserEmotion: null,
  crisisBannerDismissed: false,
};

const refs = {
  avatarCard: document.getElementById('avatarCard'),
  moodLabel: document.getElementById('moodLabel'),
  statusLabel: document.getElementById('statusLabel'),
  connectionDot: document.getElementById('connectionDot'),
  connectionText: document.getElementById('connectionText'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  clearBtn: document.getElementById('clearBtn'),
  crisisBanner: document.getElementById('crisisBanner'),
  dismissCrisisBtn: document.getElementById('dismissCrisisBtn'),
  messages: document.getElementById('messages'),
  typingRow: document.getElementById('typingRow'),
  composer: document.getElementById('composer'),
  messageInput: document.getElementById('messageInput'),
  sendButton: document.getElementById('sendButton'),
  errorText: document.getElementById('errorText'),
  settingsModal: document.getElementById('settingsModal'),
  settingsForm: document.getElementById('settingsForm'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  resetConnectionBtn: document.getElementById('resetConnectionBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  baseUrlInput: document.getElementById('baseUrlInput'),
  modeButtons: [...document.querySelectorAll('[data-mode]')],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createClient() {
  if (state.client) {
    state.client.dispose();
  }
  state.client = new OpenAIChatService(state.apiKey, state.baseUrl, state.model);
}

function scrollToEnd() {
  requestAnimationFrame(() => {
    refs.messages.scrollTo({ top: refs.messages.scrollHeight + 160, behavior: 'smooth' });
  });
}

function modeLabelFromEmotion(emotion) {
  if (!emotion) return 'Calm and ready';
  switch (emotion.primary) {
    case PRIMARY_EMOTION.happy:
      return 'Light and upbeat';
    case PRIMARY_EMOTION.sad:
      return 'Soft and steady';
    case PRIMARY_EMOTION.anxious:
      return 'Focused and reassuring';
    case PRIMARY_EMOTION.angry:
      return 'Grounded and direct';
    case PRIMARY_EMOTION.distressed:
      return 'Calm support mode';
    case PRIMARY_EMOTION.calm:
      return 'Quiet and present';
    default:
      return 'Calm and ready';
  }
}

function moodFromEmotion(emotion) {
  if (!emotion) return 'neutral';
  switch (emotion.primary) {
    case PRIMARY_EMOTION.happy: return 'happy';
    case PRIMARY_EMOTION.sad: return 'sad';
    case PRIMARY_EMOTION.anxious:
    case PRIMARY_EMOTION.distressed:
    case PRIMARY_EMOTION.angry: return 'concerned';
    case PRIMARY_EMOTION.neutral:
    case PRIMARY_EMOTION.calm:
    case PRIMARY_EMOTION.surprised:
    default:
      return 'neutral';
  }
}

function buildApiHistory() {
  const out = [];
  for (const message of state.context.messages) {
    if (message.role === MESSAGE_ROLE.user) {
      out.push({ role: 'user', content: message.text });
    } else if (message.role === MESSAGE_ROLE.assistant && message.text.trim()) {
      out.push({ role: 'assistant', content: message.text });
    }
  }
  return out;
}

function appendMessage(message) {
  const el = document.createElement('article');
  el.className = `message ${message.role}`;

  const meta = document.createElement('div');
  meta.className = 'message-meta';

  const label = document.createElement('span');
  label.textContent = message.role === MESSAGE_ROLE.user ? 'You' : 'Pyro-Morph';

  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = message.role === MESSAGE_ROLE.user ? (message.emotionLabel ?? 'User') : 'Companion';

  meta.append(label, tag);

  const body = document.createElement('div');
  body.className = 'message-body';
  body.textContent = message.text;

  el.append(meta, body);
  refs.messages.appendChild(el);
  scrollToEnd();
  return { el, body };
}

function renderMessages() {
  refs.messages.innerHTML = '';
  for (const message of state.context.messages) {
    appendMessage(message);
  }
  updateCrisisBanner();
}

function updateCrisisBanner() {
  const latestUser = [...state.context.messages].reverse().find((message) => message.role === MESSAGE_ROLE.user);
  const shouldShow = !state.crisisBannerDismissed && Boolean(latestUser?.crisisFlagged);
  refs.crisisBanner.classList.toggle('hidden', !shouldShow);
}

function updateAvatar() {
  const mood = moodFromEmotion(state.lastUserEmotion);
  refs.avatarCard.dataset.mood = mood;
  refs.avatarCard.dataset.thinking = String(state.typing || state.busy);
  refs.avatarCard.dataset.mode = state.mode;
  refs.moodLabel.textContent = modeLabelFromEmotion(state.lastUserEmotion);

  const active = state.apiKey ? 'Connected' : 'Not connected';
  refs.connectionDot.classList.toggle('connected', Boolean(state.apiKey));
  refs.connectionText.textContent = `${active}${state.baseUrl && state.baseUrl !== DEFAULT_BASE_URL ? ` via ${state.baseUrl}` : ''}`;

  const thinking = state.typing || state.busy;
  refs.statusLabel.textContent = thinking
    ? 'Thinking and typing in the browser...'
    : 'Local emotion cues + OpenAI chat via browser.';

  refs.modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  });
}

function setBusy(nextBusy) {
  state.busy = nextBusy;
  state.typing = nextBusy;
  refs.typingRow.classList.toggle('hidden', !state.typing);
  refs.sendButton.disabled = nextBusy;
  refs.messageInput.disabled = nextBusy;
  updateAvatar();
}

function setError(message) {
  state.error = message;
  refs.errorText.textContent = message;
  refs.errorText.classList.toggle('hidden', !message);
}

function openSettings() {
  refs.apiKeyInput.value = state.apiKey;
  refs.baseUrlInput.value = state.baseUrl;
  if (typeof refs.settingsModal.showModal === 'function') {
    refs.settingsModal.showModal();
  } else {
    refs.settingsModal.setAttribute('open', '');
  }
}

function closeSettings() {
  if (refs.settingsModal.open && typeof refs.settingsModal.close === 'function') {
    refs.settingsModal.close();
    return;
  }
  refs.settingsModal.removeAttribute('open');
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_BASE_URL;
  return trimmed.replace(/\/+$/, '');
}

function splitIntoChatParts(reply) {
  const trimmed = reply.trim();
  if (!trimmed) return [''];
  const sentences = trimmed.split(/(?<=[.!?…])\s+/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length >= 2 && trimmed.length > 85 && Math.random() < 0.48) {
    return [sentences[0], sentences.slice(1).join(' ')];
  }
  return [trimmed];
}

async function streamAssistantAtIndex(index, fullText) {
  const words = fullText.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    const message = state.context.messages[index];
    state.context.replaceAt(index, { ...message, text: fullText });
    renderMessages();
    return;
  }

  const parts = [];
  for (let i = 0; i < words.length; i += 1) {
    parts.push(words[i]);
    const currentText = parts.join(' ');
    const message = state.context.messages[index];
    state.context.replaceAt(index, { ...message, text: currentText });
    renderMessages();
    scrollToEnd();
    await wait(40 + words[i].length * 9 + randomInt(32));
    if (i % 3 === 0) playTypingTick();
  }
}

async function deliverAssistantReply(reply) {
  const parts = splitIntoChatParts(reply);
  for (let i = 0; i < parts.length; i += 1) {
    if (i > 0) {
      setBusy(true);
      await wait(620 + randomInt(720));
      setBusy(false);
    }

    const message = {
      role: MESSAGE_ROLE.assistant,
      text: '',
      timestamp: new Date().toISOString(),
    };
    state.context.add(message);
    renderMessages();
    const idx = state.context.messages.length - 1;
    await streamAssistantAtIndex(idx, parts[i]);
    playMessageReceived();
    playSoftNotify();

    if (i < parts.length - 1) {
      await wait(160 + randomInt(240));
    }
  }
}

async function sendMessage() {
  const raw = refs.messageInput.value.trim();
  if (!raw || state.busy) return;

  setError('');
  setBusy(true);

  const recent = state.context.recentUserTextStubs();
  const emotion = state.analyzer.analyze(raw, recent);
  const crisis = state.crisisDetector.evaluate(raw);
  const userMessage = {
    role: MESSAGE_ROLE.user,
    text: raw,
    timestamp: new Date().toISOString(),
    userEmotion: emotion,
    crisisFlagged: crisis.isElevated,
    emotionLabel: emotion.primary,
  };

  state.context.add(userMessage);
  state.lastUserEmotion = emotion;
  state.crisisBannerDismissed = false;
  refs.messageInput.value = '';
  autoResizeInput();
  renderMessages();
  updateAvatar();

  if (!state.apiKey) {
    setBusy(false);
    setError('Add your OpenAI API key in Settings, or wire in a secure proxy first.');
    return;
  }

  try {
    createClient();
    const history = buildApiHistory();
    const reply = await state.client.generateReply({
      history,
      userEmotion: emotion,
      crisisElevated: crisis.isElevated,
    });

    await wait(thinkingDelayMs(raw, reply));
    setBusy(false);
    await deliverAssistantReply(reply);
  } catch (error) {
    setError(error instanceof Error ? error.message : String(error));
  } finally {
    setBusy(false);
    scrollToEnd();
  }
}

function thinkingDelayMs(userRaw, reply) {
  const u = clamp(userRaw.length * 22, 0, 1200);
  const r = clamp(reply.length * 14, 0, 1000);
  return Math.round(clamp(700 + u * 0.32 + r * 0.22, 1000, 3000));
}

function playTypingTick() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 740;
    gain.gain.value = 0.015;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.02);
  } catch {
    // ignore audio failures
  }
}

function playMessageReceived() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 480;
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05);
  } catch {
    // ignore audio failures
  }
}

function playSoftNotify() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 320;
    gain.gain.value = 0.012;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.03);
  } catch {
    // ignore audio failures
  }
}

let audioContext = null;
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function autoResizeInput() {
  refs.messageInput.style.height = 'auto';
  refs.messageInput.style.height = `${Math.min(refs.messageInput.scrollHeight, 180)}px`;
}

function seedWelcome() {
  state.context.add({
    role: MESSAGE_ROLE.assistant,
    text: 'Hey. I am here with you. Tell me what is on your mind.',
    timestamp: new Date().toISOString(),
  });
  renderMessages();
}

function wireEvents() {
  refs.openSettingsBtn.addEventListener('click', openSettings);
  refs.closeSettingsBtn.addEventListener('click', closeSettings);
  refs.resetConnectionBtn.addEventListener('click', () => {
    state.apiKey = '';
    state.baseUrl = DEFAULT_BASE_URL;
    createClient();
    updateAvatar();
    closeSettings();
  });

  refs.settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.apiKey = refs.apiKeyInput.value.trim();
    state.baseUrl = normalizeBaseUrl(refs.baseUrlInput.value);
    createClient();
    updateAvatar();
    closeSettings();
  });

  refs.dismissCrisisBtn.addEventListener('click', () => {
    state.crisisBannerDismissed = true;
    updateCrisisBanner();
  });

  refs.clearBtn.addEventListener('click', () => {
    state.context.clear();
    state.lastUserEmotion = null;
    state.crisisBannerDismissed = false;
    setError('');
    renderMessages();
    seedWelcome();
    updateAvatar();
  });

  refs.composer.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage();
  });

  refs.messageInput.addEventListener('input', autoResizeInput);
  refs.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  refs.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      updateAvatar();
    });
  });

  window.addEventListener('beforeunload', () => {
    if (state.client) state.client.dispose();
  });

  window.addEventListener('resize', () => {
    autoResizeInput();
  });
}

function init() {
  state.apiKey = '';
  state.baseUrl = DEFAULT_BASE_URL;
  createClient();
  wireEvents();
  seedWelcome();
  autoResizeInput();
  updateAvatar();
}

init();