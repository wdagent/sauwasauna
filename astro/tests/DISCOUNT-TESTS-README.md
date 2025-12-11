# Discount Code Testing Documentation

Testing implementation for WDA-1023 - Discount Code System

## Overview

This document describes the testing strategy for the SAUWA discount code feature.

## Test Structure

### Unit Tests (Vitest)
Location: `src/stores/__tests__/discountStore.test.ts`

Coverage: Discount store state management with nanostores

**Tests included:**
- Atoms initialization (discountCode, discountState, appliedDiscount, discountError)
- Action functions (setDiscountCode, setValidating, setValid, setError, clearDiscount)
- Computed values (isDiscountApplied, discountPercentage)
- Validation functions (validateCodeFormat, sanitizeCode)
- Integration flows (successful application, error handling, removal)

**Run unit tests:**
```bash
npm run test:unit
```

**Run with coverage:**
```bash
npm run test:coverage
```

Target coverage: >= 70%

### E2E Tests (Playwright)
Location: `tests/e2e-discount-codes.spec.ts`

**Tests included:**
1. Apply valid discount code - Verify badge appears with correct percentage
2. Show error for invalid code - Verify error message and input styling
3. Remove applied discount - Verify discount can be removed
4. Keyboard navigation (Enter) - Apply discount with Enter key
5. Keyboard navigation (Escape) - Clear input with Escape key
6. Loading state - Verify loading spinner appears during validation
7. Accessibility audit - axe-core validation (idle state)

**Run E2E tests:**
```bash
npm run test -- tests/e2e-discount-codes.spec.ts
```

**Run accessibility test only:**
```bash
npm run test -- tests/e2e-discount-codes.spec.ts -g "accessibility"
```

## Test Data

**Valid discount fixture:**
- Code: VERANO20
- Percentage: 20%
- Status: Active

**Expired discount fixture:**
- Code: EXPIRED2023
- Status: Expired

## Notes

- Most E2E tests are marked `test.skip()` because the backend GraphQL endpoint for discount validation is not yet implemented
- The accessibility test runs successfully and validates the idle state of the discount input component
- Unit tests cover the complete state management logic independently of backend

## Next Steps

When backend is ready:
1. Remove `test.skip()` from E2E tests
2. Configure test discount codes in WordPress backend
3. Run full E2E suite
4. Verify all 8 critical flows pass
