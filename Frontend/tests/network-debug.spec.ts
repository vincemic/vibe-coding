import { test, expect } from '@playwright/test';

test.describe('Quiz Game - SignalR Debug', () => {
  test('monitor console and network during join', async ({ page }) => {
    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });

    // Capture network responses
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('Initial requests:', requests.slice(-5));
    
    // Navigate to quiz
    await page.click('text=Quiz Game');
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    console.log('After navigation requests:', requests.slice(-5));
    console.log('Console logs so far:', logs.slice(-5));
    
    // Fill name and join
    await page.fill('.name-input', 'NetworkDebugPlayer');
    await page.click('.join-button');
    
    console.log('After join click requests:', requests.slice(-5));
    console.log('Console logs after join:', logs.slice(-10));
    
    // Wait longer to see what happens
    await page.waitForTimeout(10000);
    
    console.log('Final console logs:', logs);
    console.log('Final requests:', requests.filter(r => r.includes('hub') || r.includes('5001')));
    console.log('Final responses:', responses.filter(r => r.includes('hub') || r.includes('5001')));
    
    // Check if still in joining state
    const isStillJoining = await page.locator('.join-section').isVisible();
    const joinButtonText = await page.locator('.join-button').textContent();
    
    console.log('Still in joining state:', isStillJoining);
    console.log('Join button text:', joinButtonText);
  });
});
