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
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '').trim();
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      const m = parsed.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{6,})/);
      if (m) return m[1];
    }
  } catch (_) {}
  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = (req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'url query parameter is required' });

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' }
    });

    if (!response.ok) {
      return res.status(200).json({ url, title: '', image: '', description: '' });
    }

    const html = await response.text();
    const finalUrl = response.url || url;

    let title = getMeta(html, 'og:title') || getTitleFallback(html) || '';
    let image = getMeta(html, 'og:image') || '';
    let description = getMeta(html, 'og:description') || getMeta(html, 'description') || '';

    const youtubeId = getYoutubeId(finalUrl) || getYoutubeId(url);
    if (youtubeId) {
      try {
        const oeRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + youtubeId)}&format=json`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (oeRes.ok) {
          const oe = await oeRes.json();
          if (oe.title) title = oe.title;
          if (oe.thumbnail_url) image = oe.thumbnail_url;
          if (oe.author_name && (!description || description.length < 20)) {
            description = `${oe.author_name} on YouTube`;
          }
        }
      } catch (_) {}
      if (!image) image = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    const tiktokMatch = finalUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) {
      try {
        const oeRes = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (oeRes.ok) {
          const oe = await oeRes.json();
          if (oe.title) title = oe.title;
          if (oe.thumbnail_url) image = oe.thumbnail_url;
          if (oe.author_name && (!description || description.length < 20)) {
            description = `${oe.author_name} on TikTok`;
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({ url: finalUrl, title, image, description });
  } catch (error) {
    console.error('unfurl error:', error);
    return res.status(200).json({ url, title: '', image: '', description: '' });
  }
}
