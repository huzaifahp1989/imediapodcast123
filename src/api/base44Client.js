function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sortData(data, sort) {
  if (!sort) return [...data];
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    if (desc) return av < bv ? 1 : -1;
    return av > bv ? 1 : -1;
  });
}

function matches(item, query) {
  if (!query) return true;
  return Object.entries(query).every(([k, v]) => item[k] === v);
}

function makeStore(initial = []) {
  let store = [...initial];
  return {
    list: async (sort, limit) => {
      const d = sortData(store, sort);
      return typeof limit === 'number' ? d.slice(0, limit) : d;
    },
    filter: async (query, sort, limit) => {
      const d = sortData(store.filter((i) => matches(i, query)), sort);
      return typeof limit === 'number' ? d.slice(0, limit) : d;
    },
    create: async (data) => {
      const item = { id: makeId(), ...data };
      store.push(item);
      return item;
    },
    update: async (id, data) => {
      const idx = store.findIndex((i) => i.id === id);
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...data };
        return store[idx];
      }
      return null;
    },
    delete: async (id) => {
      store = store.filter((i) => i.id !== id);
      return { success: true };
    },
  };
}

function makePersistentStore(key, initial = []) {
  let store = (() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`base44_store_${key}`) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      // Attempt migration from existing caches
      if (typeof localStorage !== 'undefined') {
        let migrated = null;
        if (key === 'VideoPodcast') {
          const cache = localStorage.getItem('cache_videoPodcasts');
          if (cache) {
            try { const parsed = JSON.parse(cache); if (Array.isArray(parsed)) migrated = parsed; } catch {}
          }
        } else if (key === 'AudioContent') {
          const cache = localStorage.getItem('cache_audioContent');
          if (cache) {
            try { const parsed = JSON.parse(cache); if (Array.isArray(parsed)) migrated = parsed; } catch {}
          }
        }
        if (migrated) return migrated;
      }
    } catch {}
    return [...initial];
  })();

  const persist = () => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(`base44_store_${key}`, JSON.stringify(store));
    } catch {}
  };

  return {
    list: async (sort, limit) => {
      const d = sortData(store, sort);
      return typeof limit === 'number' ? d.slice(0, limit) : d;
    },
    filter: async (query, sort, limit) => {
      const d = sortData(store.filter((i) => matches(i, query)), sort);
      return typeof limit === 'number' ? d.slice(0, limit) : d;
    },
    create: async (data) => {
      const item = { id: makeId(), ...data };
      store.push(item);
      persist();
      return item;
    },
    update: async (id, data) => {
      const idx = store.findIndex((i) => i.id === id);
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...data };
        persist();
        return store[idx];
      }
      return null;
    },
    delete: async (id) => {
      store = store.filter((i) => i.id !== id);
      persist();
      return { success: true };
    },
  };
}

const nowIso = () => new Date().toISOString();

