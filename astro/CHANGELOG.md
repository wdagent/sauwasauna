# Changelog

All notable changes to the SAUWA project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2025-12-16

### Added - Blog Infinite Scroll

- **Automatic infinite scroll on blog listing**
  - Replaced "Load More" button with `IntersectionObserver` sentinel
  - Loading spinner + "Cargando artículos..." text when reaching bottom
  - Critical fix: `hasNextPage` was always `false` due to GraphQL pagination not reflecting language-filtered results
  - Solution: Client-side pagination with cached filtered posts per language/category
  - Cursor uses numeric offset for accurate post-filter pagination
  - `prefers-reduced-motion` support for spinner animation
  - Changes in:
    - `src/components/blog/BlogGrid.astro` - Sentinel + Observer
    - `src/lib/blog-queries.ts` - `allFilteredPostsCache` + client-side pagination
  - Verified: 9 initial posts → scroll → 13 total posts loaded automatically

### Fixed - TypeScript Build Errors (160 → 0)

- **Astro 5 Migration Fixes**
  - Added `Props` interface and type casting in dynamic pages (`[partnerSlug]/index.astro`, `[sessionSlug]/index.astro`)
  - Fixed `Astro.params` locale type from `string` to `Locale` union type
  - Added `partner` field to `SessionDetails` interface in `booking/types.ts`

- **Type Export Cleanup**
  - Removed duplicate type exports in `wordpress-complete.ts`
  - Removed non-existent `PartnerConnection` export from `booking/index.ts`
  - Added missing `language` and `translations` fields to `BlogPost` interface

- **Form Components**
  - Fixed `FormData.get()` null safety in `JobApplicationForm.astro` and `PartnerApplicationForm.astro`
  - Changed `FormData` to `globalThis.FormData` for Node.js compatibility
  - Fixed variable collision (`errorMessage` → `errorMsg`) in `BookingWidget.astro` catch block

- **Component Props**
  - Fixed `Layout.astro` locale prop type casting for `NavbarScroll`
  - Fixed `CategoryFilterExample.astro` locale type and `CustomEvent` casting
  - Removed invalid `categories` prop from `CategoryFilter` component usage

- **Test Files**
  - Fixed `elementHandle()` null → undefined conversion in `automated-inspection.spec.ts`
  - Cast elements to `HTMLElement` for `offsetHeight` access in `debug-sticky-layout.spec.ts`

- **Vitest Config**
  - Updated coverage config for Vitest 4.0 (`lines` → `statements` under `thresholds`)

### Fixed - WDA-1032: Dynamic Blog Slug Extraction Bug

- **Critical Fix: Slug extraction from URL path**
  - Fixed JavaScript not receiving slug when using .htaccess internal rewrite
  - Problem: `window.location.search` was empty because browser shows original URL, not rewritten URL
  - Solution: Extract slug from URL path (`/es/guia-sauwa-sauna/{slug}/`) when query string is empty
  - Updated all 4 locale pages: `es/ca/en/fr/dynamic/blog.astro`

### Added - WDA-1032: Dynamic Blog Post Catch-All

- **Dynamic Blog Loading System**
  - Blog posts created in WordPress after Astro build now load dynamically
  - No rebuild required for new blog content to appear
  - Skeleton loading state while fetching content from WordPress API

- **New Files Created**
  - `src/components/core/skeletons/BlogPostSkeleton.astro` - Loading skeleton for blog posts
  - `src/pages/{es,ca,en,fr}/dynamic/blog.astro` - Dynamic blog loader pages (4 locales)

- **GraphQL & Client Updates**
  - `src/lib/dynamic-queries.ts` - Added `GET_ALL_BLOG_SLUGS` and `GET_BLOG_POST_BY_SLUG_DYNAMIC` queries
  - `src/lib/dynamic-content-client.ts` - Added `blogPostSlugExists()` and `fetchBlogPostBySlug()` functions
  - `src/lib/dynamic-renderers.ts` - Added `renderBlogPost()` for client-side blog rendering with i18n support

- **.htaccess Catch-All Rules**
  - Added blog post catch-all: `/es/guia-sauwa-sauna/[slug]/` → `/es/dynamic/blog/?slug=[slug]`
  - Fixed all catch-all rules to use folder paths (`/dynamic/blog/`) instead of `.html` files
  - Corrected session and partner rules for consistency with Astro's output format

