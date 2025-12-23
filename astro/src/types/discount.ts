/**
 * Discount Type Definitions
 * WDA-1020: TypeScript interfaces for SAUWA discount code system
 * WDA-1023: Updated to match backend GraphQL schema
 */

/**
 * Discount type - percentage or fixed amount
 */
export type DiscountType = 'percentage' | 'fixed';

/**
 * Discount code entity from WordPress backend
 * GraphQL query: sauwaValidateDiscountCode
 * WDA-1023: Updated field names to match backend schema
 */
export interface Discount {
  /** Discount code (uppercase alphanumeric) */
  code: string;
  /** Type of discount: percentage or fixed amount */
  type: DiscountType;
  /** Discount value (percentage 0-100 or fixed amount in euros) */
  amount: number;
  /** Expiration date in ISO 8601 format (null if no expiration) */
  validUntil: string | null;
  /** Maximum number of times this code can be used (null if unlimited) */
  maxUses: number | null;
  /** Current number of times this code has been used */
  currentUses: number;
  /** Whether the discount code is currently active */
  status: 'active' | 'inactive' | 'expired';
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
