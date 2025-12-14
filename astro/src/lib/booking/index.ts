/**
 * Booking Module - Barrel Export
 * WDA-900: SAUWA booking system infrastructure
 *
 * Usage in components:
 * ```typescript
 * import { getSession, getAvailableDates, getDaySlots, createBooking } from '../lib/booking';
 * import type { SaunaSession, TimeSlot, CreateBookingRequest } from '../lib/booking';
 * ```
 */

// Configuration
export { BOOKING_CONFIG, CACHE_KEYS } from './config';

// Types
export type {
  // Core types
  Locale,
  SaunaSession,
  SessionDetails,
  SessionPartner,
  SessionResponse,
  // Availability
  DateAvailability,
  AvailableDatesResponse,
  SlotStatus,
  SlotCapacity,
  TimeSlot,
  DaySessionInfo,
  DayAvailability,
  DayAvailabilityResponse,
  // Booking
  BookingAttendee,
  CreateBookingRequest,
  CreateBookingResponse,
  // UI State
  BookingWidgetState,
  CustomerFormData,
  // Query variables
  AvailableDatesVariables,
  DaySlotsVariables,
} from './types';

// Queries
export { BOOKING_QUERIES } from './queries';
export type { BookingQueryName } from './queries';

// API functions
export {
  // Data fetching (cached)
  getSession,
  getAvailableDates,
  getDaySlots,
  // Booking creation
  createBooking,
  // Cache management
  clearBookingCache,
  // Utilities
  formatTime,
  formatDate,
  getDefaultDateRange,
  isPastDate,
  getCapacityColor,
} from './api';