- **Bug Fix: RewriteRule Target Format**
  - Changed from `.html` files to directory paths (Astro generates `blog/index.html`, not `blog.html`)
  - Session: `/$1/dynamic/session/?slug=$3&partner=$2`
  - Partner: `/$1/dynamic/partner/?slug=$2`
  - Blog: `/$1/dynamic/blog/?slug=$2`

### Fixed - WDA-1014: Client-Side Hydration Data & Style Fixes

- **Dynamic Query Enhancement**
  - Added missing fields to `GET_PUBLIC_SESSIONS_DYNAMIC` query: `duration`, `includedPersons`, `voucherValidityMonths`, `usesSharedCapacity`, `requiresFullCapacity`
  - Updated `DynamicPublicSession` and `PublicSessionData` interfaces with new fields
  - Fixed `transformPublicSession()` to map all backend fields correctly

- **Real Data Instead of Hardcoded Placeholders**
  - Fixed `generateSessionCardHtml()` to use real session data (`session.duration`, `session.includedPersons`, `session.voucherValidityMonths`)
  - Removed hardcoded placeholders: 90 min → real duration, 2 personas → real included persons, 4 meses → real validity

- **Style Recovery**
  - Copied exact scoped styles from `partners/SessionCard.astro` to `session-card.css`
  - Fixed class names from BEM (`sauwa-session-card`) back to original (`session-card`)
  - Restored original hover effects and visual design

- **Correct Session Type Order**
  - Fixed `groupSessionsByType()` in `dynamic-renderers.ts` to maintain proper display order
  - Order: SINGLE → PACK → VOUCHER (bonos) → PRIVATE
  - Bonos now appear after "Packs Grupales" as intended

- **Files Modified**
  - `src/lib/dynamic-queries.ts` - Complete GraphQL query
  - `src/lib/dynamic-content-client.ts` - Updated interfaces and transformation
  - `src/lib/dynamic-renderers.ts` - Real data usage + correct order
  - `src/styles/components/sessions/session-card.css` - Original styles
  - `src/components/partners/SessionTypeSection.astro` - Fixed class names

### To Do
- Integración con pasarela de pago (Stripe/Redsys)
- Check-in digital con QR
- Asistente IA 24/7
- Panel de gestión completo

## [0.11.0] - 2025-12-08

### Added - Epic WDA-1001: Flujos de Reserva Diferenciados

- **WDA-1002: Flujo Pack**
  - Contador de asistentes fijo (N/N) según `included_persons`
  - Campos de asistente pre-creados al seleccionar slot
  - Botón "Añadir asistente" oculto para packs
  - Validación: todos los nombres de asistente requeridos

- **WDA-1003: Flujo Voucher (Compra)**
  - Visualización de códigos generados en confirmación
  - Sección `.voucher-codes-section` con copy-to-clipboard
  - Integración con `voucher_codes` del backend
  - Traducciones ES/CA/EN/FR

- **WDA-1004: Flujo Private**
  - Solo muestra slots con 100% disponibilidad
  - Estilo visual diferenciado (púrpura)
  - Texto "Uso exclusivo" en lugar de conteo de plazas
  - Estado vacío específico para sesiones privadas

- **WDA-1005: Páginas Voucher Redemption Multi-idioma**
  - `/ca/bescanviar-bo/` - Catalán
  - `/en/redeem-voucher/` - Inglés (actualizado)
  - `/fr/echanger-bon/` - Francés
  - Estructura consistente con página ES existente

- **WDA-1006: Calendario Visual VoucherRedemptionFlow**
  - Navegación mes anterior/siguiente
  - Grid de días con estados de disponibilidad
  - Indicador visual (punto verde) para días disponibles
  - Integración con `getAvailableDates()` API
  - Reemplaza date picker básico

- **WDA-1007: Tests E2E**
  - `e2e-booking-pack.spec.ts` (4 tests)
    - TC-014: Contador fijo de asistentes
    - TC-015: Campos pre-poblados
    - TC-016: Validación de formulario
    - TC-016B: Todos los campos requeridos
  - `e2e-voucher-redemption.spec.ts` (6 tests)
    - TC-017 a TC-022: Validación, calendario, multi-idioma

