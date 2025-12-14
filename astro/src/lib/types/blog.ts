/**
 * Blog Type Definitions
 * TypeScript types for the SAUWA blog functionality
 */

export interface FeaturedImage {
  node: {
    sourceUrl: string;
    altText: string;
    mediaDetails?: {
      width: number;
      height: number;
    };
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface BlogPostLanguage {
  code: string;
  locale: string;
  name: string;
}

export interface BlogPostTranslation {
  id: string;
  slug: string;
  language: {
    code: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  date: string;
  modified?: string;
  featuredImage?: FeaturedImage;
  categories: {
    nodes: Category[];
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
  /** Polylang language info */
  language?: BlogPostLanguage;
  /** Polylang translations */
  translations?: BlogPostTranslation[];
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  total?: number;
}

export interface BlogPostsResponse {
  posts: {
    nodes: BlogPost[];
    pageInfo: PageInfo;
  };
}

export interface CategoriesResponse {
  categories: {
    nodes: Category[];
  };
}

export interface BlogQueryVariables {
  first?: number;
  after?: string | null;
  before?: string | null;
  categoryName?: string;
  language?: string;
}

export interface BlogFilterState {
  selectedCategory: string | null;
  currentPage: number;
  postsPerPage: number;
  endCursor: string | null;
  hasNextPage: boolean;
  isLoading: boolean;
}

export type Locale = 'es' | 'ca' | 'en' | 'fr';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
