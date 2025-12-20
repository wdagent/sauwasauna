/**
 * Dynamic Content Renderers
 * WDA-990: Functions for updating DOM with fresh content
 *
 * These renderers handle the client-side DOM updates when
 * dynamic content is loaded or changed. They work with the
 * DynamicContent.astro component's data attributes.
 */

import type {
  SessionData,
  PartnerData,
  PublicSessionData,
  BlogPostData,
  Locale,
} from './dynamic-content-client';

import {
  getLocalizedSessionTitle,
  getLocalizedSessionSubtitle,
  getLocalizedSessionDescription,
} from './dynamic-content-client';

// Session types for grouping
// WDA-1033: Added 'gift' session type
type SessionType = 'single' | 'pack' | 'voucher' | 'private' | 'gift';

// i18n content for session type sections
const sessionTypesContent: Record<Locale, {
  sections: Record<SessionType, { title: string; subtitle: string }>;
  card: {
    people: string;
    person: string;
    sessions: string;
    session: string;
    validFor: string;
    months: string;
    month: string;
    exclusive: string;
  };
}> = {
  es: {
    sections: {
      single: { title: 'SESIONES INDIVIDUALES', subtitle: 'Precio por persona' },
      pack: { title: 'PACKS GRUPALES', subtitle: 'Precio fijo para el grupo' },
      voucher: { title: 'BONOS', subtitle: 'Compra ahora, canjea cuando quieras' },
      gift: { title: 'TARJETAS REGALO', subtitle: 'Regala una experiencia única' },
      private: { title: 'SESIONES PRIVADAS', subtitle: 'Sauna en exclusiva' },
    },
    card: {
      people: 'personas', person: 'persona', sessions: 'sesiones', session: 'sesión',
      validFor: 'Válido', months: 'meses', month: 'mes', exclusive: 'Uso exclusivo',
    },
  },
  ca: {
    sections: {
      single: { title: 'SESSIONS INDIVIDUALS', subtitle: 'Preu per persona' },
      pack: { title: 'PACKS GRUPALS', subtitle: 'Preu fix per al grup' },
      voucher: { title: 'BONS', subtitle: 'Compra ara, bescanvia quan vulguis' },
      gift: { title: 'TARGETES REGAL', subtitle: 'Regala una experiència única' },
      private: { title: 'SESSIONS PRIVADES', subtitle: 'Sauna en exclusiva' },
    },
    card: {
      people: 'persones', person: 'persona', sessions: 'sessions', session: 'sessió',
      validFor: 'Vàlid', months: 'mesos', month: 'mes', exclusive: 'Ús exclusiu',
    },
  },
  en: {
    sections: {
      single: { title: 'INDIVIDUAL SESSIONS', subtitle: 'Price per person' },
      pack: { title: 'GROUP PACKS', subtitle: 'Fixed price for the group' },
      voucher: { title: 'VOUCHERS', subtitle: 'Buy now, redeem anytime' },
      gift: { title: 'GIFT CARDS', subtitle: 'Give a unique experience' },
      private: { title: 'PRIVATE SESSIONS', subtitle: 'Exclusive sauna use' },
    },
    card: {
      people: 'people', person: 'person', sessions: 'sessions', session: 'session',
      validFor: 'Valid for', months: 'months', month: 'month', exclusive: 'Exclusive use',
    },
  },
  fr: {
    sections: {
      single: { title: 'SÉANCES INDIVIDUELLES', subtitle: 'Prix par personne' },
      pack: { title: 'PACKS GROUPES', subtitle: 'Prix fixe pour le groupe' },
      voucher: { title: 'BONS', subtitle: 'Achetez maintenant, utilisez quand vous voulez' },
      gift: { title: 'CARTES CADEAU', subtitle: 'Offrez une expérience unique' },
      private: { title: 'SÉANCES PRIVÉES', subtitle: 'Sauna en exclusivité' },
    },
    card: {
      people: 'personnes', person: 'personne', sessions: 'séances', session: 'séance',
      validFor: 'Valide', months: 'mois', month: 'mois', exclusive: 'Usage exclusif',
    },
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const SELECTORS = {
  // Partner page selectors
  PARTNER_TITLE: '[data-dynamic="partner-title"]',
  PARTNER_ADDRESS: '[data-dynamic="partner-address"]',
  PARTNER_PHONE: '[data-dynamic="partner-phone"]',
  PARTNER_EMAIL: '[data-dynamic="partner-email"]',
  PARTNER_WEB: '[data-dynamic="partner-web"]',
  PARTNER_LOGO: '[data-dynamic="partner-logo"]',
  PARTNER_HERO: '[data-dynamic="partner-hero"]',

  // Session page selectors
  SESSION_TITLE: '[data-dynamic="session-title"]',
  SESSION_SUBTITLE: '[data-dynamic="session-subtitle"]',
  SESSION_DESCRIPTION: '[data-dynamic="session-description"]',
  SESSION_DURATION: '[data-dynamic="session-duration"]',
  SESSION_CAPACITY: '[data-dynamic="session-capacity"]',
  SESSION_PRICE: '[data-dynamic="session-price"]',
  SESSION_IMAGE: '[data-dynamic="session-image"]',

  // Session list selectors
  SESSIONS_CONTAINER: '[data-dynamic="sessions-list"]',
  SESSION_CARD: '[data-dynamic="session-card"]',

  // Loading states
  SKELETON: '[data-skeleton]',
  CONTENT: '[data-content]',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely update text content of an element
 */
function updateText(
  container: Element,
  selector: string,
  value: string | undefined
): void {
  const element = container.querySelector(selector);
  if (element && value !== undefined) {
    element.textContent = value;
  }
}

/**
 * Safely update href attribute of a link
 */
function updateHref(
  container: Element,
  selector: string,
  value: string | undefined
): void {
  const element = container.querySelector(selector) as HTMLAnchorElement | null;
  if (element && value !== undefined) {
    element.href = value;
  }
}

/**
 * Safely update image src and alt
 */
function updateImage(
  container: Element,
  selector: string,
  src: string | undefined,
  alt: string = ''
): void {
  const element = container.querySelector(selector) as HTMLImageElement | null;
  if (element && src) {
    element.src = src;
    element.alt = alt;
  }
}

/**
 * Safely update HTML content (use with caution - only for trusted content)
 */
function updateHtml(
  container: Element,
  selector: string,
  html: string | undefined
): void {
  const element = container.querySelector(selector);
  if (element && html !== undefined) {
    element.innerHTML = html;
  }
}

/**
 * Show content and hide skeleton
 */
function showContent(container: Element): void {
  const skeleton = container.querySelector(SELECTORS.SKELETON);
  const content = container.querySelector(SELECTORS.CONTENT);

  if (skeleton) {
    skeleton.classList.add('hidden');
  }
  if (content) {
    content.classList.remove('hidden');
  }
}

/**
 * Show skeleton and hide content
 */
function showSkeleton(container: Element): void {
  const skeleton = container.querySelector(SELECTORS.SKELETON);
  const content = container.querySelector(SELECTORS.CONTENT);

  if (skeleton) {
    skeleton.classList.remove('hidden');
  }
  if (content) {
    content.classList.add('hidden');
  }
}

// ============================================================================
// PARTNER RENDERERS
// ============================================================================

/**
 * Render partner data into the DOM
 */
export function renderPartner(
  container: Element,
  partner: PartnerData,
  _locale: Locale
): void {
  // Update partner info
  updateText(container, SELECTORS.PARTNER_TITLE, partner.title);
  updateText(container, SELECTORS.PARTNER_ADDRESS, partner.address);
  updateText(container, SELECTORS.PARTNER_PHONE, partner.phone);
  updateText(container, SELECTORS.PARTNER_EMAIL, partner.email);

  // Update links
  if (partner.address) {
    const addressUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.address)}`;
    updateHref(container, `${SELECTORS.PARTNER_ADDRESS}`, addressUrl);
  }

  if (partner.phone) {
    updateHref(container, SELECTORS.PARTNER_PHONE, `tel:${partner.phone}`);
  }

  if (partner.email) {
    updateHref(container, SELECTORS.PARTNER_EMAIL, `mailto:${partner.email}`);
  }

  if (partner.web) {
    updateHref(container, SELECTORS.PARTNER_WEB, partner.web);
    // Extract hostname for display
    try {
      const hostname = new URL(partner.web).hostname.replace('www.', '');
      updateText(container, SELECTORS.PARTNER_WEB, hostname);
    } catch {
      updateText(container, SELECTORS.PARTNER_WEB, partner.web);
    }
  }

  // Update images
  if (partner.featuredImage) {
    updateImage(
      container,
      SELECTORS.PARTNER_LOGO,
      partner.featuredImage.sourceUrl,
      partner.featuredImage.altText || partner.title
    );
  }

  if (partner.heroImage) {
    updateImage(container, SELECTORS.PARTNER_HERO, partner.heroImage, partner.title);
  }

  // Show content
  showContent(container);
}

// ============================================================================
// SESSION RENDERERS
// ============================================================================

/**
 * Render session data into the DOM
 */
export function renderSession(
  container: Element,
  session: SessionData,
  locale: Locale
): void {
  // Get localized content
  const title = getLocalizedSessionTitle(session, locale);
  const subtitle = getLocalizedSessionSubtitle(session, locale);
  const description = getLocalizedSessionDescription(session, locale);

  // Update session info
  updateText(container, SELECTORS.SESSION_TITLE, title);
  updateText(container, SELECTORS.SESSION_SUBTITLE, subtitle);
  updateHtml(container, SELECTORS.SESSION_DESCRIPTION, description);
  updateText(container, SELECTORS.SESSION_DURATION, `${session.duration} min`);
  updateText(container, SELECTORS.SESSION_CAPACITY, String(session.capacity));
  updateText(container, SELECTORS.SESSION_PRICE, `${session.price}`);

  // Update image
  if (session.featuredImage) {
    updateImage(
      container,
      SELECTORS.SESSION_IMAGE,
      session.featuredImage.sourceUrl,
      session.featuredImage.altText || title
    );
  }

  // Show content
  showContent(container);
}

// ============================================================================
// SESSION LIST RENDERERS
// ============================================================================

/**
 * i18n labels for session cards
 */
const SESSION_CARD_LABELS: Record<Locale, { people: string; minutes: string }> = {
  es: { people: 'personas', minutes: 'min' },
  ca: { people: 'persones', minutes: 'min' },
  en: { people: 'people', minutes: 'min' },
  fr: { people: 'personnes', minutes: 'min' },
};

/**
 * Create session card HTML
 */
function createSessionCardHtml(
  session: SessionData | PublicSessionData,
  locale: Locale,
  partnerSlug: string
): string {
  const labels = SESSION_CARD_LABELS[locale];

  // Get localized title based on session type
  let title: string;
  let subtitle: string = '';
  let duration: number = 90;
  let capacity: number;
  let price: number;

  if ('localizedTitle' in session) {
    // SessionData type
    title = getLocalizedSessionTitle(session, locale);
    subtitle = getLocalizedSessionSubtitle(session, locale);
    duration = session.duration;
    capacity = session.capacity;
    price = session.price;
  } else {
    // PublicSessionData type
    title = session.title;
    capacity = session.capacity;
    price = session.price;
  }

  const sessionUrl = `/${locale}/${partnerSlug}/${session.slug}/`;
  const imageUrl = session.featuredImage?.sourceUrl || '';
  const imageAlt = session.featuredImage?.altText || title;

  return `
    <article class="session-card" data-dynamic="session-card" data-session-id="${session.databaseId}">
      <a href="${sessionUrl}" class="session-card__link">
        ${imageUrl ? `
          <div class="session-card__image">
            <img
              src="${imageUrl}"
              alt="${imageAlt}"
              loading="lazy"
              width="400"
              height="240"
            />
          </div>
        ` : ''}
        <div class="session-card__content">
          <h3 class="session-card__title">${title}</h3>
          ${subtitle ? `<p class="session-card__subtitle">${subtitle}</p>` : ''}

          <div class="session-card__meta">
            <span class="session-card__meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              ${duration} ${labels.minutes}
            </span>
            <span class="session-card__meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              ${capacity} ${labels.people}
            </span>
            <span class="session-card__meta-item session-card__price">
              ${price}
            </span>
          </div>
        </div>
      </a>
    </article>
  `;
}

/**
 * Render list of sessions into a container
 */
export function renderSessionsList(
  container: Element,
  sessions: (SessionData | PublicSessionData)[],
  locale: Locale,
  partnerSlug: string
): void {
  const listContainer = container.querySelector(SELECTORS.SESSIONS_CONTAINER);
  if (!listContainer) {
    console.warn('[DynamicRenderer] Sessions container not found');
    return;
  }

  if (sessions.length === 0) {
    // Show no sessions message (already in DOM via SSG)
    showContent(container);
    return;
  }

  // Generate HTML for all session cards
  const cardsHtml = sessions
    .map(session => createSessionCardHtml(session, locale, partnerSlug))
    .join('');

  // Update container
  listContainer.innerHTML = cardsHtml;

  // Show content
  showContent(container);
}

/**
 * Update a single session card in the list (for partial updates)
 */
export function updateSessionCard(
  container: Element,
  session: SessionData | PublicSessionData,
  locale: Locale,
  partnerSlug: string
): void {
  const existingCard = container.querySelector(
    `${SELECTORS.SESSION_CARD}[data-session-id="${session.databaseId}"]`
  );

  if (existingCard) {
    // Replace existing card
    const newCardHtml = createSessionCardHtml(session, locale, partnerSlug);
    existingCard.outerHTML = newCardHtml;
  } else {
    // Add new card to list
    const listContainer = container.querySelector(SELECTORS.SESSIONS_CONTAINER);
    if (listContainer) {
      const newCardHtml = createSessionCardHtml(session, locale, partnerSlug);
      listContainer.insertAdjacentHTML('beforeend', newCardHtml);
    }
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * i18n error messages
 */
const ERROR_MESSAGES: Record<Locale, { title: string; message: string; retry: string }> = {
  es: {
    title: 'Error al cargar',
    message: 'No se pudo cargar el contenido. Por favor, intenta de nuevo.',
    retry: 'Reintentar',
  },
  ca: {
    title: 'Error en carregar',
    message: 'No s\'ha pogut carregar el contingut. Si us plau, torna-ho a provar.',
    retry: 'Reintentar',
  },
  en: {
    title: 'Loading error',
    message: 'Could not load the content. Please try again.',
    retry: 'Retry',
  },
  fr: {
    title: 'Erreur de chargement',
    message: 'Impossible de charger le contenu. Veuillez reessayer.',
    retry: 'Reessayer',
  },
};

/**
 * Show error state in container
 */
export function showError(
  container: Element,
  locale: Locale,
  onRetry?: () => void
): void {
  const messages = ERROR_MESSAGES[locale];

  // Hide skeleton and content
  const skeleton = container.querySelector(SELECTORS.SKELETON);
  const content = container.querySelector(SELECTORS.CONTENT);

  if (skeleton) skeleton.classList.add('hidden');
  if (content) content.classList.add('hidden');

  // Create or update error element
  let errorEl = container.querySelector('[data-error]') as HTMLElement | null;

  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.setAttribute('data-error', '');
    errorEl.className = 'dynamic-error';
    container.appendChild(errorEl);
  }

  errorEl.innerHTML = `
    <div class="dynamic-error__content">
      <h3 class="dynamic-error__title">${messages.title}</h3>
      <p class="dynamic-error__message">${messages.message}</p>
      <button class="dynamic-error__retry" type="button">${messages.retry}</button>
    </div>
  `;

  errorEl.classList.remove('hidden');

  // Attach retry handler
  if (onRetry) {
    const retryBtn = errorEl.querySelector('.dynamic-error__retry');
    retryBtn?.addEventListener('click', () => {
      errorEl?.classList.add('hidden');
      showSkeleton(container);
      onRetry();
    });
  }
}

/**
 * Hide error state
 */
export function hideError(container: Element): void {
  const errorEl = container.querySelector('[data-error]');
  if (errorEl) {
    errorEl.classList.add('hidden');
  }
}

// ============================================================================
// SESSION GROUPING HELPERS (WDA-990 Enhancement)
// ============================================================================

/**
 * Group sessions by type with proper display order
 */
function groupSessionsByType(sessions: PublicSessionData[]): Map<SessionType, PublicSessionData[]> {
  const groups = new Map<SessionType, PublicSessionData[]>();

  // Initialize with empty arrays in display order
  // Order: SINGLE → PACK → VOUCHER (bonos) → GIFT → PRIVATE
  // WDA-1033: Added 'gift' to display order
  const displayOrder: SessionType[] = ['single', 'pack', 'voucher', 'gift', 'private'];
  for (const type of displayOrder) {
    groups.set(type, []);
  }

  // Group sessions
  for (const session of sessions) {
    // Normalize sessionType to lowercase
    const type = ((session.sessionType || 'single').toLowerCase()) as SessionType;
    const group = groups.get(type);
    if (group) {
      group.push(session);
    } else {
      // Handle unexpected types as 'single'
      groups.get('single')!.push(session);
    }
  }

  return groups;
}

/**
 * Generate HTML for a single session card
 * Replicates SessionCard.astro structure
 */
function generateSessionCardHtml(
  session: PublicSessionData,
  type: SessionType,
  locale: Locale,
  partnerSlug: string
): string {
  // Ensure locale is valid
  const validLocale = locale in sessionTypesContent ? locale : 'es';
  const cardContent = sessionTypesContent[validLocale].card;
  const sessionUrl = `/${validLocale}/${partnerSlug}/${session.slug}/`;
  const imageUrl = session.featuredImage?.sourceUrl || '';
  const imageAlt = session.featuredImage?.altText || session.title;

  // Type-specific logic
  const showDuration = type !== 'voucher';
  const showPeople = type === 'pack';
  const showSessions = type === 'voucher';
  const showValidity = type === 'voucher';
  const showExclusive = type === 'private';

  // Extract real data from session
  const duration = session.duration || 90;
  const peopleCount = session.includedPersons || 2;
  const sessionsCount = session.includedPersons || 5; // For vouchers, reusing includedPersons
  const validityMonths = session.voucherValidityMonths || 12;

  const peopleLabel = peopleCount === 1 ? cardContent.person : cardContent.people;
  const sessionsLabel = sessionsCount === 1 ? cardContent.session : cardContent.sessions;
  const monthsLabel = validityMonths === 1 ? cardContent.month : cardContent.months;

  return `
    <article class="session-card session-card--${type}">
      <a href="${sessionUrl}" class="session-card__link">
        ${imageUrl ? `
          <div class="session-card__image">
            <img
              src="${imageUrl}"
              alt="${imageAlt}"
              loading="lazy"
              width="400"
              height="240"
            />
          </div>
        ` : ''}
        <div class="session-card__content">
          <h4 class="session-card__title">${session.title}</h4>

          <div class="session-card__meta">
            ${showDuration ? `
              <span class="session-card__meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${duration} min
              </span>
            ` : ''}

            ${showPeople ? `
              <span class="session-card__meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                ${peopleCount} ${peopleLabel}
              </span>
            ` : ''}

            ${showSessions ? `
              <span class="session-card__meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${sessionsCount} ${sessionsLabel}
              </span>
            ` : ''}

            ${showValidity ? `
              <span class="session-card__meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${cardContent.validFor} ${validityMonths} ${monthsLabel}
              </span>
            ` : ''}

            ${showExclusive ? `
              <span class="session-card__meta-item session-card__meta-item--exclusive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                ${cardContent.exclusive}
              </span>
            ` : ''}

            <span class="session-card__price">
              ${session.price}€
            </span>
          </div>
        </div>
      </a>
    </article>
  `;
}

/**
 * Generate HTML for a session type section
 * Replicates SessionTypeSection.astro structure
 */
function generateSessionTypeSectionHtml(
  type: SessionType,
  sessions: PublicSessionData[],
  locale: Locale,
  partnerSlug: string
): string {
  if (sessions.length === 0) {
    return '';
  }

  // Ensure locale and type are valid
  const validLocale = locale in sessionTypesContent ? locale : 'es';
  const validType = type in sessionTypesContent[validLocale].sections ? type : 'single';

  const sectionContent = sessionTypesContent[validLocale].sections[validType];
  const cardsHtml = sessions
    .map(session => generateSessionCardHtml(session, validType, validLocale, partnerSlug))
    .join('');

  return `
    <section class="session-type-section session-type-section--${validType}">
      <header class="session-type-section__header">
        <p class="section-label section-label--primary">${sectionContent.title}</p>
        <h3 class="section-title">${sectionContent.subtitle}</h3>
      </header>

      <div class="session-type-section__grid">
        ${cardsHtml}
      </div>
    </section>
  `;
}

/**
 * Render grouped sessions list (WDA-990 Enhancement)
 * This function generates HTML matching the SessionTypeSection structure
 */
export function renderGroupedSessions(
  container: Element,
  sessions: PublicSessionData[],
  locale: Locale,
  partnerSlug: string
): void {
  const listContainer = container.querySelector(SELECTORS.SESSIONS_CONTAINER);
  if (!listContainer) {
    console.warn('[DynamicRenderer] Sessions container not found');
    return;
  }

  if (sessions.length === 0) {
    // Show no sessions message (already in DOM via SSG)
    showContent(container);
    return;
  }

  // Group sessions by type
  const grouped = groupSessionsByType(sessions);

  // Generate HTML for each group with proper headers
  const sectionsHtml = Array.from(grouped)
    .map(([type, typeSessions]) =>
      generateSessionTypeSectionHtml(type, typeSessions, locale, partnerSlug)
    )
    .join('');

  // Update container
  listContainer.innerHTML = sectionsHtml;

  // Show content
  showContent(container);
}

// ============================================================================
// BLOG POST RENDERERS (WDA-1032)
// ============================================================================

/**
 * i18n content for blog posts
 */
const blogPostContent: Record<Locale, {
  backToBlog: string;
  share: string;
  readingTime: string;
  breadcrumbHome: string;
  breadcrumbBlog: string;
}> = {
  es: { backToBlog: 'Volver al blog', share: 'Compartir', readingTime: 'min de lectura', breadcrumbHome: 'Inicio', breadcrumbBlog: 'Blog' },
  ca: { backToBlog: 'Tornar al blog', share: 'Compartir', readingTime: 'min de lectura', breadcrumbHome: 'Inici', breadcrumbBlog: 'Blog' },
  en: { backToBlog: 'Back to blog', share: 'Share', readingTime: 'min read', breadcrumbHome: 'Home', breadcrumbBlog: 'Blog' },
  fr: { backToBlog: 'Retour au blog', share: 'Partager', readingTime: 'min de lecture', breadcrumbHome: 'Accueil', breadcrumbBlog: 'Blog' },
};

/**
 * Format date for blog post
 */
function formatBlogDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  const localeMap: Record<Locale, string> = {
    es: 'es-ES',
    ca: 'ca-ES',
    en: 'en-US',
    fr: 'fr-FR',
  };
  return date.toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate reading time from content
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Render blog post into the DOM
 */
export function renderBlogPost(
  container: Element,
  post: BlogPostData,
  locale: Locale
): void {
  const validLocale = locale in blogPostContent ? locale : 'es';
  const content = blogPostContent[validLocale];

  const imageUrl = post.featuredImage?.sourceUrl || '/images/blog/placeholder.jpg';
  const imageAlt = post.featuredImage?.altText || post.title;
  const primaryCategory = post.categories?.[0];
  const formattedDate = formatBlogDate(post.date, validLocale);
  const readingTime = post.content ? calculateReadingTime(post.content) : 5;
  const blogUrl = `/${validLocale}/guia-sauwa-sauna/`;
  const currentUrl = `https://sauwasauna.com/${validLocale}/guia-sauwa-sauna/${post.slug}/`;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(post.title);

  const homeUrl = `/${validLocale}/`;

  const heroHtml = `
    <section class="blog-post-hero" role="banner">
      <div class="hero-background">
        <img src="${imageUrl}" alt="${imageAlt}" class="hero-image" loading="eager" />
        <div class="hero-overlay" aria-hidden="true"></div>
      </div>
      <div class="hero-content">
        ${primaryCategory ? `
          <div class="hero-category">
            <a href="${blogUrl}?category=${primaryCategory.slug}" class="category-badge">
              ${primaryCategory.name}
            </a>
          </div>
        ` : ''}
        <div class="hero-title-wrapper">
          <h1 class="hero-title">${post.title}</h1>
        </div>
        <div class="hero-meta">
          <time datetime="${post.date}" class="meta-date">${formattedDate}</time>
          <span class="meta-separator" aria-hidden="true">•</span>
          <span class="meta-reading-time">${readingTime} ${content.readingTime}</span>
        </div>
        <div class="hero-breadcrumb">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="${homeUrl}" class="breadcrumb-link">${content.breadcrumbHome}</a>
            <span class="breadcrumb-separator" aria-hidden="true">/</span>
            <a href="${blogUrl}" class="breadcrumb-link">${content.breadcrumbBlog}</a>
            <span class="breadcrumb-separator" aria-hidden="true">/</span>
            <span class="breadcrumb-text">${post.title}</span>
          </nav>
        </div>
        <a href="#post-content" class="scroll-indicator" aria-label="Scroll to article content">
          <div class="scroll-icon"></div>
        </a>
      </div>
    </section>
  `;

  const contentHtml = `
    <article id="post-content" class="blog-post-content">
      <div class="content-container">
        <div class="back-to-blog">
          <a href="${blogUrl}" class="back-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${content.backToBlog}
          </a>
        </div>
        <div class="post-content">${post.content || ''}</div>
        <div class="share-section">
          <h3 class="share-title">${content.share}</h3>
          <div class="share-buttons">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-button share-facebook" aria-label="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" class="share-button share-twitter" aria-label="Twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
            <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" class="share-button share-whatsapp" aria-label="WhatsApp">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </article>
  `;

  // Update page title and meta
  document.title = post.seo?.title || `${post.title} | Blog SAUWA`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && post.seo?.metaDesc) {
    metaDesc.setAttribute('content', post.seo.metaDesc);
  }

  // Update container
  container.innerHTML = heroHtml + contentHtml;

  // Show content
  showContent(container);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  showContent,
  showSkeleton,
  SELECTORS,
};
