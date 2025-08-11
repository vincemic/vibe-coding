import { test, expect } from '@playwright/test';

test.describe('Debug State Changes', () => {
  test('check answer section specifically', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      console.log(`Browser Console [${msg.type()}]: ${msg.text()}`);
    });

    // Navigate to the quiz page
    await page.goto('http://localhost:4200/quiz');
    
    // Wait for SignalR connection
    await page.waitForTimeout(2000);

    // Fill in player name and join
    await page.fill('.name-input', 'TestPlayer');
    await page.click('.join-button');

    // Wait for game to complete state transitions
    await page.waitForTimeout(12000); // Wait long enough for question->answer transition

    // Check current state
    const sections = {
      join: await page.locator('.join-section').isVisible(),
      waiting: await page.locator('.waiting-section').isVisible(),
      starting: await page.locator('.starting-section').isVisible(),
      question: await page.locator('.question-section').isVisible(),
      answer: await page.locator('.answer-section').isVisible(),
      results: await page.locator('.results-section').isVisible(),
      gameover: await page.locator('.gameover-section').isVisible()
    };
    
    console.log('Section visibility:', sections);

    // Check if answer section exists in DOM even if not visible
    const answerSectionExists = await page.locator('.answer-section').count() > 0;
    console.log('Answer section exists in DOM:', answerSectionExists);
    
    if (answerSectionExists) {
      const answerSectionHTML = await page.locator('.answer-section').innerHTML();
      console.log('Answer section HTML length:', answerSectionHTML.length);
      console.log('Answer section HTML preview:', answerSectionHTML.substring(0, 200));
    }

    // Check if answer options exist
    const answerOptions = await page.locator('.option-button').count();
    console.log('Number of answer options found:', answerOptions);

    // Force test to pass so we can see the logs
    expect(true).toBe(true);
  });
});