### Changed
- `BookingWidget.astro`: +400 líneas para flujos Pack/Voucher/Private
- `VoucherRedemptionFlow.astro`: +370 líneas para calendario visual
- `types.ts`: Añadido `voucher_codes?: string[]` a `CreateBookingResponse`

### Tests
- 17 tests E2E pasados (Chromium)
- Cobertura: Single, Pack, Private, Voucher Redemption

## [0.10.0] - 2025-12-08

### Added
- **WDA-990: Sistema de Contenido Dinámico SSG + Client Hydration**
  - Arquitectura híbrida para contenido sin rebuild en hosting estático
  - Nuevo partner/sesión accesible inmediatamente sin rebuild
  - Cambios de contenido visibles en < 5 minutos (cache TTL)
  - SEO no afectado (SSG para crawlers)

- **Core Components**:
  - `src/lib/dynamic-content-client.ts` - Cliente JS con cache 5min, retry logic, change detection via hash
  - `src/lib/dynamic-queries.ts` - Queries GraphQL optimizadas para partners/sessions
  - `src/lib/dynamic-renderers.ts` - Funciones para actualizar DOM selectivamente
  - `src/components/core/DynamicContent.astro` - Wrapper SSG + Client Hydration
  - `src/components/core/DynamicPageLoader.astro` - Loader para catch-all routing
  - `src/components/core/skeletons/PartnerSkeleton.astro` - Skeleton loading partner
  - `src/components/core/skeletons/SessionSkeleton.astro` - Skeleton loading session

- **Catch-All Routing**:
  - `src/pages/[locale]/dynamic/partner.astro` - Carga partners nuevos sin rebuild (4 idiomas)
  - `src/pages/[locale]/dynamic/session.astro` - Carga sessions nuevas sin rebuild (4 idiomas)
  - `src/pages/404.astro` - Página 404 mejorada con i18n
  - `public/.htaccess` - Reglas de rewrite para redirigir URLs no existentes

### Changed
- **Partner Page Migration** (`src/pages/[locale]/[partnerSlug]/index.astro`):
  - Envuelto con `DynamicContent` wrapper
  - Atributos `data-dynamic` para actualización selectiva de DOM
  - Hash de contenido para change detection

- **Session Page Migration** (`src/pages/[locale]/[partnerSlug]/[sessionSlug]/index.astro`):
  - Envuelto con `DynamicContent` wrapper
  - Atributos `data-dynamic` para actualización selectiva de DOM
  - Hash de contenido para change detection

### Technical
- **Arquitectura**:
  ```
  BUILD TIME (SSG):
  ├── Páginas con datos iniciales de WordPress
  ├── Script de hidratación incluido
  └── Hash de contenido para change detection

  RUNTIME (Browser):
  ├── Mostrar SSG inmediatamente (SEO ✓)
  ├── Fetch datos frescos de GraphQL
  ├── Comparar hash → Actualizar si cambió
  └── Cache 5 min en cliente

  CATCH-ALL (URLs nuevas):
  ├── .htaccess rewrite → /dynamic/
  └── Validar slug → Cargar o 404
  ```

- **Features implementados**:
  - Cache de 5 minutos con TTL
  - Retry logic (2 intentos con 1s delay)
  - Change detection via hash comparison
  - Event system para debugging (`content:loading`, `content:loaded`, etc.)
  - Soporte View Transitions API de Astro
  - URL cleanup con `history.replaceState`

- **Archivos creados**: 16 nuevos
- **Archivos modificados**: 3
- **Build**: 147 páginas en ~26s

### Known Issues (WDA-910, WDA-911, WDA-912, WDA-913)
- Email de asistentes adicionales debería ser opcional (WDA-910)
- Cálculo de capacidad no cuenta el contacto principal (WDA-911)
- Mensajes de error del backend en inglés sin traducir (WDA-912)
- Contador de asistentes incorrecto en confirmación (WDA-913)

## [0.9.0] - 2025-12-05

