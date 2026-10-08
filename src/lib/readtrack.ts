// Fetches the reading list from the ReadTrack API at build time.
// Runs server-side during `astro build` / `astro dev`, so results are baked
// into the static HTML — no client-side calls and the API key never ships to
// the browser. Rebuild the site to refresh the list.
//
// Auth: GET /api/public/books with header `x-api-key: <READ_TRACK_API_KEY>`.
// The key is read from .env (READ_TRACK_API_KEY) and is gitignored.

const API_BASE = 'https://readtrack-37hx.onrender.com';

export type ReadingStatus = 'finished' | 'current_read' | 'want_to_read';

export const BOOK_CATEGORIES = [
  'Fantasy & Adventure',
  'Mystery & Thriller',
  'Biography & Memoir',
  'Self-Help & Business',
  'Fiction & Classics',
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export interface Book {
  externalId: string;
  title: string;
  author: string;
  coverImg: string;
  isbn: string;
  status: ReadingStatus;
  category: BookCategory;
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

export function getCategory(title: string, author: string): BookCategory {
  const hay = `${title} ${author}`.toLowerCase();

  // helper for substring match
  const has = (...keys: string[]) => keys.some((k) => hay.includes(k));

  // Fantasy & Adventure – catches any future fantasy/adventure/sci-fi titles
  if (has(
    'harry potter', 'percy jackson', 'sea of monsters', "titan's curse", 'lightning thief', 'rick riordan',
    'j.k. rowling', 'j. k. rowling', 'tolkien', 'hobbit', 'lord of the rings', 'narnia', 'wizard', 'magic',
    'dragon', 'chronicles', 'demigod', 'olympian', 'fantasy', 'adventure', 'quest', 'prophecy', 'myth'
  )) return 'Fantasy & Adventure';

  // Sci-fi thriller like Dark Matter should visually sit with mystery/thriller, but
  // generic sci-fi keywords also map to Fantasy & Adventure if not already caught above.
  // Mystery & Thriller – broad crime/mystery/thriller detection for future books
  if (has(
    'agatha', 'dan brown', 'jeffery deaver', 'shari lapena', 'alex michaelides', 'jo nesbo', 'karen mcmanus',
    'blake crouch', 'dark matter', 'one of us is lying', 'couple next door', 'lost symbol', 'roger ackroyd',
    'october list', 'da vinci', 'headhunters', 'then there were none', 'silent patient', 'angels & demons',
    'angels and demons', 'orient express', 'murder', 'mystery', 'thriller', 'detective', 'crime', 'killing',
    'death', 'patient', 'psychological', 'suspense', 'homicide', 'whodunit'
  )) return 'Mystery & Thriller';

  // Biography & Memoir – real people, memoir keywords
  if (has(
    'elon musk', 'shoe dog', 'i am malala', 'malala', 'phil knight', 'andre agassi', 'that will never work',
    'marc randolph', 'ashlee vance', 'letters from a father', 'biography', 'memoir', 'autobiography',
    'diary', 'my life', 'my story', 'becoming', 'born a crime', 'steve jobs', 'obama'
  )) return 'Biography & Memoir';

  // Self-Help & Business – productivity, business, psychology
  if (has(
    'do epic', 'warikoo', 'deep work', 'cal newport', 'atomic habits', 'habit', 'mindset', 'psychology',
    'thinking, fast', 'sapiens', 'business', 'startup', 'entrepreneur', 'leadership', 'productivity',
    'self-help', 'self help', 'motivation', 'success', 'rich dad', 'lean startup', 'zero to one',
    'shoe dog' // overlaps but already caught, keep here for completeness
  )) return 'Self-Help & Business';

  // Anything new that doesn't match above still gets a home – Fiction & Classics is the
  // intentional catch-all so newly added books never appear uncategorized.
  return 'Fiction & Classics';
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
        const title = b.title?.trim() ?? 'Untitled';
        const author = b.author?.trim() ?? '';
        all.push({
          externalId: b.externalId ?? '',
          title,
          author,
          coverImg: b.coverImg ?? '',
          isbn: b.isbn ?? '',
          status: normalizeStatus(b.status),
          category: getCategory(title, author),
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
