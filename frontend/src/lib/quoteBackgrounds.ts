export const DEFAULT_QUOTE_BACKGROUND =
  '/display-backgrounds/quotes/q01-taqwa-dawn.png';

export const QUOTE_BACKGROUNDS = [
  '/display-backgrounds/quotes/q01-taqwa-dawn.png',
  '/display-backgrounds/quotes/q02-hardship-ease.png',
  '/display-backgrounds/quotes/q03-sabr-night.png',
  '/display-backgrounds/quotes/q04-dhikr-garden.png',
  '/display-backgrounds/quotes/q05-hope-horizon.png',
  '/display-backgrounds/quotes/q06-dua-desert.png',
  '/display-backgrounds/quotes/q07-salah-arches.png',
  '/display-backgrounds/quotes/q08-taqwa-emerald.png',
  '/display-backgrounds/quotes/q09-learn-quran.png',
  '/display-backgrounds/quotes/q10-dua-moon.png',
  '/display-backgrounds/quotes/q11-fear-allah.png',
  '/display-backgrounds/quotes/q12-benefit-people.png',
  '/display-backgrounds/quotes/q13-consistency.png',
  '/display-backgrounds/quotes/q14-salawat.png',
  '/display-backgrounds/quotes/q15-cleanliness.png',
] as const;

type QuoteWithBackground = { bg?: string | null };

function normalizeBackgroundPath(value?: string | null) {
  const path = value?.trim();
  if (!path) return null;

  // Public assets are addressed from the site root, never through /public.
  if (path.startsWith('/public/')) return path.slice('/public'.length);

  // Reject local filesystem paths, malformed relative paths, and unsafe schemes.
  if (/^\/(Users|home|var|private|tmp)\//i.test(path)) return null;
  if (/^[a-z]:[\\/]/i.test(path)) return null;
  if (path.startsWith('/') && !path.startsWith('//')) return path;
  if (/^https:\/\//i.test(path)) return path;
  return null;
}

export function getQuoteBackground(
  quote: QuoteWithBackground | null | undefined,
  index: number,
) {
  return (
    normalizeBackgroundPath(quote?.bg) ??
    QUOTE_BACKGROUNDS[index % QUOTE_BACKGROUNDS.length] ??
    DEFAULT_QUOTE_BACKGROUND
  );
}
