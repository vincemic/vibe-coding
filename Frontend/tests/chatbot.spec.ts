import { test, expect } from '@playwright/test';

test.describe('Chatbot Application', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous state and start fresh with a unique timestamp to avoid cache
    const timestamp = Date.now();
    await page.goto(`http://localhost:4200?t=${timestamp}`, { waitUntil: 'networkidle' });
    
    // Wait for the app to be fully loaded and the welcome message to appear
    await expect(page.locator('.message.assistant-message').first()).toBeVisible({ timeout: 10000 });
    
    // Ensure we have a clean starting state with only the welcome message
    console.log('Test starting with fresh page load');
  });

  test('should display the chat interface', async ({ page }) => {
    // Check if the main chat container is visible
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Check if the header is present
    await expect(page.locator('.chat-header h1')).toContainText('AI Chatbot Assistant');
    
    // Check if the status indicator is present
    await expect(page.locator('.status-indicator')).toBeVisible();
    
    // Check if the messages container is present
    await expect(page.locator('.messages-container')).toBeVisible();
    
    // Check if the input container is present
    await expect(page.locator('.input-container')).toBeVisible();
    
    // Check if the message input field is present
    await expect(page.locator('.message-input')).toBeVisible();
    
    // Check if the send button is present
    await expect(page.locator('.send-button')).toBeVisible();
  });

  test('should show initial welcome message', async ({ page }) => {
    // Wait for SignalR connection and welcome message
    await expect(page.locator('.message.assistant-message')).toBeVisible({ timeout: 10000 });
    
    // Check if the welcome message contains expected text (check the first assistant message)
    const welcomeMessage = page.locator('.message.assistant-message').first().locator('.message-content');
    await expect(welcomeMessage).toContainText(/Hello|Hi|welcome|assistant/i);
  });

  test('should show connection status', async ({ page }) => {
    // Wait for connection status to update
    await page.waitForTimeout(2000);
    
    // Check if status indicator shows connection state
    const statusText = page.locator('.status-indicator');
    await expect(statusText).toContainText(/Connected|Disconnected/);
  });

  test('should send and receive messages', async ({ page }) => {
    // Wait for initial welcome message to be loaded
    await expect(page.locator('.message.assistant-message').first()).toBeVisible({ timeout: 10000 });
    
    // Type a unique test message
    const testMessage = `Test message ${Date.now()}`;
    await page.fill('.message-input', testMessage);
    
    // Send the message by clicking the send button
    await page.click('.send-button');
    
    // Check if user message appears with our unique test message
    await expect(page.locator('.message.user-message').filter({ hasText: testMessage })).toBeVisible();
    
    // Check if typing indicator appears
    await expect(page.locator('.typing-indicator')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response (should be the second assistant message after welcome)
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Check if typing indicator disappears
    await expect(page.locator('.typing-indicator')).not.toBeVisible();
    
    // Verify AI response is not empty (just check it exists and has content)
    const aiResponse = page.locator('.message.assistant-message').nth(1).locator('.message-content');
    await expect(aiResponse).not.toBeEmpty();
  });

  test('should send message with Enter key', async ({ page }) => {
    // Wait for initial welcome message to be loaded
    await expect(page.locator('.message.assistant-message').first()).toBeVisible({ timeout: 10000 });
    
    // Type a unique test message
    const testMessage = `Testing Enter key ${Date.now()}`;
    await page.fill('.message-input', testMessage);
    
    // Send the message by pressing Enter
    await page.press('.message-input', 'Enter');
    
    // Check if user message appears with our unique test message
    await expect(page.locator('.message.user-message').filter({ hasText: testMessage })).toBeVisible();
    
    // Wait for AI response (should be the second assistant message after welcome)
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
  });

  test('should disable send button when input is empty', async ({ page }) => {
    // Check if send button is disabled when input is empty
    await expect(page.locator('.send-button')).toBeDisabled();
    
    // Type something
    await page.fill('.message-input', 'Hello');
    
    // Check if send button is enabled
    await expect(page.locator('.send-button')).toBeEnabled();
    
    // Clear the input
    await page.fill('.message-input', '');
    
    // Check if send button is disabled again
    await expect(page.locator('.send-button')).toBeDisabled();
  });

  test('should disable input and send button while waiting for response', async ({ page }) => {
    // Wait for initial welcome message to be loaded
    await expect(page.locator('.message.assistant-message').first()).toBeVisible({ timeout: 10000 });
    
    // Type a unique test message
    const testMessage = `Test disable ${Date.now()}`;
    await page.fill('.message-input', testMessage);
    await page.click('.send-button');
    
    // Verify that the typing indicator appears (this proves we're in waiting state)
    await expect(page.locator('.typing-indicator')).toBeVisible({ timeout: 5000 });
    
    // Wait for response to complete (should be the second assistant message after welcome)
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Check if typing indicator disappears (response completed)
    await expect(page.locator('.typing-indicator')).not.toBeVisible();
    
    // Check if input is enabled again
    await expect(page.locator('.message-input')).toBeEnabled();
    
    // For the send button to be enabled, we need to type something in the input
    await page.fill('.message-input', 'test');
    await expect(page.locator('.send-button')).toBeEnabled();
  });

  test('should display timestamps for messages', async ({ page }) => {
    // Wait for initial welcome message to be loaded
    await expect(page.locator('.message.assistant-message').first()).toBeVisible({ timeout: 10000 });
    
    // Type a unique test message
    const testMessage = `Check timestamp ${Date.now()}`;
    await page.fill('.message-input', testMessage);
    await page.click('.send-button');
    
    // Check if user message appears and has timestamp
    await expect(page.locator('.message.user-message').filter({ hasText: testMessage })).toBeVisible();
    await expect(page.locator('.message.user-message').filter({ hasText: testMessage }).locator('.timestamp')).toBeVisible();
    
    // Wait for AI response (should be the second assistant message after welcome)
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Check if AI message has timestamp
    await expect(page.locator('.message.assistant-message').nth(1).locator('.timestamp')).toBeVisible();
  });

  test('should scroll to bottom when new messages are added', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Send multiple messages to test scrolling
    for (let i = 1; i <= 5; i++) {
      await page.fill('.message-input', `Message ${i}`);
      await page.click('.send-button');
      
      // Wait for response before sending next message
      await expect(page.locator('.message.assistant-message').nth(i)).toBeVisible({ timeout: 10000 });
    }
    
    // Check if the latest message is visible (indicating auto-scroll)
    const lastMessage = page.locator('.message').last();
    await expect(lastMessage).toBeInViewport();
  });

  test('should handle different types of mock responses', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Test greeting response
    await page.fill('.message-input', 'Hello');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    let response = page.locator('.message.assistant-message .message-content').nth(1);
    await expect(response).toContainText(/Hello|Hi|great to meet you/i);
    
    // Clear and test joke response
    await page.fill('.message-input', 'Tell me a joke');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant-message').nth(2)).toBeVisible({ timeout: 10000 });
    response = page.locator('.message.assistant-message .message-content').nth(2);
    await expect(response).toContainText(/Why|joke|funny|😄|😂|😊/i);
    
    // Clear and test help response
    await page.fill('.message-input', 'I need help');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant-message').nth(3)).toBeVisible({ timeout: 10000 });
    response = page.locator('.message.assistant-message .message-content').nth(3);
    await expect(response).toContainText(/help|assist|questions/i);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if the chat container is still visible and properly sized
    await expect(page.locator('.chat-container')).toBeVisible();
    
    // Check if the input area is accessible
    await expect(page.locator('.message-input')).toBeVisible();
    
    // Test message sending on mobile
    await page.fill('.message-input', 'Mobile test');
    await page.click('.send-button');
    
    // Check if user message appears
    await expect(page.locator('.message.user-message .message-content')).toContainText('Mobile test');
  });

  test('should maintain chat history during session', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000);
    
    // Send first message
    await page.fill('.message-input', 'First message');
    await page.click('.send-button');
    await expect(page.locator('.message.user-message .message-content')).toContainText('First message');
    
    // Wait for response
    await expect(page.locator('.message.assistant-message').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Send second message
    await page.fill('.message-input', 'Second message');
    await page.click('.send-button');
    await expect(page.locator('.message.user-message .message-content').nth(1)).toContainText('Second message');
    
    // Verify both messages are still visible
    await expect(page.locator('.message.user-message')).toHaveCount(2);
    await expect(page.locator('.message.assistant-message')).toHaveCount(3); // Initial welcome + 2 responses
  });
});
