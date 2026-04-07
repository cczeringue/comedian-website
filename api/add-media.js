import { getKvConfig, normalizeMediaItem, readMediaStore, writeMediaStore } from './_media-store.js';

function getYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim();
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
      if (embedMatch) return embedMatch[1];
      const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch (_) {
    return '';
  }
  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const expectedKey = process.env.MEDIA_ADMIN_KEY;
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body || {};
    const url = payload.url ? String(payload.url).trim() : '';

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!getKvConfig()) {
      return res.status(500).json({
        error: 'Media storage is not configured on Vercel yet.',
        details: 'Connect a Vercel Upstash Redis database so new media can be saved persistently.'
      });
    }

    const mediaItems = await readMediaStore().catch(() => []);
    const duplicate = mediaItems.find((item) => item.url === url);
    if (duplicate) {
      return res.status(409).json({ error: 'This URL is already in your media gallery', media: duplicate });
    }

    const normalized = normalizeMediaItem({
      ...payload,
      url,
      videoId: payload.videoId || getYoutubeId(url),
      track: payload.track,
      featured: payload.featured
    });

    mediaItems.push(normalized);
    await writeMediaStore(mediaItems);

    return res.status(201).json({
      success: true,
      message: 'Media item added',
      media: normalized
    });
  } catch (error) {
    console.error('add-media error:', error);
    return res.status(500).json({ error: 'Failed to add media', details: error.message });
  }
}
