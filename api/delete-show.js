// Delete a show by ID
// DELETE /api/delete-show?id=show_123

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.SHOWS_API_KEY;

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return res.status(500).json({ error: 'Vercel KV not configured' });
    }

    // Get existing shows
    const getResponse = await fetch(`${process.env.KV_REST_API_URL}/get/shows`, {
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
    });
    const getData = await getResponse.json();
    const shows = getData.result ? JSON.parse(getData.result) : [];

    // Find and remove the show
    const showIndex = shows.findIndex(s => s.id === id);

    if (showIndex === -1) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const deletedShow = shows.splice(showIndex, 1)[0];

    // Save back to KV
    await fetch(`${process.env.KV_REST_API_URL}/set/shows`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(shows) }),
    });

    return res.status(200).json({
      success: true,
      message: 'Show deleted',
      show: deletedShow
    });

  } catch (error) {
    console.error('Error deleting show:', error);
    return res.status(500).json({ error: 'Failed to delete show' });
  }
}