### Added
- **WDA-962: GraphQL Backend for Slug-based Queries**
  - DataLoader pattern implementado para optimizar N+1 queries en relaciones partner↔sessions
  - 4 nuevas queries slug-based: `sauwaPartnerBySlug`, `sauwaSessionBySlug`, `sauwaAllPartnerSlugs`, `sauwaAllSessionPaths`
  - Campo `slug` agregado a tipos GraphQL `SauwaSession` y `SauwaPartner`
  - Archivos: `sessions-queries.ts`, `partners-queries.ts`, interfaces actualizadas

- **WDA-963: Dynamic Routes Implementation**
  - Rutas dinámicas para sesiones: `/[locale]/[partnerSlug]/[sessionSlug]/`
  - Rutas dinámicas para partners: `/[locale]/[partnerSlug]/`
  - `getStaticPaths()` implementado para SSG con soporte multi-idioma (ES, CA, EN, FR)
  - Queries GraphQL actualizados con `partnerInformation`, `featuredImage`, y títulos multi-idioma
  - Archivos: páginas dinámicas de sesión/partner, `sessions-queries.ts`, `sessions.ts` interfaces

- **WDA-965: Partner Hero Image Implementation**
  - Campo ACF `partnerHeroImage` agregado (tipo Image, retorno URL)
  - Componente `PartnerHero.astro` creado con hero image, nombre del partner, y link a dirección
  - Estructura GraphQL: `partnerHeroImage { node { sourceUrl, altText } }`
  - Estilos alineados con patrón `ExclusiveHero` para consistencia de marca
  - Archivos: `PartnerHero.astro`, queries GraphQL de partner, página de detalle

- **Global Multilingual Fallback System**
  - Sistema de fallback centralizado: `src/lib/i18n/fallback.ts`
  - Español (ES) definido como idioma base para todos los fallbacks de campos ACF
  - Función `getLocalizedValue()` implementada para fallback automático a ES cuando traducciones vacías
  - Sistema aplicado a: sesiones, posts de blog, páginas de partners
  - Optimización de query de blog: filtro de idioma eliminado, fallback aplicado en frontend
  - Documentación: `src/lib/i18n/README.md` con especificación de fallback

- **Lapelland Sponsor Integration**
  - Logo SVG de Lapelland creado: `public/logos/lapelland-black.svg`
  - Diseño vectorial con símbolo chevron invertido + texto "LAPELLAND"
  - Agregado al array de sponsors en todas las páginas de sesión
  - Aparece en sección de colaboradores junto con Hotel Coma Bella y Aneto Natural
  - Aplicado automáticamente a los 4 idiomas (ES, CA, EN, FR)

### Fixed
- **GraphQL Type Registration Issues**
  - Tipos no aparecían en schema debido a calls `add_action()` anidadas en constructores
  - Solución: Llamar `register()` directamente en constructores, eliminar hooks anidados
  - 10 archivos de tipos GraphQL afectados (Session, Partner, Inventory, Attendee, Consent, etc.)

- **Partner Page Layout & Styling**
  - Display del logo en navbar corregido (ruta SVG corregida: `sauwa-full-white.svg`)
  - Márgenes de contenedor alineados con patrón de blog (`max-width: 1280px`, `padding: 0 1rem`)
  - Card de información de partner rediseñada: layout horizontal con logo (280px) + grid 2×2 de datos
  - Link de dirección estilizado sin apariencia de botón, icono en color corporativo `var(--color-primary-hover)`

- **Blog Pages Navigation (Multi-language)**
  - Navbar mostrando solo letra "N" roja en lugar de logo completo "SAUWA" corregido
  - `padding-top: 80px` incorrecto eliminado, `variant="dark"` agregado a Breadcrumb
  - CSS duplicado y wrappers de contenedor extra limpiados en páginas CA/EN/FR
  - Archivos: `/ca/guia-sauwa-sauna.astro`, `/en/sauna-guide.astro`, `/fr/guide-sauna.astro`

### Changed
- **Session Detail Pages**
  - Array de sponsors ahora incluye 3 colaboradores: Hotel Coma Bella, Aneto Natural, Lapelland
  - `CollaboratorsSection` renderiza automáticamente todos los logos con estilos consistentes

