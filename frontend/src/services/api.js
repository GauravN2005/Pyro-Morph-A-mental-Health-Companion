import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_AVATAR = {
  gender: null,
  name: 'Pyro',
  personality: 'warm',
};

function makeError(status, message) {
  const err = new Error(message);
  err.response = {
    status,
    data: { message },
  };
  return err;
}

function cacheKey(userId) {
  return `pyro_profile_cache_${userId}`;
}

function loadUserCache(userId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(userId)) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveUserCache(userId, patch) {
  const current = loadUserCache(userId);
  const next = { ...current, ...patch, lastActive: new Date().toISOString() };
  localStorage.setItem(cacheKey(userId), JSON.stringify(next));
  return next;
}

function mapUser(authUser, profile) {
  const cache = loadUserCache(authUser.id);
  const baseName = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';

  return {
    _id: authUser.id,
    id: authUser.id,
    name: baseName,
    email: authUser.email,
    avatar: { ...DEFAULT_AVATAR, ...(cache.avatar || {}) },
    onboarded: Boolean(cache.onboarded),
    messageCount: Number(cache.messageCount) || 0,
    moodHistory: Array.isArray(cache.moodHistory) ? cache.moodHistory : [],
    createdAt: authUser.created_at,
    lastActive: cache.lastActive || authUser.last_sign_in_at || authUser.created_at,
  };
}

async function getAuthUserOrThrow() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw makeError(401, 'Not authorized. Please log in again.');
  }
  return data.user;
}

async function getOrCreateProfile(authUser, fallbackName = '') {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, created_at, updated_at')
    .eq('id', authUser.id)
    .maybeSingle();

  if (selectError) {
    throw makeError(500, selectError.message || 'Could not fetch profile');
  }

  if (existing) return existing;

  const insertPayload = {
    id: authUser.id,
    full_name: fallbackName || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
  };

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select('id, full_name, username, avatar_url, created_at, updated_at')
    .single();

  if (insertError) {
    throw makeError(500, insertError.message || 'Could not create profile');
  }

  return created;
}

export const authAPI = {
  async register(data) {
    const name = String(data?.name || '').trim();
    const email = String(data?.email || '').trim().toLowerCase();
    const password = String(data?.password || '');

    if (!name || !email || !password) throw makeError(400, 'Please provide name, email, and password');
    if (name.length < 2) throw makeError(400, 'Name must be at least 2 characters');
    if (password.length < 6) throw makeError(400, 'Password must be at least 6 characters');

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) throw makeError(400, error.message);
    if (!signUpData?.user) throw makeError(500, 'Could not create account');
    if (!signUpData.session) {
      throw makeError(400, 'Signup successful. Please verify your email, then sign in.');
    }

    const profile = await getOrCreateProfile(signUpData.user, name);
    const user = mapUser(signUpData.user, profile);

    return {
      data: {
        token: signUpData.session.access_token,
        user,
      },
    };
  },

  async login(data) {
    const email = String(data?.email || '').trim().toLowerCase();
    const password = String(data?.password || '');

    if (!email || !password) throw makeError(400, 'Please provide email and password');

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw makeError(401, error.message || 'Invalid email or password');
    if (!signInData?.user || !signInData?.session) throw makeError(401, 'Invalid email or password');

    const profile = await getOrCreateProfile(signInData.user);
    const user = mapUser(signInData.user, profile);

    return {
      data: {
        token: signInData.session.access_token,
        user,
      },
    };
  },

  async logout() {
    await supabase.auth.signOut();
  },
};

export const userAPI = {
  async getMe() {
    const authUser = await getAuthUserOrThrow();
    const profile = await getOrCreateProfile(authUser);
    return { data: { user: mapUser(authUser, profile) } };
  },

  async updateProfile(data) {
    const authUser = await getAuthUserOrThrow();
    const fullName = String(data?.name || '').trim();

    if (fullName) {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', authUser.id);
      if (error) throw makeError(400, error.message || 'Could not update profile');
    }

    const profile = await getOrCreateProfile(authUser, fullName);
    return { data: { success: true, user: mapUser(authUser, profile) } };
  },

  async updateAvatar(data) {
    const authUser = await getAuthUserOrThrow();
    const current = loadUserCache(authUser.id);
    const gender = data?.gender ?? current.avatar?.gender ?? null;

    const nextAvatar = {
      ...(current.avatar || {}),
      gender,
      name: data?.name || (gender === 'female' ? 'Luna' : 'Pyro'),
      personality: data?.personality || 'warm',
    };

    saveUserCache(authUser.id, { avatar: nextAvatar });
    return { data: { success: true, avatar: nextAvatar } };
  },

  async completeOnboarding() {
    const authUser = await getAuthUserOrThrow();
    const cache = saveUserCache(authUser.id, { onboarded: true });
    return { data: { success: true, onboarded: Boolean(cache.onboarded) } };
  },

  async logMood(data) {
    const authUser = await getAuthUserOrThrow();
    const mood = String(data?.mood || '').trim();
    if (!mood) throw makeError(400, 'Mood is required');

    const current = loadUserCache(authUser.id);
    const list = Array.isArray(current.moodHistory) ? current.moodHistory : [];
    list.push({ mood, note: String(data?.note || ''), date: new Date().toISOString() });

    const next = saveUserCache(authUser.id, { moodHistory: list.slice(-100) });
    return { data: { success: true, moodHistory: (next.moodHistory || []).slice(-30) } };
  },

  async incrementMessages() {
    const authUser = await getAuthUserOrThrow();
    const current = loadUserCache(authUser.id);
    const nextCount = (Number(current.messageCount) || 0) + 1;
    saveUserCache(authUser.id, { messageCount: nextCount });
    return { data: { success: true, messageCount: nextCount } };
  },
};

export default { authAPI, userAPI };
