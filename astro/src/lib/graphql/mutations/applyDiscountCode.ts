/**
 * Apply Discount Code Mutation
 * WDA-1021: GraphQL mutation for applying discount codes to bookings
 *
 * Backend endpoint: backend.sauwasauna.com/graphql
 * Mutation: sauwaApplyDiscountCode
 */

import { graphqlQuery } from '../../graphql';

// =============================================================================
// TYPES
// =============================================================================

/**
 * GraphQL response structure for apply discount code mutation
 */
export interface ApplyDiscountResponse {
  sauwaApplyDiscountCode: {
    success: boolean;
    message: string;
    discountApplied: number | null;
  };
}

/**
 * Result type for applyDiscountCode function
 */
export interface ApplyDiscountResult {
  success: boolean;
  message: string;
  discountApplied?: number;
}

// =============================================================================
// MUTATION
// =============================================================================

export const APPLY_DISCOUNT_CODE_MUTATION = `
  mutation ApplyDiscountCode($code: String!, $bookingId: Int!) {
    sauwaApplyDiscountCode(input: {
      code: $code
      bookingId: $bookingId
    }) {
      success
      message
      discountApplied
    }
  }
`;

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Apply a validated discount code to a booking
 *
 * @param code - The discount code to apply
 * @param bookingId - The booking ID to apply the discount to
 * @returns Promise with application result
 *
 * @example
 * ```typescript
 * const result = await applyDiscountCode('SUMMER20', 12345);
 * if (result.success) {
 *   console.log(`Discount applied: ${result.discountApplied} cents`);
 * } else {
 *   console.log(`Error: ${result.message}`);
 * }
 * ```
 */
export async function applyDiscountCode(
  code: string,
  bookingId: number
): Promise<ApplyDiscountResult> {
  // Create abort controller for timeout (5 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const data = await graphqlQuery<ApplyDiscountResponse>(
      APPLY_DISCOUNT_CODE_MUTATION,
      {
        code: code.trim().toUpperCase(),
        bookingId,
      }
    );

    clearTimeout(timeoutId);

    const result = data.sauwaApplyDiscountCode;

    return {
      success: result.success,
      message: result.message,
      discountApplied: result.discountApplied ?? undefined,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle network/timeout errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: `Error applying discount: ${errorMessage}`,
    };
  }
}
