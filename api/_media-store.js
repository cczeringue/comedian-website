import fs from 'fs/promises';
import path from 'path';

const KV_KEY = 'media_items';
const DATA_FILE = path.join(process.cwd(), 'data', 'media.json');

export function getKvConfig() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN
    };
  }

  const envEntries = Object.entries(process.env);
  const urlEntry = envEntries.find(([key, value]) => {
    return value && (key.endsWith('_REST_API_URL') || key.endsWith('_REST_URL'));
  });
  if (!urlEntry) return null;

  const tokenKey = urlEntry[0].replace(/_URL$/, '_TOKEN');
  const tokenValue = process.env[tokenKey];
  if (!tokenValue) return null;

  return {
    url: urlEntry[1],
    token: tokenValue
  };
}

function safeArray(input) {
  return Array.isArray(input) ? input : [];
}

async function readFileStore() {
  const file = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(file);
  return safeArray(parsed).map(normalizeMediaItem);
}

function coerceDate(dateValue) {
  if (!dateValue) return new Date().toISOString();
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeType(type, url = '') {
  if (type === 'video' || type === 'podcast') return type;
  const lc = String(url).toLowerCase();
  if (lc.includes('youtube.com') || lc.includes('youtu.be') || lc.includes('vimeo.com')) return 'video';
  if (
    lc.includes('podcast') ||
    lc.includes('spotify.com/show') ||
    lc.includes('open.spotify.com/episode') ||
    lc.includes('podcasts.apple.com') ||
    lc.includes('anchor.fm') ||
    lc.includes('simplecast.com')
  ) {
    return 'podcast';
  }
  return 'video';
}

const TRACK_VALUES = new Set(['standup', 'drillmaster', 'luigi']);

export function inferMediaTrack(raw = {}) {
  const explicit = String(raw.track || '')
    .toLowerCase()
    .trim();
  if (TRACK_VALUES.has(explicit)) return explicit;

  const hay = `${raw.url || ''} ${raw.title || ''}`.toLowerCase();
  if (hay.includes('luigithemusical')) return 'luigi';
  if (hay.includes('luigi') && (hay.includes('musical') || hay.includes('mangione'))) return 'luigi';
  if (hay.includes('drillmaster') || hay.includes('thedrillmaster')) return 'drillmaster';
  return 'standup';
}

function coerceFeatured(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function normalizeMediaItem(raw) {
  const item = raw || {};
  return {
    id: item.id || `media_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    type: normalizeType(item.type, item.url),
    title: String(item.title || 'Untitled appearance'),
    url: String(item.url || ''),
    thumbnail: item.thumbnail ? String(item.thumbnail) : '',
    description: item.description ? String(item.description) : '',
    date: coerceDate(item.date),
    videoId: item.videoId ? String(item.videoId) : '',
    track: inferMediaTrack(item),
    featured: coerceFeatured(item.featured)
  };
}

export async function readMediaStore() {
  const kv = getKvConfig();

  if (kv) {
    const response = await fetch(`${kv.url}/get/${KV_KEY}`, {
      headers: {
        Authorization: `Bearer ${kv.token}`
      }
    });

    if (!response.ok) {
      return await readFileStore();
    }

    const data = await response.json();
    const parsed = data.result ? JSON.parse(data.result) : [];
    const normalized = safeArray(parsed).map(normalizeMediaItem);

    if (normalized.length > 0) {
      return normalized;
    }

    try {
      return await readFileStore();
    } catch (_) {
      return [];
    }
  }

  return await readFileStore();
}

export async function writeMediaStore(mediaItems) {
  const normalized = safeArray(mediaItems).map(normalizeMediaItem);
  const kv = getKvConfig();

  if (kv) {
    const response = await fetch(`${kv.url}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: JSON.stringify(normalized) })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`KV write failed (${response.status}): ${body}`);
    }

    return;
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
}
