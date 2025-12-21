/**
 * Booking Type Definitions
 * WDA-900: TypeScript interfaces for SAUWA booking system
 * WDA-974: Added session type support for differentiated booking flows
 */

// =============================================================================
// LOCALE
// =============================================================================

export type Locale = 'es' | 'ca' | 'en' | 'fr';

// =============================================================================
// SESSION TYPES - WDA-974
// =============================================================================

/**
 * Session type determines booking flow behavior
 * - single: Standard booking with quantity selector
 * - pack: Pre-paid pack with fixed number of entries
 * - voucher: Gift voucher (no calendar, generates codes)
 * - private: Private session (full capacity, no quantity selector)
 * - gift: Gift card (like voucher but with recipient info, generates GIFT-... codes)
 */
export type SessionType = 'single' | 'pack' | 'voucher' | 'private' | 'gift';

// =============================================================================
// SESSION (CPT: sauna_session)
// =============================================================================

/**
 * Featured Image from WordPress
 */
export interface FeaturedImage {
  node: {
    sourceUrl: string;
    altText?: string;
    mediaDetails?: {
      width: number;
      height: number;
    };
  };
}

/**
 * Sauna session from WordPress CPT
 * GraphQL query: saunaSession
 * WDA-986: Added sauwaPartnerId for two-query pattern (partner queried separately)
 */
export interface SaunaSession {
  databaseId: number;
  title: string;
  content?: string;
  slug?: string;
  sauwaPartnerId?: number | null;
  featuredImage?: FeaturedImage | null;
  sessionDetails: SessionDetails;
  partner?: SessionPartner | null;
}

/**
 * Partner information ACF field group
 */
export interface PartnerInformation {
  partnerAddress?: string | null;
  partnerPhone?: string | null;
  partnerEmail?: string | null;
  partnerWeb?: string | null;
  partnerActive?: boolean | null;
}

export interface SessionPartner {
  databaseId: number;
  title: string;
  slug: string;
  partnerInformation?: PartnerInformation | null;
  featuredImage?: FeaturedImage | null;
}

/**
 * Partner edge structure from ACF post_object field
 * WPGraphQL for ACF v2.4.1 returns Edge (not Connection)
 * Changed from edges[] to direct node access
 */
export interface PartnerEdge {
  node: SessionPartner;
}

export interface SessionDetails {
  /** Duration in minutes */
  sessionDuration: number;
  /** Maximum capacity per slot */
  sessionCapacity: number;
  /** Price in euros (0 for free events, null if not set) */
  sessionPrice: number | null;
  /** Optional description (ES) */
  sessionDescription: string | null;
  /** Subtitle for hero section (ES) */
  subtitulo: string | null;
  /** WDA-960: Multi-language fields - Catalan */
  tituloCa?: string | null;
  subtituloCa?: string | null;
  sessionDescriptionCa?: string | null;
  /** WDA-960: Multi-language fields - French */
  tituloFr?: string | null;
  subtituloFr?: string | null;
  sessionDescriptionFr?: string | null;
  /** WDA-960: Multi-language fields - English */
  tituloEn?: string | null;
  sessionSubtitleEn?: string | null;
  sessionDescriptionEn?: string | null;
  /** WDA-986: Partner field - optional for legacy pages (open-days) */
  partner?: PartnerEdge | null;
}

/**
 * Extended session details with booking type metadata
 * WDA-974: Adds session type and capacity fields for differentiated flows
 */
export interface ExtendedSessionDetails extends SessionDetails {
  /** Session type determines booking flow */
  sessionType: SessionType;
  /** Number of persons included (for pack/voucher types) */
  includedPersons: number | null;
  /** Whether session uses shared capacity calculation */
  usesSharedCapacity: boolean;
  /** Whether session requires full capacity booking */
  requiresFullCapacity: boolean;
  /** Base session for packs/vouchers (references another session) */
  baseSession?: {
    id: number;
    title: string;
  } | null;
}

/**
 * GraphQL response wrapper for session query
 * Note: Uses "session" (not "saunaSession") based on actual GraphQL schema
 */
export interface SessionResponse {
  session: SaunaSession | null;
}

/**
 * GraphQL response wrapper for partner query
 * WDA-986: Added for two-query pattern
 */
export interface PartnerResponse {
  partner: SessionPartner | null;
}

// =============================================================================
// AVAILABILITY - DATES
// =============================================================================

/**
 * Date availability for calendar display
 * GraphQL query: sauwaAvailableDates
 * Note: Uses camelCase as per GraphQL schema (hasSlots, slotCount)
 */
export interface DateAvailability {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Whether date has any available slots */
  hasSlots: boolean;
  /** Number of available slots on this date */
  slotCount: number;
}

/**
 * GraphQL response wrapper for available dates query
 */
