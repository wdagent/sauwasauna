/**
 * Booking API Functions
 * WDA-900: Client-side API for SAUWA booking system
 *
 * Pattern: Same as blog-queries.ts
 * - GraphQL for read operations (cached)
 * - REST API for write operations (booking creation)
 * - LocalStorage caching with 5-min TTL
 */

import { BOOKING_CONFIG, CACHE_KEYS } from './config';
import { BOOKING_QUERIES } from './queries';
import type {
  SaunaSession,
  SessionResponse,
  PartnerResponse,
  DateAvailability,
  AvailableDatesResponse,
  DayAvailability,
  DayAvailabilityResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  AvailableDatesVariables,
  DaySlotsVariables,
} from './types';

// =============================================================================
// CACHE UTILITIES
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data from localStorage if still valid
 */
function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    const isExpired = Date.now() - entry.timestamp > BOOKING_CONFIG.cacheDuration;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set data in localStorage cache
 */
function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('[Booking Cache] Failed to cache data:', error);
  }
}

/**
 * Clear all booking cache entries
 */
export function clearBookingCache(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BOOKING_CONFIG.cacheKeyPrefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// =============================================================================
// GRAPHQL FETCH
// =============================================================================

/**
 * Execute a GraphQL query against WordPress
 */
async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(BOOKING_CONFIG.graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    console.error('[Booking API] GraphQL errors:', result.errors);
    throw new Error(result.errors[0].message);
  }

  return result.data as T;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get session details by ID (server-side/build time)
 * Use this in Astro pages for SSG
 * WDA-986: Now uses two-query pattern to avoid ACF partner field 500 error
 *
 * @param sessionId - WordPress post ID
 */
export async function fetchSessionServer(sessionId: number): Promise<SaunaSession | null> {
  try {
    const data = await graphqlFetch<SessionResponse>(
      BOOKING_QUERIES.GET_SESSION,
      { sessionId: String(sessionId) }
    );

    if (!data.session) {
      return null;
    }

    // WDA-986: Fetch partner separately if sauwaPartnerId exists
    if (data.session.sauwaPartnerId) {
      try {
        const partnerData = await graphqlFetch<PartnerResponse>(
          BOOKING_QUERIES.GET_PARTNER,
          { partnerId: String(data.session.sauwaPartnerId) }
        );
        if (partnerData.partner) {
          data.session.partner = partnerData.partner;
        }
      } catch (partnerError) {
        console.warn('[Booking API] Could not fetch partner:', partnerError);
        // Continue without partner data
      }
    }

    return data.session;
  } catch (error) {
    console.error('[Booking API] fetchSessionServer error:', error);
    return null;
  }
}

/**
 * Get session details by ID (client-side)
 * Cached for 5 minutes in localStorage
 * WDA-986: Now uses two-query pattern to avoid ACF partner field 500 error
 *
 * @param sessionId - WordPress post ID
 */
export async function getSession(sessionId: number): Promise<SaunaSession | null> {
  const cacheKey = CACHE_KEYS.session(sessionId);
  const cached = getCachedData<SaunaSession>(cacheKey);

  if (cached) {
    console.log('[Booking API] Session from cache:', sessionId);
    return cached;
  }

  try {
    const data = await graphqlFetch<SessionResponse>(
      BOOKING_QUERIES.GET_SESSION,
      { sessionId: String(sessionId) }
    );

    if (!data.session) {
      return null;
    }

    // WDA-986: Fetch partner separately if sauwaPartnerId exists
    if (data.session.sauwaPartnerId) {
      try {
        const partnerData = await graphqlFetch<PartnerResponse>(
          BOOKING_QUERIES.GET_PARTNER,
          { partnerId: String(data.session.sauwaPartnerId) }
        );
        if (partnerData.partner) {
          data.session.partner = partnerData.partner;
        }
      } catch (partnerError) {
        console.warn('[Booking API] Could not fetch partner:', partnerError);
        // Continue without partner data
      }
    }

    setCachedData(cacheKey, data.session);
    return data.session;
  } catch (error) {
    console.error('[Booking API] getSession error:', error);
    throw error;
  }
}

/**
 * Get available dates for a session within a date range
 * Cached for 5 minutes
 *
 * @param variables - Session ID and date range
 */
export async function getAvailableDates(
  variables: AvailableDatesVariables
): Promise<DateAvailability[]> {
  const { sessionId, startDate, endDate } = variables;
  const cacheKey = CACHE_KEYS.availableDates(sessionId, startDate, endDate);
  const cached = getCachedData<DateAvailability[]>(cacheKey);

  if (cached) {
    console.log('[Booking API] Available dates from cache');
    return cached;
  }

  try {
    const data = await graphqlFetch<AvailableDatesResponse>(
      BOOKING_QUERIES.GET_AVAILABLE_DATES,
      { sessionId, startDate, endDate }
    );

    const dates = data.sauwaAvailableDates || [];
    setCachedData(cacheKey, dates);

    return dates;
  } catch (error) {
    console.error('[Booking API] getAvailableDates error:', error);
    throw error;
  }
}

/**
 * Get time slots for a specific date
 * Cached for 5 minutes
 *
 * @param variables - Session ID and date
 */
export async function getDaySlots(
  variables: DaySlotsVariables
): Promise<DayAvailability | null> {
  const { sessionId, date } = variables;
  const cacheKey = CACHE_KEYS.daySlots(sessionId, date);
  const cached = getCachedData<DayAvailability>(cacheKey);

  if (cached) {
    console.log('[Booking API] Day slots from cache:', date);
    return cached;
  }

  try {
    const data = await graphqlFetch<DayAvailabilityResponse>(
      BOOKING_QUERIES.GET_DAY_SLOTS,
      { sessionId, date }
    );

    if (data.sauwaSessionAvailabilityByDate) {
      setCachedData(cacheKey, data.sauwaSessionAvailabilityByDate);
    }

    return data.sauwaSessionAvailabilityByDate;
  } catch (error) {
    console.error('[Booking API] getDaySlots error:', error);
    throw error;
  }
}

/**
 * Create a booking via REST API
 * NOT cached - always hits server
 *
 * @param data - Booking request data
 */
export async function createBooking(
  data: CreateBookingRequest
): Promise<CreateBookingResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: CreateBookingResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `Request failed: ${response.status}`,
      };
    }

    // Clear slots cache for this date after successful booking
    // so next user sees updated availability
    const slotCacheKey = CACHE_KEYS.daySlots(data.session_id, data.slot_date);
    localStorage.removeItem(slotCacheKey);

    return result;
  } catch (error) {
    console.error('[Booking API] createBooking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format time from HH:MM:SS to display format (e.g., "10:00")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

/**
 * Format date for display based on locale
 * WDA-909: Fix timezone issue - parse date parts to avoid UTC conversion
 */
export function formatDate(dateString: string, locale: string = 'es'): string {
  // Parse date parts manually to avoid timezone issues
  // dateString format: "YYYY-MM-DD"
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at noon local time to avoid any timezone edge cases
  const date = new Date(year, month - 1, day, 12, 0, 0);

  const localeMap: Record<string, string> = {
    es: 'es-ES',
    ca: 'ca-ES',
    en: 'en-US',
    fr: 'fr-FR',
  };

  return date.toLocaleDateString(localeMap[locale] || 'es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get date range for calendar (current month + next month)
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];

  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 2);
  endDate.setDate(0); // Last day of next month

  return {
    startDate,
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  return date < today;
}

/**
 * Get capacity color class based on availability
 */
export function getCapacityColor(capacity: {
  available: number;
  maximum: number;
}): 'green' | 'yellow' | 'red' {
  const ratio = capacity.available / capacity.maximum;
  if (ratio > 0.5) return 'green';
  if (ratio > 0.2) return 'yellow';
  return 'red';
}

// =============================================================================
// VOUCHER REDEMPTION - WDA-975
// =============================================================================

/**
 * Validate voucher code
 * REST API: POST /wp-json/sauwa/v1/vouchers/validate
 *
 * @param code - Voucher code (format: VCH-2025-XXXXXX-YYYY)
 */
export async function validateVoucher(
  code: string
): Promise<import('./types').VoucherValidationResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/vouchers/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        valid: false,
        error: result.error || 'invalid',
      };
    }

    return result;
  } catch (error) {
    console.error('[Booking API] validateVoucher error:', error);
    return {
      valid: false,
      error: 'invalid',
    };
  }
}