### Technical
- **Archivos creados**:
  - `public/logos/lapelland-black.svg` - Logo vectorial del sponsor Lapelland
  - `src/lib/i18n/fallback.ts` - Sistema centralizado de fallback multi-idioma
  - `src/lib/i18n/README.md` - Documentación del sistema de fallback
  - `src/components/booking/PartnerHero.astro` - Componente hero para páginas de partner

- **Archivos modificados**:
  - `src/pages/[locale]/[partnerSlug]/[sessionSlug]/index.astro` - Array de sponsors actualizado
  - `src/pages/[locale]/[partnerSlug]/index.astro` - Página dinámica de partner
  - `src/lib/sessions-queries.ts` - Queries slug-based agregadas
  - `src/lib/partners-queries.ts` - Queries de partner actualizadas
  - `src/interfaces/sessions.ts` - Interfaces TypeScript extendidas

## [0.8.2] - 2025-12-04

### Fixed
- **Blog Navbar Logo Display** (Multi-language):
  - Corregido logo que mostraba solo "N" roja en CA/EN/FR blog pages
  - Problema: `padding-top: 80px` empujaba contenido y desalineaba navbar
  - Solución: Sincronizado estructura CSS/HTML entre idiomas
  - Cambios en `/ca/guia-sauwa-sauna.astro`, `/en/guia-sauwa-sauna.astro`, `/fr/guia-sauwa-sauna.astro`:
    - `padding-top: 80px` → `padding-top: 0`
    - Agregado `variant="dark"` a componente Breadcrumb
    - Eliminado contenedor extra `<div class="container">` en CategoryFilter
  - Verificado con Playwright en todas las versiones de idioma

### Added
- **Google Analytics 4 Configuration**:
  - Habilitado GTM en desarrollo con variable `PUBLIC_ENABLE_GTM_IN_DEV=true`
  - Configurada "Etiqueta de Google" (gtag.js) en Google Tag Manager
  - ID de medición: G-S3XC2RKG11
  - Activador: Initialization - All Pages
  - Etiqueta publicada en producción
  - Analytics tracking ahora funcional en `https://sauwasauna.com`

### Changed
- **Archivos modificados**:
  - `.env` - Agregada variable `PUBLIC_ENABLE_GTM_IN_DEV=true` para testing local
  - `src/pages/ca/guia-sauwa-sauna.astro` - Sincronizado con versión ES
  - `src/pages/en/guia-sauwa-sauna.astro` - Sincronizado con versión ES
  - `src/pages/fr/guia-sauwa-sauna.astro` - Sincronizado con versión ES

### Technical Notes
- GTM ya estaba instalado correctamente en el código
- DataLayer enviando eventos correctamente: `pageview`, `gtm.js`, `gtm.dom`, `gtm.load`
- Problema era configuración incompleta en Google Tag Manager (faltaba publicar etiqueta)
- Verificado en producción: GTM script cargando correctamente con ID `GTM-5FJSRXL7`

## [0.8.1] - 2025-11-30

### Fixed
- **Google Analytics Tracking**:
  - GTM ahora se carga correctamente en builds de producción
  - Cambiado de `PUBLIC_ENV` a `import.meta.env.DEV` para detección confiable
  - Fallback `GTM-5FJSRXL7` incluido en Layout.astro para builds sin variables de entorno
  - Analytics tracking funcional en producción manteniendo desarrollo limpio

### Changed
- **Archivos modificados**:
  - `src/layouts/Layout.astro` - Fallback GTM ID hardcoded
  - `src/components/GoogleTagManager.astro` - Usa `import.meta.env.DEV` en lugar de `PUBLIC_ENV`
  - `.env` - Comentario aclaratorio sobre GTM en builds

## [0.8.0] - 2025-11-30

### Added
- **Multi-language Session Fields** (WDA-960):
  - Nuevo helper `getLocalizedSession()` con lógica de fallback automática
  - Soporte para 4 idiomas: ES (base), CA, FR, EN
  - Fallback: Idioma solicitado → Español (si vacío)
  - GraphQL queries actualizados con campos multi-idioma
  - TypeScript interfaces extendidas para soportar campos opcionales por idioma

