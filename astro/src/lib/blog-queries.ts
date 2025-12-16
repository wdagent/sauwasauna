/**
 * Blog GraphQL Queries
 * Client-side and server-side queries for blog functionality with caching
 */

import { graphqlQuery } from './graphql';
import type {
  BlogPost,
  BlogPostsResponse,
  CategoriesResponse,
  BlogQueryVariables,
  Locale,
} from './types/blog';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache for client-side
const cache = new Map<string, CacheEntry<any>>();

/**
 * Generate cache key from query and variables
 */
function getCacheKey(queryName: string, variables?: BlogQueryVariables): string {
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
 * GraphQL Query: Get blog posts with optional filtering and Polylang support
 *
 * NORMA GLOBAL DE FALLBACK: No filtramos por idioma en GraphQL.
 * En su lugar, obtenemos TODOS los posts y luego en el cliente:
 * 1. Priorizamos posts en el idioma solicitado
 * 2. Incluimos posts en español (ES) como fallback si no hay suficientes
 *
 * Esto garantiza que siempre hay contenido disponible en todas las versiones del sitio.
 */
export const GET_POSTS_QUERY = `
  query GetBlogPosts($first: Int = 9, $after: String, $categoryName: String) {
    posts(
      first: $first
      after: $after
      where: {
        orderby: { field: DATE, order: DESC }
        categoryName: $categoryName
      }
    ) {
      nodes {
        id
        title
        slug
        excerpt
        date
        modified
        language {
          code
          locale
          name
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
        categories {
          nodes {
            id
            name
            slug
          }
        }
        translations {
          id
          slug
          language {
            code
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/**
 * GraphQL Query: Get all categories
 */
export const GET_CATEGORIES_QUERY = `
  query GetCategories {
    categories(first: 100, where: { hideEmpty: true }) {
      nodes {
        id
        name
        slug
        count
      }
    }
  }
`;

/**
 * GraphQL Query: Get single post by slug
 */
export const GET_POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
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
          mediaDetails {
            width
            height
          }
        }
      }
      categories {
        nodes {
          id
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
 * Filter and sort posts with language fallback
 *
 * NORMA GLOBAL DE FALLBACK:
 * 1. Primero muestra posts en el idioma solicitado
 * 2. Si no hay suficientes, añade posts en español (ES) como fallback
 * 3. Nunca muestra una versión vacía - siempre hay contenido
 */
function filterPostsWithFallback(
  posts: BlogPost[],
  requestedLocale: string,
  limit?: number
): BlogPost[] {
  // Normalizar códigos de idioma (CA, ES, EN, FR)
  const normalizedLocale = requestedLocale.toUpperCase();

  // 1. Filtrar posts en idioma solicitado
  const postsInRequestedLanguage = posts.filter(
    (post) => post.language?.code === normalizedLocale
  );

  // 2. Si tenemos suficientes posts en el idioma solicitado, devolverlos
  if (!limit || postsInRequestedLanguage.length >= limit) {
    return limit ? postsInRequestedLanguage.slice(0, limit) : postsInRequestedLanguage;
  }

  // 3. FALLBACK: Añadir posts en español para completar
  const fallbackPosts = posts.filter(
    (post) => post.language?.code === 'ES' && !postsInRequestedLanguage.find(p => p.id === post.id)
  );

  // 4. Combinar: posts solicitados + fallback español
  const combinedPosts = [...postsInRequestedLanguage, ...fallbackPosts];

  // 5. Aplicar límite si existe
  return limit ? combinedPosts.slice(0, limit) : combinedPosts;
}

// Cache for all filtered posts per language/category combination
const allFilteredPostsCache = new Map<string, BlogPost[]>();

/**
 * Fetch blog posts with caching, language fallback, and CLIENT-SIDE pagination
 *
 * NORMA GLOBAL: Siempre devuelve posts, usando español como fallback si el idioma
 * solicitado no tiene suficiente contenido.
 *
 * PAGINATION: Fetches all posts once, caches them, and paginates client-side
 * for accurate hasNextPage calculation after language filtering.
 */
export async function getBlogPosts(
  variables: BlogQueryVariables = {}
): Promise<BlogPostsResponse> {
  const requestedLanguage = variables.language || 'ES';
  const postsPerPage = variables.first || 9;
  const categoryKey = variables.categoryName || 'all';
  const allPostsCacheKey = `all_${requestedLanguage}_${categoryKey}`;

  // Check if we have all filtered posts cached
  let allFilteredPosts = allFilteredPostsCache.get(allPostsCacheKey);

  if (!allFilteredPosts) {
    try {
      // Fetch ALL posts from GraphQL (without language filter)
      const data = await graphqlQuery<BlogPostsResponse>(GET_POSTS_QUERY, {
        first: 100,
        after: null,
        categoryName: variables.categoryName || null,
      });

      // Filter by language with Spanish fallback
      allFilteredPosts = filterPostsWithFallback(
        data.posts.nodes,
        requestedLanguage
      );

      // Cache all filtered posts
      allFilteredPostsCache.set(allPostsCacheKey, allFilteredPosts);

      // Set cache expiry (5 minutes)
      setTimeout(() => {
        allFilteredPostsCache.delete(allPostsCacheKey);
      }, CACHE_TTL);
    } catch (error) {
      console.error('[getBlogPosts] Error:', error);
      throw error;
    }
  }

  // Calculate offset based on cursor (cursor = index of last item)
  const offset = variables.after ? parseInt(variables.after, 10) : 0;

  // Slice posts for current page
  const paginatedPosts = allFilteredPosts.slice(offset, offset + postsPerPage);

  // Calculate accurate pagination info
  const nextOffset = offset + postsPerPage;
  const hasNextPage = nextOffset < allFilteredPosts.length;

  const response: BlogPostsResponse = {
    posts: {
      nodes: paginatedPosts,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: offset > 0,
        startCursor: offset.toString(),
        endCursor: hasNextPage ? nextOffset.toString() : null,
      },
    },
  };

  return response;
}

/**
 * Fetch categories with caching
 */
export async function getCategories(): Promise<CategoriesResponse> {
  const cacheKey = getCacheKey('GET_CATEGORIES');
  const cached = getCachedData<CategoriesResponse>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const data = await graphqlQuery<CategoriesResponse>(GET_CATEGORIES_QUERY);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('[getCategories] Error:', error);
    throw error;
  }
}

/**
 * Fetch single post by slug with caching
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const cacheKey = getCacheKey('GET_POST', { categoryName: slug });
  const cached = getCachedData<{ post: BlogPost }>(cacheKey);

  if (cached) {
    return cached.post;
  }

  try {
    const data = await graphqlQuery<{ post: BlogPost }>(
      GET_POST_BY_SLUG_QUERY,
      { slug }
    );

    if (!data.post) {
      return null;
    }

    setCachedData(cacheKey, data);
    return data.post;
  } catch (error) {
    console.error('[getPostBySlug] Error:', error);
    throw error;
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, locale: Locale = 'es'): string {
  const date = new Date(dateString);
  const localeMap: Record<Locale, string> = {
    es: 'es-ES',
    ca: 'ca-ES',
    en: 'en-US',
    fr: 'fr-FR',
  };

  return date.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Strip HTML tags from excerpt
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 150): string {
  const stripped = stripHtml(text);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + '...';
}

/**
 * Get default image placeholder
 */
export function getDefaultImage(): string {
  return '/images/blog/placeholder.jpg';
}

/**
 * Clear all cache
 */
export function clearBlogCache(): void {
  cache.clear();
}
