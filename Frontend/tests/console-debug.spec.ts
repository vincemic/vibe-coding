import { test, expect } from '@playwright/test';

test.describe('Quiz Game - Console Debug', () => {
  test('capture console logs during join', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Quiz loads directly on main page now
    await expect(page.locator('.quiz-container')).toBeVisible();
    
    // Wait a bit to see initial state and capture logs
    await page.waitForTimeout(5000);
    
    // Check what state we're in
    const isInJoinState = await page.locator('.join-section').isVisible();
    const isInWaitingState = await page.locator('.waiting-section').isVisible();
    
    console.log('Initial state - Join visible:', isInJoinState, 'Waiting visible:', isInWaitingState);
    
    if (isInJoinState) {
      console.log('In join state - attempting to fill and join');
      await page.fill('.name-input', 'ConsoleDebugPlayer');
      await page.click('.join-button');
      await page.waitForTimeout(5000);
    } else {
      console.log('Not in join state - just observing current state');
    }
    
    // Wait for more events
    await page.waitForTimeout(5000);
    
    // Print all console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => {
      console.log(log);
    });
    
    // Look for specific events
    const playerJoinedLogs = consoleLogs.filter(log => log.includes('PlayerJoined') || log.includes('Current player'));
    const gameStateLogs = consoleLogs.filter(log => log.includes('GameStateUpdate') || log.includes('Game state changing'));
    const masterMessageLogs = consoleLogs.filter(log => log.includes('Quiz master message'));
    
    console.log('\n=== Player Join Events ===');
    playerJoinedLogs.forEach(log => console.log(log));
    
    console.log('\n=== Game State Events ===');
    gameStateLogs.forEach(log => console.log(log));
    
    console.log('\n=== Quiz Master Messages ===');
    masterMessageLogs.forEach(log => console.log(log));
  });
});
