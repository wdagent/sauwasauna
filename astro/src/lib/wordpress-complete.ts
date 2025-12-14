/**
 * WordPress GraphQL Integration for SAUWA Blog
 * Complete implementation ready for Astro
 *
 * Directory structure:
 * src/lib/wordpress/
 *   ├── posts.ts (this file - main functions)
 *   ├── utils.ts (helper functions)
 *   └── types.ts (TypeScript interfaces)
 */

// ============================================
// FILE: src/lib/wordpress/types.ts
// ============================================

export interface WPCategory {
  name: string;
  slug: string;
}

export interface WPFeaturedImage {
  sourceUrl: string;
  altText: string;
  width: number;
  height: number;
}

export interface WPPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  featuredImage: WPFeaturedImage | null;
  categories: WPCategory[];
}

export interface WPGraphQLResponse {
  data?: {
    posts: {
      nodes: any[];
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

// ============================================
// FILE: src/lib/wordpress/utils.ts
// ============================================

/**
 * Limpia el excerpt de HTML y entidades
 */
export function cleanExcerpt(excerpt: string): string {
  if (!excerpt) return '';

  return excerpt
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .replace(/\[&hellip;\]/g, '...') // Convertir ellipsis de WordPress
    .replace(/&hellip;/g, '...') // Convertir entidad HTML
    .replace(/&nbsp;/g, ' ') // Espacios no rompibles
    .replace(/&quot;/g, '"') // Comillas
    .replace(/&amp;/g, '&') // Ampersand
    .replace(/&lt;/g, '<') // Menor que
    .replace(/&gt;/g, '>') // Mayor que
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim();
}

/**
 * Trunca el excerpt a un número máximo de caracteres
 * Respeta las palabras completas
 */
export function truncateExcerpt(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // Si encontramos un espacio, cortamos ahí para no cortar palabras
  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Formatea la fecha en español
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return date.toLocaleDateString('es-ES', options);
}

/**
 * Formatea la fecha en formato corto
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  return date.toLocaleDateString('es-ES', options);
}

/**
 * Obtiene el tiempo de lectura estimado
 * @param text Texto completo del post
 * @returns Minutos estimados de lectura
 */
export function getReadingTime(text: string): number {
  const wordsPerMinute = 200; // Velocidad de lectura promedio
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Obtiene la categoría principal (excluyendo "Blog")
 */
export function getPrimaryCategory(categories: WPCategory[]): WPCategory | null {
  const filtered = categories.filter(cat => cat.slug !== 'blog');
  return filtered.length > 0 ? filtered[0] : null;
}

// ============================================
// FILE: src/lib/wordpress/posts.ts
// ============================================

const WORDPRESS_GRAPHQL_ENDPOINT = 'https://backend.sauwasauna.com/graphql';

/**
 * Transforma un post raw de WordPress al formato tipado
 */
function transformPost(post: any): WPPost {
  return {
    id: post.id,
    title: post.title || '',
    excerpt: cleanExcerpt(post.excerpt || ''),
    slug: post.slug || '',
    date: post.date || new Date().toISOString(),
    featuredImage: post.featuredImage?.node ? {
      sourceUrl: post.featuredImage.node.sourceUrl,
      altText: post.featuredImage.node.altText || post.title || '',
      width: post.featuredImage.node.mediaDetails?.width || 1920,
      height: post.featuredImage.node.mediaDetails?.height || 1080
    } : null,
    categories: post.categories?.nodes || []
  };
}

/**
 * Obtiene los últimos posts del blog desde WordPress
 * @param limit Número de posts a obtener (default: 6, max: 100)
 * @returns Array de posts con sus metadatos
 */
export async function getLatestPosts(limit: number = 6): Promise<WPPost[]> {
  // Limitar a un máximo razonable
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const query = `
    query GetLatestPosts($first: Int!) {
      posts(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          title
          excerpt
          slug
          date
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
              name
              slug
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { first: safeLimit }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WPGraphQLResponse = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('Error fetching posts from WordPress');
    }

    if (!result.data?.posts?.nodes) {
      console.warn('No posts data received from WordPress');
      return [];
    }

    // Transformar y limpiar datos
    return result.data.posts.nodes.map(transformPost);
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    // Retornar array vacío en caso de error para no romper el build
    return [];
  }
}

/**
 * Obtiene posts por categoría
 * @param categorySlug Slug de la categoría
 * @param limit Número de posts a obtener
 */
export async function getPostsByCategory(
  categorySlug: string,
  limit: number = 6
): Promise<WPPost[]> {
  const query = `
    query GetPostsByCategory($categorySlug: String!, $first: Int!) {
      posts(
        first: $first,
        where: {
          orderby: { field: DATE, order: DESC },
          categoryName: $categorySlug
        }
      ) {
        nodes {
          id
          title
          excerpt
          slug
          date
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
              name
              slug
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          categorySlug,
          first: Math.min(limit, 100)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WPGraphQLResponse = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return [];
    }

    if (!result.data?.posts?.nodes) {
      return [];
    }

    return result.data.posts.nodes.map(transformPost);
  } catch (error) {
    console.error(`Error fetching posts for category ${categorySlug}:`, error);
    return [];
  }
}

/**
 * Obtiene un post individual por slug
 * @param slug Slug del post
 */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const query = `
    query GetPostBySlug($slug: String!) {
      postBy(slug: $slug) {
        id
        title
        excerpt
        slug
        date
        content
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
            name
            slug
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { slug }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }

    if (!result.data?.postBy) {
      return null;
    }

    return transformPost(result.data.postBy);
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return null;
  }
}

// ============================================
// FILE: src/lib/wordpress/cache.ts (Optional)
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number;

  constructor(ttlSeconds: number = 300) { // 5 minutos por defecto
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Instancia de cache para posts
const postsCache = new SimpleCache<WPPost[]>(
  import.meta.env.DEV ? 60 : 300 // 1 min en dev, 5 min en prod
);

/**
 * Obtiene posts con cache
 */
export async function getCachedPosts(limit: number = 6): Promise<WPPost[]> {
  const cacheKey = `posts_${limit}`;
  const cached = postsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const posts = await getLatestPosts(limit);
  postsCache.set(cacheKey, posts);

  return posts;
}

// ============================================
// Note: All types and functions are exported inline above
// ============================================