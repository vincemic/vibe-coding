import { test, expect } from '@playwright/test';

test.describe('Application Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for these tests
    test.setTimeout(45000);
  });

  test('should load quiz application successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should see the app title
    await expect(page.locator('h1').first()).toContainText('Ultimate Quiz Challenge');

    // Should see quiz container
    await expect(page.locator('.quiz-container')).toBeVisible();

    // Should be in some valid state (either join form or active game)
    const hasJoinForm = await page.locator('.join-section').isVisible();
    const hasActiveGame = await page.locator('.waiting-section, .starting-section, .answer-section').isVisible();
    
    expect(hasJoinForm || hasActiveGame).toBeTruthy();
    
    console.log('App state:', { 
      hasJoinForm, 
      hasActiveGame,
      url: page.url()
    });
  });

  test('should establish SignalR connection', async ({ page }) => {
    // Monitor console for connection messages
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('SignalR') || text.includes('connection') || text.includes('QuizHub')) {
        logs.push(text);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(5000);

    // Check for SignalR connection indicators
    const hasConnectionLogs = logs.some(log => 
      log.includes('connected') || 
      log.includes('QuizHub') ||
      log.includes('WebSocket')
    );

    // Also check for connection status in UI
    const connectionStatus = await page.locator('.connection-status, [class*="connected"]').first().isVisible();

    expect(hasConnectionLogs || connectionStatus).toBeTruthy();
    
    console.log('Connection logs:', logs);
  });

  test('should show quiz master panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Should see quiz master section
    await expect(page.locator('.quiz-master-panel, .quiz-master')).toBeVisible();

    // Should have quiz master heading
    const hasMasterHeading = await page.locator('h3:has-text("Quiz Master")').isVisible();
    const hasBotIcon = await page.locator('text=🤖').isVisible();

    expect(hasMasterHeading || hasBotIcon).toBeTruthy();
  });
});
