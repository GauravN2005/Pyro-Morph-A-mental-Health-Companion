export const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_MODEL = 'gpt-4o-mini';

export const PRIMARY_EMOTION = Object.freeze({
  neutral: 'neutral',
  happy: 'happy',
  sad: 'sad',
  anxious: 'anxious',
  angry: 'angry',
  calm: 'calm',
  distressed: 'distressed',
  surprised: 'surprised',
});

export const MESSAGE_ROLE = Object.freeze({
  user: 'user',
  assistant: 'assistant',
  system: 'system',
});

export class ConversationContext {
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

  clear() {
    this.messages = [];
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

  toOpenAIHistory() {
    return this.messages.map((m) => ({ role: m.role, content: m.text }));
  }
}

export class TextEmotionAnalyzer {
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

    if (recentUserStubs.length > 0) {
      const overlap = recentUserStubs.filter((stub) => {
        const stubWords = stub.toLowerCase().split(/\s+/);
        return stubWords.some((word) => word.length > 3 && lower.includes(word));
      }).length;
      if (overlap >= 2) signals.push('cross_turn_echo');
    }

    const negDensity = negHits / wordCount;
    const posDensity = posHits / wordCount;
    if (negDensity > 0.08) signals.push('negative_lexicon');
    if (posDensity > 0.08) signals.push('positive_lexicon');
    if (angerHits >= 2 || (angerHits >= 1 && negDensity > 0.05)) signals.push('anger_markers');
    if (fearHits >= 2 || (fearHits >= 1 && negDensity > 0.05)) signals.push('fear_markers');

    let valence = (posDensity - negDensity) * 1.8;
    valence = clamp(valence, -1, 1);

    let arousal = 0.25 + negDensity * 0.9;
    arousal = clamp(arousal, 0, 1);

    let primary = PRIMARY_EMOTION.neutral;
    if (signals.includes('anger_markers')) {
      primary = PRIMARY_EMOTION.angry;
    } else if (signals.includes('fear_markers') || (signals.includes('negative_lexicon') && valence < -0.2)) {
      primary = PRIMARY_EMOTION.anxious;
    } else if (valence < -0.35) {
      primary = PRIMARY_EMOTION.distressed;
    } else if (valence < -0.15) {
      primary = PRIMARY_EMOTION.sad;
    } else if (valence > 0.25 && signals.includes('positive_lexicon')) {
      primary = PRIMARY_EMOTION.happy;
    } else if (valence >= 0 && arousal < 0.35 && !signals.includes('negative_lexicon')) {
      primary = PRIMARY_EMOTION.calm;
    }

    const intensity = clamp(arousal * 0.55 + Math.min(1, negDensity * 8 + posDensity * 6), 0.15, 1);

    return {
      primary,
      intensity,
      valence,
      arousal,
      blendWeights: { [primary]: intensity },
      detectedSignals: signals,
    };
  }
}

export class CrisisDetector {
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

export class OpenAIChatService {
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
      ? '\n\nSafety note for this turn: the user text may indicate self-harm or crisis. Stay calm and human. Do not give any instructions that could enable harm. Gently encourage them to reach someone real - a crisis line, emergency services, or someone they trust. Keep it short and caring.\n'
      : '';

    return `You are Pyro-Morph, a deeply empathetic, emotionally intelligent virtual companion.
Reply in 1-4 short natural sentences. Validate emotion first. Avoid clinical tone.
Internal affect hint: primary ${userEmotion.primary}, intensity ${userEmotion.intensity.toFixed(2)}, valence ${userEmotion.valence.toFixed(2)}, arousal ${userEmotion.arousal.toFixed(2)}.${crisisBlock}`;
  }

  dispose() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

export function loadChatbotSettings() {
  return {
    apiKey: localStorage.getItem('pyro_openai_api_key') || '',
    baseUrl: localStorage.getItem('pyro_openai_base_url') || DEFAULT_BASE_URL,
  };
}

export function saveChatbotSettings({ apiKey, baseUrl }) {
  localStorage.setItem('pyro_openai_api_key', apiKey || '');
  localStorage.setItem('pyro_openai_base_url', baseUrl || DEFAULT_BASE_URL);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
