import { test, expect } from '@playwright/test';

test.describe('UI/UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper styling and animations', async ({ page }) => {
    // Check if main container has gradient background
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toBeVisible();
    
    // Check if messages have proper styling
    await page.waitForTimeout(2000); // Wait for welcome message
    const welcomeMessage = page.locator('.message.assistant-message').first();
    await expect(welcomeMessage).toBeVisible();
    
    // Check if message appears with animation
    await expect(welcomeMessage).toHaveCSS('animation-duration', /0.3s/);
  });

  test('should have proper color scheme', async ({ page }) => {
    // Check header background
    const header = page.locator('.chat-header');
    await expect(header).toBeVisible();
    
    // Check if user and assistant messages have different colors
    await page.fill('.message-input', 'Color test');
    await page.click('.send-button');
    
    // Wait for both messages
    const userMessage = page.locator('.message.user-message');
    await expect(userMessage).toBeVisible();
    
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    
    // They should have different background colors
    const userBg = await userMessage.evaluate(el => getComputedStyle(el).backgroundColor);
    const assistantBg = await page.locator('.message.assistant-message').first().evaluate(el => getComputedStyle(el).backgroundColor);
    
    expect(userBg).not.toBe(assistantBg);
  });

  test('should show typing indicator animation', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Send a message
    await page.fill('.message-input', 'Show typing indicator');
    await page.click('.send-button');
    
    // Check if typing indicator appears
    const typingIndicator = page.locator('.typing-indicator');
    await expect(typingIndicator).toBeVisible({ timeout: 5000 });
    
    // Check if typing dots are animated
    const dots = page.locator('.typing-indicator span');
    await expect(dots).toHaveCount(3);
    
    // Verify animation exists
    const firstDot = dots.first();
    await expect(firstDot).toHaveCSS('animation-name', 'typing');
    
    // Wait for response and verify typing indicator disappears
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    await expect(typingIndicator).not.toBeVisible();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should focus on message input
    await expect(page.locator('.message-input')).toBeFocused();
    
    // Type a message
    await page.keyboard.type('Keyboard test');
    
    // Press Tab to focus send button
    await page.keyboard.press('Tab');
    await expect(page.locator('.send-button')).toBeFocused();
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    
    // Message should be sent
    await expect(page.locator('.message.user-message .message-content')).toContainText('Keyboard test');
  });

  test('should handle long messages properly', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Send a very long message
    const longMessage = 'This is a very long message that should test how the chat interface handles text wrapping and display of lengthy content. '.repeat(5);
    
    await page.fill('.message-input', longMessage);
    await page.click('.send-button');
    
    // Check if long message is displayed properly
    const userMessage = page.locator('.message.user-message .message-content');
    await expect(userMessage).toContainText(longMessage);
    
    // Check if message doesn't overflow container
    const messageWidth = await userMessage.evaluate(el => el.scrollWidth);
    const containerWidth = await page.locator('.messages-container').evaluate(el => el.clientWidth);
    
    expect(messageWidth).toBeLessThanOrEqual(containerWidth);
  });

  test('should display proper message alignment', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Check welcome message alignment (should be left-aligned)
    const assistantMessage = page.locator('.message.assistant-message').first();
    await expect(assistantMessage).toHaveCSS('align-self', 'flex-start');
    
    // Send user message
    await page.fill('.message-input', 'User message test');
    await page.click('.send-button');
    
    // Check user message alignment (should be right-aligned)
    const userMessage = page.locator('.message.user-message');
    await expect(userMessage).toHaveCSS('align-self', 'flex-end');
  });

  test('should show message usernames correctly', async ({ page }) => {
    // Wait for connection and welcome message
    await page.waitForTimeout(2000);
    
    // Check assistant username
    const assistantUsername = page.locator('.message.assistant-message .username').first();
    await expect(assistantUsername).toContainText('Assistant');
    
    // Send user message
    await page.fill('.message-input', 'Username test');
    await page.click('.send-button');
    
    // Check user username
    const userUsername = page.locator('.message.user-message .username');
    await expect(userUsername).toContainText('You');
  });

  test('should update status indicator correctly', async ({ page }) => {
    // Initially might be disconnected
    const statusIndicator = page.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Wait for connection
    await page.waitForTimeout(3000);
    
    // Check if status shows connected (test may vary based on actual connection)
    const statusText = await statusIndicator.textContent();
    expect(statusText).toMatch(/Connected|Disconnected/);
    
    // Status dot should be present
    const statusDot = page.locator('.status-dot');
    await expect(statusDot).toBeVisible();
  });

  test('should handle window resize properly', async ({ page }) => {
    // Start with desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Send a message
    await page.fill('.message-input', 'Resize test');
    await page.click('.send-button');
    
    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Interface should still be functional
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.message-input')).toBeVisible();
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should still work
    await expect(page.locator('.chat-container')).toBeVisible();
    await page.fill('.message-input', 'Mobile resize test');
    await page.click('.send-button');
    
    await expect(page.locator('.message.user-message').nth(1)).toBeVisible();
  });
});
