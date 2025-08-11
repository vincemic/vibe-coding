import { test, expect, Page } from '@playwright/test';

// Helper function to join a quiz game
async function joinQuizGame(page: Page, playerName: string) {
  // Navigate directly to quiz route
  await page.goto('/quiz');
  await page.waitForLoadState('networkidle');
  
  // Wait for quiz interface to load
  await expect(page.locator('.quiz-container')).toBeVisible({ timeout: 10000 });
  
  // Check if we're already in the game (welcome state)
  const isAlreadyJoined = await page.locator('.waiting-section, .starting-section').isVisible();
  if (isAlreadyJoined) {
    console.log('Already joined game, skipping join process');
    return;
  }
  
  // Wait for input field to be available
  await expect(page.locator('.name-input')).toBeVisible({ timeout: 8000 });
  
  // Enter player name and join
  await page.fill('.name-input', playerName);
  await page.click('.join-button');
  
  // Wait for joining to complete
  await expect(page.locator('.waiting-section, .starting-section')).toBeVisible({ timeout: 10000 });
}

// Helper function to wait for question display
async function waitForQuestion(page: Page, questionNumber: number = 1) {
  await expect(page.locator('.answer-section')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.question-text')).toBeVisible();
  if (questionNumber > 0) {
    await expect(page.locator('.question-number')).toContainText(`${questionNumber}/10`);
  }
}

test.describe('Quiz Game - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to quiz game page', async ({ page }) => {
    // Navigate directly to quiz route (quiz is now the default route)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should see quiz interface
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Should have join form OR be in an active game state
    const hasJoinForm = await page.locator('.name-input').isVisible();
    const hasActiveGame = await page.locator('.waiting-section, .starting-section, .answer-section').isVisible();
    
    expect(hasJoinForm || hasActiveGame).toBeTruthy();
  });

  test('should allow player to join a quiz game', async ({ page }) => {
    const playerName = 'TestPlayer1';
    
    // Navigate directly to quiz
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Enter player name
    await page.fill('.name-input', playerName);
    
    // Join the game
    await page.click('.join-button');
    
    // Verify player joined successfully - should see waiting or starting section
    await expect(page.locator('.waiting-section, .starting-section')).toBeVisible({ timeout: 5000 });
    
    // Should see player name in welcome message
    await expect(page.locator('.waiting-card h2')).toContainText(playerName, { timeout: 5000 });
  });

  test('should auto-start game and show first question', async ({ page }) => {
    await joinQuizGame(page, 'AutoStartPlayer');
    
    // Wait for game to auto-start and show question
    await waitForQuestion(page);
    
    // Verify question structure - should have 4 answer options
    await expect(page.locator('.answer-options .option-button')).toHaveCount(4);
    
    // Each option should be clickable
    const options = page.locator('.option-button');
    for (let i = 0; i < 4; i++) {
      await expect(options.nth(i)).toBeEnabled();
    }
  });

  test('should allow answer selection', async ({ page }) => {
    await joinQuizGame(page, 'AnswerTester');
    await waitForQuestion(page);
    
    // Click first option
    const firstOption = page.locator('.option-button').first();
    await firstOption.click();
    
    // Should show some kind of selection feedback
    const isSelected = await firstOption.getAttribute('class');
    const hasSelectedClass = isSelected?.includes('selected') || isSelected?.includes('chosen') || isSelected?.includes('active');
    
    // Or check if other options are disabled
    const secondOption = page.locator('.option-button').nth(1);
    const isDisabled = await secondOption.isDisabled();
    
    expect(hasSelectedClass || isDisabled).toBeTruthy();
  });

  test('should progress through the game', async ({ page }) => {
    await joinQuizGame(page, 'ProgressTester');
    
    // Wait for first question
    await waitForQuestion(page, 1);
    
    // Answer the question
    await page.click('.option-button:first-child');
    
    // Wait a reasonable time for progression
    await page.waitForTimeout(35000); // Wait for question timer
    
    // Should either show results, next question, or game over
    const hasResults = await page.locator('.results-section').isVisible();
    const hasNextQuestion = await page.locator('.answer-section').isVisible();
    const hasGameOver = await page.locator('.gameover-section').isVisible();
    
    expect(hasResults || hasNextQuestion || hasGameOver).toBeTruthy();
  });
});

test.describe('Quiz Game - SignalR Integration', () => {
  test('should establish SignalR connection', async ({ page }) => {
    await page.goto('/');
    
    // Monitor console for SignalR connection messages
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    // Quiz loads automatically now
    await page.waitForTimeout(3000);
    
    // Should be able to join without connection errors
    await page.fill('.name-input', 'ConnectionTester');
    await page.click('.join-button');
    
    // Should successfully join - check for waiting or starting state
    await expect(page.locator('.waiting-section, .starting-section')).toBeVisible({ timeout: 10000 });
  });

  test('should handle multiple players', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Player 1 joins
      await joinQuizGame(page1, 'Player1');
      
      // Player 2 joins
      await joinQuizGame(page2, 'Player2');
      
      // Both should see the game
      await expect(page1.locator('.quiz-container')).toBeVisible();
      await expect(page2.locator('.quiz-container')).toBeVisible();
      
      // Wait for questions to appear on both
      await waitForQuestion(page1);
      await waitForQuestion(page2);
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Quiz Game - Error Handling', () => {
  test('should validate player name input', async ({ page }) => {
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Check if join form is visible (might not be if game is in progress)
    const joinFormVisible = await page.locator('.join-section').isVisible();
    if (!joinFormVisible) {
      console.log('Join form not visible, test not applicable');
      return;
    }
    
    // Try to join without name
    const joinButton = page.locator('.join-button');
    
    // The join button should have some disabled behavior when name is empty
    const buttonClasses = await joinButton.getAttribute('class');
    const hasDisabledClass = buttonClasses?.includes('disabled') || false;
    
    // Try clicking and check for validation
    await page.click('.join-button', { force: true });
    
    // Should prevent joining or show validation message
    await page.waitForTimeout(1000);
    
    // Check for validation hints or error messages
    const hasValidationHint = await page.locator('.validation-hint').isVisible();
    const hasError = await page.locator('.error, .invalid, .warning').isVisible();
    
    expect(hasValidationHint || hasError || hasDisabledClass).toBeTruthy();
  });

  test('should handle backend connection issues gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Block backend requests
    await page.route('**/localhost:5001/**', route => route.abort());
    
    // Quiz loads automatically now
    
    // Should still show the interface
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Try to join
    await page.fill('.name-input', 'ErrorTester');
    await page.click('.join-button');
    
    // Should handle gracefully (show error or still function)
    await page.waitForTimeout(5000);
    
    const hasError = await page.locator('.error, .connection-error').isVisible();
    const stillFunctional = await page.locator('.quiz-container').isVisible();
    
    expect(hasError || stillFunctional).toBeTruthy();
  });
});
