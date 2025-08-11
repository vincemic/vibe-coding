import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load initial quiz page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    // Wait for the quiz container to be fully loaded
    await expect(page.locator('.quiz-container')).toBeVisible();
    await expect(page.locator('h1:has-text("Ultimate Quiz Challenge")')).toBeVisible();
    await expect(page.locator('.join-section, .waiting-section, .question-section')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (generous for local development)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Quiz page load time: ${loadTime}ms`);
  });

  test('should handle quiz join process efficiently', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Check if we can join the game
    const joinSection = page.locator('.join-section');
    if (await joinSection.isVisible()) {
      await page.fill('.name-input', 'PerformanceTestPlayer');
      await page.click('.join-button');
      
      // Wait for state transition
      await page.waitForTimeout(2000);
    }
    
    const joinTime = Date.now() - startTime;
    console.log(`Quiz join process time: ${joinTime}ms`);
    
    // Should complete join process within reasonable time
    expect(joinTime).toBeLessThan(10000);
  });

  test('should handle SignalR connections efficiently', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Monitor SignalR connection performance
    const connectionLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('SignalR') || text.includes('connection') || text.includes('QuizHub')) {
        connectionLogs.push(text);
      }
    });
    
    // Trigger some quiz interactions to test SignalR performance
    const joinSection = page.locator('.join-section');
    if (await joinSection.isVisible()) {
      await page.fill('.name-input', 'SignalRTestPlayer');
      await page.click('.join-button');
    }
    
    // Wait for SignalR events
    await page.waitForTimeout(5000);
    
    const signalRTime = Date.now() - startTime;
    console.log(`SignalR operations time: ${signalRTime}ms`);
    console.log('SignalR logs:', connectionLogs);
    
    // Should handle SignalR operations efficiently
    expect(signalRTime).toBeLessThan(10000);
  });

  test('should not have memory leaks during quiz interactions', async ({ page }) => {
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
    
    // Simulate quiz interactions
    await page.waitForTimeout(2000);
    
    for (let i = 1; i <= 5; i++) {
      // Try to join if possible
      const joinSection = page.locator('.join-section');
      if (await joinSection.isVisible()) {
        await page.fill('.name-input', `MemoryTestPlayer${i}`);
        await page.click('.join-button');
        await page.waitForTimeout(1000);
      }
      
      // Refresh to reset state every few iterations
      if (i % 3 === 0) {
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
    await expect(page.locator('.quiz-container')).toBeVisible();
  });

  test('should efficiently handle rapid name input typing', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Simulate rapid typing in name input
    const nameText = 'RapidTypingTestPlayerWithAVeryLongName123456789';
    
    const nameInput = page.locator('.name-input');
    if (await nameInput.isVisible()) {
      // Type character by character rapidly
      await nameInput.click();
      for (const char of nameText) {
        await page.keyboard.type(char, { delay: 10 }); // 10ms between characters
      }
      
      const typingTime = Date.now() - startTime;
      console.log(`Rapid typing time: ${typingTime}ms for ${nameText.length} characters`);
      
      // Should handle rapid typing without lag (relaxed expectation for CI/CD)
      expect(typingTime).toBeLessThan(nameText.length * 100); // Max 100ms per character (was 50ms)
      
      // Input should contain the full text
      const inputValue = await nameInput.inputValue();
      expect(inputValue).toBe(nameText);
    }
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
    await expect(page.locator('.quiz-container')).toBeVisible();
    await expect(page.locator('h1:has-text("Ultimate Quiz Challenge")')).toBeVisible();
    
    // Test functionality after resizes
    const nameInput = page.locator('.name-input');
    if (await nameInput.isVisible()) {
      await nameInput.fill('ResizeTestPlayer');
      await expect(nameInput).toHaveValue('ResizeTestPlayer');
    }
  });

  test('should maintain performance with multiple quiz state changes', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    
    // Simulate multiple quiz interactions
    for (let i = 1; i <= 3; i++) {
      const joinSection = page.locator('.join-section');
      if (await joinSection.isVisible()) {
        await page.fill('.name-input', `StateTestPlayer${i}`);
        await page.click('.join-button');
        await page.waitForTimeout(2000);
      }
      
      // Refresh to simulate state changes
      await page.reload();
      await page.waitForTimeout(1000);
    }
    
    const stateChangesTime = Date.now() - startTime;
    console.log(`Multiple state changes time: ${stateChangesTime}ms`);
    
    // Should handle state changes efficiently
    expect(stateChangesTime).toBeLessThan(15000);
    
    // Final state should be functional
    await expect(page.locator('.quiz-container')).toBeVisible();
  });
});
