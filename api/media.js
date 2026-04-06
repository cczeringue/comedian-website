import { readMediaStore } from './_media-store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const media = await readMediaStore();
    const sorted = media.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json({ media: sorted });
  } catch (error) {
    console.error('media api error:', error);
    return res.status(200).json({ media: [], error: 'No media storage found yet. Add first item via admin.' });
  }
}
