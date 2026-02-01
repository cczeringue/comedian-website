// Add a show by submitting an event URL
// Scrapes Eventbrite, Dice, Facebook Events, and generic event pages

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check - require a secret key
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.SHOWS_API_KEY;

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized. Include Authorization: Bearer YOUR_KEY' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Scrape the event
    const eventData = await scrapeEvent(url);

    if (!eventData) {
      return res.status(400).json({ error: 'Could not extract event data from URL' });
    }

    // Store in Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      // Get existing shows
      const getResponse = await fetch(`${process.env.KV_REST_API_URL}/get/shows`, {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      });
      const getData = await getResponse.json();
      const shows = getData.result ? JSON.parse(getData.result) : [];

      // Check for duplicate (same URL or same name+date)
      const isDuplicate = shows.some(s =>
        s.url === eventData.url ||
        (s.name === eventData.name && s.date === eventData.date)
      );

      if (isDuplicate) {
        return res.status(409).json({ error: 'This show already exists', show: eventData });
      }

      // Add new show
      shows.push(eventData);

      // Save back to KV
      await fetch(`${process.env.KV_REST_API_URL}/set/shows`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: JSON.stringify(shows) }),
      });

      return res.status(201).json({
        success: true,
        message: 'Show added successfully!',
        show: eventData
      });
    }

    // No KV configured - just return the scraped data
    return res.status(200).json({
      success: true,
      message: 'Show scraped but not stored (Vercel KV not configured)',
      show: eventData,
      instructions: 'To enable storage, set up Vercel KV in your project settings'
    });

  } catch (error) {
    console.error('Error adding show:', error);
    return res.status(500).json({ error: 'Failed to add show', details: error.message });
  }
}

// Scrape event data from various platforms
async function scrapeEvent(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Determine platform and scrape accordingly
    if (hostname.includes('eventbrite')) {
      return await scrapeEventbrite(url);
    } else if (hostname.includes('dice.fm')) {
      return await scrapeDice(url);
    } else if (hostname.includes('facebook.com') && url.includes('/events/')) {
      return await scrapeFacebook(url);
    } else if (hostname.includes('seetickets') || hostname.includes('ticketmaster')) {
      return await scrapeGeneric(url);
    } else {
      // Try generic scraping with Open Graph / JSON-LD
      return await scrapeGeneric(url);
    }
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

// Scrape Eventbrite events
async function scrapeEventbrite(url) {
  try {
    // Handle manage URLs - convert to public event page
    // e.g., /manage/events/1982095095788/details → /e/-tickets-1982095095788
    let publicUrl = url;
    const manageMatch = url.match(/eventbrite\.com\/manage\/events\/(\d+)/);
    if (manageMatch) {
      const eventId = manageMatch[1];
      // Try to fetch the public page directly using the event ID
      publicUrl = `https://www.eventbrite.com/e/-tickets-${eventId}`;
    }

    const response = await fetch(publicUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });
    const html = await response.text();
    const finalUrl = response.url; // Get the actual URL after redirects

    // Try to find JSON-LD structured data first
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        const event = Array.isArray(jsonLd) ? jsonLd.find(item => item['@type'] === 'Event') : jsonLd;

        if (event && event['@type'] === 'Event') {
          return {
            id: generateId(),
            name: event.name,
            date: event.startDate,
            endDate: event.endDate || null,
            venue: event.location?.name || 'TBA',
            address: formatAddress(event.location?.address),
            city: event.location?.address?.addressLocality || '',
            url: finalUrl || publicUrl,
            ticketUrl: event.offers?.url || finalUrl || publicUrl,
            image: event.image || null,
            platform: 'eventbrite',
            addedAt: new Date().toISOString()
          };
        }
      } catch (e) {
        console.log('JSON-LD parse error, trying regex fallback');
      }
    }

    // Fallback: regex patterns for Eventbrite
    const titleMatch = html.match(/<h1[^>]*class="[^"]*event-title[^"]*"[^>]*>([^<]+)</) ||
                       html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    const dateMatch = html.match(/datetime="([^"]+)"/);
    const venueMatch = html.match(/<p[^>]*class="[^"]*location-info__address[^"]*"[^>]*>([^<]+)</);

    if (titleMatch) {
      return {
        id: generateId(),
        name: decodeHtmlEntities(titleMatch[1].trim()),
        date: dateMatch ? dateMatch[1] : null,
        venue: venueMatch ? decodeHtmlEntities(venueMatch[1].trim()) : 'TBA',
        url: finalUrl || publicUrl,
        ticketUrl: finalUrl || publicUrl,
        platform: 'eventbrite',
        addedAt: new Date().toISOString()
      };
    }

    // Last resort: try Eventbrite API if we have an event ID
    const eventId = url.match(/(\d{10,})/)?.[1];
    if (eventId) {
      try {
        // Eventbrite has a public oEmbed endpoint
        const oembedUrl = `https://www.eventbrite.com/oembed/?url=https://www.eventbrite.com/e/-tickets-${eventId}&format=json`;
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          if (oembed.title) {
            return {
              id: generateId(),
              name: oembed.title,
              date: null, // oEmbed doesn't include date
              venue: 'See event page',
              url: `https://www.eventbrite.com/e/-tickets-${eventId}`,
              ticketUrl: `https://www.eventbrite.com/e/-tickets-${eventId}`,
              platform: 'eventbrite',
              addedAt: new Date().toISOString()
            };
          }
        }
      } catch (e) {
        console.log('oEmbed fallback failed');
      }
    }

    return null;
  } catch (error) {
    console.error('Eventbrite scraping error:', error);
    return null;
  }
}

