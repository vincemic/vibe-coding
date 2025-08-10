import { test, expect } from '@playwright/test';

test.describe('Quiz Game - Simple Debug', () => {
  test('check what sections are visible after join', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to quiz
    await page.click('text=Quiz Game');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    console.log('=== Initial State ===');
    console.log('Join section visible:', await page.locator('.join-section').isVisible());
    console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
    console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
    console.log('Question section visible:', await page.locator('.question-section').isVisible());
    console.log('Answer section visible:', await page.locator('.answer-section').isVisible());
    
    // Check if we need to join or if we're already in waiting state
    const isInJoinState = await page.locator('.join-section').isVisible();
    const isInWaitingState = await page.locator('.waiting-section').isVisible();
    
    if (isInJoinState) {
      console.log('In join state - filling name and joining');
      // Fill name and join
      await page.fill('.name-input', 'DebugPlayer');
      await page.click('.join-button');
      
      console.log('\n=== After Join Click (2s) ===');
      await page.waitForTimeout(2000);
    } else if (isInWaitingState) {
      console.log('Already in waiting state - game state management is working!');
    } else {
      console.log('Unknown state - checking what is visible...');
    }
    
    // Check final state after any transitions
    console.log('\n=== Final State Check ===');
    console.log('Join section visible:', await page.locator('.join-section').isVisible());
    console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
    console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
    console.log('Question section visible:', await page.locator('.question-section').isVisible());
    console.log('Answer section visible:', await page.locator('.answer-section').isVisible());
    
    // Wait for potential game progression
    console.log('\n=== After 10s wait ===');
    await page.waitForTimeout(10000);
    console.log('Join section visible:', await page.locator('.join-section').isVisible());
    console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
    console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
    console.log('Question section visible:', await page.locator('.question-section').isVisible());
    console.log('Answer section visible:', await page.locator('.answer-section').isVisible());
    
    // Check if any content is present
    const content = await page.locator('.quiz-content').innerHTML();
    console.log('\n=== Quiz Content HTML ===');
    console.log(content.substring(0, 500) + '...');
  });
});
