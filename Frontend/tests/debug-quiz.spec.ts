import { test, expect } from '@playwright/test';

test.describe('Quiz Game - Debug Tests', () => {
  test('debug what happens after join', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to quiz
    await page.click('text=Quiz Game');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    console.log('Quiz container visible');
    
    // Check initial state
    const initialContent = await page.locator('.quiz-content').innerHTML();
    console.log('Initial content:', initialContent);
    
    // Fill name and try to join
    await page.fill('.name-input', 'DebugPlayer');
    
    console.log('Name filled');
    
    // Check if join button is enabled
    const joinButton = page.locator('.join-button');
    const isEnabled = await joinButton.isEnabled();
    console.log('Join button enabled:', isEnabled);
    
    if (isEnabled) {
      await joinButton.click();
      console.log('Join button clicked');
      
      // Wait a bit and see what happens
      await page.waitForTimeout(5000);
      
      // Get current content
      const afterClickContent = await page.locator('.quiz-content').innerHTML();
      console.log('Content after click:', afterClickContent);
      
      // Check all possible states
      const hasJoining = await page.locator('.join-section').isVisible();
      const hasWaiting = await page.locator('.waiting-section').isVisible();
      const hasStarting = await page.locator('.starting-section').isVisible();
      const hasQuestion = await page.locator('.question-section').isVisible();
      const hasAnswer = await page.locator('.answer-section').isVisible();
      
      console.log('States:', { hasJoining, hasWaiting, hasStarting, hasQuestion, hasAnswer });
      
      // Check for any error messages
      const errorMessages = await page.locator('.error, .warning, .message').count();
      console.log('Error messages count:', errorMessages);
      
      if (errorMessages > 0) {
        const errors = await page.locator('.error, .warning, .message').allTextContents();
        console.log('Error messages:', errors);
      }
      
      // Check connection status
      const connectionStatus = await page.locator('.connection-status').textContent();
      console.log('Connection status:', connectionStatus);
      
    } else {
      console.log('Join button is disabled');
    }
  });
  
  test('check backend availability', async ({ page }) => {
    // Test if backend is reachable
    try {
      const response = await page.request.get('http://localhost:5001/api/health');
      console.log('Backend health status:', response.status());
      const body = await response.text();
      console.log('Backend health response:', body);
    } catch (error) {
      console.log('Backend not available:', error);
    }
  });
});
