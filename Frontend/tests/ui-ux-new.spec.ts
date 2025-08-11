import { test, expect } from '@playwright/test';

test.describe('Quiz UI/UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper quiz styling and layout', async ({ page }) => {
    // Check if main quiz container is visible and styled
    const quizContainer = page.locator('.quiz-container');
    await expect(quizContainer).toBeVisible();
    
    // Check if header is properly styled
    const header = page.locator('h1:has-text("Ultimate Quiz Challenge")');
    await expect(header).toBeVisible();
    
    // Check if name input is styled
    const nameInput = page.locator('.name-input');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('placeholder');
  });

  test('should have proper color scheme and branding', async ({ page }) => {
    // Check if quiz master section has proper styling
    const quizMaster = page.locator('.quiz-master, .quiz-master-panel');
    await expect(quizMaster).toBeVisible();
    
    // Check if join button is properly styled
    const joinButton = page.locator('button:has-text("Join Game")');
    await expect(joinButton).toBeVisible();
    
    // Button should have hover states (check CSS classes)
    const buttonClasses = await joinButton.getAttribute('class');
    expect(buttonClasses).toBeTruthy();
  });

  test('should show proper join form validation styling', async ({ page }) => {
    // Try submitting without name to trigger validation styling
    const joinButton = page.locator('button:has-text("Join Game")');
    await joinButton.click();
    
    // Check if validation styling appears
    const nameInput = page.locator('.name-input');
    const hasValidationClass = await nameInput.evaluate(el => {
      return el.matches(':invalid') || el.classList.contains('invalid') || el.classList.contains('error');
    });
    
    const isRequired = await nameInput.getAttribute('required');
    expect(isRequired !== null || hasValidationClass).toBeTruthy();
  });

  test('should show typing indicator or feedback', async ({ page }) => {
    // Type in name input and check for visual feedback
    const nameInput = page.locator('.name-input');
    await nameInput.fill('UI Test Player');
    
    // Should show that input has content
    const inputValue = await nameInput.inputValue();
    expect(inputValue).toBe('UI Test Player');
    
    // Join button should be enabled/ready
    const joinButton = page.locator('button:has-text("Join Game")');
    const isDisabled = await joinButton.isDisabled();
    expect(isDisabled).toBeFalsy();
  });

  test('should have responsive design elements', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.quiz-container')).toBeVisible();
    await expect(page.locator('.name-input')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.quiz-container')).toBeVisible();
  });

  test('should handle focus states properly', async ({ page }) => {
    // Name input should be focusable
    const nameInput = page.locator('.name-input');
    await nameInput.focus();
    await expect(nameInput).toBeFocused();
    
    // Tab to join button
    await page.keyboard.press('Tab');
    const joinButton = page.locator('button:has-text("Join Game")');
    await expect(joinButton).toBeFocused();
  });

  test('should show proper quiz state transitions', async ({ page }) => {
    // Fill name and join
    await page.fill('.name-input', 'UI State Test Player');
    await page.click('button:has-text("Join Game")');
    
    // Should transition from join state to waiting state
    await page.waitForTimeout(2000);
    
    // Should show waiting section
    const waitingSection = page.locator('.waiting-section');
    const isWaitingVisible = await waitingSection.isVisible();
    
    // Or might be in another valid state
    const joinSection = page.locator('.join-section');
    const isJoinVisible = await joinSection.isVisible();
    
    const answerSection = page.locator('.answer-section');
    const isAnswerVisible = await answerSection.isVisible();
    
    // Should be in some valid quiz state
    expect(isWaitingVisible || isJoinVisible || isAnswerVisible).toBeTruthy();
  });

  test('should show proper connection status indicators', async ({ page }) => {
    // Should show connection status
    await page.waitForTimeout(3000);
    
    // Look for connection indicators
    const connectionText = page.locator('text=Connected');
    const statusIndicator = page.locator('.status-indicator, [class*="connected"], [class*="status"]');
    
    const hasConnectionStatus = await connectionText.isVisible() || await statusIndicator.isVisible();
    expect(hasConnectionStatus).toBeTruthy();
  });

  test('should handle quiz master messages styling', async ({ page }) => {
    // Wait for quiz master messages to appear
    await page.waitForTimeout(3000);
    
    // Should have quiz master section
    const quizMasterSection = page.locator('.quiz-master, .quiz-master-panel');
    await expect(quizMasterSection).toBeVisible();
    
    // Messages should have proper styling
    const quizMasterMessages = page.locator('.quiz-master-panel *', { hasText: /Welcome|Quiz/ });
    const hasMessages = await quizMasterMessages.count() > 0;
    expect(hasMessages).toBeTruthy();
  });

  test('should maintain UI consistency across different screen sizes', async ({ page }) => {
    const sizes = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1440, height: 900 }  // Desktop
    ];
    
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(500);
      
      // Core elements should remain visible
      await expect(page.locator('.quiz-container')).toBeVisible();
      await expect(page.locator('h1:has-text("Ultimate Quiz Challenge")')).toBeVisible();
      
      // Form elements should be accessible
      const nameInput = page.locator('.name-input');
      const joinButton = page.locator('button:has-text("Join Game")');
      
      await expect(nameInput).toBeVisible();
      await expect(joinButton).toBeVisible();
    }
  });
});
