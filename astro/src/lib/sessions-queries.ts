/**
 * Session GraphQL Queries
 * Client-side and server-side queries for session functionality with caching (WDA-963)
 * Updated to use real WordPress GraphQL schema
 */

import { graphqlQuery } from './graphql';

// Note: Using local types that match the real WordPress GraphQL schema
// The original types in ./types/sessions.ts expected a different schema

// Cache configuration (same as blog: 5-minute TTL)
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Generate cache key from query and variables
 */
function getCacheKey(queryName: string, variables?: Record<string, any>): string {
  return `${queryName}_${JSON.stringify(variables || {})}`;
}

/**
 * Get cached data if still valid
 */
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set cache data
 */
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * GraphQL Query: Get all sessions for getStaticPaths
 * WDA-963: Uses real WordPress GraphQL schema
 * WDA-986: Uses sauwaPartnerId to avoid ACF bug with nested partner { node { ... } }
 */
export const GET_ALL_SESSIONS_QUERY = `
  query GetAllSessions {
    sessions(first: 1000, where: { status: PUBLISH }) {
      nodes {
        id
        databaseId
        slug
        title
        content
        sauwaPartnerId
        sessionDetails {
          sessionDuration
          sessionCapacity
          sessionPrice
          subtitulo
          tituloCa
          subtituloCa
          sessionDescriptionCa
          tituloEn
          sessionSubtitleEn
          sessionDescriptionEn
          tituloFr
          subtituloFr
          sessionDescriptionFr
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        translations {
          slug
          title
          language {
            code
          }
        }
      }
    }
  }
`;

/**
 * GraphQL Query: Get partner by ID
 * WDA-986: Second query to fetch partner data separately (avoids ACF bug)
 */
export const GET_PARTNER_BY_ID_QUERY = `
  query GetPartnerById($id: ID!) {
    partner(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      slug
      title
      partnerInformation {
        partnerAddress
        partnerPhone
        partnerEmail
        partnerWeb
        partnerHeroImage {
          node {
            sourceUrl
            altText
          }
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`;

/**
 * GraphQL Query: Get session by ID with full details
 * WDA-963: Uses real WordPress GraphQL schema
 * WDA-986: Uses sauwaPartnerId to avoid ACF bug
 */
export const GET_SESSION_BY_ID_QUERY = `
  query GetSessionById($id: ID!) {
    session(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      slug
      title
      content
      sauwaPartnerId
      sessionDetails {
        sessionDuration
        sessionCapacity
        sessionPrice
        subtitulo
        tituloCa
        subtituloCa
        sessionDescriptionCa
        tituloEn
        sessionSubtitleEn
        sessionDescriptionEn
        tituloFr
        subtituloFr
        sessionDescriptionFr
      }
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      translations {
        slug
        title
        language {
          code
        }
      }
      seo {
        title
        metaDesc
      }
    }
  }
`;

/**
 * GraphQL Query: Get session realtime data (for client-side updates)
 * CRITICAL: This is the lightweight query for 30-second interval updates
 * WDA-963: Uses real WordPress GraphQL schema
 */
export const GET_SESSION_BY_ID_REALTIME_QUERY = `
  query GetSessionRealtime($id: ID!) {
    session(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      sessionDetails {
        sessionCapacity
        sessionPrice
      }
    }
  }
`;

/**
 * WordPress GraphQL response types (real schema)
 * WDA-986: Uses sauwaPartnerId instead of nested partner { node { ... } }
 */
interface WPSessionNode {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  content?: string;
  sauwaPartnerId?: number;
  sessionDetails: {
    sessionDuration: number;
    sessionCapacity: number;
    sessionPrice: number;
    subtitulo?: string;
    tituloCa?: string;
    subtituloCa?: string;
    sessionDescriptionCa?: string;
    tituloEn?: string;
    sessionSubtitleEn?: string;
    sessionDescriptionEn?: string;
    tituloFr?: string;
    subtituloFr?: string;
    sessionDescriptionFr?: string;
  };
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
      mediaDetails?: {
        width: number;
        height: number;
      };
    };
  };
  translations?: Array<{
    slug: string;
    title: string;
    language?: {
      code: string;
    };
  }>;
  seo?: {
    title?: string;
    metaDesc?: string;
  };
}

