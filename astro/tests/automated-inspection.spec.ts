/**
 * Automated Visual Inspection + Screenshot Capture
 * Benefits + Blog Section (WDA-266)
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4325';
const SCREENSHOTS_DIR = 'test-results/screenshots';

test.describe('Visual Inspection - Screenshots & Analysis', () => {

  test.beforeAll(() => {
    // Create screenshots directory
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  });

  test('1. Desktop - Full section screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'desktop-full-section.png'),
      fullPage: false,
    });

    // Screenshot of just the section
    const section = page.locator('.benefits-blog-section');
    await section.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'desktop-section-only.png'),
    });
  });

  test('2. Desktop - Sticky column detail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const stickyColumn = page.locator('.sticky-column');
    await stickyColumn.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'desktop-sticky-column.png'),
    });
  });

  test('3. Desktop - Blog cards scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const scrollColumn = page.locator('.scroll-column');
    await scrollColumn.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'desktop-scroll-column.png'),
    });
  });

  test('4. Desktop - Individual blog card hover', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const firstCard = page.locator('.blog-card').first();

    // Normal state
    await firstCard.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'card-normal-state.png'),
    });

    // Hover state
    await firstCard.hover();
    await page.waitForTimeout(500);
    await firstCard.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'card-hover-state.png'),
    });
  });

  test('5. Tablet - Full section', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'tablet-full-section.png'),
      fullPage: false,
    });
  });

  test('6. Mobile - Full section', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile-full-section.png'),
      fullPage: false,
    });

    // Mobile card detail
    const firstCard = page.locator('.blog-card').first();
    await firstCard.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile-card-detail.png'),
    });
  });

  test('7. Accessibility tree snapshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const snapshot = await page.accessibility.snapshot({
      root: (await page.locator('.benefits-blog-section').elementHandle()) ?? undefined,
    });

    // Save to JSON
    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'accessibility-tree.json'),
      JSON.stringify(snapshot, null, 2)
    );
  });

  test('8. Extract computed styles', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();

    const styles = await page.evaluate(() => {
      const section = document.querySelector('.benefits-blog-section');
      const stickyGrid = document.querySelector('.sticky-grid');
      const stickyColumn = document.querySelector('.sticky-column');
      const stickyContent = document.querySelector('.sticky-content');
      const scrollColumn = document.querySelector('.scroll-column');
      const blogCard = document.querySelector('.blog-card');
      const category = document.querySelector('.card-category');

      return {
        section: section ? {
          backgroundColor: window.getComputedStyle(section).backgroundColor,
        } : null,
        stickyGrid: stickyGrid ? {
          display: window.getComputedStyle(stickyGrid).display,
          gridTemplateColumns: window.getComputedStyle(stickyGrid).gridTemplateColumns,
          minHeight: window.getComputedStyle(stickyGrid).minHeight,
        } : null,
        stickyContent: stickyContent ? {
          position: window.getComputedStyle(stickyContent).position,
          top: window.getComputedStyle(stickyContent).top,
          height: window.getComputedStyle(stickyContent).height,
        } : null,
        scrollColumn: scrollColumn ? {
          backgroundColor: window.getComputedStyle(scrollColumn).backgroundColor,
        } : null,
        blogCard: blogCard ? {
          backgroundColor: window.getComputedStyle(blogCard).backgroundColor,
          borderRadius: window.getComputedStyle(blogCard).borderRadius,
          boxShadow: window.getComputedStyle(blogCard).boxShadow,
          transition: window.getComputedStyle(blogCard).transition,
        } : null,
        category: category ? {
          backgroundColor: window.getComputedStyle(category).backgroundColor,
          color: window.getComputedStyle(category).color,
        } : null,
      };
    });

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'computed-styles.json'),
      JSON.stringify(styles, null, 2)
    );

    console.log('Computed Styles:', JSON.stringify(styles, null, 2));
  });

  test('9. Check spacing and typography', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();

    const typography = await page.evaluate(() => {
      const benefitsHeading = document.querySelector('.main-heading');
      const benefitsIntro = document.querySelector('.intro-text');
      const benefitTitle = document.querySelector('.benefit-title');
      const cardTitle = document.querySelector('.card-title');
      const cardExcerpt = document.querySelector('.card-excerpt');
      const category = document.querySelector('.card-category');

      return {
        benefitsHeading: benefitsHeading ? {
          fontFamily: window.getComputedStyle(benefitsHeading).fontFamily,
          fontSize: window.getComputedStyle(benefitsHeading).fontSize,
          fontWeight: window.getComputedStyle(benefitsHeading).fontWeight,
          lineHeight: window.getComputedStyle(benefitsHeading).lineHeight,
          color: window.getComputedStyle(benefitsHeading).color,
        } : null,
        benefitsIntro: benefitsIntro ? {
          fontFamily: window.getComputedStyle(benefitsIntro).fontFamily,
          fontSize: window.getComputedStyle(benefitsIntro).fontSize,
          fontWeight: window.getComputedStyle(benefitsIntro).fontWeight,
          lineHeight: window.getComputedStyle(benefitsIntro).lineHeight,
        } : null,
        cardTitle: cardTitle ? {
          fontFamily: window.getComputedStyle(cardTitle).fontFamily,
          fontSize: window.getComputedStyle(cardTitle).fontSize,
          fontWeight: window.getComputedStyle(cardTitle).fontWeight,
          lineHeight: window.getComputedStyle(cardTitle).lineHeight,
        } : null,
        cardExcerpt: cardExcerpt ? {
          fontFamily: window.getComputedStyle(cardExcerpt).fontFamily,
          fontSize: window.getComputedStyle(cardExcerpt).fontSize,
          fontWeight: window.getComputedStyle(cardExcerpt).fontWeight,
          lineHeight: window.getComputedStyle(cardExcerpt).lineHeight,
        } : null,
        category: category ? {
          fontFamily: window.getComputedStyle(category).fontFamily,
          fontSize: window.getComputedStyle(category).fontSize,
          fontWeight: window.getComputedStyle(category).fontWeight,
          textTransform: window.getComputedStyle(category).textTransform,
          letterSpacing: window.getComputedStyle(category).letterSpacing,
        } : null,
      };
    });

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'typography-analysis.json'),
      JSON.stringify(typography, null, 2)
    );

    console.log('Typography Analysis:', JSON.stringify(typography, null, 2));
  });

  test('10. Measure spacing between elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();

    const spacing = await page.evaluate(() => {
      const benefitsContent = document.querySelector('.benefits-content');
      const blogContainer = document.querySelector('.blog-scroll-container');
      const benefitsList = document.querySelector('.benefits-list');
      const benefitItems = Array.from(document.querySelectorAll('.benefit-item'));

      return {
        benefitsContent: benefitsContent ? {
          padding: window.getComputedStyle(benefitsContent).padding,
        } : null,
        blogContainer: blogContainer ? {
          padding: window.getComputedStyle(blogContainer).padding,
          gap: window.getComputedStyle(blogContainer).gap,
        } : null,
        benefitsList: benefitsList ? {
          marginBottom: window.getComputedStyle(benefitsList).marginBottom,
        } : null,
        benefitItemMargins: benefitItems.slice(0, 3).map(item =>
          window.getComputedStyle(item).marginBottom
        ),
      };
    });

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'spacing-analysis.json'),
      JSON.stringify(spacing, null, 2)
    );

    console.log('Spacing Analysis:', JSON.stringify(spacing, null, 2));
  });

  test('11. Analyze color palette', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();

    const colors = await page.evaluate(() => {
      const seoTitle = document.querySelector('.seo-title');
      const category = document.querySelector('.card-category');
      const ctaLink = document.querySelector('.cta-link');
      const benefitIcon = document.querySelector('.benefit-icon');

      return {
        brandRed_DB4529: {
          seoTitle: seoTitle ? window.getComputedStyle(seoTitle).color : null,
          category: category ? window.getComputedStyle(category).backgroundColor : null,
          benefitIcon: benefitIcon ? window.getComputedStyle(benefitIcon).color : null,
        },
        brandGreen_406E51: {
          ctaLink: ctaLink ? window.getComputedStyle(ctaLink).color : null,
          ctaLinkBorder: ctaLink ? window.getComputedStyle(ctaLink).borderColor : null,
        },
      };
    });

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'color-palette.json'),
      JSON.stringify(colors, null, 2)
    );

    console.log('Color Palette:', JSON.stringify(colors, null, 2));
  });

  test('12. Check all blog cards loaded', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const cardsData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));

      return cards.map((card, index) => {
        const title = card.querySelector('.card-title')?.textContent?.trim() || '';
        const excerpt = card.querySelector('.card-excerpt')?.textContent?.trim() || '';
        const category = card.querySelector('.card-category')?.textContent?.trim() || '';
        const date = card.querySelector('.card-date')?.textContent?.trim() || '';
        const hasImage = !!card.querySelector('.card-image');
        const imageUrl = card.querySelector('.card-image')?.getAttribute('src') || '';
        const link = card.querySelector('.card-title a')?.getAttribute('href') || '';

        return {
          index,
          title,
          excerpt: excerpt.substring(0, 100) + '...',
          category,
          date,
          hasImage,
          imageUrl,
          link,
        };
      });
    });

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'blog-cards-data.json'),
      JSON.stringify(cardsData, null, 2)
    );

    console.log(`Found ${cardsData.length} blog cards`);
    console.log('Blog Cards Data:', JSON.stringify(cardsData, null, 2));
  });

  test('13. Test scroll behavior', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/es`);

    // Scroll to section
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Get initial sticky position
    const initialPosition = await page.locator('.sticky-content').boundingBox();

    // Scroll down within the section
    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });
    await page.waitForTimeout(500);

    // Get position after scroll
    const afterScrollPosition = await page.locator('.sticky-content').boundingBox();

    const scrollData = {
      initialTop: initialPosition?.y || 0,
      afterScrollTop: afterScrollPosition?.y || 0,
      stickyWorking: (initialPosition?.y === afterScrollPosition?.y),
    };

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'scroll-behavior.json'),
      JSON.stringify(scrollData, null, 2)
    );

    console.log('Scroll Behavior:', JSON.stringify(scrollData, null, 2));
  });

  test('14. Create visual regression report', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Capture different states for regression testing
    const states = {
      initial: await page.screenshot({ fullPage: false }),
      afterHover: null as Buffer | null,
      afterScroll: null as Buffer | null,
    };

    // Hover on first card
    await page.locator('.blog-card').first().hover();
    await page.waitForTimeout(500);
    states.afterHover = await page.screenshot({ fullPage: false });

    // Scroll
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
    states.afterScroll = await page.screenshot({ fullPage: false });

    // Save states
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'state-initial.png'), states.initial);
    if (states.afterHover) {
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'state-after-hover.png'), states.afterHover);
    }
    if (states.afterScroll) {
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'state-after-scroll.png'), states.afterScroll);
    }
  });

  test('15. Generate inspection report', async ({ page }) => {
    await page.goto(`${BASE_URL}/es`);
    await page.locator('#beneficios-blog').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const report = {
      timestamp: new Date().toISOString(),
      url: BASE_URL + '/es',
      viewport: await page.viewportSize(),
      section: {
        exists: await page.locator('.benefits-blog-section').isVisible(),
        id: 'beneficios-blog',
      },
      stickyColumn: {
        exists: await page.locator('.sticky-column').isVisible(),
        benefitsCount: await page.locator('.benefit-item').count(),
        hasCtaLink: await page.locator('.cta-link').isVisible(),
      },
      scrollColumn: {
        exists: await page.locator('.scroll-column').isVisible(),
        cardsCount: await page.locator('.blog-card').count(),
        expectedCards: 6,
      },
      issues: [] as string[],
    };

    // Check for issues
    if (report.scrollColumn.cardsCount !== report.scrollColumn.expectedCards) {
      report.issues.push(`Expected 6 blog cards, found ${report.scrollColumn.cardsCount}`);
    }

    if (report.stickyColumn.benefitsCount !== 5) {
      report.issues.push(`Expected 5 benefits, found ${report.stickyColumn.benefitsCount}`);
    }

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'inspection-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('Inspection Report:', JSON.stringify(report, null, 2));

    // Assert no issues
    expect(report.issues.length).toBe(0);
  });
});
