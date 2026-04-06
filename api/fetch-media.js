function decodeEntities(str = '') {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getMeta(html, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${escaped}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${escaped}["']`, 'i'),
    new RegExp(`<meta[^>]*name=["']${escaped}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${escaped}["']`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return decodeEntities(match[1].trim());
  }
  return '';
}

function getTitleFallback(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1]) return '';
  return decodeEntities(titleMatch[1].trim());
}

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

function inferType(url) {
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
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DrillmasterMediaBot/1.0)'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Could not fetch URL (${response.status})` });
    }

    const html = await response.text();
    const finalUrl = response.url || url;
    const youtubeId = getYoutubeId(finalUrl) || getYoutubeId(url);

    let title = getMeta(html, 'og:title') || getTitleFallback(html);
    let thumbnail = getMeta(html, 'og:image');
    const description = getMeta(html, 'og:description') || getMeta(html, 'description') || '';
    const type = inferType(finalUrl);

    if (youtubeId && !thumbnail) {
      thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    if (!title) title = 'Untitled media item';

    return res.status(200).json({
      media: {
        type,
        title,
        url: finalUrl,
        thumbnail,
        description,
        date: new Date().toISOString(),
        videoId: youtubeId || ''
      }
    });
  } catch (error) {
    console.error('fetch-media error:', error);
    return res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
  }
}
