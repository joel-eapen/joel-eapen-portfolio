// Fetches the reading list from the ReadTrack API at build time.
// Runs server-side during `astro build` / `astro dev`, so results are baked
// into the static HTML — no client-side calls and the API key never ships to
// the browser. Rebuild the site to refresh the list.
//
// Auth: GET /api/public/books with header `x-api-key: <READ_TRACK_API_KEY>`.
// The key is read from .env (READ_TRACK_API_KEY) and is gitignored.

const API_BASE = 'https://readtrack-37hx.onrender.com';

export type ReadingStatus = 'finished' | 'current_read' | 'want_to_read';

export interface Book {
  externalId: string;
  title: string;
  author: string;
  coverImg: string;
  isbn: string;
  status: ReadingStatus;
  totalPages: number;
  pagesRead: number;
  percentRead: number;
}

interface ApiBook {
  externalId?: string;
  title?: string;
  author?: string;
  coverImg?: string;
  isbn?: string;
  status?: string;
  totalPages?: number;
  pagesRead?: number;
  percentRead?: number;
}

interface ApiEnvelope {
  success?: boolean;
  data?: { books?: ApiBook[] };
  message?: string;
}

const VALID_STATUSES: ReadingStatus[] = ['finished', 'current_read', 'want_to_read'];

function normalizeStatus(status: string | undefined): ReadingStatus {
  return VALID_STATUSES.includes(status as ReadingStatus)
    ? (status as ReadingStatus)
    : 'want_to_read';
}

/**
 * Returns all books from the ReadTrack reading list. Paginates through the API
 * so the full list is included. Never throws: on any failure returns an empty
 * array so the build/page still renders.
 */
export async function getBooks(): Promise<Book[]> {
  const rawKey =
    import.meta.env.READ_TRACK_API_KEY ??
    (typeof process !== 'undefined' ? process.env.READ_TRACK_API_KEY : undefined);
  const apiKey = rawKey?.trim();
  if (!apiKey) {
    console.warn('[readtrack] READ_TRACK_API_KEY not set — skipping book fetch.');
    return [];
  }

  const headers = {
    'x-api-key': apiKey,
    Accept: 'application/json',
  };

  const all: Book[] = [];
  const limit = 100;
  let page = 1;
  const maxPages = 20; // safety cap

  try {
    while (page <= maxPages) {
      const url = `${API_BASE}/api/public/books?page=${page}&limit=${limit}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`[readtrack] fetch failed: ${res.status} ${res.statusText}`);
        break;
      }

      const envelope = (await res.json()) as ApiEnvelope;
      const books = envelope.data?.books ?? [];
      if (books.length === 0) break;

      for (const b of books) {
        all.push({
          externalId: b.externalId ?? '',
          title: b.title?.trim() ?? 'Untitled',
          author: b.author?.trim() ?? '',
          coverImg: b.coverImg ?? '',
          isbn: b.isbn ?? '',
          status: normalizeStatus(b.status),
          totalPages: b.totalPages ?? 0,
          pagesRead: b.pagesRead ?? 0,
          percentRead: b.percentRead ?? 0,
        });
      }

      if (books.length < limit) break;
      page += 1;
    }
  } catch (err) {
    console.warn('[readtrack] fetch error:', err);
    return all;
  }

  return all;
}
