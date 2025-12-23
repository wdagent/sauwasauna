/**
 * WDA-339: Route Translation Map
 *
 * Maps page identifiers to their localized slugs
 * Used for language switching to preserve the correct translated route
 */

export type Locale = 'es' | 'ca' | 'en' | 'fr';

/**
 * Route translations map
 * Key: route identifier
 * Value: object with locale keys pointing to the actual slug
 */
export const ROUTE_TRANSLATIONS: Record<string, Record<Locale, string>> = {
  // Home page
  home: {
    es: '/',
    ca: '/',
    en: '/',
    fr: '/',
  },

  // Partners / B2B page - WDA-528: Renamed from "Acceso Exclusivo" to "Partners Hoteleros"
  'partners-b2b': {
    es: '/partners-hoteleros/',
    ca: '/socis-hotelers/',
    en: '/hotel-partners/',
    fr: '/partenaires-hoteliers/',
  },

  // Careers page
  careers: {
    es: '/trabaja-con-nosotros/',
    ca: '/treballa-amb-nosaltres/',
    en: '/work-with-us/',
    fr: '/travailler-avec-nous/',
  },

  // Blog (same for all languages)
  blog: {
    es: '/blog/',
    ca: '/blog/',
    en: '/blog/',
    fr: '/blog/',
  },

  // Legal pages - WDA-556: Translated slugs per language
  'aviso-legal': {
    es: '/aviso-legal/',
    ca: '/avis-legal/',
    en: '/legal-notice/',
    fr: '/mentions-legales/',
  },

  'politica-cookies': {
    es: '/politica-de-cookies/',
    ca: '/politica-de-cookies/',
    en: '/cookie-policy/',
    fr: '/politique-cookies/',
  },

  'politica-privacidad': {
    es: '/politica-de-privacidad/',
    ca: '/politica-de-privacitat/',
    en: '/privacy-policy/',
    fr: '/politique-de-confidentialite/',
  },

  // WDA-963: Partner detail pages
  'partner-detail': {
    es: '/socio/',
    ca: '/soci/',
    en: '/partner/',
    fr: '/partenaire/',
  },

  // WDA-963: Session detail pages
  'session-detail': {
    es: '/sesion/',
    ca: '/sessio/',
    en: '/session/',
    fr: '/seance/',
  },

  // WDA-1033: Gift redemption pages
  'gift-redemption': {
    es: '/canjear-regalo/',
    ca: '/bescanviar-regal/',
    en: '/redeem-gift/',
    fr: '/echanger-cadeau/',
  },
};

/**
 * Reverse map: slug → route identifier
 * Used to identify which page we're on based on the current path
 */
export const SLUG_TO_ROUTE: Record<string, string> = {
  // Home
  '/': 'home',

  // Partners - WDA-528: New slugs
  '/partners-hoteleros/': 'partners-b2b',
  '/socis-hotelers/': 'partners-b2b',
  '/hotel-partners/': 'partners-b2b',
  '/partenaires-hoteliers/': 'partners-b2b',
  // Old slugs for backwards compatibility (should redirect)
  '/acceso-exclusivo/': 'partners-b2b',
  '/acces-exclusiu/': 'partners-b2b',
  '/exclusive-access/': 'partners-b2b',
  '/acces-exclusif/': 'partners-b2b',

  // Careers
  '/trabaja-con-nosotros/': 'careers',
  '/treballa-amb-nosaltres/': 'careers',
  '/work-with-us/': 'careers',
  '/travailler-avec-nous/': 'careers',

  // Blog
  '/blog/': 'blog',

  // Legal - WDA-556: All translated slugs
  // Aviso Legal
  '/aviso-legal/': 'aviso-legal',
  '/avis-legal/': 'aviso-legal',
  '/legal-notice/': 'aviso-legal',
  '/mentions-legales/': 'aviso-legal',

  // Política de Cookies
  '/politica-de-cookies/': 'politica-cookies',
  '/cookie-policy/': 'politica-cookies',
  '/politique-cookies/': 'politica-cookies',

  // Política de Privacidad
  '/politica-de-privacidad/': 'politica-privacidad',
  '/politica-de-privacitat/': 'politica-privacidad',
  '/privacy-policy/': 'politica-privacidad',
  '/politique-de-confidentialite/': 'politica-privacidad',

  // WDA-1033: Gift Redemption
  '/canjear-regalo/': 'gift-redemption',
  '/bescanviar-regal/': 'gift-redemption',
  '/redeem-gift/': 'gift-redemption',
  '/echanger-cadeau/': 'gift-redemption',
};

/**
 * Get the translated route for a given path and target locale
 *
 * @param currentPath - Current path without locale (e.g., '/blog/', '/acceso-exclusivo/')
 * @param targetLocale - Target language code
 * @returns Translated path for the target locale
 *
 * @example
 * getTranslatedRoute('/acceso-exclusivo/', 'en') // returns '/exclusive-access/'
 * getTranslatedRoute('/blog/', 'fr') // returns '/blog/'
 */
export function getTranslatedRoute(currentPath: string, targetLocale: Locale): string {
  // Check if path starts with /blog/ (blog post)
  if (currentPath.startsWith('/blog/') && currentPath !== '/blog/') {
    // Blog posts keep the same slug across languages
    return currentPath;
  }

  // Look up the route identifier for the current path
  const routeId = SLUG_TO_ROUTE[currentPath];

  // If we found a route identifier, get the translated slug
  if (routeId && ROUTE_TRANSLATIONS[routeId]) {
    return ROUTE_TRANSLATIONS[routeId][targetLocale];
  }

  // Fallback: return the current path (for unknown routes)
  return currentPath;
}

/**
 * Build the full localized URL for language switching
 *
 * @param currentPath - Current full path with locale (e.g., '/es/blog/', '/es/acceso-exclusivo/')
 * @param targetLocale - Target language code
 * @returns Full URL with target locale and translated path
 *
 * @example
 * getLocalizedUrl('/es/acceso-exclusivo/', 'en') // returns '/en/exclusive-access/'
 * getLocalizedUrl('/ca/blog/', 'fr') // returns '/fr/blog/'
 */
export function getLocalizedUrl(currentPath: string, targetLocale: Locale): string {
  // Remove leading slash and split path
  const pathParts = currentPath.replace(/^\//, '').split('/');

  // First part should be the current locale (es, ca, en, fr)
  if (pathParts.length > 0 && ['es', 'ca', 'en', 'fr'].includes(pathParts[0])) {
    // Remove the locale from path parts
    pathParts.shift();
  }

  // Reconstruct path without locale
  const pathWithoutLocale = '/' + pathParts.join('/');

  // Ensure trailing slash
  const normalizedPath = pathWithoutLocale.endsWith('/') ? pathWithoutLocale : `${pathWithoutLocale}/`;

  // Get translated route
  const translatedPath = getTranslatedRoute(normalizedPath, targetLocale);

  // Build final URL
  return `/${targetLocale}${translatedPath}`;
}
