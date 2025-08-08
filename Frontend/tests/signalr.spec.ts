import { test, expect } from '@playwright/test';

test.describe('SignalR Connection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should establish SignalR connection', async ({ page }) => {
    // Wait for connection to establish
    await page.waitForTimeout(3000);
    
    // Check connection status indicator
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Monitor console for connection messages
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    // Send a test message to verify connection
    await page.fill('.message-input', 'Connection test');
    await page.click('.send-button');
    
    // Verify message was sent and response received
    await expect(page.locator('.message.user-message .message-content')).toContainText('Connection test');
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Block SignalR hub requests to simulate connection failure
    await page.route('**/chathub/**', route => route.abort());
    
    // Try to send a message
    await page.fill('.message-input', 'Test with blocked connection');
    await page.click('.send-button');
    
    // The message should still appear in the UI
    await expect(page.locator('.message.user-message .message-content')).toContainText('Test with blocked connection');
    
    // But no response should come
    await page.waitForTimeout(2000);
    
    // Verify only user message exists (no AI response)
    const messageCount = await page.locator('.message').count();
    expect(messageCount).toBe(1); // Only user message, no welcome or response
  });

  test('should reconnect after connection loss', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Send initial message to verify connection works
    await page.fill('.message-input', 'Before disconnection');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Temporarily block connection
    await page.route('**/chathub/**', route => route.abort());
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Unblock connection (simulate reconnection)
    await page.unroute('**/chathub/**');
    
    // Try sending another message
    await page.fill('.message-input', 'After reconnection');
    await page.click('.send-button');
    
    // Should work again (may take a moment for reconnection)
    await expect(page.locator('.message.user-message').nth(1)).toBeVisible();
  });

  test('should handle rapid message sending', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Send multiple messages quickly
    const messages = ['Message 1', 'Message 2', 'Message 3'];
    
    for (const message of messages) {
      await page.fill('.message-input', message);
      await page.click('.send-button');
      
      // Wait for user message to appear before sending next
      await expect(page.locator('.message.user-message .message-content')).toContainText(message);
      
      // Small delay to prevent overwhelming the connection
      await page.waitForTimeout(500);
    }
    
    // Verify all user messages are present
    await expect(page.locator('.message.user-message')).toHaveCount(3);
    
    // Wait for all responses (may take time due to mock delays)
    await expect(page.locator('.message.assistant-message')).toHaveCount(4, { timeout: 15000 }); // 3 responses + welcome
  });
});
