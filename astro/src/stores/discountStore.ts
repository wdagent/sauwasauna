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
 * Current discount amount (percentage or fixed value)
 * WDA-1023: Updated to use new field name
 */
export const discountPercentage = computed(appliedDiscount, (discount) => {
  if (!discount) return 0;
  // For percentage type, return the percentage; for fixed, return 0 (handled differently)
  return discount.type === 'percentage' ? discount.amount : 0;
});

/**
 * Remaining uses for the discount code (null if unlimited)
 * WDA-1023: Updated to use new field names
 */
export const remainingUses = computed(appliedDiscount, (discount) => {
  if (!discount) return null;
  if (discount.maxUses === null || discount.maxUses === 0) return null; // null/0 means unlimited
  return discount.maxUses - discount.currentUses;
});

/**
 * Whether the discount is one-time use (maxUses = 1)
 * WDA-1023: Derived from maxUses instead of one_per_user
 */
export const isOneTimeUse = computed(appliedDiscount, (discount) => discount?.maxUses === 1);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a discount has expired
 * WDA-1023: Updated to use new field name validUntil
 * @param discount - The discount to check
 * @returns true if the discount is past its validUntil date or status is expired
 */
function isDiscountExpired(discount: Discount): boolean {
  // Check status first
  if (discount.status === 'expired' || discount.status === 'inactive') return true;
  // Then check date
  if (!discount.validUntil) return false;
  const expirationDate = new Date(discount.validUntil);
  const now = new Date();
  return now > expirationDate;
}

/**
 * Calculate discount amount for a given session price
 * Returns a computed store that updates when discount changes
 * WDA-1023: Updated to support both percentage and fixed discount types
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

    let discountAmount: number;
    let percentage: number;

    if (discount.type === 'percentage') {
      percentage = discount.amount;
      discountAmount = Math.round((sessionPrice * discount.amount) / 100 * 100) / 100;
    } else {
      // Fixed amount discount
      discountAmount = Math.min(discount.amount, sessionPrice); // Can't discount more than the price
      percentage = sessionPrice > 0 ? Math.round((discountAmount / sessionPrice) * 100) : 0;
    }

    const finalPrice = Math.round((sessionPrice - discountAmount) * 100) / 100;

    return {
      originalPrice: sessionPrice,
      discountAmount,
      finalPrice,
      percentage
    };
  });
}

/**
 * Get discount calculation for a specific price (non-reactive)
 * Use this when you need a one-time calculation, not a reactive value
 * WDA-1023: Updated to support both percentage and fixed discount types
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

  let discountAmount: number;
  let percentage: number;

  if (discount.type === 'percentage') {
    percentage = discount.amount;
    discountAmount = Math.round((sessionPrice * discount.amount) / 100 * 100) / 100;
  } else {
    // Fixed amount discount
    discountAmount = Math.min(discount.amount, sessionPrice);
    percentage = sessionPrice > 0 ? Math.round((discountAmount / sessionPrice) * 100) : 0;
  }

  const finalPrice = Math.round((sessionPrice - discountAmount) * 100) / 100;

  return {
    originalPrice: sessionPrice,
    discountAmount,
    finalPrice,
    percentage
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
