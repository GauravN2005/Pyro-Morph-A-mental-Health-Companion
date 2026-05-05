// Avatar configuration used across the app
export const AVATAR_GENDERS = ['male', 'female'];

export const AVATAR_PROFILES = {
  male: {
    name: 'Pyro',
    emoji: '🧑',
    color: ['#7c3aed', '#2563eb'],
    glow: 'rgba(124,58,237,0.6)',
    tagline: 'Warm, grounded & steadfast',
  },
  female: {
    name: 'Luna',
    emoji: '👩',
    color: ['#db2777', '#9333ea'],
    glow: 'rgba(219,39,119,0.6)',
    tagline: 'Gentle, intuitive & nurturing',
  },
  default: {
    name: 'Pyro',
    emoji: '🔥',
    color: ['#7c3aed', '#06b6d4'],
    glow: 'rgba(124,58,237,0.6)',
    tagline: 'Your AI companion',
  },
};

export const PERSONALITY_TYPES = [
  { key: 'warm',      label: 'Warm & Caring',      emoji: '🤗' },
  { key: 'calm',      label: 'Calm & Steady',       emoji: '🌊' },
  { key: 'energetic', label: 'Energetic',            emoji: '⚡' },
  { key: 'wise',      label: 'Wise & Thoughtful',   emoji: '🦉' },
];

export const AVATAR_STATES = ['idle', 'speaking', 'listening', 'thinking'];
