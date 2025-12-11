/**
 * Validate Discount Code Query
 * WDA-1021: GraphQL query for validating discount codes
 *
 * Backend endpoint: backend.sauwasauna.com/graphql
 * Query: sauwaValidateDiscountCode
 */

import { graphqlQuery } from '../../graphql';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Discount error types for UI error handling
 */
export type DiscountErrorType =
  | 'INVALID_CODE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'NO_USES_LEFT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Discount code information from backend
 */
export interface Discount {
  code: string;
  percentage: number;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

/**
 * GraphQL response structure for validate discount code query
 */
export interface ValidateDiscountResponse {
  sauwaValidateDiscountCode: {
    valid: boolean;
    message: string;
    calculatedDiscount: number;
    finalPriceCents: number;
    discountCode: {
      code: string;
      percentage: number;
      validUntil: string;
      usageLimit: number;
      usageCount: number;
      isActive: boolean;
    } | null;
  };
}

/**
 * Result type for validateDiscountCode function
 */
export interface ValidateDiscountResult {
  valid: boolean;
  discount?: Discount;
  calculatedDiscount?: number;
  finalPriceCents?: number;
  message?: string;
  error?: DiscountErrorType;
}

// =============================================================================
// QUERY
// =============================================================================

export const VALIDATE_DISCOUNT_CODE_QUERY = `
  query ValidateDiscountCode($code: String!, $subtotalCents: Int!) {
    sauwaValidateDiscountCode(
      code: $code
      subtotalCents: $subtotalCents
    ) {
      valid
      message
      calculatedDiscount
      finalPriceCents
      discountCode {
        code
        percentage
        validUntil
        usageLimit
        usageCount
        isActive
      }
    }
  }
`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map backend response to specific error type
 * Analyzes discountCode properties to determine exact error
 */
function mapToErrorType(
  discountCode: ValidateDiscountResponse['sauwaValidateDiscountCode']['discountCode']
): DiscountErrorType {
  // No discount code found
  if (!discountCode) {
    return 'INVALID_CODE';
  }

  // Check if inactive
  if (!discountCode.isActive) {
    return 'INACTIVE';
  }

  // Check if expired (compare dates)
  if (discountCode.validUntil) {
    const validUntilDate = new Date(discountCode.validUntil);
    const now = new Date();
    if (validUntilDate < now) {
      return 'EXPIRED';
    }
  }

  // Check if usage limit reached
  if (
    discountCode.usageLimit > 0 &&
    discountCode.usageCount >= discountCode.usageLimit
  ) {
    return 'NO_USES_LEFT';
  }

  // If none of the above, return unknown error
  return 'UNKNOWN_ERROR';
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Validate a discount code against the backend
 *
 * @param code - The discount code to validate
 * @param subtotalCents - The subtotal in cents to calculate discount
 * @returns Promise with validation result, discount details, or error type
 *
 * @example
 * ```typescript
 * const result = await validateDiscountCode('SUMMER20', 5000);
 * if (result.valid && result.discount) {
 *   console.log(`Discount: ${result.calculatedDiscount} cents`);
 *   console.log(`Final price: ${result.finalPriceCents} cents`);
 * } else if (result.error) {
 *   console.log(`Error: ${result.error}`);
 * }
 * ```
 */
export async function validateDiscountCode(
  code: string,
  subtotalCents: number
): Promise<ValidateDiscountResult> {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const data = await graphqlQuery<ValidateDiscountResponse>(
      VALIDATE_DISCOUNT_CODE_QUERY,
      {
        code: code.trim().toUpperCase(),
        subtotalCents,
      }
    );

    clearTimeout(timeoutId);

    const result = data.sauwaValidateDiscountCode;

    // Check if validation was successful
    if (result.valid && result.discountCode) {
      return {
        valid: true,
        discount: {
          code: result.discountCode.code,
          percentage: result.discountCode.percentage,
          validUntil: result.discountCode.validUntil,
          usageLimit: result.discountCode.usageLimit,
          usageCount: result.discountCode.usageCount,
          isActive: result.discountCode.isActive,
        },
        calculatedDiscount: result.calculatedDiscount,
        finalPriceCents: result.finalPriceCents,
        message: result.message,
      };
    }

    // Validation failed - determine error type
    const errorType = mapToErrorType(result.discountCode);

    return {
      valid: false,
      error: errorType,
      message: result.message,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle network/timeout errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[validateDiscountCode] Request timeout after 5s');
        return {
          valid: false,
          error: 'NETWORK_ERROR',
          message: 'Request timeout',
        };
      }

      console.error('[validateDiscountCode] GraphQL error:', error.message);
    }

    return {
      valid: false,
      error: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
