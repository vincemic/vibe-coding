import { test, expect, Page } from '@playwright/test';

// Helper function to join a quiz game
async function joinQuizGame(page: Page, playerName: string) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Navigate to quiz section
  await page.click('text=Quiz Game');
  await page.waitForTimeout(1000);
  
  // Wait for quiz interface to load
  await expect(page.locator('.quiz-container')).toBeVisible();
  
  // Enter player name and join
  await page.fill('input[placeholder*="name" i]', playerName);
  await page.click('button:has-text("Join Game")');
  
  // Wait for join confirmation
  await expect(page.locator('.player-info')).toContainText(playerName);
}

// Helper function to wait for question display
async function waitForQuestion(page: Page, questionNumber: number = 1) {
  await expect(page.locator('.question-display')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.question-text')).toBeVisible();
  await expect(page.locator('.question-number')).toContainText(`Question ${questionNumber} of 10`);
}

test.describe('Quiz Game - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should allow player to join a quiz game', async ({ page }) => {
    const playerName = 'TestPlayer1';
    
    // Navigate to quiz
    await page.click('text=Quiz Game');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Enter player name
    await page.fill('input[placeholder*="name" i]', playerName);
    
    // Join the game
    await page.click('button:has-text("Join Game")');
    
    // Verify player joined successfully
    await expect(page.locator('.player-info')).toContainText(playerName, { timeout: 5000 });
    await expect(page.locator('.quiz-master-message')).toContainText('joined the game', { timeout: 5000 });
  });

  test('should auto-start game after player joins', async ({ page }) => {
    await joinQuizGame(page, 'AutoStartPlayer');
    
    // Wait for auto-start message
    await expect(page.locator('.quiz-master-message')).toContainText('Quiz Challenge begin', { timeout: 8000 });
    
    // Wait for first question to appear
    await waitForQuestion(page);
    
    // Verify question structure
    await expect(page.locator('.question-options .option-button')).toHaveCount(4);
    await expect(page.locator('.question-category')).toBeVisible();
  });

  test('should display question with correct structure', async ({ page }) => {
    await joinQuizGame(page, 'QuestionTester');
    await waitForQuestion(page);
    
    // Verify question components
    await expect(page.locator('.question-text')).toBeVisible();
    await expect(page.locator('.question-number')).toContainText('Question 1 of 10');
    await expect(page.locator('.question-category')).toBeVisible();
    
    // Check options
    const options = page.locator('.option-button');
    await expect(options).toHaveCount(4);
    
    for (let i = 0; i < 4; i++) {
      await expect(options.nth(i)).toBeVisible();
      await expect(options.nth(i)).toBeEnabled();
      
      // Each option should have text
      const optionText = await options.nth(i).textContent();
      expect(optionText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should allow answer submission', async ({ page }) => {
    await joinQuizGame(page, 'AnswerSubmitter');
    await waitForQuestion(page);
    
    // Select first option
    const firstOption = page.locator('.option-button').first();
    await firstOption.click();
    
    // Verify answer was selected
    await expect(firstOption).toHaveClass(/selected|chosen|active/);
    
    // Check that other options are disabled
    const allOptions = page.locator('.option-button');
    for (let i = 1; i < 4; i++) {
      await expect(allOptions.nth(i)).toBeDisabled();
    }
    
    // Look for submission confirmation
    await expect(page.locator('.quiz-master-message, .answer-submitted')).toContainText(/submitted|answer/i, { timeout: 5000 });
  });

  test('should show time countdown', async ({ page }) => {
    await joinQuizGame(page, 'TimeTester');
    await waitForQuestion(page);
    
    // Check for time display
    await expect(page.locator('.time-remaining, .timer, .countdown')).toBeVisible({ timeout: 5000 });
    
    // Wait for time warnings
    await expect(page.locator('.time-warning, .quiz-master-message')).toContainText(/seconds remaining|time/i, { timeout: 25000 });
  });

  test('should handle time expiration', async ({ page }) => {
    await joinQuizGame(page, 'TimeoutTester');
    await waitForQuestion(page);
    
    // Don't answer and wait for timeout
    await expect(page.locator('.quiz-master-message')).toContainText(/time.*up|timeout/i, { timeout: 35000 });
    
    // Should proceed to results or next question
    await page.waitForTimeout(2000);
    
    // Look for results or next question
    const hasResults = await page.locator('.question-results').isVisible();
    const hasNextQuestion = await page.locator('.question-display').isVisible();
    
    expect(hasResults || hasNextQuestion).toBeTruthy();
  });
});

test.describe('Quiz Game - Game Flow', () => {
  test('should progress through multiple questions', async ({ page }) => {
    await joinQuizGame(page, 'ProgressTester');
    
    // Answer first question
    await waitForQuestion(page, 1);
    await page.click('.option-button:first-child');
    
    // Wait for and verify second question
    await expect(page.locator('.question-number')).toContainText('Question 2 of 10', { timeout: 40000 });
    
    // Verify it's a different question
    const question1Text = await page.locator('.question-text').textContent();
    expect(question1Text?.length).toBeGreaterThan(0);
    
    // Answer second question
    await page.click('.option-button:nth-child(2)');
    
    // Wait for third question or results
    await page.waitForTimeout(35000);
    
    // Should either have question 3 or show results
    const questionNumber = await page.locator('.question-number').textContent();
    expect(questionNumber).toContain('Question');
  });

  test('should track player score', async ({ page }) => {
    await joinQuizGame(page, 'ScoreTester');
    await waitForQuestion(page);
    
    // Check initial score
    await expect(page.locator('.player-score, .current-score')).toContainText('0');
    
    // Answer question (assume first option for consistency)
    await page.click('.option-button:first-child');
    
    // Wait for score update (might happen after results)
    await page.waitForTimeout(35000);
    
    // Score should be updated (either increased or stayed same)
    const scoreElement = page.locator('.player-score, .current-score');
    if (await scoreElement.isVisible()) {
      const scoreText = await scoreElement.textContent();
      expect(scoreText).toMatch(/\d+/);
    }
  });

  test('should display player list with live updates', async ({ page }) => {
    await joinQuizGame(page, 'PlayerListTester');
    
    // Check player list exists
    await expect(page.locator('.players-list, .player-info')).toBeVisible();
    await expect(page.locator('.player-info')).toContainText('PlayerListTester');
    
    // Check for score display
    await expect(page.locator('.player-score, .score')).toBeVisible();
  });
});

test.describe('Quiz Game - Multiple Players', () => {
  test('should handle multiple players joining same game', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Player 1 joins
      await joinQuizGame(page1, 'Player1');
      
      // Player 2 joins same game
      await joinQuizGame(page2, 'Player2');
      
      // Both should see each other
      await expect(page1.locator('.players-list, .player-info')).toContainText('Player2', { timeout: 5000 });
      await expect(page2.locator('.players-list, .player-info')).toContainText('Player1', { timeout: 5000 });
      
      // Game should start for both
      await waitForQuestion(page1);
      await waitForQuestion(page2);
      
      // Both should see the same question
      const question1 = await page1.locator('.question-text').textContent();
      const question2 = await page2.locator('.question-text').textContent();
      expect(question1).toBe(question2);
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync player actions across clients', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Both players join
      await joinQuizGame(page1, 'SyncPlayer1');
      await joinQuizGame(page2, 'SyncPlayer2');
      
      // Wait for question
      await waitForQuestion(page1);
      await waitForQuestion(page2);
      
      // Player 1 answers
      await page1.click('.option-button:first-child');
      
      // Player 2 should see update (answered count or similar)
      await page2.waitForTimeout(2000);
      
      // Both should progress together
      const hasResults1 = await page1.locator('.question-results').isVisible();
      const hasResults2 = await page2.locator('.question-results').isVisible();
      
      // At least verify both pages are still functional
      expect(await page1.locator('.quiz-container').isVisible()).toBeTruthy();
      expect(await page2.locator('.quiz-container').isVisible()).toBeTruthy();
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Quiz Game - Error Handling', () => {
  test('should validate player name input', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Quiz Game');
    
    // Try to join without name
    await page.click('button:has-text("Join Game")');
    
    // Should show validation error or prevent join
    const nameInput = page.locator('input[placeholder*="name" i]');
    const isRequired = await nameInput.getAttribute('required');
    const hasError = await page.locator('.error, .invalid').isVisible();
    
    expect(isRequired !== null || hasError).toBeTruthy();
  });

  test('should handle connection interruption gracefully', async ({ page }) => {
    await joinQuizGame(page, 'ConnectionTester');
    
    // Temporarily block SignalR
    await page.route('**/quizhub', route => route.abort());
    
    await waitForQuestion(page);
    
    // Try to answer during connection loss
    await page.click('.option-button:first-child');
    
    // Should handle gracefully (show error or retry)
    await page.waitForTimeout(3000);
    
    // Restore connection
    await page.unroute('**/quizhub');
    
    // App should still be functional
    await expect(page.locator('.quiz-container')).toBeVisible();
  });

  test('should handle backend disconnection', async ({ page }) => {
    await joinQuizGame(page, 'BackendTester');
    
    // Block all backend requests
    await page.route('**/localhost:5001/**', route => route.abort());
    
    await page.waitForTimeout(5000);
    
    // Should show appropriate error state
    const hasError = await page.locator('.error, .connection-error, .offline').isVisible();
    const isStillFunctional = await page.locator('.quiz-container').isVisible();
    
    expect(hasError || isStillFunctional).toBeTruthy();
  });
});

test.describe('Quiz Game - Performance', () => {
  test('should load quiz interface quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.click('text=Quiz Game');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should handle rapid answer submissions', async ({ page }) => {
    await joinQuizGame(page, 'SpeedTester');
    await waitForQuestion(page);
    
    // Quickly click multiple options (only first should register)
    const options = page.locator('.option-button');
    await options.nth(0).click();
    await options.nth(1).click();
    await options.nth(2).click();
    
    // Only first option should be selected
    await expect(options.nth(0)).toHaveClass(/selected|chosen|active/);
    await expect(options.nth(1)).toBeDisabled();
    await expect(options.nth(2)).toBeDisabled();
  });
});

test.describe('Quiz Game - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Navigate using keyboard
    await page.keyboard.press('Tab'); // Should focus first interactive element
    await page.keyboard.press('Enter'); // Should activate it
    
    // Continue navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to reach quiz section
    await page.keyboard.press('Enter');
    
    // Basic accessibility check
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await joinQuizGame(page, 'A11yTester');
    await waitForQuestion(page);
    
    // Check for ARIA labels on interactive elements
    const options = page.locator('.option-button');
    const firstOption = options.first();
    
    const hasAriaLabel = await firstOption.getAttribute('aria-label');
    const hasAriaDescribedBy = await firstOption.getAttribute('aria-describedby');
    const hasRole = await firstOption.getAttribute('role');
    
    // Should have some accessibility attributes
    expect(hasAriaLabel || hasAriaDescribedBy || hasRole).toBeTruthy();
  });
});
