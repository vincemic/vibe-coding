import { test, expect } from '@playwright/test';

test.describe('SignalR Connection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should establish SignalR connection', async ({ page }) => {
    // Wait for connection to establish
    await page.waitForTimeout(3000);
    
    // Check connection status indicator
    const statusIndicator = page.locator('.status-indicator, [class*="connected"]');
    await expect(statusIndicator).toBeVisible();
    
    // Monitor console for connection messages
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    // Test quiz interaction to verify SignalR connection
    const nameInput = page.locator('.name-input');
    if (await nameInput.isVisible()) {
      await nameInput.fill('SignalRTestPlayer');
      await page.click('button:has-text("Join Game")');
      
      // Verify quiz master response or state change
      await page.waitForTimeout(2000);
      
      // Should see some quiz master message or state change
      const quizMasterSection = page.locator('.quiz-master, .quiz-master-panel');
      await expect(quizMasterSection).toBeVisible();
    }
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Block SignalR hub requests to simulate connection failure
    await page.route('**/quizhub/**', route => route.abort());
    
    // Try to join game with blocked connection
    const nameInput = page.locator('.name-input');
    if (await nameInput.isVisible()) {
      await nameInput.fill('ErrorTestPlayer');
      await page.click('button:has-text("Join Game")');
      
      // Wait a moment to see if connection error is handled
      await page.waitForTimeout(3000);
      
      // App should remain functional even with connection issues
      await expect(page.locator('.quiz-container')).toBeVisible();
    }
  });

  test('should reconnect after connection loss', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Try initial join to verify connection works
    const nameInput = page.locator('.name-input');
    if (await nameInput.isVisible()) {
      await nameInput.fill('ReconnectTestPlayer');
      await page.click('button:has-text("Join Game")');
      await page.waitForTimeout(2000);
    }
    
    // Temporarily block connection
    await page.route('**/quizhub/**', route => route.abort());
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Unblock connection (simulate reconnection)
    await page.unroute('**/quizhub/**');
    
    // Wait for reconnection and verify app still works
    await page.waitForTimeout(3000);
    await expect(page.locator('.quiz-container')).toBeVisible();
  });

  test('should handle rapid quiz interactions', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Test rapid interactions with the same name input
    const nameInput = page.locator('.name-input');
    if (await nameInput.isVisible()) {
      // Rapidly change name input values
      const names = ['Player1', 'Player2', 'Player3'];
      
      for (const name of names) {
        await nameInput.fill(name);
        
        // Small delay to simulate rapid typing
        await page.waitForTimeout(200);
      }
      
      // Final submission
      await page.click('button:has-text("Join Game")');
      
      // Wait to see if the rapid interactions were handled properly
      await page.waitForTimeout(2000);
      
      // App should remain functional
      await expect(page.locator('.quiz-container')).toBeVisible();
    }
  });
});
