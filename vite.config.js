import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'youtube-search-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (!req.url.startsWith('/api/youtube-search')) return next();
            const url = new URL(req.url, 'http://localhost');
            const q = url.searchParams.get('q') || '';
            const key = url.searchParams.get('key') || process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || '';
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            if (!key) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: { message: 'Missing API key' } }));
              return;
            }
            const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(q)}&key=${key}`;
            const r = await fetch(apiUrl);
            const data = await r.json();
            if (r.status === 429 || data?.error?.errors?.[0]?.reason?.includes('quota')) {
              res.statusCode = 429;
              res.end(JSON.stringify({ error: { message: 'Quota exceeded or throttled' } }));
              return;
            }
            if (data.error) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: { message: data.error.message || 'YouTube API error' } }));
              return;
            }
            const items = (data.items || []).map((item) => ({
              videoId: item.id?.videoId,
              title: item.snippet?.title,
              channel: item.snippet?.channelTitle,
              thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            }));
            res.statusCode = 200;
            res.end(JSON.stringify({ items }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: { message: e.message || 'Server error' } }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
