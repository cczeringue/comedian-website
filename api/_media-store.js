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

/** Upstash SET via POST expects the raw value as the body, not `{"value":...}`. Normalize GET result to an array. */
function parseKvMediaResult(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const inner = JSON.parse(raw);
      return parseKvMediaResult(inner);
    } catch {
      return [];
    }
  }
  if (typeof raw === 'object' && raw && typeof raw.value === 'string') {
    return parseKvMediaResult(raw.value);
  }
  return [];
}

async function readFileStore() {
  const file = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(file);
  const arr = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.media) ? parsed.media : [];
  return safeArray(arr).map(normalizeMediaItem);
}

function mergeMediaByUrlPreferKv(kvItems, fileItems) {
  const byUrl = new Map();
  fileItems.forEach((item) => {
    const u = String(item.url || '').trim();
    if (u) byUrl.set(u, item);
  });
  kvItems.forEach((item) => {
    const u = String(item.url || '').trim();
    if (u) byUrl.set(u, item);
  });
  return [...byUrl.values()];
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
    const parsed = parseKvMediaResult(data.result);
    const fromKv = safeArray(parsed).map(normalizeMediaItem);

    let fromFile = [];
    try {
      fromFile = await readFileStore();
    } catch (_) {
      fromFile = [];
    }

    if (fromKv.length > 0 || fromFile.length > 0) {
      return mergeMediaByUrlPreferKv(fromKv, fromFile);
    }

    return [];
  }

  return await readFileStore();
}

export async function writeMediaStore(mediaItems) {
  const normalized = safeArray(mediaItems).map(normalizeMediaItem);
  const kv = getKvConfig();

  if (kv) {
    const payload = JSON.stringify(normalized);
    const response = await fetch(`${kv.url}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json'
      },
      body: payload
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