### Fixed
- **Session Hydration Bug** (WDA-960):
  - Script client-side sobrescribía contenido SSG correcto con campos base en español
  - Ahora usa `getLocalizedSession()` para respetar el idioma de cada página
  - Eliminado flash de contenido en idioma incorrecto

### Changed
- **Session Pages Hydration** (WDA-960):
  - Actualizados scripts de hidratación en 4 páginas (ES, CA, FR, EN)
  - Import de `getLocalizedSession` y `Locale` type
  - Localización aplicada tanto en SSG como en client-side hydration

### Technical
- **Archivos creados**:
  - `src/lib/i18n/sessions.ts` (128 líneas) - Helper de localización
- **Archivos modificados**:
  - `src/lib/booking/queries.ts` - Campos GraphQL multi-idioma
  - `src/lib/booking/types.ts` - Interfaces TypeScript
  - `src/pages/es/puertas-abiertas.astro` - Script hydration
  - `src/pages/ca/portes-obertes.astro` - Script hydration
  - `src/pages/fr/portes-ouvertes.astro` - Script hydration
  - `src/pages/en/open-days.astro` - Script hydration

## [0.7.2] - 2025-11-29

### Added
- **Páginas de Condiciones de Contratación** (4 idiomas):
  - `/es/condiciones-contratacion/`
  - `/ca/condicions-contractacio/`
  - `/en/booking-terms/`
  - `/fr/conditions-reservation/`
- **CollaboratorsSection**: Nuevo componente para mostrar sponsors/colaboradores
- **Imágenes de sponsors**: Nueva carpeta `public/images/sponsors/`

### Fixed
- **Booking Widget - Slot Selection** (WDA-909):
  - Slots con status `BELOW_MINIMUM` ahora son clickables (antes se deshabilitaban)
  - Solo se deshabilitan slots con status `full` o `closed`
- **Booking Widget - Attendees UI**:
  - Estilos CSS corregidos para asistentes dinámicos usando `:global()`
  - Campos de asistente con fondo blanco y tamaño proporcional al formulario
  - Botón "Eliminar" posicionado correctamente en esquina superior derecha
  - Responsive mejorado para mobile

### Changed
- Legal slugs actualizados con nuevas páginas de condiciones de contratación
- Navbar y MobileMenu actualizados

## [0.7.1] - 2025-11-28

### Fixed
- **Booking API Integration** (WDA-909):
  - Fix crítico: payload de reserva ahora envía `attendees` como array de objetos
  - Cada asistente incluye: `name`, `email`, y `consents` (privacy, terms, health)
  - Primer asistente usa email del contacto principal como fallback
  - Corregido error "attendees array is required" del backend
- **Calendar Timezone Fix** (WDA-909):
  - Corregido bug de timezone que mostraba fecha incorrecta al seleccionar día
  - Fechas ahora se parsean manualmente evitando conversión UTC
  - Formato correcto: "martes, 2 de diciembre" en lugar de "lunes, 1 de diciembre"

### Changed
- Tipo `CreateBookingRequest.attendees` cambiado de `number` a `BookingAttendee[]`
- Interface `AttendeeConsents` ahora incluye `terms` y `health` además de `privacy`
- Single checkbox de privacidad implica aceptación de todos los términos requeridos

## [0.7.0] - 2025-11-28

### Added
- **Booking Widget UX Improvements** (WDA-909):
  - Sistema de estados visuales para días del calendario:
    - Verde: días disponibles con indicador de punto
    - Amarillo: días con pocas plazas (≤2 slots)
    - Rojo: días completos
    - Gris: días sin disponibilidad
  - Steps de progreso clickables para navegación hacia atrás
  - Gestión de múltiples asistentes:
    - Sección "Datos de los asistentes" con contador dinámico
    - Badge "Contacto principal" para primer asistente
    - Campos Nombre (obligatorio) + Email (opcional) por asistente
    - Botones añadir/eliminar asistentes
    - Validación y envío de datos en booking
  - Traducciones para 4 idiomas (ES, CA, EN, FR)

### Fixed
- Alineación de steps de progreso en BookingWidget
- CSS scoping para elementos dinámicos usando `:global()`
- Altura mínima de días del calendario para visualización de indicadores

