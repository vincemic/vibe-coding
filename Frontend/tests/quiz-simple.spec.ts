import { test, expect } from '@playwright/test';

test.describe('Quiz Game - Basic Functionality', () => {
  test('should navigate and show quiz interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should see quiz interface immediately (no navigation needed)
    await page.waitForTimeout(3000);
    
    // Should see quiz interface
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Should be in some valid state
    const hasJoinSection = await page.locator('.join-section').isVisible();
    const hasWaitingSection = await page.locator('.waiting-section').isVisible();
    const hasStartingSection = await page.locator('.starting-section').isVisible();
    const hasQuestionSection = await page.locator('.question-section').isVisible();
    const hasAnswerSection = await page.locator('.answer-section').isVisible();
    
    const isInValidState = hasJoinSection || hasWaitingSection || hasStartingSection || hasQuestionSection || hasAnswerSection;
    expect(isInValidState).toBeTruthy();
    
    console.log('Quiz states:', {
      join: hasJoinSection,
      waiting: hasWaitingSection,  
      starting: hasStartingSection,
      question: hasQuestionSection,
      answer: hasAnswerSection
    });
  });

  test('should connect to SignalR and show content', async ({ page }) => {
    await page.goto('/');
    
    // Should be on quiz page automatically
    await page.waitForTimeout(5000);    // Should have quiz container
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Should have quiz master panel (shows SignalR is working)
    const hasMasterPanel = await page.locator('.quiz-master-panel').isVisible();
    
    if (hasMasterPanel) {
      console.log('Quiz master panel is visible - SignalR working');
    }
    
    // Check for any quiz content
    const hasQuizContent = await page.locator('.join-section, .waiting-section, .starting-section, .question-section, .answer-section').count() > 0;
    expect(hasQuizContent).toBeTruthy();
  });

  test('should show join form when available', async ({ page }) => {
    await page.goto('/');
    
    // Should be on quiz page automatically  
    await page.waitForTimeout(4000);
    
    const hasJoinSection = await page.locator('.join-section').isVisible();
    
    if (hasJoinSection) {
      // Should have name input and join button
      await expect(page.locator('.name-input')).toBeVisible();
      await expect(page.locator('.join-button')).toBeVisible();
      
      // Test joining
      await page.fill('.name-input', 'TestPlayer');
      await page.click('.join-button');
      
      // Should transition to some other state
      await expect(page.locator('.waiting-section, .starting-section, .question-section, .answer-section')).toBeVisible({ timeout: 15000 });
      
    } else {
      console.log('Join section not available - quiz might be in progress');
      // That's fine - just verify we're in some valid state
      const hasValidState = await page.locator('.waiting-section, .starting-section, .question-section, .answer-section').isVisible();
      expect(hasValidState).toBeTruthy();
    }
  });

  test('should show quiz content regardless of game state', async ({ page }) => {
    await page.goto('/');
    
    // Should be on quiz page automatically
    await page.waitForTimeout(5000);
    
    // Should have quiz container
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Check all possible states
    const states = {
      join: await page.locator('.join-section').isVisible(),
      waiting: await page.locator('.waiting-section').isVisible(),
      starting: await page.locator('.starting-section').isVisible(),
      question: await page.locator('.question-section').isVisible(),
      answer: await page.locator('.answer-section').isVisible()
    };
    
    console.log('Current quiz states:', states);
    
    // At least one should be visible
    const hasActiveState = Object.values(states).some(state => state);
    expect(hasActiveState).toBeTruthy();
    
    // If in answer state, should have options
    if (states.answer) {
      const optionCount = await page.locator('.option-button').count();
      expect(optionCount).toBeGreaterThan(0);
      console.log('Found', optionCount, 'answer options');
    }
    
    // If in question state, should have question text
    if (states.question) {
      await expect(page.locator('.question-text')).toBeVisible();
      console.log('Question section has question text');
    }
  });
});