export interface AvailableDatesResponse {
  sauwaAvailableDates: DateAvailability[];
}

// =============================================================================
// AVAILABILITY - TIME SLOTS
// =============================================================================

/**
 * Time slot status
 */
export type SlotStatus = 'available' | 'full' | 'closed';

/**
 * Capacity information for a time slot
 */
export interface SlotCapacity {
  /** Current number of bookings */
  current: number;
  /** Minimum required for session to run */
  minimum: number;
  /** Maximum allowed */
  maximum: number;
  /** Spots still available */
  available: number;
}

/**
 * Individual time slot
 * GraphQL query: sauwaSessionAvailabilityByDate.slots
 * Note: Uses camelCase as per GraphQL schema
 */
export interface TimeSlot {
  /** Start time in HH:MM:SS format */
  startTime: string;
  /** End time in HH:MM:SS format */
  endTime: string;
  /** Duration in minutes */
  duration: number;
  /** Slot status */
  status: SlotStatus;
  /** Whether slot can be booked */
  bookable: boolean;
  /** Capacity details */
  capacity: SlotCapacity;
}

/**
 * Session info returned with day availability
 */
export interface DaySessionInfo {
  id: number;
  title: string;
  duration: number;
}

/**
 * Full day availability response
 * GraphQL query: sauwaSessionAvailabilityByDate
 * Note: Uses camelCase as per GraphQL schema
 */
export interface DayAvailability {
  session: DaySessionInfo;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Whether any slots are available */
  hasAvailability: boolean;
  /** List of time slots */
  slots: TimeSlot[];
}

/**
 * GraphQL response wrapper for day slots query
 */
export interface DayAvailabilityResponse {
  sauwaSessionAvailabilityByDate: DayAvailability;
}

// =============================================================================
// BOOKING - CREATE
// =============================================================================

/**
 * Attendee consents for booking
 */
export interface AttendeeConsents {
  /** Accept privacy policy */
  privacy: boolean;
  /** Accept terms and conditions */
  terms: boolean;
  /** Accept health declaration */
  health: boolean;
  /** Accept marketing communications (optional) */
  marketing?: boolean;
}

/**
 * Individual attendee for booking
 */
export interface BookingAttendee {
  /** Attendee full name */
  name: string;
  /** Attendee email (required) */
  email: string;
  /** Attendee consents */
  consents: AttendeeConsents;
}

/**
 * Request payload for creating a booking
 * REST API: POST /wp-json/sauwa/v1/book
 * WDA-941: Added language field for multi-language email support
 */
export interface CreateBookingRequest {
  /** Session post ID */
  session_id: number;
  /** Date in YYYY-MM-DD format (empty for voucher purchases) */
  slot_date: string;
  /** Time in HH:MM format (empty for voucher purchases) */
  slot_time: string;
  /** Array of attendees with name and optional email */
  attendees: BookingAttendee[];
  /** Customer full name */
  customer_name: string;
  /** Customer email */
  customer_email: string;
  /** Customer phone (optional) */
  customer_phone?: string;
  /** Additional notes (optional) */
  notes?: string;
  /** Language for confirmation emails (ES, CA, EN, FR) - WDA-941 */
  language?: string;
  /** WDA-1003: Flag indicating this is a voucher purchase (no date/time selection needed) */
  is_voucher_purchase?: boolean;
}

/**
 * Response from booking creation
 * REST API response
 * WDA-1003: Added voucher_codes for voucher purchases
 */
export interface CreateBookingResponse {
  success: boolean;
  booking_id?: number;
  booking_number?: string;
  total_amount?: number;
  message?: string;
  error?: string;
  /** WDA-1003: Generated voucher codes for voucher session types */
  voucher_codes?: string[];
}

// =============================================================================
// UI STATE
// =============================================================================

/**
 * Booking widget state for UI management
 */
export interface BookingWidgetState {
  /** Currently selected date */
  selectedDate: string | null;
  /** Currently selected time slot */
  selectedSlot: TimeSlot | null;
  /** Number of attendees */
  attendees: number;
  /** Loading states */
  loading: {
    dates: boolean;
    slots: boolean;
    booking: boolean;
  };
  /** Error message if any */
  error: string | null;
  /** Step in booking flow */
  step: 'date' | 'time' | 'form' | 'confirmation';
}

/**
 * Customer form data
 */
export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

// =============================================================================
// QUERY VARIABLES
// =============================================================================

/**
 * Variables for getAvailableDates query
 */
export interface AvailableDatesVariables {
  sessionId: number;
  startDate: string;
  endDate: string;
}

/**
 * Variables for getDaySlots query
 */
export interface DaySlotsVariables {
  sessionId: number;
  date: string;
}

