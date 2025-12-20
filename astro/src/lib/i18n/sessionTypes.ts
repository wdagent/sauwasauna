/**
 * WDA-998: Traducciones para tipos de sesión en página de partner
 * Secciones: single, pack, voucher, gift, private
 * Idiomas: ES, CA, EN, FR
 * WDA-1033: Added gift session type
 */

import type { SessionType } from '../sessions-queries';

export type Locale = 'es' | 'ca' | 'en' | 'fr';

export interface SessionTypeSectionContent {
  title: string;
  subtitle: string;
}

export interface SessionTypeCardContent {
  people: string;
  person: string;
  sessions: string;
  session: string;
  validFor: string;
  months: string;
  month: string;
  exclusive: string;
  perPerson: string;
  fixedPrice: string;
}

export interface SessionTypesI18n {
  sections: Record<SessionType, SessionTypeSectionContent>;
  card: SessionTypeCardContent;
}

/**
 * Traducciones de secciones y cards por tipo de sesión
 */
export const sessionTypesContent: Record<Locale, SessionTypesI18n> = {
  es: {
    sections: {
      single: {
        title: 'SESIONES INDIVIDUALES',
        subtitle: 'Precio por persona',
      },
      pack: {
        title: 'PACKS GRUPALES',
        subtitle: 'Precio fijo para el grupo',
      },
      voucher: {
        title: 'BONOS',
        subtitle: 'Compra ahora, canjea cuando quieras',
      },
      gift: {
        title: 'TARJETAS REGALO',
        subtitle: 'Regala una experiencia única',
      },
      private: {
        title: 'SESIONES PRIVADAS',
        subtitle: 'Sauna en exclusiva',
      },
    },
    card: {
      people: 'personas',
      person: 'persona',
      sessions: 'sesiones',
      session: 'sesión',
      validFor: 'Válido',
      months: 'meses',
      month: 'mes',
      exclusive: 'Uso exclusivo',
      perPerson: 'por persona',
      fixedPrice: 'precio fijo',
    },
  },
  ca: {
    sections: {
      single: {
        title: 'SESSIONS INDIVIDUALS',
        subtitle: 'Preu per persona',
      },
      pack: {
        title: 'PACKS GRUPALS',
        subtitle: 'Preu fix per al grup',
      },
      voucher: {
        title: 'BONS',
        subtitle: 'Compra ara, bescanvia quan vulguis',
      },
      gift: {
        title: 'TARGETES REGAL',
        subtitle: 'Regala una experiència única',
      },
      private: {
        title: 'SESSIONS PRIVADES',
        subtitle: 'Sauna en exclusiva',
      },
    },
    card: {
      people: 'persones',
      person: 'persona',
      sessions: 'sessions',
      session: 'sessió',
      validFor: 'Vàlid',
      months: 'mesos',
      month: 'mes',
      exclusive: 'Ús exclusiu',
      perPerson: 'per persona',
      fixedPrice: 'preu fix',
    },
  },
  en: {
    sections: {
      single: {
        title: 'INDIVIDUAL SESSIONS',
        subtitle: 'Price per person',
      },
      pack: {
        title: 'GROUP PACKS',
        subtitle: 'Fixed price for the group',
      },
      voucher: {
        title: 'VOUCHERS',
        subtitle: 'Buy now, redeem anytime',
      },
      gift: {
        title: 'GIFT CARDS',
        subtitle: 'Give a unique experience',
      },
      private: {
        title: 'PRIVATE SESSIONS',
        subtitle: 'Exclusive sauna use',
      },
    },
    card: {
      people: 'people',
      person: 'person',
      sessions: 'sessions',
      session: 'session',
      validFor: 'Valid for',
      months: 'months',
      month: 'month',
      exclusive: 'Exclusive use',
      perPerson: 'per person',
      fixedPrice: 'fixed price',
    },
  },
  fr: {
    sections: {
      single: {
        title: 'SÉANCES INDIVIDUELLES',
        subtitle: 'Prix par personne',
      },
      pack: {
        title: 'PACKS GROUPES',
        subtitle: 'Prix fixe pour le groupe',
      },
      voucher: {
        title: 'BONS',
        subtitle: 'Achetez maintenant, utilisez quand vous voulez',
      },
      gift: {
        title: 'CARTES CADEAU',
        subtitle: 'Offrez une expérience unique',
      },
      private: {
        title: 'SÉANCES PRIVÉES',
        subtitle: 'Sauna en exclusivité',
      },
    },
    card: {
      people: 'personnes',
      person: 'personne',
      sessions: 'séances',
      session: 'séance',
      validFor: 'Valide',
      months: 'mois',
      month: 'mois',
      exclusive: 'Usage exclusif',
      perPerson: 'par personne',
      fixedPrice: 'prix fixe',
    },
  },
};

/**
 * Get session types translations for a locale
 */
export function getSessionTypesI18n(locale: Locale): SessionTypesI18n {
  return sessionTypesContent[locale] || sessionTypesContent.es;
}

/**
 * Get section content for a specific session type
 */
export function getSectionContent(
  locale: Locale,
  type: SessionType
): SessionTypeSectionContent {
  const content = sessionTypesContent[locale] || sessionTypesContent.es;
  return content.sections[type];
}

/**
 * Get card translations for a locale
 */
export function getCardContent(locale: Locale): SessionTypeCardContent {
  const content = sessionTypesContent[locale] || sessionTypesContent.es;
  return content.card;
}
