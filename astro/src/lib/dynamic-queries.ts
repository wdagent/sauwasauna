/**
 * Dynamic Content GraphQL Queries
 * WDA-990: Queries optimized for client-side dynamic content fetching
 *
 * These queries are designed to:
 * 1. Fetch fresh content at runtime (browser)
 * 2. Be lightweight for fast load times
 * 3. Support all locales (ES, CA, EN, FR)
 */

// ============================================================================
// PARTNER QUERIES
// ============================================================================

/**
 * Get partner by slug with all sessions
 * Used for: Partner detail page hydration
 * Returns: Partner info + list of available sessions
 */
export const GET_PARTNER_BY_SLUG_DYNAMIC = `
  query GetPartnerBySlugDynamic($slug: String!) {
    partners(where: { name: $slug }, first: 1) {
      nodes {
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
  }
`;

/**
 * Get all partner slugs for validation
 * Used for: Catch-all page validation (check if partner exists)
 * Returns: List of all partner slugs
 */
export const GET_ALL_PARTNERS_SLUGS = `
  query GetAllPartnersSlugs {
    partners(first: 100, where: { status: PUBLISH }) {
      nodes {
        slug
        databaseId
      }
    }
  }
`;

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Get session by slug with partner info
 * Used for: Session detail page hydration
 * Returns: Full session data including localized fields and partner
 */
export const GET_SESSION_BY_SLUG_DYNAMIC = `
  query GetSessionBySlugDynamic($slug: String!) {
    sessions(where: { name: $slug }, first: 1) {
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
        seo {
          title
          metaDesc
        }
      }
    }
  }
`;

/**
 * Get all session slugs for validation
 * Used for: Catch-all page validation (check if session exists)
 * Returns: List of all session slugs with partner IDs
 */
export const GET_ALL_SESSIONS_SLUGS = `
  query GetAllSessionsSlugs {
    sessions(first: 1000, where: { status: PUBLISH }) {
      nodes {
        slug
        databaseId
        sauwaPartnerId
      }
    }
  }
`;

/**
 * Get sessions by partner ID
 * Used for: Loading sessions for a specific partner on partner page
 * Returns: List of sessions belonging to the partner
 */
export const GET_SESSIONS_BY_PARTNER_ID = `
  query GetSessionsByPartnerId($partnerId: Int!) {
    sessions(
      first: 100,
      where: {
        status: PUBLISH,
        metaQuery: {
          metaArray: [
            { key: "sauwa_partner_id", value: $partnerId, compare: EQUAL_TO, type: NUMERIC }
          ]
        }
      }
    ) {
      nodes {
        id
        databaseId
        slug
        title
        sessionDetails {
          sessionDuration
          sessionCapacity
          sessionPrice
          subtitulo
          tituloCa
          subtituloCa
          tituloEn
          sessionSubtitleEn
          tituloFr
          subtituloFr
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

/**
 * Get partner by database ID (for resolving sauwaPartnerId)
 * Used for: Resolving partner data from session's sauwaPartnerId
 */
export const GET_PARTNER_BY_ID_DYNAMIC = `
  query GetPartnerByIdDynamic($id: ID!) {
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

// ============================================================================
// PUBLIC SESSIONS (FILTERED BY AVAILABILITY)
// ============================================================================

/**
 * Get public sessions filtered by sale_enabled and availability rules
 * Used for: Dynamic partner page showing only purchasable sessions
 * Returns: Sessions that are currently on sale
 */
export const GET_PUBLIC_SESSIONS_DYNAMIC = `
  query GetPublicSessionsDynamic($partnerId: Int, $first: Int) {
    sauwaPublicSessions(
      first: $first,
      where: { partnerId: $partnerId }
    ) {
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Type definitions for dynamic query responses
 */
export interface DynamicPartner {
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

export interface DynamicSession {
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
    };
  };
  seo?: {
    title?: string;
    metaDesc?: string;
  };
}

export interface DynamicPublicSession {
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
  featuredImage?: {
    sourceUrl: string;
    altText?: string;
  };
  partner?: {
    id: string;
    databaseId: number;
    slug: string;
    name: string;
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
    currency: string;
    saleEnabled: boolean;
  };
}

export interface SlugEntry {
  slug: string;
  databaseId: number;
  sauwaPartnerId?: number;
}

// ============================================================================
// BLOG POST QUERIES (WDA-1032)
// ============================================================================

/**
 * Get all blog post slugs for validation
 * Used for: Catch-all page validation (check if blog post exists)
 * Returns: List of all published post slugs
 */
export const GET_ALL_BLOG_SLUGS = `
  query GetAllBlogSlugs {
    posts(first: 500, where: { status: PUBLISH }) {
      nodes {
        slug
        databaseId
      }
    }
  }
`;

/**
 * Get blog post by slug with full content
 * Used for: Dynamic blog post page hydration
 * Returns: Full post data including content, meta, and author
 */
export const GET_BLOG_POST_BY_SLUG_DYNAMIC = `
  query GetBlogPostBySlugDynamic($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      excerpt
      date
      modified
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          id
          databaseId
          name
          slug
        }
      }
      author {
        node {
          name
          avatar {
            url
          }
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
 * Type definition for dynamic blog post response
 */
export interface DynamicBlogPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  date: string;
  modified?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText?: string;
    };
  };
  categories?: {
    nodes: Array<{
      id: string;
      databaseId: number;
      name: string;
      slug: string;
    }>;
  };
  author?: {
    node: {
      name: string;
      avatar?: {
        url: string;
      };
    };
  };
  seo?: {
    title?: string;
    metaDesc?: string;
  };
}
