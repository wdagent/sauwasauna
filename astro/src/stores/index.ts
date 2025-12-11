/**
 * Store Exports
 * WDA-1020: Central export point for all nanostores
 */

// Discount Store
export {
  // Atoms
  discountCode,
  discountState,
  appliedDiscount,
  discountError,
  // Computed
  isDiscountApplied,
  discountPercentage,
  isOneTimeUse,
  remainingUses,
  // Functions
  calculateDiscountAmount,
  getDiscountCalculation,
  // Validators
  validateCodeFormat,
  sanitizeCode,
  // Actions
  setDiscountCode,
  setValidating,
  setValid,
  setError,
  clearDiscount,
  revalidateStoredDiscount,
  // Selectors
  getDiscountSnapshot,
  isValidating,
  hasError
} from './discountStore';

// Types re-export for convenience
export type { Discount, DiscountState, DiscountCalculation } from '../types/discount';
export type { DiscountErrorType, DiscountErrorConfig } from '../types/discount-errors';
export { ERROR_MESSAGES, getErrorConfig, isRecoverableError } from '../types/discount-errors';
