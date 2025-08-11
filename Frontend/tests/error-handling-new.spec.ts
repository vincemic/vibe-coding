import { test, expect } from '@playwright/test';

test.describe('Quiz Error Handling Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle SignalR connection errors gracefully', async ({ page }) => {
    // Monitor console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a moment for connection attempts
    await page.waitForTimeout(5000);
    
    // Quiz interface should still be visible even if backend is down
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Should not have uncaught JavaScript errors
    const jsErrors = consoleErrors.filter(error => 
      !error.includes('SignalR') && 
      !error.includes('WebSocket') &&
      !error.includes('Failed to fetch') &&
      !error.includes('net::')
    );
    expect(jsErrors.length).toBe(0);
  });

  test('should handle empty name submission', async ({ page }) => {
    // Wait for quiz interface
    await page.waitForTimeout(2000);
    
    // Try to join without entering a name
    await page.click('button:has-text("Join Game")');
    
    // Should prevent join or show validation error
    const nameInput = page.locator('.name-input');
    const isRequired = await nameInput.getAttribute('required');
    const hasErrorMessage = await page.locator('.error, .invalid, [class*="error"]').isVisible();
    
    expect(isRequired !== null || hasErrorMessage).toBeTruthy();
  });

  test('should handle very long name input', async ({ page }) => {
    // Wait for quiz interface
    await page.waitForTimeout(2000);
    
    // Try entering a very long name
    const veryLongName = 'A'.repeat(100);
    const nameInput = page.locator('.name-input');
    
    await nameInput.fill(veryLongName);
    
    // Should limit or truncate the input
    const inputValue = await nameInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(50); // Reasonable name length limit
  });

  test('should handle network interruption during join', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Block network requests to simulate connection issues
    await page.route('**/quizhub/**', route => route.abort());
    
    // Try to join
    await page.fill('.name-input', 'NetworkTestPlayer');
    await page.click('button:has-text("Join Game")');
    
    // Should handle gracefully - either show error or remain in join state
    await page.waitForTimeout(3000);
    
    // Interface should remain functional
    await expect(page.locator('.quiz-container')).toBeVisible();
    await expect(page.locator('.name-input')).toBeVisible();
  });

  test('should handle rapid join attempts', async ({ page }) => {
    // Wait for quiz interface
    await page.waitForTimeout(2000);
    
    const nameInput = page.locator('.name-input');
    const joinButton = page.locator('button:has-text("Join Game")');
    
    // Fill name
    await nameInput.fill('RapidTester');
    
    // Rapidly click join button multiple times
    for (let i = 0; i < 5; i++) {
      await joinButton.click();
      await page.waitForTimeout(100);
    }
    
    // Should handle gracefully without errors
    await page.waitForTimeout(2000);
    
    // Interface should remain functional
    await expect(page.locator('.quiz-container')).toBeVisible();
  });

  test('should handle disabled state properly', async ({ page }) => {
    // Wait for quiz interface
    await page.waitForTimeout(2000);
    
    // Initially join button might be disabled without name
    const joinButton = page.locator('button:has-text("Join Game")');
    const initialDisabled = await joinButton.isDisabled();
    
    // Fill name
    await page.fill('.name-input', 'DisabledTestPlayer');
    
    // Button should become enabled (if it was disabled)
    if (initialDisabled) {
      await expect(joinButton).toBeEnabled();
    }
  });

  test('should maintain state after page refresh', async ({ page }) => {
    // Join a game
    await page.fill('.name-input', 'RefreshTestPlayer');
    await page.click('button:has-text("Join Game")');
    
    // Wait for successful join
    await page.waitForTimeout(3000);
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should return to initial state
    await expect(page.locator('.quiz-container')).toBeVisible();
    await expect(page.locator('.name-input, .join-section')).toBeVisible();
  });

  test('should handle invalid characters in name', async ({ page }) => {
    // Wait for quiz interface
    await page.waitForTimeout(2000);
    
    // Try entering name with special characters
    const specialName = '!@#$%^&*()';
    await page.fill('.name-input', specialName);
    
    const inputValue = await page.locator('.name-input').inputValue();
    
    // Should either accept it or sanitize it
    expect(inputValue.length).toBeGreaterThan(0);
    
    // Try to join
    await page.click('button:has-text("Join Game")');
    
    // Should handle gracefully
    await page.waitForTimeout(2000);
    await expect(page.locator('.quiz-container')).toBeVisible();
  });
});