/**
 * Partner response type for the second query
 * WDA-986: Two-query pattern
 */
interface WPPartnerNode {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  partnerInformation?: {
    partnerAddress?: string;
    partnerPhone?: string;
    partnerEmail?: string;
    partnerWeb?: string;
    partnerHeroImage?: {
      node: {
        sourceUrl: string;
        altText?: string;
      };
    };
  };
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
    };
  };
}

interface WPSessionsResponse {
  sessions: {
    nodes: WPSessionNode[];
  };
}

interface WPSessionByIdResponse {
  session: WPSessionNode;
}

interface WPPartnerByIdResponse {
  partner: WPPartnerNode | null;
}

/**
 * Transform WordPress session to internal SessionData type
 * WDA-986: Partner data is passed separately from second query
 */
function transformWPSession(wpSession: WPSessionNode, partner?: WPPartnerNode | null): SessionData {
  return {
    id: wpSession.id,
    databaseId: wpSession.databaseId,
    slug: wpSession.slug,
    title: wpSession.title,
    sauwaPartnerId: wpSession.sauwaPartnerId,
    localizedTitle: {
      es: wpSession.title,
      ca: wpSession.sessionDetails?.tituloCa,
      en: wpSession.sessionDetails?.tituloEn,
      fr: wpSession.sessionDetails?.tituloFr,
    },
    content: wpSession.content,
    duration: wpSession.sessionDetails?.sessionDuration || 60,
    capacity: wpSession.sessionDetails?.sessionCapacity || 6,
    price: wpSession.sessionDetails?.sessionPrice || 0,
    subtitle: {
      es: wpSession.sessionDetails?.subtitulo,
      ca: wpSession.sessionDetails?.subtituloCa,
      en: wpSession.sessionDetails?.sessionSubtitleEn,
      fr: wpSession.sessionDetails?.subtituloFr,
    },
    description: {
      es: wpSession.content,
      ca: wpSession.sessionDetails?.sessionDescriptionCa,
      en: wpSession.sessionDetails?.sessionDescriptionEn,
      fr: wpSession.sessionDetails?.sessionDescriptionFr,
    },
    featuredImage: wpSession.featuredImage?.node ? {
      sourceUrl: wpSession.featuredImage.node.sourceUrl,
      altText: wpSession.featuredImage.node.altText || '',
    } : undefined,
    partner: partner ? {
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
    } : undefined,
    translations: wpSession.translations?.map(t => ({
      slug: t.slug,
      title: t.title,
      locale: t.language?.code?.toLowerCase() as 'es' | 'ca' | 'en' | 'fr',
    })) || [],
    seo: wpSession.seo,
  };
}

/**
 * Fetch partner by ID
 * WDA-986: Second query in the two-query pattern
 */
async function getPartnerById(id: number): Promise<WPPartnerNode | null> {
  const cacheKey = getCacheKey('GET_PARTNER', { id });
  const cached = getCachedData<WPPartnerByIdResponse>(cacheKey);

  if (cached) {
    return cached.partner;
  }

  try {
    const data = await graphqlQuery<WPPartnerByIdResponse>(
      GET_PARTNER_BY_ID_QUERY,
      { id: String(id) }
    );

    setCachedData(cacheKey, data);
    return data.partner;
  } catch (error) {
    console.error('[getPartnerById] Error:', error);
    return null; // Fail gracefully, session can still work without partner
  }
}

/**
 * Simplified Session type for WDA-963 dynamic routes
 * WDA-986: Added sauwaPartnerId for two-query pattern
 */
