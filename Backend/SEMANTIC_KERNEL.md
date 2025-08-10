# Semantic Kernel Integration

This document describes the Microsoft Semantic Kernel integration in the Vibe chatbot application.

## Overview

Microsoft Semantic Kernel has been integrated to provide a more robust and extensible AI framework for the chatbot. This integration includes:

- **Plugin Architecture**: Modular functionality through Semantic Kernel plugins
- **Enhanced Chat Completion**: Better conversation management with chat history
- **Tool Integration**: Automatic function calling for enhanced responses
- **Fallback Support**: Intelligent mock responses when Azure OpenAI is unavailable

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Semantic Kernel Integration                   │
├─────────────────────────────────────────────────────────────────┤
│  SemanticKernelChatService                                      │
│  ├── Kernel (with plugins)                                     │
│  ├── IChatCompletionService (Azure OpenAI)                     │
│  ├── ChatHistory (conversation context)                        │
│  └── Enhanced Mock Responses (fallback)                        │
├─────────────────────────────────────────────────────────────────┤
│  Plugins:                                                      │
│  ├── ChatbotPlugin                                             │
│  │   ├── GetCurrentDateTime()                                 │
│  │   ├── GetCurrentDayOfWeek()                                │
│  │   ├── AnalyzeSentiment(message)                            │
│  │   ├── GetEncouragingMessage()                              │
│  │   ├── SuggestConversationTopic()                           │
│  │   └── GetConversationTip()                                 │
│  └── UtilityPlugin                                             │
│      ├── GetRandomFact()                                       │
│      ├── GetWritingPrompt()                                    │
│      ├── GetReflectionPrompt()                                 │
│      ├── GetMathPuzzle()                                       │
│      └── GetProductivityTip()                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Plugin-Based Architecture

The chatbot now uses Semantic Kernel plugins to provide enhanced functionality:

#### ChatbotPlugin
- **Current Date/Time**: Provides real-time information
- **Sentiment Analysis**: Basic keyword-based sentiment detection
- **Encouraging Messages**: Motivational responses
- **Conversation Management**: Topic suggestions and communication tips

#### UtilityPlugin
- **Educational Content**: Random facts, writing prompts, reflection questions
- **Brain Teasers**: Math puzzles and mental challenges
- **Productivity**: Tips for better organization and efficiency

### 2. Enhanced Chat Completion

- **Conversation History**: Maintains context across multiple exchanges
- **Tool Calling**: Automatically invokes relevant plugins based on conversation
- **Execution Settings**: Configurable temperature, token limits, and behavior
- **Memory Management**: Automatically manages chat history size

### 3. Intelligent Fallback System

When Azure OpenAI is not available, the system provides enhanced mock responses that:
- Use Semantic Kernel plugins for dynamic content
- Analyze message sentiment and context
- Provide contextually appropriate responses
- Maintain engaging conversation flow

## Configuration

### Basic Setup

The Semantic Kernel is configured in `Program.cs` using extension methods:

```csharp
// Add Semantic Kernel with plugins
builder.Services.AddSemanticKernel(builder.Configuration);
builder.Services.AddSemanticKernelLogging();

// Register the Semantic Kernel chat service
builder.Services.AddScoped<IChatService, SemanticKernelChatService>();
```

### Azure OpenAI Configuration

Add to `appsettings.json`:

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://your-openai-resource.openai.azure.com/",
    "ApiKey": "your-api-key-here",
    "DeploymentName": "gpt-4",
    "MaxTokens": 500,
    "Temperature": 0.7
  }
}
```

### Environment Variables (Recommended for Production)

```bash
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

## Plugin Development

### Creating Custom Plugins

1. Create a new class in the `Plugins` folder
2. Decorate methods with `[KernelFunction]` and `[Description]`
3. Register the plugin in `SemanticKernelExtensions.cs`

Example:

```csharp
public class CustomPlugin
{
    [KernelFunction, Description("Describes what this function does")]
    public string MyFunction([Description("Parameter description")] string input)
    {
        // Implementation
        return "result";
    }
}
```

