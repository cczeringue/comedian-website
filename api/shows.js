// Vercel KV-based shows storage API
// GET: returns all shows
// Requires SHOWS_DATA environment variable OR Vercel KV

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try Vercel KV first
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const response = await fetch(`${process.env.KV_REST_API_URL}/get/shows`, {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      });
      const data = await response.json();
      const shows = data.result ? JSON.parse(data.result) : [];

      // Filter to only upcoming shows and sort by date
      const now = new Date();
      const upcomingShows = shows
        .filter(show => new Date(show.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return res.status(200).json({ shows: upcomingShows });
    }

    // Fallback: check environment variable for static shows
    if (process.env.SHOWS_DATA) {
      const shows = JSON.parse(process.env.SHOWS_DATA);
      const now = new Date();
      const upcomingShows = shows
        .filter(show => new Date(show.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      return res.status(200).json({ shows: upcomingShows });
    }

    // No storage configured - return empty
    return res.status(200).json({ shows: [], message: 'No storage configured. Set up Vercel KV or SHOWS_DATA env var.' });

  } catch (error) {
    console.error('Error fetching shows:', error);
    return res.status(500).json({ error: 'Failed to fetch shows' });
  }
}
