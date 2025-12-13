/**
 * Dynamic Content Client
 * WDA-990: Vanilla JS client for runtime content hydration
 *
 * Features:
 * - Browser-side GraphQL fetching with 5-minute cache
 * - Change detection between SSG and fresh data
 * - Event-based rendering for custom updates
 * - Robust error handling with retry logic
 * - Zero dependencies (vanilla JS only)
 */

import {
  GET_PARTNER_BY_SLUG_DYNAMIC,
  GET_SESSION_BY_SLUG_DYNAMIC,
  GET_ALL_PARTNERS_SLUGS,
  GET_ALL_SESSIONS_SLUGS,
  GET_PARTNER_BY_ID_DYNAMIC,
  GET_PUBLIC_SESSIONS_DYNAMIC,
  GET_ALL_BLOG_SLUGS,
  GET_BLOG_POST_BY_SLUG_DYNAMIC,
  type DynamicPartner,
  type DynamicSession,
  type DynamicPublicSession,
  type DynamicBlogPost,
  type SlugEntry,
} from './dynamic-queries';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** GraphQL endpoint URL */
const GRAPHQL_URL = 'https://backend.sauwasauna.com/graphql';

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

/** Maximum retry attempts for failed requests */
const MAX_RETRIES = 2;

/** Delay between retries in milliseconds */
const RETRY_DELAY = 1000;

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

/** In-memory cache store */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Generate cache key from query name and variables
 */
function getCacheKey(queryName: string, variables?: Record<string, unknown>): string {
  return `${queryName}_${JSON.stringify(variables || {})}`;
}

/**
 * Generate simple hash for change detection
 */
function generateHash(data: unknown): string {
  return JSON.stringify(data).split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0).toString(36);
}

/**
 * Get cached data if still valid
 */
function getCachedData<T>(key: string): { data: T; hash: string } | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return { data: entry.data, hash: entry.hash };
}

/**
 * Set cache data with hash for change detection
 */
function setCachedData<T>(key: string, data: T): string {
  const hash = generateHash(data);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    hash,
  });
  return hash;
}

/**
 * Clear all cached data
 */
export function clearDynamicCache(): void {
  cache.clear();
}

// ============================================================================
// GRAPHQL FETCH
// ============================================================================

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Execute a GraphQL query with retry logic
 */
async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  retryCount = 0
): Promise<T> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('[DynamicContent] GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL');
    }

    return result.data;
  } catch (error) {
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.warn(`[DynamicContent] Retry ${retryCount + 1}/${MAX_RETRIES}:`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return graphqlFetch<T>(query, variables, retryCount + 1);
    }
    throw error;
  }
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

export type DynamicContentEventType =
  | 'content:loading'
  | 'content:loaded'
  | 'content:changed'
  | 'content:error'
  | 'content:cached';

export interface DynamicContentEvent<T = unknown> {
  type: DynamicContentEventType;
  contentType: 'partner' | 'session';
  slug: string;
  data?: T;
  previousHash?: string;
  currentHash?: string;
  error?: Error;
  fromCache?: boolean;
}

type EventCallback<T = unknown> = (event: DynamicContentEvent<T>) => void;

const eventListeners = new Map<DynamicContentEventType, Set<EventCallback>>();

/**
 * Subscribe to dynamic content events
 */
export function onDynamicContent<T = unknown>(
  eventType: DynamicContentEventType,
  callback: EventCallback<T>
): () => void {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }
  eventListeners.get(eventType)!.add(callback as EventCallback);

  // Return unsubscribe function
  return () => {
    eventListeners.get(eventType)?.delete(callback as EventCallback);
  };
}

/**
 * Emit dynamic content event
 */
function emitEvent<T>(event: DynamicContentEvent<T>): void {
  const listeners = eventListeners.get(event.type);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[DynamicContent] Event handler error:', error);
      }
    });
  }
}

// ============================================================================
// PARTNER FETCHING
// ============================================================================

export interface PartnerData {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  address?: string;
  phone?: string;
  email?: string;
  web?: string;
  heroImage?: string;
  featuredImage?: {
    sourceUrl: string;
    altText: string;
  };
}

/**
 * Transform raw GraphQL partner to normalized PartnerData
 */