// =============================================================================
// VOUCHER REDEMPTION - WDA-975
// =============================================================================

/**
 * Voucher error types
 */
export type VoucherError = 'invalid' | 'redeemed' | 'expired' | 'no_slots';

/**
 * Voucher validation response
 * REST API: POST /wp-json/sauwa/v1/vouchers/validate
 */
export interface VoucherValidationResponse {
  valid: boolean;
  error?: VoucherError;
  voucher?: {
    code: string;
    status: 'active' | 'redeemed' | 'expired';
    expiresAt: string;
    redeemedAt?: string;
    baseSession: {
      id: number;
      title: string;
    };
    includedPersons: number;
  };
}

/**
 * Attendee data for voucher redemption
 */
export interface VoucherAttendee {
  name: string;
  email: string;
  dni?: string;
}

/**
 * Consents for voucher redemption
 */
export interface VoucherConsents {
  privacy: boolean;
  terms: boolean;
}

/**
 * Voucher redemption request
 * REST API: POST /wp-json/sauwa/v1/vouchers/redeem
 */
export interface VoucherRedemptionRequest {
  code: string;
  slot_date: string;
  slot_time: string;
  attendee: VoucherAttendee;
  consents: VoucherConsents;
  language: string;
}

/**
 * Voucher redemption response
 */
export interface VoucherRedemptionResponse {
  success: boolean;
  booking_id?: number;
  booking_number?: string;
  ticket_url?: string;
  error?: string;
}

// =============================================================================
// GIFT PURCHASE & REDEMPTION - WDA-1033
// =============================================================================

/**
 * Delivery option for gift purchases
 * - immediate: Send gift email immediately upon purchase
 * - scheduled: Send gift email on a specific date and time
 * - no_send: Don't send to recipient, buyer will deliver personally
 */
export type DeliveryOption = 'immediate' | 'scheduled' | 'no_send';

/**
 * Gift recipient information for gift purchases
 */
export interface GiftRecipient {
  name: string;
  email: string;
}

/**
 * Request payload for creating a gift purchase
 * Similar to CreateBookingRequest but with recipient info
 * REST API: POST /wp-json/sauwa/v1/book (with is_gift_purchase: true)
 */
export interface CreateGiftRequest extends Omit<CreateBookingRequest, 'slot_date' | 'slot_time' | 'attendees'> {
  /** Flag indicating this is a gift purchase */
  is_gift_purchase: true;
  /** Recipient information */
  recipient: GiftRecipient;
  /** Optional personalized message for the recipient */
  gift_message?: string;
  /** Delivery option: immediate, scheduled, or no_send */
  delivery_option: DeliveryOption;
  /** Optional scheduled delivery date (YYYY-MM-DD) - only for 'scheduled' option */
  delivery_date?: string;
  /** Optional scheduled delivery time (HH:MM) - only for 'scheduled' option */
  delivery_time?: string;
  /** Optional buyer notes (additional notes from buyer) */
  buyer_notes?: string;
}

/**
 * Response from gift purchase creation
 */
export interface CreateGiftResponse {
  success: boolean;
  booking_id?: number;
  booking_number?: string;
  /** Generated gift code (format: GIFT-YYYY-XXXXXX-ZZZZ) */
  gift_code?: string;
  message?: string;
  error?: string;
}

/**
 * Gift validation response
 * REST API: POST /wp-json/sauwa/v1/gifts/validate
 */
export interface GiftValidationResponse {
  valid: boolean;
  reason?: string;
  gift?: {
    giftCode: string;
    recipientName: string;
    expiresAt: string;
    /** Number of persons included in the gift */
    includedPersons: number;
    /** Status of the gift */
    status: 'active' | 'redeemed' | 'expired';
    redeemedAt?: string;
  };
  /** Session info for the gift (matches backend REST response) */
  session?: {
    id: number;
    title: string;
    duration: number;
  };
}

/**
 * Request payload for redeeming a gift
 * Similar to VoucherRedemptionRequest but supports N attendees
 * REST API: POST /wp-json/sauwa/v1/gifts/redeem
 */
export interface GiftRedemptionRequest {
  /** Gift code (format: GIFT-YYYY-XXXXXX-ZZZZ) */
  code: string;
  /** Selected date (YYYY-MM-DD) */
  slot_date: string;
  /** Selected time (HH:MM) */
  slot_time: string;
  /** Array of N attendees (N = includedPersons from gift) */
  attendees: VoucherAttendee[];
  /** Consents */
  consents: VoucherConsents;
  /** Language for confirmation emails */
  language: string;
}

/**
 * Response from gift redemption
 */
export interface GiftRedemptionResponse {
  success: boolean;
  booking_id?: number;
  booking_number?: string;
  ticket_url?: string;
  error?: string;
}