### Plugin Guidelines

- **Single Responsibility**: Each plugin should have a focused purpose
- **Clear Descriptions**: Use detailed descriptions for functions and parameters
- **Error Handling**: Handle exceptions gracefully
- **Performance**: Keep functions lightweight and fast
- **Stateless**: Avoid storing state in plugin instances

## Usage Examples

### Basic Chat with Plugin Enhancement

```csharp
// User: "What time is it?"
// System automatically calls GetCurrentDateTime() plugin
// Response: "The current date and time is: 2025-08-10 14:30:25. Is there anything specific about time management I can help you with?"
```

### Sentiment-Aware Responses

```csharp
// User: "I'm feeling sad today"
// System calls AnalyzeSentiment() and GetEncouragingMessage()
// Response: Contextual encouragement with additional support
```

### Creative Content Generation

```csharp
// User: "I want to write something creative"
// System calls GetWritingPrompt()
// Response: "Here's a writing prompt to spark your imagination: [creative prompt]"
```

## Monitoring and Logging

### Semantic Kernel Logs

The system logs Semantic Kernel operations at various levels:

```
[INFO] Processing chat request with Semantic Kernel: {Message}
[DEBUG] Message sentiment analyzed as: {Sentiment}
[INFO] Successfully generated response using Semantic Kernel
[WARN] Azure OpenAI not configured, using enhanced mock responses
```

### Performance Metrics

Monitor these key metrics:
- Plugin execution time
- Chat completion response time
- Memory usage with chat history
- Fallback usage frequency

## Testing

### Plugin Testing

Test plugins independently:

```csharp
[Test]
public async Task TestChatbotPlugin()
{
    var plugin = new ChatbotPlugin();
    var result = plugin.GetCurrentDateTime();
    Assert.IsNotNull(result);
}
```

### Integration Testing

Test with Semantic Kernel:

```csharp
[Test]
public async Task TestSemanticKernelChatService()
{
    var service = new SemanticKernelChatService(kernel, logger, configuration);
    var response = await service.GetChatResponseAsync("Hello");
    Assert.IsNotNull(response);
}
```

## Performance Considerations

### Memory Management

- Chat history is limited to 20 messages
- Plugin results are not cached (consider adding caching for expensive operations)
- Kernel instances are singleton for efficiency

### Execution Time

- Plugin functions should complete quickly (< 100ms recommended)
- Use async/await for I/O operations
- Consider timeout settings for external calls

### Token Usage

- Monitor token consumption with Azure OpenAI
- Adjust MaxTokens setting based on requirements
- Use temperature settings to control response variability

## Troubleshooting

### Common Issues

1. **Plugin Not Found**
   - Verify plugin registration in `SemanticKernelExtensions.cs`
   - Check plugin method signatures and attributes

2. **Azure OpenAI Connection Issues**
   - Verify endpoint and API key configuration
   - Check network connectivity and firewall settings

3. **Performance Issues**
   - Review plugin execution times
   - Monitor chat history size
   - Check token usage patterns

### Debug Information

Enable detailed logging:

```json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.SemanticKernel": "Debug",
      "ChatbotApp.Backend.Services.SemanticKernelChatService": "Debug"
    }
  }
}
```

## Future Enhancements

### Planned Features

1. **Additional Plugins**
   - Weather plugin (with external API)
   - Calendar integration
   - Web search capabilities

2. **Advanced Planning**
   - Multi-step task execution
   - Goal-oriented conversations
   - Context-aware action planning

3. **Personalization**
   - User preference learning
   - Conversation style adaptation
   - Custom plugin loading per user

### Contributing

When adding new plugins:

1. Follow the plugin development guidelines
2. Add comprehensive tests
3. Update documentation
4. Consider performance impact
5. Ensure error handling is robust

## Resources

- [Microsoft Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/)
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [Plugin Development Guide](https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/)
