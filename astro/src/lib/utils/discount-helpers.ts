/**
 * Discount Helpers
 * WDA-1021: Utility functions for formatting and calculating discounts
 */

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format a discount amount in cents to a readable EUR string
 *
 * @param cents - Amount in cents
 * @returns Formatted string with EUR symbol (e.g., "10.00 EUR")
 *
 * @example
 * ```typescript
 * formatDiscountAmount(1000); // "10.00 EUR"
 * formatDiscountAmount(2550); // "25.50 EUR"
 * ```
 */
export function formatDiscountAmount(cents: number): string {
  return `${(cents / 100).toFixed(2)} EUR`;
}

/**
 * Format a discount percentage for display
 *
 * @param percentage - Percentage value (0-100)
 * @returns Formatted string with % symbol (e.g., "20%")
 *
 * @example
 * ```typescript
 * formatDiscountPercentage(20); // "20%"
 * formatDiscountPercentage(15.5); // "15.5%"
 * ```
 */
export function formatDiscountPercentage(percentage: number): string {
  return `${percentage}%`;
}

/**
 * Format a price in cents to localized EUR currency
 * Uses Spanish locale for consistent formatting across the app
 *
 * @param cents - Price in cents
 * @returns Formatted currency string (e.g., "25,00 EUR")
 *
 * @example
 * ```typescript
 * formatPrice(2500); // "25,00 EUR"
 * formatPrice(1299); // "12,99 EUR"
 * ```
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate savings between original and final price
 *
 * @param originalPriceCents - Original price in cents
 * @param finalPriceCents - Final price after discount in cents
 * @returns Savings amount in cents
 *
 * @example
 * ```typescript
 * calculateSavings(5000, 4000); // 1000 (10 EUR saved)
 * ```
 */
export function calculateSavings(
  originalPriceCents: number,
  finalPriceCents: number
): number {
  return originalPriceCents - finalPriceCents;
}

/**
 * Calculate discount percentage from original and final price
 *
 * @param originalPriceCents - Original price in cents
 * @param finalPriceCents - Final price after discount in cents
 * @returns Discount percentage (0-100)
 *
 * @example
 * ```typescript
 * calculateDiscountPercentage(5000, 4000); // 20
 * calculateDiscountPercentage(10000, 8500); // 15
 * ```
 */
export function calculateDiscountPercentage(
  originalPriceCents: number,
  finalPriceCents: number
): number {
  if (originalPriceCents <= 0) return 0;
  const savings = calculateSavings(originalPriceCents, finalPriceCents);
  return Math.round((savings / originalPriceCents) * 100);
}

/**
 * Apply a percentage discount to a price
 *
 * @param priceCents - Original price in cents
 * @param percentage - Discount percentage (0-100)
 * @returns Final price in cents after discount
 *
 * @example
 * ```typescript
 * applyPercentageDiscount(5000, 20); // 4000
 * applyPercentageDiscount(10000, 15); // 8500
 * ```
 */
export function applyPercentageDiscount(
  priceCents: number,
  percentage: number
): number {
  const discount = Math.round(priceCents * (percentage / 100));
  return priceCents - discount;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a discount code format is valid (basic client-side validation)
 * Codes should be alphanumeric, 3-20 characters
 *
 * @param code - Discount code to validate
 * @returns true if format is valid
 *
 * @example
 * ```typescript
 * isValidCodeFormat('SUMMER20'); // true
 * isValidCodeFormat('AB'); // false (too short)
 * isValidCodeFormat(''); // false (empty)
 * ```
 */
export function isValidCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  // Alphanumeric, 3-20 characters
  return /^[A-Za-z0-9]{3,20}$/.test(trimmed);
}

/**
 * Normalize a discount code for comparison/submission
 * Trims whitespace and converts to uppercase
 *
 * @param code - Discount code to normalize
 * @returns Normalized code string
 *
 * @example
 * ```typescript
 * normalizeCode('  summer20  '); // 'SUMMER20'
 * normalizeCode('Winter15'); // 'WINTER15'
 * ```
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}
