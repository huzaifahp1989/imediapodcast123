import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Preload critical queries and endpoint to optimize cold start
async function preload() {
  try {
    await queryClient.prefetchQuery({
      queryKey: ['videoPodcasts'],
      queryFn: () => import('./api/base44Client').then(m => m.base44.entities.VideoPodcast.filter({ status: 'approved' }, '-published_date')),
    });
    await queryClient.prefetchQuery({
      queryKey: ['audioContent'],
      queryFn: () => import('./api/base44Client').then(m => m.base44.entities.AudioContent.filter({ status: 'approved' }, '-published_date')),
    });
  } catch {}

  // Attempt to preload /api/videos endpoint, abort after 5s if slow
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    fetch('/api/videos', { signal: controller.signal }).catch(() => {});
    setTimeout(() => clearTimeout(id), 0);
  } catch {}
}

preload()

ReactDOM.createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
)
