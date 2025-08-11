import { test, expect } from '@playwright/test';

test('Debug: Check state progression with console logs', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Quiz loads directly - no navigation needed
  await expect(page.locator('.quiz-container')).toBeVisible();

  console.log('=== Initial State Check ===');
  console.log('Join section visible:', await page.locator('.join-section').isVisible());
  console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
  console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
  console.log('Question section visible:', await page.locator('.question-section').isVisible());
  console.log('Answer section visible:', await page.locator('.answer-section').isVisible());

  // If in join state, join the game
  const inJoinState = await page.locator('.join-section').isVisible();
  if (inJoinState) {
    console.log('Joining game...');
    await page.fill('.name-input', 'DebugPlayer');
    await page.click('.join-button');
    await page.waitForTimeout(2000);
  }

  console.log('=== After Join (2s) ===');
  console.log('Join section visible:', await page.locator('.join-section').isVisible());
  console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
  console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
  console.log('Question section visible:', await page.locator('.question-section').isVisible());
  console.log('Answer section visible:', await page.locator('.answer-section').isVisible());

  // Wait for auto-start (should happen around 3 seconds after joining)
  console.log('=== Waiting 5s for auto-start ===');
  await page.waitForTimeout(5000);

  console.log('=== After 5s wait ===');
  console.log('Join section visible:', await page.locator('.join-section').isVisible());
  console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
  console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
  console.log('Question section visible:', await page.locator('.question-section').isVisible());
  console.log('Answer section visible:', await page.locator('.answer-section').isVisible());

  // Wait longer for question progression
  console.log('=== Waiting 10s for question progression ===');
  await page.waitForTimeout(10000);

  console.log('=== After 10s wait ===');
  console.log('Join section visible:', await page.locator('.join-section').isVisible());
  console.log('Waiting section visible:', await page.locator('.waiting-section').isVisible());
  console.log('Starting section visible:', await page.locator('.starting-section').isVisible());
  console.log('Question section visible:', await page.locator('.question-section').isVisible());
  console.log('Answer section visible:', await page.locator('.answer-section').isVisible());

  // Check if there's any question content
  const hasQuestionText = await page.locator('.question-text').count();
  const hasProgressText = await page.locator('.progress-text').count();
  console.log('Question text elements:', hasQuestionText);
  console.log('Progress text elements:', hasProgressText);

  if (hasProgressText > 0) {
    const progressText = await page.locator('.progress-text').textContent();
    console.log('Progress text content:', progressText);
  }
});