/**
 * Session type for WDA-998 categorization
 * - single: Individual sessions (price per person)
 * - pack: Group packs (fixed price for included persons)
 * - voucher: Vouchers/bonuses (N sessions, validity period)
 * - gift: Gift cards (1 code for N persons, recipient info) - WDA-1033
 * - private: Private sessions (exclusive use)
 */
export type SessionType = 'single' | 'pack' | 'voucher' | 'private' | 'gift';

export interface SessionData {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  sauwaPartnerId?: number;
  localizedTitle?: {
    es?: string;
    ca?: string;
    en?: string;
    fr?: string;
  };
  content?: string;
  duration: number;
  capacity: number;
  price: number;
  // WDA-998: New fields for session type categorization
  sessionType?: SessionType;
  includedPersons?: number;
  voucherValidityMonths?: number;
  usesSharedCapacity?: boolean;
  requiresFullCapacity?: boolean;
  subtitle?: {
    es?: string;
    ca?: string;
    en?: string;
    fr?: string;
  };
  description?: {
    es?: string;
    ca?: string;
    en?: string;
    fr?: string;
  };
  featuredImage?: {
    sourceUrl: string;
    altText: string;
  };
  partner?: {
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
  };
  translations: Array<{
    slug: string;
    title: string;
    locale: 'es' | 'ca' | 'en' | 'fr';
  }>;
  seo?: {
    title?: string;
    metaDesc?: string;
  };
}

/**
 * Fetch all sessions (for getStaticPaths)
 * WDA-986: Uses two-query pattern - first gets sessions, then fetches partners in parallel
 */
export async function getAllSessions(): Promise<SessionData[]> {
  const cacheKey = getCacheKey('GET_ALL_SESSIONS_WITH_PARTNERS');
  const cached = getCachedData<SessionData[]>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // First query: get all sessions with sauwaPartnerId
    const data = await graphqlQuery<WPSessionsResponse>(GET_ALL_SESSIONS_QUERY);

    if (!data.sessions || !data.sessions.nodes) {
      console.warn('[getAllSessions] No sessions found');
      return [];
    }

    // Collect unique partner IDs
    const partnerIds = [...new Set(
      data.sessions.nodes
        .map(s => s.sauwaPartnerId)
        .filter((id): id is number => id != null && id > 0)
    )];

    // Second query: fetch all partners in parallel
    const partnersMap = new Map<number, WPPartnerNode>();
    if (partnerIds.length > 0) {
      const partnerPromises = partnerIds.map(id => getPartnerById(id));
      const partners = await Promise.all(partnerPromises);
      partners.forEach((partner, index) => {
        if (partner) {
          partnersMap.set(partnerIds[index], partner);
        }
      });
    }

    // Transform sessions with partner data
    const sessions = data.sessions.nodes.map(session => {
      const partner = session.sauwaPartnerId ? partnersMap.get(session.sauwaPartnerId) : undefined;
      return transformWPSession(session, partner);
    });

    setCachedData(cacheKey, sessions);
    return sessions;
  } catch (error) {
    console.error('[getAllSessions] Error:', error);
    throw error;
  }
}

/**
 * Fetch single session by ID with full details
 * WDA-986: Uses two-query pattern - first gets session, then fetches partner
 */
export async function getSessionById(id: string | number): Promise<SessionData | null> {
  const cacheKey = getCacheKey('GET_SESSION_WITH_PARTNER', { id });
  const cached = getCachedData<SessionData>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // First query: get session with sauwaPartnerId
    const data = await graphqlQuery<WPSessionByIdResponse>(
      GET_SESSION_BY_ID_QUERY,
      { id: String(id) }
    );

    if (!data.session) {
      return null;
    }

    // Second query: get partner if sauwaPartnerId exists
    let partner: WPPartnerNode | null = null;
    if (data.session.sauwaPartnerId) {
      partner = await getPartnerById(data.session.sauwaPartnerId);
    }

    const sessionData = transformWPSession(data.session, partner);
    setCachedData(cacheKey, sessionData);
    return sessionData;
  } catch (error) {
    console.error('[getSessionById] Error:', error);
    throw error;
  }
}

