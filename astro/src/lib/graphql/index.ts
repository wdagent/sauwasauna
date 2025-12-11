/**
 * GraphQL Module Index
 * WDA-1021: Central export for all GraphQL queries and mutations
 */

// Queries
export {
  VALIDATE_DISCOUNT_CODE_QUERY,
  validateDiscountCode,
  type Discount,
  type DiscountErrorType,
  type ValidateDiscountResponse,
  type ValidateDiscountResult,
} from './queries';

// Mutations
export {
  APPLY_DISCOUNT_CODE_MUTATION,
  applyDiscountCode,
  type ApplyDiscountResponse,
  type ApplyDiscountResult,
} from './mutations';
