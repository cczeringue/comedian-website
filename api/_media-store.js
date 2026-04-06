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
  const urlEntry = envEntries.find(([key, value]) => key.endsWith('_REST_API_URL') && value);
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
    videoId: item.videoId ? String(item.videoId) : ''
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
    const data = await response.json();
    const parsed = data.result ? JSON.parse(data.result) : [];
    return safeArray(parsed).map(normalizeMediaItem);
  }

  const file = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(file);
  return safeArray(parsed).map(normalizeMediaItem);
}

export async function writeMediaStore(mediaItems) {
  const normalized = safeArray(mediaItems).map(normalizeMediaItem);
  const kv = getKvConfig();

  if (kv) {
    await fetch(`${kv.url}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: JSON.stringify(normalized) })
    });
    return;
  }

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
}