const sampleVideos = [
  { id: makeId(), title: "Daily Reminder", category: "Spirituality", speaker: "Imam Ali", duration: 420, view_count: 321, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/FXrDXfymVok', thumbnail_url: 'https://i.ytimg.com/vi/FXrDXfymVok/hqdefault.jpg' },
  { id: makeId(), title: "Seerah Series Ep. 1", category: "Seerah", speaker: "Dr. Ahmad", duration: 1800, view_count: 942, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/KvK_d9edjPM', thumbnail_url: 'https://i.ytimg.com/vi/KvK_d9edjPM/hqdefault.jpg' },
  { id: makeId(), title: "Tafsir Juz Amma", category: "Tafsir", speaker: "Sheikh Yusuf", duration: 1500, view_count: 1183, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/ywNrz-hOfgo', thumbnail_url: 'https://i.ytimg.com/vi/ywNrz-hOfgo/hqdefault.jpg' },
  { id: makeId(), title: "Ramadan Reflections", category: "Ramadan", speaker: "Ustadh Kareem", duration: 900, view_count: 765, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/TYmsXSKkGPw', thumbnail_url: 'https://i.ytimg.com/vi/TYmsXSKkGPw/hqdefault.jpg' },
  { id: makeId(), title: "Fiqh of Purification", category: "Fiqh", speaker: "Sheikh Bilal", duration: 2100, view_count: 502, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/IdaPmyk3fsc', thumbnail_url: 'https://i.ytimg.com/vi/IdaPmyk3fsc/hqdefault.jpg' },
  { id: makeId(), title: "Friday Khutbah Highlights", category: "Lectures", speaker: "Imam Musa", duration: 780, view_count: 1310, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/5J45cRPTOAc', thumbnail_url: 'https://i.ytimg.com/vi/5J45cRPTOAc/hqdefault.jpg' },
  { id: makeId(), title: "Aqeedah Essentials", category: "Aqeedah", speaker: "Dr. Zain", duration: 2400, view_count: 401, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/pqfZQmNEj2k', thumbnail_url: 'https://i.ytimg.com/vi/pqfZQmNEj2k/hqdefault.jpg' },
  { id: makeId(), title: "Youth Talk: Staying Strong", category: "General", speaker: "Sister Layla", duration: 1200, view_count: 777, published_date: nowIso(), status: 'approved', type: 'video', video_url: 'https://www.youtube.com/embed/7v9u2Qe5JQo', thumbnail_url: 'https://i.ytimg.com/vi/7v9u2Qe5JQo/hqdefault.jpg' },
];

const sampleAudio = [
  { id: makeId(), title: "Morning Dhikr", category: "Spirituality", speaker: "Imam Ali", duration: 360, play_count: 120, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Nasheed: Hope", category: "Nasheeds", speaker: "Abdullah", duration: 210, play_count: 560, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Hadith Commentary", category: "Hadith", speaker: "Sheikh Yusuf", duration: 1800, play_count: 233, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Fiqh Q&A", category: "Fiqh", speaker: "Dr. Zain", duration: 2400, play_count: 97, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Seerah Stories", category: "Seerah", speaker: "Ustadh Kareem", duration: 1200, play_count: 311, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Friday Reminder", category: "Lectures", speaker: "Imam Musa", duration: 600, play_count: 452, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Ramadan Tips", category: "Ramadan", speaker: "Sister Layla", duration: 480, play_count: 210, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
  { id: makeId(), title: "Tafsir: Surah Ikhlas", category: "Tafsir", speaker: "Sheikh Bilal", duration: 900, play_count: 188, published_date: nowIso(), status: 'approved', type: 'audio', cover_image_url: '', audio_url: '' },
];

export const base44 = {
  entities: {
    Show: makeStore([]),
    Podcast: makeStore([]),
    ExternalStream: makeStore([]),
    Comment: makeStore([]),
    Guest: makeStore([]),
    UserEngagement: makeStore([]),
    AudioContent: makePersistentStore('AudioContent', sampleAudio),
    User: makeStore([]),
    Playlist: makePersistentStore('Playlist', []),
    VideoPodcast: makePersistentStore('VideoPodcast', sampleVideos),
    ContentModeration: makeStore([]),
    VideoPlaylist: makeStore([]),
    MediaRequest: makeStore([]),
    Rating: makeStore([]),
    ContentComment: makeStore([]),
    Favorite: makePersistentStore('Favorite', []),
    WatchProgress: makeStore([]),
    PlaybackQueue: makeStore([{ id: makeId(), user_email: "", name: "My Queue", items: [], current_index: 0, is_active: true }]),
    UserPreference: makeStore([]),
    UserFollow: makeStore([]),
    PlaylistLike: makeStore([]),
  },
  integrations: {
    Core: {
      UploadFile: async (file) => ({ file_url: typeof URL !== 'undefined' && file ? URL.createObjectURL(file) : '' }),
      SendEmail: async () => ({ success: true }),
      GenerateImage: async () => ({ url: '' }),
      ExtractDataFromUploadedFile: async () => ({ data: {} }),
      CreateFileSignedUrl: async () => ({ url: '' }),
      UploadPrivateFile: async () => ({ success: true }),
    },
  },
  auth: {
    _listeners: [],
    _notify(user) {
      try { this._listeners.forEach((cb) => cb(user)); } catch {}
    },
    onChange(cb) {
      if (typeof cb === 'function') this._listeners.push(cb);
      return () => {
        this._listeners = this._listeners.filter((f) => f !== cb);
      };
    },
    async me() {
      try {
        const email = typeof localStorage !== 'undefined' ? localStorage.getItem('base44_session_email') : null;
        if (!email) throw new Error('no session');
        const users = await base44.entities.User.filter({ email });
        if (users.length > 0) return users[0];
        throw new Error('no user');
      } catch (e) { throw e; }
    },
    async signup({ email, password, full_name, display_name }) {
      if (!email || !password) throw new Error('email and password required');
      const existing = await base44.entities.User.filter({ email });
      if (existing.length > 0) throw new Error('user already exists');
      const user = await base44.entities.User.create({
        email,
        full_name: full_name || '',
        display_name: display_name || '',
        role: 'user',
        trusted_uploader: false,
        created_date: nowIso(),
      });
      try {
        const creds = typeof btoa === 'function' ? btoa(`${email}:${password}`) : `${email}:${password}`;
        if (typeof localStorage !== 'undefined') {
          const usersDb = JSON.parse(localStorage.getItem('base44_users') || '[]');
          usersDb.push({ email, password: creds });
          localStorage.setItem('base44_users', JSON.stringify(usersDb));
          localStorage.setItem('base44_session_email', email);
        }
      } catch {}
      try {
        await base44.integrations.Core.SendEmail({
          to: 'imediac786@gmail.com',
          subject: `New signup: ${email}`,
          body: `<p>A new user signed up.</p><ul><li>Email: ${email}</li><li>Name: ${full_name || ''}</li><li>Display: ${display_name || ''}</li><li>Date: ${new Date().toLocaleString()}</li></ul>`
        });
      } catch {}
      this._notify(user);
      return user;
    },
    async signin({ email, password }) {
      if (!email || !password) throw new Error('email and password required');
      try {
        const usersDb = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('base44_users') || '[]') : [];
        const token = typeof btoa === 'function' ? btoa(`${email}:${password}`) : `${email}:${password}`;
        const ok = usersDb.some((u) => u.email === email && u.password === token);
        if (!ok) throw new Error('invalid credentials');
        if (typeof localStorage !== 'undefined') localStorage.setItem('base44_session_email', email);
        const users = await base44.entities.User.filter({ email });
        const user = users[0] || await base44.entities.User.create({ email, role: 'user', created_date: nowIso() });
        this._notify(user);
        return user;
      } catch (e) { throw e; }
    },
    async signout() {
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem('base44_session_email'); } catch {}
      this._notify(null);
      return { success: true };
    }
  },
};
