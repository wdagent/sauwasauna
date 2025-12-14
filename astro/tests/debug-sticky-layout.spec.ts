/**
 * Debug script for sticky layout issue in BenefitsBlogSection
 * WDA-294: Investigating background color and sticky positioning
 */

import { test, expect } from '@playwright/test';

test.describe('BenefitsBlogSection - Sticky Layout Debug', () => {
  test('should inspect sticky layout and background colors', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:4321/es/');

    // Wait for the section to be visible
    await page.waitForSelector('.benefits-blog-section', { timeout: 10000 });

    console.log('\n========================================');
    console.log('🔍 DEBUGGING STICKY LAYOUT');
    console.log('========================================\n');

    // 1. Check section existence
    const section = page.locator('.benefits-blog-section');
    const sectionExists = await section.count();
    console.log('1️⃣ Section exists:', sectionExists > 0);

    // 2. Check grid structure
    const grid = page.locator('.sticky-grid');
    const gridExists = await grid.count();
    console.log('2️⃣ Grid exists:', gridExists > 0);

    // 3. Check columns
    const stickyColumn = page.locator('.sticky-column');
    const scrollColumn = page.locator('.scroll-column');
    const stickyCount = await stickyColumn.count();
    const scrollCount = await scrollColumn.count();
    console.log('3️⃣ Sticky column exists:', stickyCount > 0);
    console.log('   Scroll column exists:', scrollCount > 0);

    // Check parent containers for transform/will-change (breaks sticky)
    console.log('\n🔍 CHECKING FOR STICKY-BREAKING PROPERTIES:');
    const stickyBreakers = await stickyColumn.evaluate((el) => {
      const issues = [];
      let current = el.parentElement;
      while (current && current.tagName !== 'HTML') {
        const computed = window.getComputedStyle(current);

        // Check for properties that break position: sticky
        const breakingProps = [];
        if (computed.transform && computed.transform !== 'none') breakingProps.push(`transform: ${computed.transform}`);
        if (computed.willChange && computed.willChange !== 'auto') breakingProps.push(`will-change: ${computed.willChange}`);
        if (computed.perspective && computed.perspective !== 'none') breakingProps.push(`perspective: ${computed.perspective}`);
        if (computed.filter && computed.filter !== 'none') breakingProps.push(`filter: ${computed.filter}`);
        if (computed.contain && computed.contain !== 'none') breakingProps.push(`contain: ${computed.contain}`);

        if (breakingProps.length > 0) {
          issues.push({
            tag: current.tagName,
            class: current.className,
            breaking: breakingProps,
          });
        }
        current = current.parentElement;
      }
      return issues;
    });

    if (stickyBreakers.length > 0) {
      console.log('   ⚠️  FOUND STICKY-BREAKING PROPERTIES:');
      stickyBreakers.forEach(issue => {
        console.log(`      ${issue.tag}.${issue.class}:`, issue.breaking);
      });
    } else {
      console.log('   ✅ No sticky-breaking properties found');
    }

    // 4. Inspect computed styles for sticky column
    console.log('\n📊 STICKY COLUMN STYLES:');
    const stickyStyles = await stickyColumn.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        position: computed.position,
        alignSelf: computed.alignSelf,
        display: computed.display,
        width: computed.width,
        height: computed.height,
      };
    });
    console.log('   Background Color:', stickyStyles.backgroundColor);
    console.log('   Position:', stickyStyles.position);
    console.log('   Align Self:', stickyStyles.alignSelf);
    console.log('   Display:', stickyStyles.display);
    console.log('   Width:', stickyStyles.width);
    console.log('   Height:', stickyStyles.height);

    // 5. Inspect computed styles for sticky content
    const stickyContent = page.locator('.sticky-content');
    console.log('\n📊 STICKY CONTENT STYLES:');
    const contentStyles = await stickyContent.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        top: computed.top,
        height: computed.height,
        display: computed.display,
        alignItems: computed.alignItems,
        overflow: computed.overflow,
      };
    });
    console.log('   Position:', contentStyles.position);
    console.log('   Top:', contentStyles.top);
    console.log('   Height:', contentStyles.height);
    console.log('   Display:', contentStyles.display);
    console.log('   Align Items:', contentStyles.alignItems);
    console.log('   Overflow:', contentStyles.overflow);

    // 6. Inspect benefits content (child of sticky content)
    const benefitsContent = page.locator('.sticky-content .benefits-content');
    console.log('\n📊 BENEFITS CONTENT STYLES (inside sticky):');
    const benefitsStyles = await benefitsContent.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        padding: computed.padding,
        maxWidth: computed.maxWidth,
        width: computed.width,
      };
    });
    console.log('   Background Color:', benefitsStyles.backgroundColor);
    console.log('   Padding:', benefitsStyles.padding);
    console.log('   Max Width:', benefitsStyles.maxWidth);
    console.log('   Width:', benefitsStyles.width);

    // 7. Inspect scroll column
    console.log('\n📊 SCROLL COLUMN STYLES:');
    const scrollStyles = await scrollColumn.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        position: computed.position,
        minHeight: computed.minHeight,
      };
    });
    console.log('   Background Color:', scrollStyles.backgroundColor);
    console.log('   Position:', scrollStyles.position);
    console.log('   Min Height:', scrollStyles.minHeight);

    // 8. Check grid layout
    console.log('\n📊 GRID STYLES:');
    const gridStyles = await grid.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        minHeight: computed.minHeight,
        gap: computed.gap,
      };
    });
    console.log('   Display:', gridStyles.display);
    console.log('   Grid Template Columns:', gridStyles.gridTemplateColumns);
    console.log('   Min Height:', gridStyles.minHeight);
    console.log('   Gap:', gridStyles.gap);

    // 9. Check for any conflicting styles
    console.log('\n🔍 CHECKING FOR CONFLICTS:');

    // Check if there's any inline styles
    const stickyColumnInline = await stickyColumn.getAttribute('style');
    console.log('   Sticky column inline styles:', stickyColumnInline || 'None');

    const benefitsInline = await benefitsContent.getAttribute('style');
    console.log('   Benefits content inline styles:', benefitsInline || 'None');

    // 10. Check element dimensions
    console.log('\n📐 ELEMENT DIMENSIONS:');
    const stickyBox = await stickyColumn.boundingBox();
    const scrollBox = await scrollColumn.boundingBox();

    if (stickyBox) {
      console.log('   Sticky column:', {
        width: stickyBox.width,
        height: stickyBox.height,
        x: stickyBox.x,
        y: stickyBox.y,
      });
    }

    if (scrollBox) {
      console.log('   Scroll column:', {
        width: scrollBox.width,
        height: scrollBox.height,
        x: scrollBox.x,
        y: scrollBox.y,
      });
    }

    // 10. Check grid actual height - CRITICAL for sticky to work
    console.log('\n📏 GRID ACTUAL HEIGHT:');
    const gridHeight = await grid.evaluate((el) => {
      const htmlEl = el as HTMLElement;
      return {
        offsetHeight: htmlEl.offsetHeight,
        scrollHeight: htmlEl.scrollHeight,
        clientHeight: htmlEl.clientHeight,
      };
    });
    console.log('   Grid offset height:', gridHeight.offsetHeight, 'px');
    console.log('   Grid scroll height:', gridHeight.scrollHeight, 'px');
    console.log('   Scroll column height: 2834px (from earlier test)');
    console.log('   ⚠️  Grid should be >= scroll column height for sticky to work!');

    // 11. Test sticky behavior (TEST THE STICKY COLUMN, NOT CONTENT)
    console.log('\n🧪 TESTING STICKY BEHAVIOR:');

    // Get initial position of STICKY COLUMN
    const initialTop = await stickyColumn.evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    console.log('   Initial sticky column top:', initialTop);

    // Scroll to the section
    await section.evaluate((el) => el.scrollIntoView());
    await page.waitForTimeout(300);

    const topAfterScroll1 = await stickyColumn.evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    console.log('   Sticky column top after scrolling to section:', topAfterScroll1);

    // Scroll down more to test sticky
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(500);

    // Get position after more scroll
    const scrolledTop = await stickyColumn.evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    console.log('   Sticky column top after additional scroll (1200px):', scrolledTop);

    // Scroll to exactly where sticky should activate (when top reaches 0)
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    const scrolledTop2 = await stickyColumn.evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    console.log('   Sticky column top after more scroll (total 1800px):', scrolledTop2);

    // NOW scroll UP a bit to see if it unsticks
    await page.evaluate(() => window.scrollBy(0, -100));
    await page.waitForTimeout(500);

    const afterScrollUp = await stickyColumn.evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    console.log('   Sticky column top after scrolling UP 100px:', afterScrollUp);

    // Scroll DOWN again
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);

    const afterScrollDown = await stickyColumn.evaluate((el) => {
      return el.getBoundingClientRect().top;
    });
    console.log('   Sticky column top after scrolling DOWN 200px:', afterScrollDown);
    console.log('   ✅ STICKY CONFIRMED?', afterScrollDown === 0 || (afterScrollDown >= -5 && afterScrollDown <= 5));

    // 12. Check viewport height
    console.log('\n📱 VIEWPORT INFO:');
    const viewportSize = await page.viewportSize();
    console.log('   Viewport:', viewportSize);

    const stickyContentHeight = await stickyContent.evaluate((el) => {
      const htmlEl = el as HTMLElement;
      return {
        offsetHeight: htmlEl.offsetHeight,
        scrollHeight: htmlEl.scrollHeight,
        clientHeight: htmlEl.clientHeight,
      };
    });
    console.log('   Sticky content heights:', stickyContentHeight);

    // 13. Check all applied CSS classes
    console.log('\n🏷️ CSS CLASSES:');
    const sectionClasses = await section.getAttribute('class');
    const gridClasses = await grid.getAttribute('class');
    const stickyColumnClasses = await stickyColumn.getAttribute('class');
    const stickyContentClasses = await stickyContent.getAttribute('class');

    console.log('   Section:', sectionClasses);
    console.log('   Grid:', gridClasses);
    console.log('   Sticky column:', stickyColumnClasses);
    console.log('   Sticky content:', stickyContentClasses);

    console.log('\n========================================');
    console.log('✅ DEBUG COMPLETE');
    console.log('========================================\n');

    // Take a screenshot for visual inspection
    await page.screenshot({
      path: 'astro/tests/screenshots/sticky-layout-debug.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to: astro/tests/screenshots/sticky-layout-debug.png\n');
  });
});
