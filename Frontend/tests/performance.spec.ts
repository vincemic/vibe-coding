import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load initial page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    // Wait for the chat container to be fully loaded
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.message-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (generous for local development)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should handle multiple messages without performance degradation', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Send 20 messages
    for (let i = 1; i <= 20; i++) {
      await page.fill('.message-input', `Performance test message ${i}`);
      await page.click('.send-button');
      
      // Small delay to allow processing
      await page.waitForTimeout(100);
    }
    
    // Wait for all messages to be processed
    await expect(page.locator('.message.user-message').nth(19)).toBeVisible({ timeout: 30000 });
    
    const totalTime = Date.now() - startTime;
    console.log(`Time to send 20 messages: ${totalTime}ms`);
    
    // Should complete within reasonable time (30 seconds including server responses)
    expect(totalTime).toBeLessThan(30000);
    
    // Check if all messages are visible
    const userMessages = page.locator('.message.user-message');
    await expect(userMessages).toHaveCount(20);
  });

  test('should maintain smooth scrolling with many messages', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    // Send enough messages to require scrolling
    for (let i = 1; i <= 15; i++) {
      await page.fill('.message-input', `Scroll test message ${i} - This is a longer message to test scrolling behavior`);
      await page.click('.send-button');
      await page.waitForTimeout(200);
    }
    
    // Wait for messages to load
    await expect(page.locator('.message.user-message').nth(14)).toBeVisible({ timeout: 45000 });
    
    // Check if container is scrollable
    const messagesContainer = page.locator('.messages-container');
    const scrollHeight = await messagesContainer.evaluate(el => el.scrollHeight);
    const clientHeight = await messagesContainer.evaluate(el => el.clientHeight);
    
    expect(scrollHeight).toBeGreaterThan(clientHeight);
    
    // Test scrolling performance
    const scrollStartTime = Date.now();
    
    // Scroll to top
    await messagesContainer.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(100);
    
    // Scroll to bottom
    await messagesContainer.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(100);
    
    const scrollTime = Date.now() - scrollStartTime;
    console.log(`Scroll operation time: ${scrollTime}ms`);
    
    // Scrolling should be smooth (under 1 second)
    expect(scrollTime).toBeLessThan(1000);
  });

  test('should handle concurrent SignalR operations efficiently', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Send multiple messages rapidly to test concurrent handling
    const promises: Promise<void>[] = [];
    for (let i = 1; i <= 5; i++) {
      promises.push((async () => {
        await page.fill('.message-input', `Concurrent message ${i}`);
        await page.click('.send-button');
      })());
    }
    
    await Promise.all(promises);
    
    // Wait for all messages to be processed
    await expect(page.locator('.message.user-message').nth(4)).toBeVisible({ timeout: 15000 });
    
    const concurrentTime = Date.now() - startTime;
    console.log(`Concurrent message handling time: ${concurrentTime}ms`);
    
    // Should handle concurrent operations efficiently
    expect(concurrentTime).toBeLessThan(10000);
    
    // All messages should be present
    const userMessages = page.locator('.message.user-message');
    await expect(userMessages).toHaveCount(5);
  });

  test('should not have memory leaks during extended use', async ({ page }) => {
    // This is a basic test for memory leaks - in a real scenario you'd use browser dev tools
    
    let initialMemory: number;
    let finalMemory: number;
    
    // Get initial memory (if supported by browser)
    try {
      initialMemory = await page.evaluate(() => {
        // @ts-ignore - performance.memory might not be available in all browsers
        return window.performance?.memory?.usedJSHeapSize || 0;
      });
    } catch {
      initialMemory = 0;
    }
    
    // Simulate extended use
    await page.waitForTimeout(2000);
    
    for (let i = 1; i <= 10; i++) {
      await page.fill('.message-input', `Memory test message ${i}`);
      await page.click('.send-button');
      await page.waitForTimeout(300);
      
      // Clear some messages by refreshing every 5 messages
      if (i % 5 === 0) {
        await page.reload();
        await page.waitForTimeout(2000);
      }
    }
    
    // Get final memory
    try {
      finalMemory = await page.evaluate(() => {
        // @ts-ignore
        return window.performance?.memory?.usedJSHeapSize || 0;
      });
    } catch {
      finalMemory = 0;
    }
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`Memory increase: ${memoryIncrease} bytes`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
    
    // Interface should still be responsive
    await expect(page.locator('.chat-container')).toBeVisible();
  });

  test('should efficiently handle rapid typing', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Simulate rapid typing
    const longText = 'This is a performance test for rapid typing input handling. '.repeat(10);
    
    // Type character by character rapidly
    await page.click('.message-input');
    for (const char of longText) {
      await page.keyboard.type(char, { delay: 10 }); // 10ms between characters
    }
    
    const typingTime = Date.now() - startTime;
    console.log(`Rapid typing time: ${typingTime}ms for ${longText.length} characters`);
    
    // Should handle rapid typing without lag
    expect(typingTime).toBeLessThan(longText.length * 50); // Max 50ms per character
    
    // Input should contain the full text
    const inputValue = await page.locator('.message-input').inputValue();
    expect(inputValue).toBe(longText);
    
    // Send the message
    await page.click('.send-button');
    await expect(page.locator('.message.user-message')).toBeVisible();
  });

  test('should handle window resize efficiently', async ({ page }) => {
    // Start with desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    const startTime = Date.now();
    
    // Perform multiple rapid resizes
    const sizes = [
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 1440, height: 900 },
      { width: 600, height: 800 },
      { width: 1200, height: 800 }
    ];
    
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(100);
    }
    
    const resizeTime = Date.now() - startTime;
    console.log(`Resize operations time: ${resizeTime}ms`);
    
    // Should handle resizes efficiently
    expect(resizeTime).toBeLessThan(2000);
    
    // Interface should remain functional
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.message-input')).toBeVisible();
    
    // Test functionality after resizes
    await page.fill('.message-input', 'Resize test complete');
    await page.click('.send-button');
    await expect(page.locator('.message.user-message')).toBeVisible();
  });

  test('should maintain performance with long conversations', async ({ page }) => {
    // Simulate a longer conversation
    await page.waitForTimeout(2000);
    
    const messageCount = 30;
    const startTime = Date.now();
    
    for (let i = 1; i <= messageCount; i++) {
      await page.fill('.message-input', `Long conversation message ${i}`);
      
      const sendStartTime = Date.now();
      await page.click('.send-button');
      
      // Wait for user message to appear
      await expect(page.locator('.message.user-message').nth(i - 1)).toBeVisible({ timeout: 5000 });
      
      const sendTime = Date.now() - sendStartTime;
      
      // Each message should be processed within reasonable time
      expect(sendTime).toBeLessThan(3000);
      
      if (i % 10 === 0) {
        console.log(`Processed ${i} messages so far...`);
      }
      
      // Small delay between messages
      await page.waitForTimeout(200);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Total time for ${messageCount} messages: ${totalTime}ms`);
    console.log(`Average time per message: ${totalTime / messageCount}ms`);
    
    // Performance shouldn't degrade significantly over time
    const avgTimePerMessage = totalTime / messageCount;
    expect(avgTimePerMessage).toBeLessThan(2000); // 2 seconds average per message including responses
    
    // All messages should be present
    const userMessages = page.locator('.message.user-message');
    await expect(userMessages).toHaveCount(messageCount);
  });
});