/**
 * Fetch session by slug
 */
export async function getSessionBySlug(slug: string): Promise<SessionData | null> {
  // First get all sessions to find the one with matching slug
  const sessions = await getAllSessions();
  return sessions.find(s => s.slug === slug) || null;
}

/**
 * Fetch session realtime data (for client-side updates)
 * This is used for the 30-second interval updates
 */
export async function getSessionRealtime(id: string | number): Promise<{ id: string; databaseId: number; capacity: number; price: number } | null> {
  try {
    const data = await graphqlQuery<{ session: { id: string; databaseId: number; sessionDetails: { sessionCapacity: number; sessionPrice: number } } }>(
      GET_SESSION_BY_ID_REALTIME_QUERY,
      { id: String(id) }
    );

    if (!data.session) {
      return null;
    }

    return {
      id: data.session.id,
      databaseId: data.session.databaseId,
      capacity: data.session.sessionDetails.sessionCapacity,
      price: data.session.sessionDetails.sessionPrice,
    };
  } catch (error) {
    console.error('[getSessionRealtime] Error:', error);
    return null; // Fail gracefully for client-side updates
  }
}

/**
 * Clear session cache
 */
export function clearSessionCache(): void {
  cache.clear();
}

/**
 * GraphQL Query: Get public sessions (filtered by sale_enabled and availability rules)
 * WDA-988: Uses sauwaPublicSessions query for frontend display
 */
export const GET_PUBLIC_SESSIONS_QUERY = `
  query GetPublicSessions($first: Int, $where: SauwaPublicSessionsFilterInput) {
    sauwaPublicSessions(first: $first, where: $where) {
      id
      databaseId
      slug
      title
      sessionType
      usesSharedCapacity
      includedPersons
      voucherValidityMonths
      requiresFullCapacity
      availabilityStatus
      duration
      featuredImage {
        sourceUrl
        altText
      }
      partner {
        id
        databaseId
        slug
        name
        description
        email
        phone
        web
        address {
          street
          city
          postalCode
          country
          googleMapsUrl
        }
        featuredImage {
          sourceUrl
          altText
        }
        heroImage {
          sourceUrl
          altText
        }
      }
      inventory {
        capacity
        available
        reserved
        booked
        priceCents
        currency
        saleEnabled
      }
    }
  }
`;

/**
 * Response type for sauwaPublicSessions
 * WDA-988: Matches the SauwaPublicSession GraphQL type
 */
interface SauwaPublicSession {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  sessionType?: string;
  usesSharedCapacity: boolean;
  includedPersons?: number;
  voucherValidityMonths?: number;
  requiresFullCapacity: boolean;
  availabilityStatus: 'active' | 'no_future_dates';
  duration?: number;
  featuredImage?: {
    sourceUrl: string;
    altText?: string;
  };
  partner?: {
    id: string;
    databaseId: number;
    slug: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    web?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      googleMapsUrl?: string;
    };
    featuredImage?: {
      sourceUrl: string;
      altText?: string;
    };
    heroImage?: {
      sourceUrl: string;
      altText?: string;
    };
  };
  inventory?: {
    capacity: number;
    available: number;
    reserved: number;
    booked: number;
    priceCents: number;
    currencyCode: string;
    saleEnabled: boolean;
  };
}

interface SauwaPublicSessionsResponse {
  sauwaPublicSessions: SauwaPublicSession[];
}

/**
 * Map GraphQL sessionType to our SessionType
 * WDA-998: Normalize session types from backend
 */
