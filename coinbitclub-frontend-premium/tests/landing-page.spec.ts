import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/CoinBitClub.*MarketBot/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Trading Automático');
    await expect(page.locator('h1')).toContainText('com IA 24/7');
    
    // Check CTA buttons
    const testFreeButton = page.getByRole('button', { name: /quero testar grátis/i });
    const howItWorksButton = page.getByRole('button', { name: /como funciona o marketbot/i });
    
    await expect(testFreeButton).toBeVisible();
    await expect(howItWorksButton).toBeVisible();
  });

  test('should navigate to sections when clicking nav links', async ({ page }) => {
    await page.goto('/');
    
    // Test features navigation
    await page.click('a[href="#features"]');
    await page.waitForSelector('#features', { state: 'visible' });
    
    // Check if features section is visible
    await expect(page.locator('#features')).toBeInViewport();
    
    // Test como-funciona navigation
    await page.click('a[href="#como-funciona"]');
    await page.waitForSelector('#como-funciona', { state: 'visible' });
    await expect(page.locator('#como-funciona')).toBeInViewport();
  });

  test('should display features correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check features section
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();
    
    // Check feature cards
    await expect(page.locator('text=Saldo Sempre Seguro')).toBeVisible();
    await expect(page.locator('text=IA Operando 24/7')).toBeVisible();
    await expect(page.locator('text=Lucros em Tempo Real')).toBeVisible();
  });

  test('should display AI setup steps', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to como-funciona section
    await page.locator('#como-funciona').scrollIntoViewIfNeeded();
    
    // Check AI steps
    await expect(page.locator('text=Leitura de Mercado')).toBeVisible();
    await expect(page.locator('text=Seleção de Ativos')).toBeVisible();
    await expect(page.locator('text=Escolha do Robô')).toBeVisible();
    await expect(page.locator('text=Gestão de Riscos')).toBeVisible();
  });

  test('should work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile menu button
    const mobileMenuButton = page.locator('button[aria-label="Open menu"]').first();
    await expect(mobileMenuButton).toBeVisible();
    
    // Open mobile menu
    await mobileMenuButton.click();
    
    // Check mobile menu items
    await expect(page.locator('text=Funcionalidades')).toBeVisible();
    await expect(page.locator('text=Como Funciona')).toBeVisible();
    await expect(page.locator('text=Preços')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should load footer correctly', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    // Check footer content
    await expect(page.locator('footer')).toContainText('CoinBitClub');
    await expect(page.locator('footer')).toContainText('© 2024');
    
    // Check footer links
    await expect(page.locator('footer a[href="/termos"]')).toBeVisible();
    await expect(page.locator('footer a[href="/privacidade"]')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load page within performance budget', async ({ page }) => {
    // Start measuring performance
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
      };
    });
    
    // Assert performance budgets
    expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
  });
});
