import { test, expect } from '@playwright/test';

test.describe('Error Handling Tests', () => {
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
    
    // If backend is down, should show disconnected status
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Should not have uncaught JavaScript errors
    const jsErrors = consoleErrors.filter(error => 
      !error.includes('SignalR') && 
      !error.includes('WebSocket') &&
      !error.includes('Failed to fetch') &&
      !error.includes('net::')
    );
    expect(jsErrors.length).toBe(0);
  });

  test('should handle empty message submission', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Try to send empty message
    await page.click('.send-button');
    
    // Input should be cleared but no message sent
    const messageInput = page.locator('.message-input');
    await expect(messageInput).toHaveValue('');
    
    // No new user message should appear
    const userMessages = page.locator('.message.user-message');
    await expect(userMessages).toHaveCount(0);
  });

  test('should handle very long message input', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Create a very long message (test character limits)
    const veryLongMessage = 'A'.repeat(10000);
    
    await page.fill('.message-input', veryLongMessage);
    
    // Should either truncate or handle gracefully
    const inputValue = await page.locator('.message-input').inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
    
    // Try to send
    await page.click('.send-button');
    
    // Should either send or show error, but not crash
    await page.waitForTimeout(2000);
    
    // Interface should still be functional
    await expect(page.locator('.message-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
  });

  test('should handle special characters in messages', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Test various special characters
    const specialChars = ['<script>alert("test")</script>', '&lt;&gt;&amp;', '😀🚀💻', '\\n\\t\\r', '"quotes" and \'apostrophes\''];
    
    for (const testMessage of specialChars) {
      await page.fill('.message-input', testMessage);
      await page.click('.send-button');
      
      // Should display without executing scripts or breaking layout
      const userMessage = page.locator('.message.user-message').last();
      await expect(userMessage).toBeVisible();
      
      // Clear for next test
      await page.waitForTimeout(1000);
    }
    
    // Interface should still be functional
    await expect(page.locator('.message-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
  });

  test('should handle rapid message sending', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Send multiple messages rapidly
    for (let i = 1; i <= 5; i++) {
      await page.fill('.message-input', `Rapid message ${i}`);
      await page.click('.send-button');
      await page.waitForTimeout(100); // Small delay between sends
    }
    
    // Should handle all messages
    const userMessages = page.locator('.message.user-message');
    await expect(userMessages).toHaveCount(5);
    
    // Interface should still be responsive
    await page.fill('.message-input', 'Final test message');
    await page.click('.send-button');
    await expect(page.locator('.message.user-message').nth(5)).toBeVisible();
  });

  test('should handle network interruption simulation', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Block network requests
    await page.route('**/*', route => route.abort());
    
    // Try to send a message
    await page.fill('.message-input', 'Network blocked message');
    await page.click('.send-button');
    
    // Should handle gracefully - either show error or keep trying
    await page.waitForTimeout(3000);
    
    // Status should show disconnected or similar
    const statusIndicator = page.locator('.status-indicator');
    const statusText = await statusIndicator.textContent();
    expect(statusText).toMatch(/Disconnected|Connecting|Error/i);
    
    // Restore network
    await page.unroute('**/*');
    
    // Interface should still be usable
    await expect(page.locator('.message-input')).toBeVisible();
  });

  test('should handle malformed server responses', async ({ page }) => {
    // Intercept SignalR responses and modify them
    await page.route('**/chatHub/negotiate**', route => {
      route.fulfill({
        status: 200,
        body: '{"invalid": "json"}'
      });
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Should not crash the application
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Status should indicate connection issues
    const statusIndicator = page.locator('.status-indicator');
    const statusText = await statusIndicator.textContent();
    expect(statusText).toMatch(/Disconnected|Error/i);
  });

  test('should handle missing DOM elements gracefully', async ({ page }) => {
    // Remove critical elements via JavaScript
    await page.evaluate(() => {
      const sendButton = document.querySelector('.send-button');
      if (sendButton) sendButton.remove();
    });
    
    // Try to send message via Enter key
    await page.fill('.message-input', 'Testing without send button');
    await page.keyboard.press('Enter');
    
    // Should either work via Enter key or handle gracefully
    await page.waitForTimeout(2000);
    
    // Application should not crash
    await expect(page.locator('.chat-container')).toBeVisible();
  });

  test('should handle localStorage/sessionStorage errors', async ({ page }) => {
    // Disable storage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false
      });
      Object.defineProperty(window, 'sessionStorage', {
        value: null,
        writable: false
      });
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should still load without storage
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Should be able to send messages
    await page.fill('.message-input', 'Storage disabled test');
    await page.click('.send-button');
    
    await expect(page.locator('.message.user-message')).toBeVisible();
  });

  test('should handle window.undefined scenarios', async ({ page }) => {
    // Test with various undefined global objects
    await page.addInitScript(() => {
      // @ts-ignore
      window.WebSocket = undefined;
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Should handle WebSocket unavailability
    await expect(page.locator('.chat-container')).toBeVisible();
    
    const statusIndicator = page.locator('.status-indicator');
    const statusText = await statusIndicator.textContent();
    expect(statusText).toMatch(/Disconnected|Error|Unsupported/i);
  });
});