function mapSessionType(backendType?: string): SessionType {
  if (!backendType) return 'single';
  const normalized = backendType.toLowerCase();
  if (normalized === 'pack' || normalized === 'group') return 'pack';
  if (normalized === 'voucher' || normalized === 'bono' || normalized === 'bonus') return 'voucher';
  if (normalized === 'private' || normalized === 'privado' || normalized === 'privada') return 'private';
  // WDA-1033: Gift session type
  if (normalized === 'gift' || normalized === 'regalo' || normalized === 'regal') return 'gift';
  return 'single'; // Default: individual sessions
}

/**
 * Transform SauwaPublicSession to SessionData format
 * WDA-988: Converts the new query format to existing SessionData type
 * WDA-998: Added sessionType, includedPersons, and related fields
 */
function transformPublicSession(session: SauwaPublicSession): SessionData {
  return {
    id: session.id,
    databaseId: session.databaseId,
    slug: session.slug,
    title: session.title,
    duration: session.duration || 90, // WDA-1008: Dynamic from GraphQL, fallback to 90
    capacity: session.inventory?.capacity || 6,
    price: session.inventory ? session.inventory.priceCents / 100 : 0,
    // WDA-998: Session type categorization
    sessionType: mapSessionType(session.sessionType),
    includedPersons: session.includedPersons,
    voucherValidityMonths: session.voucherValidityMonths,
    usesSharedCapacity: session.usesSharedCapacity,
    requiresFullCapacity: session.requiresFullCapacity,
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
    translations: [],
  };
}

/**
 * Fetch public sessions (filtered by sale_enabled and availability rules)
 * WDA-988: Uses sauwaPublicSessions for frontend display
 * Only returns sessions that are:
 * - Published
 * - Have sales enabled (sale_enabled = 1)
 * - Have at least one active availability rule
 */
export async function getPublicSessions(options?: {
  partnerId?: number;
  sessionType?: string;
  first?: number;
}): Promise<SessionData[]> {
  const cacheKey = getCacheKey('GET_PUBLIC_SESSIONS', options);
  const cached = getCachedData<SessionData[]>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const variables: Record<string, any> = {
      first: options?.first || 100,
    };

    if (options?.partnerId || options?.sessionType) {
      variables.where = {};
      if (options.partnerId) {
        variables.where.partnerId = options.partnerId;
      }
      if (options.sessionType) {
        variables.where.sessionType = options.sessionType;
      }
    }

    const data = await graphqlQuery<SauwaPublicSessionsResponse>(
      GET_PUBLIC_SESSIONS_QUERY,
      variables
    );

    if (!data.sauwaPublicSessions) {
      console.warn('[getPublicSessions] No sessions returned');
      return [];
    }

    const sessions = data.sauwaPublicSessions.map(transformPublicSession);
    setCachedData(cacheKey, sessions);
    return sessions;
  } catch (error) {
    console.error('[getPublicSessions] Error:', error);
    // Fallback to getAllSessions if sauwaPublicSessions fails
    console.warn('[getPublicSessions] Falling back to getAllSessions');
    return getAllSessions();
  }
}

/**
 * WDA-998: Group sessions by type for partner page display
 * Returns a Map with session types in display order: single, pack, voucher, private
 */
export function groupSessionsByType(
  sessions: SessionData[]
): Map<SessionType, SessionData[]> {
  const grouped = new Map<SessionType, SessionData[]>();

  // Initialize with empty arrays in display order
  // WDA-1033: Added 'gift' to display order
  const displayOrder: SessionType[] = ['single', 'pack', 'voucher', 'gift', 'private'];
  for (const type of displayOrder) {
    grouped.set(type, []);
  }

  // Group sessions
  for (const session of sessions) {
    const type = session.sessionType || 'single';
    const group = grouped.get(type);
    if (group) {
      group.push(session);
    } else {
      // Handle unexpected types as 'single'
      grouped.get('single')!.push(session);
    }
  }

  // Remove empty groups
  for (const type of displayOrder) {
    if (grouped.get(type)!.length === 0) {
      grouped.delete(type);
    }
  }

  return grouped;
}