/**
 * Redeem voucher for a booking
 * REST API: POST /wp-json/sauwa/v1/vouchers/redeem
 * NOT cached - always hits server
 *
 * @param data - Voucher redemption request data
 */
export async function redeemVoucher(
  data: import('./types').VoucherRedemptionRequest
): Promise<import('./types').VoucherRedemptionResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/vouchers/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `Request failed: ${response.status}`,
      };
    }

    // Clear cache for this date after successful redemption
    if (result.success && data.slot_date) {
      const sessionId = result.booking_id || 0;
      const slotCacheKey = CACHE_KEYS.daySlots(sessionId, data.slot_date);
      localStorage.removeItem(slotCacheKey);
    }

    return result;
  } catch (error) {
    console.error('[Booking API] redeemVoucher error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// GIFT PURCHASE & REDEMPTION - WDA-1033, WDA-1034
// =============================================================================

/**
 * Purchase a gift via dedicated endpoint
 * REST API: POST /wp-json/sauwa/v1/gifts/purchase (WDA-1034)
 * NOT cached - always hits server
 *
 * @param data - Gift purchase request data (clean, no workaround fields)
 */
export async function purchaseGift(
  data: import('./types').PurchaseGiftRequest
): Promise<import('./types').PurchaseGiftResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/gifts/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `Request failed: ${response.status}`,
      };
    }

    return result;
  } catch (error) {
    console.error('[Booking API] purchaseGift error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * @deprecated Use purchaseGift() instead - calls new /gifts/purchase endpoint
 * Legacy function using /book endpoint workaround
 * TODO: Remove when all clients migrate to purchaseGift()
 *
 * @param data - Gift purchase request data (with workaround fields)
 */
export async function createGift(
  data: import('./types').CreateGiftRequest
): Promise<import('./types').CreateGiftResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `Request failed: ${response.status}`,
      };
    }

    return result;
  } catch (error) {
    console.error('[Booking API] createGift error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate gift code
 * REST API: POST /wp-json/sauwa/v1/gifts/validate
 *
 * @param code - Gift code (format: GIFT-YYYY-XXXXXX-ZZZZ)
 */
export async function validateGift(
  code: string
): Promise<import('./types').GiftValidationResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/gifts/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        valid: false,
        reason: result.error || 'invalid',
      };
    }

    return result;
  } catch (error) {
    console.error('[Booking API] validateGift error:', error);
    return {
      valid: false,
      reason: 'invalid',
    };
  }
}

/**
 * Redeem gift for a booking
 * REST API: POST /wp-json/sauwa/v1/gifts/redeem
 * NOT cached - always hits server
 *
 * @param data - Gift redemption request data (includes N attendees)
 */
export async function redeemGift(
  data: import('./types').GiftRedemptionRequest
): Promise<import('./types').GiftRedemptionResponse> {
  try {
    const response = await fetch(`${BOOKING_CONFIG.restEndpoint}/gifts/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `Request failed: ${response.status}`,
      };
    }

    // Clear cache for this date after successful redemption
    if (result.success && data.slot_date) {
      const sessionId = result.booking_id || 0;
      const slotCacheKey = CACHE_KEYS.daySlots(sessionId, data.slot_date);
      localStorage.removeItem(slotCacheKey);
    }

    return result;
  } catch (error) {
    console.error('[Booking API] redeemGift error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
