import { test, expect } from '@playwright/test';

test.describe('Quiz Game - State Debug', () => {
  test('monitor component state changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to quiz
    await page.click('text=Quiz Game');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Fill name and join
    await page.fill('.name-input', 'StateDebugPlayer');
    await page.click('.join-button');
    
    console.log('Join button clicked');
    
    // Wait for backend to process
    await page.waitForTimeout(15000);
    
    // Check component state via JavaScript
    const componentState = await page.evaluate(() => {
      // Access Angular component instance
      const element = document.querySelector('app-quiz');
      if (element && (element as any).componentInstance) {
        const component = (element as any).componentInstance;
        return {
          currentState: component.currentState,
          isJoining: component.isJoining,
          currentPlayer: component.currentPlayer,
          playerName: component.playerName,
          hasQuestionData: !!component.currentQuestion
        };
      }
      return null;
    });
    
    console.log('Component state:', componentState);
    
    // Check DOM state
    const domState = {
      hasJoinSection: await page.locator('.join-section').isVisible(),
      hasWaitingSection: await page.locator('.waiting-section').isVisible(),
      hasStartingSection: await page.locator('.starting-section').isVisible(),
      hasQuestionSection: await page.locator('.question-section').isVisible(),
      hasAnswerSection: await page.locator('.answer-section').isVisible(),
      joinButtonText: await page.locator('.join-button').textContent(),
      joinButtonDisabled: await page.locator('.join-button').isDisabled()
    };
    
    console.log('DOM state:', domState);
    
    // Force change detection
    await page.evaluate(() => {
      const element = document.querySelector('app-quiz');
      if (element && (element as any).componentInstance) {
        const component = (element as any).componentInstance;
        // Try to access Angular's change detector
        if (component.cdr) {
          component.cdr.detectChanges();
        }
      }
    });
    
    // Check state again after manual change detection
    await page.waitForTimeout(1000);
    
    const domStateAfter = {
      hasJoinSection: await page.locator('.join-section').isVisible(),
      hasWaitingSection: await page.locator('.waiting-section').isVisible(),
      hasStartingSection: await page.locator('.starting-section').isVisible(),
      hasQuestionSection: await page.locator('.question-section').isVisible(),
      hasAnswerSection: await page.locator('.answer-section').isVisible()
    };
    
    console.log('DOM state after change detection:', domStateAfter);
  });
});
