export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const q = url.searchParams.get('q') || '';
    const keyParam = url.searchParams.get('key') || '';
    const key = keyParam || process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
    res.setHeader('Content-Type', 'application/json');
    if (!key) {
      res.status(400).json({ error: { message: 'Missing API key' } });
      return;
    }
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(q)}&key=${key}`;
    const r = await fetch(apiUrl);
    const data = await r.json();
    if (r.status === 429 || data?.error?.errors?.[0]?.reason?.includes('quota')) {
      res.status(429).json({ error: { message: 'Quota exceeded or throttled' } });
      return;
    }
    if (data.error) {
      res.status(400).json({ error: { message: data.error.message || 'YouTube API error' } });
      return;
    }
    const items = (data.items || []).map((item) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
    }));
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: { message: e.message || 'Server error' } });
  }
}
