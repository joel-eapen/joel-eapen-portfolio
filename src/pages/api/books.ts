import type { APIRoute } from 'astro';
import { getBooks } from '../../lib/readtrack.ts';

// Server-rendered endpoint (not prerendered). Runs on the Node server so the
// ReadTrack API key stays secret. The browser fetches THIS route on page load
// to get the latest reading list, instead of calling ReadTrack directly.
export const prerender = false;

export const GET: APIRoute = async () => {
  const books = await getBooks();

  return new Response(JSON.stringify({ books }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Allow brief CDN/browser caching to avoid hammering ReadTrack on every hit.
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
};
