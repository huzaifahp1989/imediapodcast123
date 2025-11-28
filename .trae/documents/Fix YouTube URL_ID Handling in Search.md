## Summary
The YouTube search box currently treats input as a keyword query and, when an API key is present, it calls the Search endpoint even if the input is a full YouTube URL or a raw video ID. This causes failures when users paste a URL/ID. I will enhance the search handler to detect URLs/IDs and fetch the specific video directly.

## Changes
1. Detect URL/ID in the search field
- In `src/pages/VideoPodcast.jsx:272` (searchYouTube), use existing `extractVideoId` (`src/pages/VideoPodcast.jsx:221`) to check if `youtubeSearchQuery` is a URL or a valid 11-char ID.

2. Direct-fetch path when URL/ID detected
- If a video ID is detected and an API key exists (`getYouTubeApiKey` in `src/pages/VideoPodcast.jsx:210`), call `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=<ID>&key=<KEY>`.
- Map the result to the existing item shape: `{ videoId, title, channel, thumbnail }` using `snippet` data and `getYouTubeThumbnail` (`src/pages/VideoPodcast.jsx:205`) as a fallback.
- Set `youtubeSearchResults` to a single-item array and stop further keyword search.

3. Fallback without API key
- If no API key, reuse `importFromInput` (`src/pages/VideoPodcast.jsx:237`) which uses oEmbed to resolve title/channel and shows the single item.

4. Preserve existing keyword search
- If input is not URL/ID, keep the current YouTube Search API flow (`search` endpoint with `q=<query>`), including timeout and quota handling already present.

5. UX messaging
- If a URL/ID is detected, show a brief toast like "Loaded video by URL/ID" (reusing the existing toast pattern) for clarity.

## Verification
- Paste full URL like `https://www.youtube.com/watch?v=dQw4w9WgXcQ` into the YouTube search box: should return exactly one result with correct title/channel/thumbnail.
- Paste short URL `https://youtu.be/dQw4w9WgXcQ`: same behavior.
- Paste raw ID `dQw4w9WgXcQ`: same behavior.
- Enter plain keywords (e.g., "Surah Al-Fatiha"): hits the search endpoint and returns multiple results.
- Test with and without API key to verify the oEmbed fallback.

## Notes
- No changes to the direct URL input section (`youtubeUrl`) or the import flow (`importSelectedVideos` at `src/pages/VideoPodcast.jsx:336`).
- API key reading remains via `getYouTubeApiKey`, using env `VITE_YOUTUBE_API_KEY` or `localStorage['youtube_api_key']`.