### Changed
- Steps de progreso cambiados de `<div>` a `<button>` para accesibilidad
- Días del calendario con `min-height: 40px` para mejor UX

## [0.6.0] - 2025-11-12

### Added
- **Dynamic SEO System** (WDA-555):
  - Sitemap.xml dinámico con integración WordPress
  - Robots.txt con configuración SEO
  - Proxy PHP para sitemap en hosting compartido
  - Plugin WordPress SAUWA Dynamic Sitemap
  - Documentación completa de arquitectura SEO
- **Dynamic Blog System** (WDA-558):
  - BlogScrollCards con carga dinámica desde WordPress
  - Client-side fetching sin necesidad de rebuild
  - Cache de 5 minutos para optimización
  - Diseño idéntico a producción preservado
  - Patrón reutilizable para otros componentes

### Fixed
- Global styles (`is:global`) para contenido dinámico
- GraphQL type error: `LanguageCodeFilterEnum!` en queries
- Scoped styles no aplicaban a DOM generado dinámicamente

## [0.5.0] - 2025-11-11

### Added
- **Partners Section Updates**:
  - Contenido actualizado para hoteles
  - Safari 18.1 video autoplay fix implementado
- **Hero Section Improvements** (WDA-402):
  - Typography responsive adjustments para laptops
  - Mejor escalado en pantallas medianas

### Changed
- `.gitignore` actualizado para excluir archivos temporales y Playwright MCP

### Fixed
- Video autoplay en Safari 18.1 y posteriores
- Responsive typography en hero section

## [0.4.0] - 2025-11-10

### Added
- **Legal Pages System** (WDA-556):
  - Páginas legales multiidioma con Polylang
  - Integración completa con WordPress GraphQL
  - Política de Privacidad, Términos y Condiciones, Cookies
  - SEO metadata y canonical URLs
- **Benefits Section Enhancement** (WDA-554):
  - SVG icons con width/height explícitos
  - Icon size aumentado a 36px para mejor visibilidad

### Fixed
- Horizontal scroll issues eliminados
- Benefits section icon rendering mejorado
- UI issues en home y blog corregidos

### Changed
- Audio de fuego deshabilitado temporalmente

## [0.3.1] - 2025-11-09

### Added
- **CSS Architecture Overhaul**:
  - Sistema de diseño modular implementado
  - Design tokens centralizados (`design-tokens.css`)
  - Utilities CSS reutilizables (`utilities.css`)
  - Documentación de arquitectura CSS completa
  - Sistema de favicons implementado
- **Blog Rename**: Blog section renombrada a "Guía SAUWA SAUNA"
- **Mobile Optimization** (WDA-294, WDA-531, WDA-535):
  - Márgenes laterales unificados a 20px estándar
  - Sistema de z-index optimizado
  - Espaciado del menú móvil mejorado
  - 5 problemas críticos de mobile resueltos

### Fixed
- Sticky scroll restaurado en sección blog (critical fix)
- Sistema de diseño y márgenes mobile unificados
- Z-index en mobile corregido
- PostCSS @import warnings resueltos
- Image extensions corregidas (.jpg → .webp)
- Scroll horizontal en móvil eliminado (WDA-294)

### Changed
- Font sizes aumentados para mejor legibilidad
- CSS classes unificadas globalmente
- Orden CSS reorganizado para evitar warnings

## [0.3.0] - 2025-10-31

### Added
- **Páginas nuevas** (WDA-315, WDA-320):
  - "Trabaja con nosotros" - página de empleo con formularios completos
  - "Acceso Exclusivo" - página de acceso especial con formularios
- **SEO mejorado**: Imagen OG para redes sociales implementada

### Fixed
- Restaurado sticky positioning en secciones clave
- Unificado background color en blog section para consistencia visual
- Corregido comportamiento de navegación móvil al hacer clic en enlaces

## [0.2.0] - 2025-10-30

### Added
- **Sistema de navegación móvil completo** (WDA-314):
  - Hamburger menu funcional
  - Sidebar responsive con navegación completa
  - Auto-cierre de sidebar al navegar
  - Logos adaptados para diferentes tamaños de pantalla
- **Mejoras UI globales** (WDA-313):
  - Font-weights aplicados consistentemente
  - Sistema de tipografía unificado