function transformPartner(partner: DynamicPartner): PartnerData {
  return {
    id: partner.id,
    databaseId: partner.databaseId,
    slug: partner.slug,
    title: partner.title,
    address: partner.partnerInformation?.partnerAddress,
    phone: partner.partnerInformation?.partnerPhone,
    email: partner.partnerInformation?.partnerEmail,
    web: partner.partnerInformation?.partnerWeb,
    heroImage: partner.partnerInformation?.partnerHeroImage?.node?.sourceUrl,
    featuredImage: partner.featuredImage?.node ? {
      sourceUrl: partner.featuredImage.node.sourceUrl,
      altText: partner.featuredImage.node.altText || '',
    } : undefined,
  };
}

/**
 * Fetch partner by slug with caching and events
 */
export async function fetchPartnerBySlug(
  slug: string,
  previousHash?: string
): Promise<{ data: PartnerData | null; changed: boolean; hash: string }> {
  const cacheKey = getCacheKey('partner', { slug });

  // Emit loading event
  emitEvent({
    type: 'content:loading',
    contentType: 'partner',
    slug,
  });

  // Check cache first
  const cached = getCachedData<{ partners: { nodes: DynamicPartner[] } }>(cacheKey);
  if (cached) {
    const partner = cached.data.partners?.nodes?.[0];
    const data = partner ? transformPartner(partner) : null;
    const changed = previousHash ? cached.hash !== previousHash : false;

    emitEvent({
      type: changed ? 'content:changed' : 'content:cached',
      contentType: 'partner',
      slug,
      data,
      previousHash,
      currentHash: cached.hash,
      fromCache: true,
    });

    return { data, changed, hash: cached.hash };
  }

  try {
    const response = await graphqlFetch<{ partners: { nodes: DynamicPartner[] } }>(
      GET_PARTNER_BY_SLUG_DYNAMIC,
      { slug }
    );

    const hash = setCachedData(cacheKey, response);
    const partner = response.partners?.nodes?.[0];
    const data = partner ? transformPartner(partner) : null;
    const changed = previousHash ? hash !== previousHash : false;

    emitEvent({
      type: changed ? 'content:changed' : 'content:loaded',
      contentType: 'partner',
      slug,
      data,
      previousHash,
      currentHash: hash,
      fromCache: false,
    });

    return { data, changed, hash };
  } catch (error) {
    emitEvent({
      type: 'content:error',
      contentType: 'partner',
      slug,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Fetch partner by database ID
 */
export async function fetchPartnerById(
  id: number
): Promise<PartnerData | null> {
  const cacheKey = getCacheKey('partner_id', { id });

  const cached = getCachedData<{ partner: DynamicPartner | null }>(cacheKey);
  if (cached) {
    return cached.data.partner ? transformPartner(cached.data.partner) : null;
  }

  try {
    const response = await graphqlFetch<{ partner: DynamicPartner | null }>(
      GET_PARTNER_BY_ID_DYNAMIC,
      { id: String(id) }
    );

    setCachedData(cacheKey, response);
    return response.partner ? transformPartner(response.partner) : null;
  } catch (error) {
    console.error('[DynamicContent] fetchPartnerById error:', error);
    return null;
  }
}

// ============================================================================
// SESSION FETCHING
// ============================================================================

export interface SessionData {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  content?: string;
  duration: number;
  capacity: number;
  price: number;
  sauwaPartnerId?: number;
  localizedTitle: {
    es?: string;
    ca?: string;
    en?: string;
    fr?: string;
  };
  subtitle: {
    es?: string;
    ca?: string;
    en?: string;
    fr?: string;
  };
  description: {
    es?: string;
    ca?: string;
    en?: string;
    fr?: string;
  };
  featuredImage?: {
    sourceUrl: string;
    altText: string;
  };
  partner?: PartnerData;
  seo?: {
    title?: string;
    metaDesc?: string;
  };
}

/**
 * Transform raw GraphQL session to normalized SessionData
 */
function transformSession(session: DynamicSession, partner?: PartnerData): SessionData {
  return {
    id: session.id,
    databaseId: session.databaseId,
    slug: session.slug,
    title: session.title,
    content: session.content,
    duration: session.sessionDetails?.sessionDuration || 90,
    capacity: session.sessionDetails?.sessionCapacity || 6,
    price: session.sessionDetails?.sessionPrice || 0,
    sauwaPartnerId: session.sauwaPartnerId,
    localizedTitle: {
      es: session.title,
      ca: session.sessionDetails?.tituloCa,
      en: session.sessionDetails?.tituloEn,
      fr: session.sessionDetails?.tituloFr,
    },
    subtitle: {
      es: session.sessionDetails?.subtitulo,
      ca: session.sessionDetails?.subtituloCa,
      en: session.sessionDetails?.sessionSubtitleEn,
      fr: session.sessionDetails?.subtituloFr,
    },
    description: {
      es: session.content,
      ca: session.sessionDetails?.sessionDescriptionCa,
      en: session.sessionDetails?.sessionDescriptionEn,
      fr: session.sessionDetails?.sessionDescriptionFr,
    },
    featuredImage: session.featuredImage?.node ? {
      sourceUrl: session.featuredImage.node.sourceUrl,
      altText: session.featuredImage.node.altText || '',
    } : undefined,
    partner,
    seo: session.seo,
  };
}

/**
 * Fetch session by slug with caching and events
 */
export async function fetchSessionBySlug(
  slug: string,
  previousHash?: string
): Promise<{ data: SessionData | null; changed: boolean; hash: string }> {
  const cacheKey = getCacheKey('session', { slug });

  // Emit loading event
  emitEvent({
    type: 'content:loading',
    contentType: 'session',
    slug,
  });

  // Check cache first
  const cached = getCachedData<{ sessions: { nodes: DynamicSession[] } }>(cacheKey);
  if (cached) {
    const session = cached.data.sessions?.nodes?.[0];
    let data: SessionData | null = null;

    if (session) {
      // Fetch partner if needed
      const partner = session.sauwaPartnerId
        ? await fetchPartnerById(session.sauwaPartnerId)
        : undefined;
      data = transformSession(session, partner || undefined);
    }

    const changed = previousHash ? cached.hash !== previousHash : false;

    emitEvent({
      type: changed ? 'content:changed' : 'content:cached',
      contentType: 'session',
      slug,
      data,
      previousHash,
      currentHash: cached.hash,
      fromCache: true,
    });

    return { data, changed, hash: cached.hash };
  }

  try {
    const response = await graphqlFetch<{ sessions: { nodes: DynamicSession[] } }>(
      GET_SESSION_BY_SLUG_DYNAMIC,
      { slug }
    );

    const hash = setCachedData(cacheKey, response);
    const session = response.sessions?.nodes?.[0];
    let data: SessionData | null = null;

    if (session) {
      // Fetch partner if needed
      const partner = session.sauwaPartnerId
        ? await fetchPartnerById(session.sauwaPartnerId)
        : undefined;
      data = transformSession(session, partner || undefined);
    }

    const changed = previousHash ? hash !== previousHash : false;

    emitEvent({
      type: changed ? 'content:changed' : 'content:loaded',
      contentType: 'session',
      slug,
      data,
      previousHash,
      currentHash: hash,
      fromCache: false,
    });

    return { data, changed, hash };
  } catch (error) {
    emitEvent({
      type: 'content:error',
      contentType: 'session',
      slug,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

// ============================================================================
// SLUG VALIDATION (FOR CATCH-ALL PAGES)
// ============================================================================

/**
 * Check if a partner slug exists
 */
export async function partnerSlugExists(slug: string): Promise<boolean> {
  const cacheKey = getCacheKey('all_partner_slugs', {});

  let slugs: SlugEntry[];

  const cached = getCachedData<{ partners: { nodes: SlugEntry[] } }>(cacheKey);
  if (cached) {
    slugs = cached.data.partners?.nodes || [];
  } else {
    const response = await graphqlFetch<{ partners: { nodes: SlugEntry[] } }>(
      GET_ALL_PARTNERS_SLUGS
    );
    setCachedData(cacheKey, response);
    slugs = response.partners?.nodes || [];
  }

  return slugs.some(entry => entry.slug === slug);
}

/**
 * Check if a session slug exists (optionally for a specific partner)
 */
export async function sessionSlugExists(
  sessionSlug: string,
  partnerSlug?: string
): Promise<boolean> {
  const cacheKey = getCacheKey('all_session_slugs', {});

  let slugs: SlugEntry[];

  const cached = getCachedData<{ sessions: { nodes: SlugEntry[] } }>(cacheKey);
  if (cached) {
    slugs = cached.data.sessions?.nodes || [];
  } else {
    const response = await graphqlFetch<{ sessions: { nodes: SlugEntry[] } }>(
      GET_ALL_SESSIONS_SLUGS
    );
    setCachedData(cacheKey, response);
    slugs = response.sessions?.nodes || [];
  }

  // If no partner specified, just check session slug
  if (!partnerSlug) {
    return slugs.some(entry => entry.slug === sessionSlug);
  }

  // If partner specified, need to verify the relationship
  // First find sessions with matching slug
  const matchingSessions = slugs.filter(entry => entry.slug === sessionSlug);
  if (matchingSessions.length === 0) return false;

  // Get partner ID from slug
  const partnerExists = await partnerSlugExists(partnerSlug);
  if (!partnerExists) return false;

  // For now, return true if session exists - full validation would require
  // fetching the session and checking its sauwaPartnerId
  return true;
}

// ============================================================================
// PUBLIC SESSIONS (FILTERED BY AVAILABILITY)
// ============================================================================

export interface PublicSessionData {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  sessionType?: string;
  usesSharedCapacity?: boolean;
  includedPersons?: number;
  voucherValidityMonths?: number;
  requiresFullCapacity?: boolean;
  availabilityStatus: 'active' | 'no_future_dates';
  duration?: number;
  capacity: number;
  available: number;
  price: number;
  currency: string;
  saleEnabled: boolean;
  featuredImage?: {
    sourceUrl: string;
    altText: string;
  };
  partner?: PartnerData;
}

/**
 * Transform public session to normalized format
 */
function transformPublicSession(session: DynamicPublicSession): PublicSessionData {
  return {
    id: session.id,
    databaseId: session.databaseId,
    slug: session.slug,
    title: session.title,
    sessionType: session.sessionType,
    usesSharedCapacity: session.usesSharedCapacity,
    includedPersons: session.includedPersons,
    voucherValidityMonths: session.voucherValidityMonths,
    requiresFullCapacity: session.requiresFullCapacity,
    availabilityStatus: session.availabilityStatus,
    duration: session.duration,
    capacity: session.inventory?.capacity || 0,
    available: session.inventory?.available || 0,
    price: session.inventory ? session.inventory.priceCents / 100 : 0,
    currency: session.inventory?.currency || 'EUR',
    saleEnabled: session.inventory?.saleEnabled || false,
    featuredImage: session.featuredImage ? {
      sourceUrl: session.featuredImage.sourceUrl,
      altText: session.featuredImage.altText || '',
    } : undefined,
    partner: session.partner ? {
      id: session.partner.id,
      databaseId: session.partner.databaseId,
      slug: session.partner.slug,
      title: session.partner.name,
      address: session.partner.address?.street
        ? `${session.partner.address.street}, ${session.partner.address.city || ''}`
        : undefined,
      phone: session.partner.phone,
      email: session.partner.email,
      web: session.partner.web,
      heroImage: session.partner.heroImage?.sourceUrl,
      featuredImage: session.partner.featuredImage ? {
        sourceUrl: session.partner.featuredImage.sourceUrl,
        altText: session.partner.featuredImage.altText || '',
      } : undefined,
    } : undefined,
  };
}

/**
 * Fetch public sessions (filtered by availability rules)
 */
export async function fetchPublicSessions(
  options?: { partnerId?: number; first?: number }
): Promise<PublicSessionData[]> {
  const cacheKey = getCacheKey('public_sessions', options || {});

  const cached = getCachedData<{ sauwaPublicSessions: DynamicPublicSession[] }>(cacheKey);
  if (cached) {
    return (cached.data.sauwaPublicSessions || []).map(transformPublicSession);
  }

  try {
    const response = await graphqlFetch<{ sauwaPublicSessions: DynamicPublicSession[] }>(
      GET_PUBLIC_SESSIONS_DYNAMIC,
      {
        partnerId: options?.partnerId,
        first: options?.first || 100,
      }
    );

    setCachedData(cacheKey, response);
    return (response.sauwaPublicSessions || []).map(transformPublicSession);
  } catch (error) {
    console.error('[DynamicContent] fetchPublicSessions error:', error);
    return [];
  }
}

// ============================================================================
// LOCALIZATION HELPERS
// ============================================================================

export type Locale = 'es' | 'ca' | 'en' | 'fr';

/**
 * Get localized value with Spanish fallback
 */
export function getLocalizedValue(
  values: { es?: string; ca?: string; en?: string; fr?: string },
  locale: Locale
): string {
  // Try requested locale first
  const value = values[locale];
  if (value && value.trim() !== '') {
    return value;
  }

  // Fallback to Spanish
  if (values.es && values.es.trim() !== '') {
    return values.es;
  }

  // Return empty string if nothing found
  return '';
}

/**
 * Get localized session title
 */
export function getLocalizedSessionTitle(session: SessionData, locale: Locale): string {
  return getLocalizedValue(session.localizedTitle, locale) || session.title;
}

/**
 * Get localized session subtitle
 */
export function getLocalizedSessionSubtitle(session: SessionData, locale: Locale): string {
  return getLocalizedValue(session.subtitle, locale);
}

/**
 * Get localized session description
 */
export function getLocalizedSessionDescription(session: SessionData, locale: Locale): string {
  return getLocalizedValue(session.description, locale);
}

// ============================================================================
// BLOG POST FETCHING (WDA-1032)
// ============================================================================

export interface BlogPostData {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  date: string;
  modified?: string;
  featuredImage?: {
    sourceUrl: string;
    altText: string;
  };
  categories?: Array<{
    id: string;
    databaseId: number;
    name: string;
    slug: string;
  }>;
  author?: {
    name: string;
    avatar?: string;
  };
  seo?: {
    title?: string;
    metaDesc?: string;
  };
}

/**
 * Transform raw GraphQL blog post to normalized BlogPostData
 */
function transformBlogPost(post: DynamicBlogPost): BlogPostData {
  return {
    id: post.id,
    databaseId: post.databaseId,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    date: post.date,
    modified: post.modified,
    featuredImage: post.featuredImage?.node ? {
      sourceUrl: post.featuredImage.node.sourceUrl,
      altText: post.featuredImage.node.altText || '',
    } : undefined,
    categories: post.categories?.nodes || [],
    author: post.author?.node ? {
      name: post.author.node.name,
      avatar: post.author.node.avatar?.url,
    } : undefined,
    seo: post.seo,
  };
}

/**
 * Check if a blog post slug exists
 */
export async function blogPostSlugExists(slug: string): Promise<boolean> {
  const cacheKey = getCacheKey('all_blog_slugs', {});

  let slugs: SlugEntry[];

  const cached = getCachedData<{ posts: { nodes: SlugEntry[] } }>(cacheKey);
  if (cached) {
    slugs = cached.data.posts?.nodes || [];
  } else {
    const response = await graphqlFetch<{ posts: { nodes: SlugEntry[] } }>(
      GET_ALL_BLOG_SLUGS
    );
    setCachedData(cacheKey, response);
    slugs = response.posts?.nodes || [];
  }

  return slugs.some(entry => entry.slug === slug);
}

/**
 * Fetch blog post by slug with caching
 */
export async function fetchBlogPostBySlug(
  slug: string,
  previousHash?: string
): Promise<{ data: BlogPostData | null; changed: boolean; hash: string }> {
  const cacheKey = getCacheKey('blog_post', { slug });

  // Check cache first
  const cached = getCachedData<{ post: DynamicBlogPost | null }>(cacheKey);
  if (cached) {
    const data = cached.data.post ? transformBlogPost(cached.data.post) : null;
    const changed = previousHash ? cached.hash !== previousHash : false;
    return { data, changed, hash: cached.hash };
  }

  try {
    const response = await graphqlFetch<{ post: DynamicBlogPost | null }>(
      GET_BLOG_POST_BY_SLUG_DYNAMIC,
      { slug }
    );

    const hash = setCachedData(cacheKey, response);
    const data = response.post ? transformBlogPost(response.post) : null;
    const changed = previousHash ? hash !== previousHash : false;

    return { data, changed, hash };
  } catch (error) {
    console.error('[DynamicContent] fetchBlogPostBySlug error:', error);
    throw error;
  }
}
