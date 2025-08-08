# Frontend E2E Testing Guide

## Overview
This project includes comprehensive end-to-end (E2E) tests using Playwright to validate the chatbot functionality, performance, and user experience.

## Test Suites

### 1. Core Functionality Tests (`tests/chatbot.spec.ts`)
- Basic chat functionality
- Message sending and receiving
- SignalR connection handling
- Message display and formatting
- Input validation

### 2. SignalR Connection Tests (`tests/signalr.spec.ts`)
- Connection establishment
- Reconnection handling
- Message delivery
- Connection status display
- Error handling

### 3. Responsive Design Tests (`tests/mobile.spec.ts`)
- Mobile layout (≤ 768px width)
- Tablet layout (769px - 1024px width)
- Desktop layout (> 1024px width)
- Touch interactions
- Viewport adaptations

### 4. UI/UX Tests (`tests/ui-ux.spec.ts`)
- Visual styling and animations
- Color schemes and themes
- Typing indicators
- Keyboard navigation
- Accessibility features
- Message alignment and display

### 5. Error Handling Tests (`tests/error-handling.spec.ts`)
- Network interruption scenarios
- Invalid input handling
- SignalR connection failures
- Malformed server responses
- Edge cases and error states

### 6. Performance Tests (`tests/performance.spec.ts`)
- Page load times
- Message handling performance
- Memory usage monitoring
- Scrolling performance
- Concurrent operation handling

## Prerequisites

1. **Backend Running**: Ensure the ASP.NET Core backend is running on `http://localhost:5001`
2. **Frontend Running**: Ensure the Angular frontend is running on `http://localhost:4200`
3. **Browsers Installed**: Playwright browsers should be installed

## Running Tests

### Install Dependencies
```bash
npm install
```

### Install Playwright Browsers
```bash
npx playwright install
```

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests with UI Mode (Recommended for development)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See browser)
```bash
npm run test:e2e:headed
```

### Debug Tests
```bash
npm run test:e2e:debug
```

### View Test Reports
```bash
npm run test:e2e:report
```

### Run Specific Test Files
```bash
# Run only chatbot functionality tests
npx playwright test chatbot.spec.ts

# Run only mobile responsive tests
npx playwright test mobile.spec.ts

# Run only performance tests
npx playwright test performance.spec.ts
```

### Run Tests by Tag or Pattern
```bash
# Run tests matching a specific pattern
npx playwright test --grep "should send and receive messages"

# Run tests in a specific browser
npx playwright test --project=chromium
```

## Test Configuration

### Browser Configuration
The tests are configured to run on:
- **Chromium** (Primary)
- **Firefox** (Secondary)
- **WebKit** (Safari engine)

### Viewport Configurations
- **Desktop**: 1280x720
- **Mobile**: 375x667
- **Tablet**: 768x1024

### Timeouts
- **Test Timeout**: 30 seconds
- **Action Timeout**: 10 seconds
- **Navigation Timeout**: 30 seconds

## Test Data and Scenarios

### Mock Response Testing
The tests work with the backend's mock response system, which provides:
- Contextual responses based on user input
- Simulated typing delays
- Various response types (helpful, creative, technical)

### Test Scenarios Include
- **Happy Path**: Normal chat interactions
- **Edge Cases**: Empty messages, very long messages, special characters
- **Error Conditions**: Network failures, connection issues
- **Performance**: High message volume, rapid interactions
- **Accessibility**: Keyboard navigation, screen reader compatibility

## Continuous Integration

### GitHub Actions Integration
To run these tests in CI/CD:

```yaml
- name: Install dependencies
  run: npm ci
  working-directory: ./Frontend

- name: Install Playwright browsers
  run: npx playwright install --with-deps
  working-directory: ./Frontend

- name: Start backend
  run: dotnet run --project Backend/ChatbotApp.Backend.csproj &

- name: Start frontend
  run: npm start &
  working-directory: ./Frontend

- name: Wait for services
  run: sleep 30

- name: Run Playwright tests
  run: npm run test:e2e
  working-directory: ./Frontend
```

## Test Maintenance

### Adding New Tests
1. Create test files in the `tests/` directory
2. Follow the existing naming convention: `feature.spec.ts`
3. Use descriptive test names: `should [expected behavior] when [condition]`
4. Include proper cleanup and setup

### Best Practices
- **Isolation**: Each test should be independent
- **Stability**: Use reliable selectors and wait conditions
- **Performance**: Avoid unnecessary waits, use efficient selectors
- **Maintainability**: Use page object models for complex scenarios

### Debugging Failed Tests
1. **Run with UI mode**: `npm run test:e2e:ui`
2. **Check screenshots**: Automatically captured on failure
3. **Review trace files**: Available in test results
4. **Use debug mode**: `npm run test:e2e:debug`

## Reporting

### Test Results
- **HTML Report**: Generated automatically after test runs
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests (configurable)
- **Traces**: Full execution traces for debugging

### Metrics Tracked
- **Performance**: Page load times, message response times
- **Reliability**: Connection stability, error rates
- **User Experience**: Interaction responsiveness, visual feedback

## Troubleshooting

### Common Issues

1. **Tests failing due to network issues**
   - Ensure backend is running on correct port
   - Check firewall settings
   - Verify SignalR connection configuration

2. **Browser installation errors**
   - Run `npx playwright install --with-deps`
   - Check system permissions
   - Verify network connectivity

3. **Timeout issues**
   - Increase timeout values in `playwright.config.ts`
   - Check for slow network or system performance
   - Verify test stability

4. **Flaky tests**
   - Add proper wait conditions
   - Use more reliable selectors
   - Ensure proper test isolation

### Getting Help
- Review Playwright documentation: https://playwright.dev/
- Check test output and error messages
- Use debug mode to step through tests
- Review generated traces and screenshots
