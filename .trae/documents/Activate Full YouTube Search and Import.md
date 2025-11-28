## Goal
Enable robust, end-to-end YouTube search that returns video results and supports bulk import, using your YouTube Data API v3 key. Avoid client-side restrictions by proxying through a server route.

## Backend Route (/api/youtube-search)
- Implement a dev server route that proxies requests to `https://www.googleapis.com/youtube/v3/search`.
- Query params: `part=snippet`, `type=video`, `maxResults=20`, `q=<query>`, `key=<apiKey>`.
- Key sourcing order: request `key` → env (`VITE_YOUTUBE_API_KEY` or `YOUTUBE_API_KEY`).
- Normalize response to `{ items: [{ videoId, title, channel, thumbnail }] }`.
- Error handling:
  - Quota/throttle → `429` + `{ error: { message: 'Quota exceeded or throttled' } }`.
  - Invalid/missing key / permission denied (403) → `400` + `{ error: { message } }`.
  - Network/server error → `500` + `{ error: { message } }`.
- CORS: set `Access-Control-Allow-Origin: *` and `Content-Type: application/json`.
- Production: provide an Express handler or serverless function with identical logic (so the feature works beyond Vite dev).

## Frontend Integration
- Update `searchYouTube` in `src/pages/VideoPodcast.jsx:272` to call `/api/youtube-search?q=<query>&key=<apiKey>` and render normalized items.
- Display:
  - Thumbnail, title, channel in the results list.
  - Loading spinner, inline error message under the search controls.
- Keep existing URL/ID detection path (`extractVideoId` in `src/pages/VideoPodcast.jsx:221`) for direct single-video load.
- Maintain selection and import flow (`importSelectedVideos` in `src/pages/VideoPodcast.jsx:336`).

## Key Management & UX
- Continue detecting keys from env/localStorage (`getYouTubeApiKey` in `src/pages/VideoPodcast.jsx:222`).
- Keep inline UI to set and save key (localStorage), plus a “Test API” button.
- Add a status indicator (“API key detected/missing”) and surface exact error causes inline.

## Remove Restrictions
- Ensure the client does not call Google directly for keywords; all keyword search goes through `/api/youtube-search` to avoid browser referrer restrictions and CORS issues.
- Allow passing the key via query to the server route to bypass env-only limitations.

## Verification
- Dev: restart and test with queries like `quran`, confirm results render with thumbnails, titles, channels.
- URL/ID: paste `https://youtu.be/<id>` and confirm single-item load.
- Error scenarios: invalid key, quota exceeded, permission denied — verify inline messages and toasts.
- Import selected videos and confirm they are created in `VideoPodcast` entity with proper fields.

## Security & Config
- Do not hardcode keys in the repo; use env or localStorage.
- For production, encourage env-only key usage and restrict origins/quotas in Google Cloud.

## Files to Update
- `vite.config.js`: add proxy route logic for dev and document production equivalent.
- `src/pages/VideoPodcast.jsx`: wire the search to `/api/youtube-search`, render results and errors.

## Notes
- Existing code paths referenced: `searchYouTube` (src/pages/VideoPodcast.jsx:272), URL/ID detection (src/pages/VideoPodcast.jsx:221), import flow (src/pages/VideoPodcast.jsx:336).
- After approval, I will apply the backend route and frontend wiring, test locally, and report success with screenshots/notes.