### Fixed
- **Home page optimizaciones** (WDA-312):
  - SVG rendering en Safari corregido
  - Espaciado y layout mejorado
  - Tipografía refinada
- Altura del hero en dispositivos móviles
- Posicionamiento del hamburger menu

## [0.1.2] - 2025-10-24

### Changed
- **Reorganización completa de estructura** del proyecto:
  - Separación clara entre `/astro` y `/wp-plugin`
  - Estructura de carpetas más limpia y mantenible
  - Documentación reorganizada

### Added
- Análisis de blog móvil documentado
- Implementación de cookie banner planificada

## [0.1.1] - 2025-10-23

### Added
- **Newsletter unificado** (WDA-99):
  - Componente de formulario newsletter integrado con backend
  - Validación y manejo de errores
  - Integración con WordPress GraphQL

### Fixed
- **Blog móvil mejorado** (WDA-295):
  - Botón "Sesión de SAUWA" ancho completo en móvil
  - Márgenes y espaciados consistentes
  - Jerarquía h1/h2 corregida
  - Gap blanco en navbar eliminado
- Trailing slashes en URLs
- Diseño de blog cards restaurado
- Position sticky funcionando correctamente
- Espaciado móvil en botón "Ver más"

## [0.1.0] - 2025-10-22

### Added
- **Blog section completa** (WDA-298, WDA-272):
  - Carousel de categorías implementado
  - Estilos GUIDELINE aplicados
  - Integración con WordPress para contenido dinámico
- **Footer actualizado** (WDA-268):
  - Enlaces a redes sociales
  - Información de contacto
  - Enlaces legales

### Changed
- Mejoras significativas en versión móvil (WDA-295)

## [0.0.2] - 2025-10-20

### Added
- **Landing page features**:
  - Sección de fases de sesión SAUWA
  - CTA newsletter integrado
  - Cliente GraphQL para WordPress
  - Sección 50/50 imagen + beneficios (WDA-267)
  - Sticky scroll benefits (WDA-266)
  - Blog carousel inicial

## [0.0.1] - 2025-10-19

### Added
- **Landing page multiidioma** (WDA-65):
  - Soporte para ES/CA/EN/FR
  - Detección automática de idioma del navegador
  - Selector manual de idioma
- **Navbar dinámica** (WDA-264):
  - Scroll-down navbar con animaciones
  - Ocultación inteligente de elementos del hero
  - Comportamiento sticky mejorado
- **Hero section**:
  - Diseño responsive
  - Animaciones sutiles
  - CTA prominente

### Fixed
- Renderizado del hero section en todas las páginas

## [0.0.0] - 2025-10-04

### Added
- Configuración inicial del proyecto
- Stack tecnológico:
  - Astro como generador de sitios estáticos (SSG)
  - WordPress Headless con WPGraphQL
  - Tailwind CSS para estilos
  - TypeScript para type safety
- Estructura base del proyecto
- Configuración de entorno de desarrollo

---

## Versiones Planificadas

### [1.0.0] - Meta: Lanzamiento MVP
- Sistema de reservas completo
- Integración de pagos
- Panel de administración funcional
- Todas las páginas traducidas
- Testing E2E completo

### [0.8.0] - Próximo Sprint
- Formulario de contacto funcional
- Mejoras de accesibilidad WCAG 2.1 AA
- Optimización Core Web Vitals
- Performance audits y mejoras Lighthouse
- Cookie consent banner
- Testing E2E del flujo de reservas

## Enlaces

- **Linear Project**: [sauwasauna.com](https://linear.app/wdamanage/project/sauwasaunacom-44379947aed1)
- **WordPress Backend**: [backend.sauwasauna.com](https://backend.sauwasauna.com/)
- **Documentación**: [/docs/GUIDELINE](./docs/GUIDELINE)

## Convenciones de Commit

Este proyecto sigue [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de errores
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan funcionalidad)
- `refactor:` Cambios de código que no corrigen bugs ni añaden features
- `test:` Añadir o corregir tests
- `chore:` Cambios en el proceso de build o herramientas auxiliares

## Autores

- **WDA** - *Desarrollo inicial* - [WDA Manage](https://linear.app/wdamanage)