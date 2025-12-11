/**
 * Discount Store - Nanostores State Management
 * WDA-1020: State management for SAUWA discount code system
 *
 * Uses nanostores for lightweight, framework-agnostic state management
 * with @nanostores/persistent for LocalStorage persistence
 */

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { Discount, DiscountState, DiscountCalculation } from '../types/discount';
import type { DiscountErrorType } from '../types/discount-errors';

// =============================================================================
// ATOMS - Core State
// =============================================================================

/**
 * Current discount code input (user-entered)
 * Auto-converted to uppercase on set
 */
export const discountCode = atom<string>('');

/**
 * Current validation state of the discount
 */
export const discountState = atom<DiscountState>('idle');

/**
 * Currently applied discount (persisted to LocalStorage)
 * Null when no discount is applied
 */
export const appliedDiscount = persistentAtom<Discount | null>(
  'sauwa_discount',
  null,
  {
    encode: JSON.stringify,
    decode: (str: string): Discount | null => {
      try {
        const discount = JSON.parse(str) as Discount | null;
        // Validate on restore - check expiration
        if (discount && isDiscountExpired(discount)) {
          return null;
        }
        return discount;
      } catch {
        return null;
      }
    }
  }
);

/**
 * Current error type if validation failed
 */
export const discountError = atom<DiscountErrorType | null>(null);

// =============================================================================
// COMPUTED VALUES - Derived State
// =============================================================================

/**
 * Whether a discount is currently applied
 */
export const isDiscountApplied = computed(appliedDiscount, (discount) => discount !== null);

/**
 * Current discount percentage (0 if no discount)
 */
export const discountPercentage = computed(appliedDiscount, (discount) => discount?.percentage ?? 0);

/**
 * Whether the discount is one-time use per user
 */
export const isOneTimeUse = computed(appliedDiscount, (discount) => discount?.one_per_user ?? false);

/**
 * Remaining uses for the discount code (null if unlimited)
 */
export const remainingUses = computed(appliedDiscount, (discount) => {
  if (!discount) return null;
  if (discount.usage_limit === 0) return null; // 0 means unlimited
  return discount.usage_limit - discount.usage_count;
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a discount has expired
 * @param discount - The discount to check
 * @returns true if the discount is past its valid_until date
 */
function isDiscountExpired(discount: Discount): boolean {
  if (!discount.valid_until) return false;
  const expirationDate = new Date(discount.valid_until);
  const now = new Date();
  return now > expirationDate;
}

/**
 * Calculate discount amount for a given session price
 * Returns a computed store that updates when discount changes
 * @param sessionPrice - The base price of the session
 * @returns Computed store with discount calculation
 */
export function calculateDiscountAmount(sessionPrice: number) {
  return computed(appliedDiscount, (discount): DiscountCalculation => {
    if (!discount) {
      return {
        originalPrice: sessionPrice,
        discountAmount: 0,
        finalPrice: sessionPrice,
        percentage: 0
      };
    }

    const discountAmount = Math.round((sessionPrice * discount.percentage) / 100 * 100) / 100;
    const finalPrice = Math.round((sessionPrice - discountAmount) * 100) / 100;

    return {
      originalPrice: sessionPrice,
      discountAmount,
      finalPrice,
      percentage: discount.percentage
    };
  });
}

/**
 * Get discount calculation for a specific price (non-reactive)
 * Use this when you need a one-time calculation, not a reactive value
 * @param sessionPrice - The base price of the session
 * @returns Discount calculation object
 */
export function getDiscountCalculation(sessionPrice: number): DiscountCalculation {
  const discount = appliedDiscount.get();

  if (!discount) {
    return {
      originalPrice: sessionPrice,
      discountAmount: 0,
      finalPrice: sessionPrice,
      percentage: 0
    };
  }

  const discountAmount = Math.round((sessionPrice * discount.percentage) / 100 * 100) / 100;
  const finalPrice = Math.round((sessionPrice - discountAmount) * 100) / 100;

  return {
    originalPrice: sessionPrice,
    discountAmount,
    finalPrice,
    percentage: discount.percentage
  };
}

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate discount code format
 * Accepts 4-20 alphanumeric characters (uppercase)
 * @param code - The code to validate
 * @returns true if code format is valid
 */
export function validateCodeFormat(code: string): boolean {
  const pattern = /^[A-Z0-9]{4,20}$/;
  return pattern.test(code.toUpperCase());
}

/**
 * Sanitize and normalize discount code input
 * @param code - The raw code input
 * @returns Uppercase trimmed code
 */
export function sanitizeCode(code: string): string {
  return code.trim().toUpperCase();
}

// =============================================================================
// ACTIONS - State Mutations
// =============================================================================

/**
 * Set the discount code input
 * Automatically converts to uppercase
 * @param code - The discount code to set
 */
export function setDiscountCode(code: string): void {
  const sanitized = sanitizeCode(code);
  discountCode.set(sanitized);
  // Reset error when user starts typing new code
  if (discountError.get() !== null) {
    discountError.set(null);
    discountState.set('idle');
  }
}

/**
 * Set state to validating (loading)
 */
export function setValidating(): void {
  discountState.set('validating');
  discountError.set(null);
}

/**
 * Set a valid discount after successful validation
 * @param discount - The validated discount object
 */
export function setValid(discount: Discount): void {
  appliedDiscount.set(discount);
  discountState.set('valid');
  discountError.set(null);
  // Clear the input code after successful application
  discountCode.set('');
}

/**
 * Set an error after failed validation
 * @param error - The type of error that occurred
 */
export function setError(error: DiscountErrorType): void {
  discountError.set(error);
  discountState.set('error');
  appliedDiscount.set(null);
}

/**
 * Clear all discount state (reset to initial)
 */
export function clearDiscount(): void {
  discountCode.set('');
  discountState.set('idle');
  appliedDiscount.set(null);
  discountError.set(null);
}

/**
 * Revalidate stored discount on page load
 * Checks if stored discount is still valid (not expired)
 * Should be called on component mount
 */
export function revalidateStoredDiscount(): void {
  const stored = appliedDiscount.get();
  if (stored && isDiscountExpired(stored)) {
    // Discount has expired, clear it
    clearDiscount();
  }
}

// =============================================================================
// SELECTORS - Convenience Getters
// =============================================================================

/**
 * Get current discount state snapshot
 * Useful for non-reactive contexts
 */
export function getDiscountSnapshot() {
  return {
    code: discountCode.get(),
    state: discountState.get(),
    discount: appliedDiscount.get(),
    error: discountError.get(),
    isApplied: isDiscountApplied.get(),
    percentage: discountPercentage.get()
  };
}

/**
 * Check if the store is in a loading state
 */
export function isValidating(): boolean {
  return discountState.get() === 'validating';
}

/**
 * Check if there's an active error
 */
export function hasError(): boolean {
  return discountState.get() === 'error' && discountError.get() !== null;
}
