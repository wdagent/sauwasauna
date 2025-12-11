/**
 * Discount Type Definitions
 * WDA-1020: TypeScript interfaces for SAUWA discount code system
 */

/**
 * Discount code entity from WordPress backend
 * GraphQL query: sauwaValidateDiscount
 */
export interface Discount {
  /** Unique identifier from WordPress */
  id: string;
  /** Discount code (uppercase alphanumeric) */
  code: string;
  /** Discount percentage (0-100) */
  percentage: number;
  /** Expiration date in ISO 8601 format */
  valid_until: string;
  /** Maximum number of times this code can be used */
  usage_limit: number;
  /** Current number of times this code has been used */
  usage_count: number;
  /** Whether the discount code is currently active */
  is_active: boolean;
  /** Whether each user can only use this code once */
  one_per_user: boolean;
}

/**
 * Discount validation state for UI feedback
 */
export type DiscountState = 'idle' | 'validating' | 'valid' | 'error';

/**
 * Calculated discount information for checkout display
 */
export interface DiscountCalculation {
  /** Original price before discount */
  originalPrice: number;
  /** Discount amount in currency */
  discountAmount: number;
  /** Final price after discount */
  finalPrice: number;
  /** Applied discount percentage */
  percentage: number;
}
