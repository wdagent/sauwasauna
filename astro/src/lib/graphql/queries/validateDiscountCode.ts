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

// WDA-1023: Import Discount type from central types
import type { Discount } from '../../../types/discount';

/**
 * GraphQL response structure for validate discount code query
 * WDA-1023: Updated to match backend SauwaDiscountCodeValidation type
 */
export interface ValidateDiscountResponse {
  sauwaValidateDiscountCode: {
    valid: boolean;
    reason: string;
    calculatedDiscount: number | null;
    finalPriceCents: number | null;
    discountCode: {
      id: number;
      code: string;
      name: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      maxUses: number | null;
      currentUses: number;
      validFrom: string | null;
      validUntil: string | null;
      status: 'active' | 'inactive' | 'expired';
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
      reason
      calculatedDiscount
      finalPriceCents
      discountCode {
        id
        code
        name
        discountType
        discountValue
        maxUses
        currentUses
        validFrom
        validUntil
        status
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
 * WDA-1023: Updated to use new backend field names
 */
function mapToErrorType(
  discountCode: ValidateDiscountResponse['sauwaValidateDiscountCode']['discountCode'],
  reason?: string
): DiscountErrorType {
  // No discount code found
  if (!discountCode) {
    return 'INVALID_CODE';
  }

  // Check status
  if (discountCode.status === 'inactive') {
    return 'INACTIVE';
  }

  if (discountCode.status === 'expired') {
    return 'EXPIRED';
  }

  // Check if expired (compare dates as backup)
  if (discountCode.validUntil) {
    const validUntilDate = new Date(discountCode.validUntil);
    const now = new Date();
    if (validUntilDate < now) {
      return 'EXPIRED';
    }
  }

  // Check if usage limit reached
  if (
    discountCode.maxUses !== null &&
    discountCode.maxUses > 0 &&
    discountCode.currentUses >= discountCode.maxUses
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
          type: result.discountCode.discountType,
          amount: result.discountCode.discountValue,
          validUntil: result.discountCode.validUntil,
          maxUses: result.discountCode.maxUses,
          currentUses: result.discountCode.currentUses,
          status: result.discountCode.status,
        },
        calculatedDiscount: result.calculatedDiscount ?? undefined,
        finalPriceCents: result.finalPriceCents ?? undefined,
        message: result.reason,
      };
    }

    // Validation failed - determine error type
    const errorType = mapToErrorType(result.discountCode, result.reason);

    return {
      valid: false,
      error: errorType,
      message: result.reason,
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