// Scrape Dice.fm events
async function scrapeDice(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    // Look for JSON-LD or Open Graph tags
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        const event = Array.isArray(jsonLd) ? jsonLd.find(item => item['@type'] === 'Event') : jsonLd;

        if (event && event['@type'] === 'Event') {
          return {
            id: generateId(),
            name: event.name,
            date: event.startDate,
            venue: event.location?.name || 'TBA',
            city: event.location?.address?.addressLocality || '',
            url: url,
            ticketUrl: url,
            image: event.image || null,
            platform: 'dice',
            addedAt: new Date().toISOString()
          };
        }
      } catch (e) {
        console.log('JSON-LD parse error for Dice');
      }
    }

    // Fallback to Open Graph
    return await scrapeOpenGraph(url, html, 'dice');
  } catch (error) {
    console.error('Dice scraping error:', error);
    return null;
  }
}

// Scrape Facebook Events
async function scrapeFacebook(url) {
  // Facebook is notoriously hard to scrape - try Open Graph approach
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    const html = await response.text();
    return await scrapeOpenGraph(url, html, 'facebook');
  } catch (error) {
    console.error('Facebook scraping error:', error);
    return null;
  }
}

// Generic scraper using Open Graph and JSON-LD
async function scrapeGeneric(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    // Try JSON-LD first
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const jsonLd = JSON.parse(jsonStr);
          const event = Array.isArray(jsonLd) ? jsonLd.find(item => item['@type'] === 'Event') : jsonLd;

          if (event && event['@type'] === 'Event') {
            return {
              id: generateId(),
              name: event.name,
              date: event.startDate,
              endDate: event.endDate || null,
              venue: event.location?.name || 'TBA',
              address: formatAddress(event.location?.address),
              city: event.location?.address?.addressLocality || '',
              url: url,
              ticketUrl: event.offers?.url || url,
              image: event.image || null,
              platform: 'generic',
              addedAt: new Date().toISOString()
            };
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Fallback to Open Graph
    return await scrapeOpenGraph(url, html, 'generic');
  } catch (error) {
    console.error('Generic scraping error:', error);
    return null;
  }
}

// Extract Open Graph metadata
async function scrapeOpenGraph(url, html, platform) {
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
  const ogDescription = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/);
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);

  // Try to find a date
  const datePatterns = [
    /datetime="(\d{4}-\d{2}-\d{2}T[^"]+)"/,
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/,
    /(\w+ \d{1,2}, \d{4})/,
  ];

  let date = null;
  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match) {
      date = match[1];
      break;
    }
  }

  if (ogTitle) {
    return {
      id: generateId(),
      name: decodeHtmlEntities(ogTitle[1]),
      date: date,
      description: ogDescription ? decodeHtmlEntities(ogDescription[1]) : null,
      url: url,
      ticketUrl: url,
      image: ogImage ? ogImage[1] : null,
      platform: platform,
      addedAt: new Date().toISOString()
    };
  }

  return null;
}

// Helper functions
function generateId() {
  return `show_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function formatAddress(address) {
  if (!address) return null;
  if (typeof address === 'string') return address;

  const parts = [];
  if (address.streetAddress) parts.push(address.streetAddress);
  if (address.addressLocality) parts.push(address.addressLocality);
  if (address.addressRegion) parts.push(address.addressRegion);
  if (address.postalCode) parts.push(address.postalCode);

  return parts.join(', ');
}
