import { describe, it, expect, beforeEach } from 'vitest';
import { discountCode, discountState, appliedDiscount, discountError, isDiscountApplied, discountPercentage, setDiscountCode, setValidating, setValid, setError, clearDiscount, validateCodeFormat, sanitizeCode } from '../discountStore';
import type { Discount } from '../../types/discount';

const VALID_DISCOUNT: Discount = { id: '1', code: 'VERANO20', percentage: 20, valid_until: new Date(Date.now() + 86400000).toISOString(), usage_limit: 100, usage_count: 10, is_active: true, one_per_user: false };

function clearLS() { if (typeof localStorage !== 'undefined') localStorage.clear(); }

describe('discountStore', () => {
  beforeEach(() => { clearLS(); clearDiscount(); });
  
  it('should initialize discountCode with empty string', () => expect(discountCode.get()).toBe(''));
  it('should initialize discountState with idle', () => expect(discountState.get()).toBe('idle'));
  it('should initialize appliedDiscount with null', () => expect(appliedDiscount.get()).toBeNull());
  it('should update discount code', () => { setDiscountCode('SUMMER20'); expect(discountCode.get()).toBe('SUMMER20'); });
  it('should sanitize to uppercase', () => { setDiscountCode('summer20'); expect(discountCode.get()).toBe('SUMMER20'); });
  it('should trim whitespace', () => { setDiscountCode('  WINTER15  '); expect(discountCode.get()).toBe('WINTER15'); });
  it('should set validating', () => { setValidating(); expect(discountState.get()).toBe('validating'); });
  it('should set valid', () => { setValid(VALID_DISCOUNT); expect(discountState.get()).toBe('valid'); });
  it('should store discount data', () => { setValid(VALID_DISCOUNT); expect(appliedDiscount.get()).toEqual(VALID_DISCOUNT); });
  it('should set error', () => { setError('INVALID_CODE'); expect(discountState.get()).toBe('error'); });
  it('should reset on clear', () => { setDiscountCode('TEST'); clearDiscount(); expect(discountCode.get()).toBe(''); });
  it('should validate format', () => { expect(validateCodeFormat('VERANO20')).toBe(true); expect(validateCodeFormat('ABC')).toBe(false); });
  it('should sanitize code', () => expect(sanitizeCode('summer20')).toBe('SUMMER20'));
});
