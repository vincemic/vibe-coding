using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.ChatCompletion;
using ChatbotApp.Backend.Plugins;
using System.Text.Json;

namespace ChatbotApp.Backend.Services;

public class SemanticKernelChatService : IChatService
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService? _chatCompletionService;
    private readonly ILogger<SemanticKernelChatService> _logger;
    private readonly IConfiguration _configuration;
    private readonly ChatHistory _chatHistory;

    public SemanticKernelChatService(
        Kernel kernel,
        ILogger<SemanticKernelChatService> logger,
        IConfiguration configuration,
        IChatCompletionService? chatCompletionService = null)
    {
        _kernel = kernel;
        _chatCompletionService = chatCompletionService;
        _logger = logger;
        _configuration = configuration;
        _chatHistory = new ChatHistory();
        
        // Initialize with system message
        _chatHistory.AddSystemMessage(@"
You are Vibe, a friendly, helpful, and intelligent AI assistant. You have access to various tools and plugins to provide enhanced assistance.

Your personality:
- Friendly and conversational
- Helpful and informative
- Creative and encouraging
- Curious and engaged
- Patient and understanding

Guidelines:
- Provide clear, helpful responses
- Use available tools when they would enhance your response
- Be conversational and personable
- Ask follow-up questions when appropriate
- Offer suggestions and ideas
- Be encouraging and positive

Available tools include:
- Current date/time information
- Sentiment analysis
- Random facts and trivia
- Writing prompts and creative ideas
- Productivity tips
- Math puzzles and brain teasers
- Conversation suggestions

Use these tools naturally in conversation when they would be helpful or interesting to the user.
");
    }

    public async Task<string> GetChatResponseAsync(string message)
    {
        try
        {
            _logger.LogInformation("Processing chat request with Semantic Kernel: {Message}", message);

            // Check if Azure OpenAI is configured and chat completion service is available
            var openAiEndpoint = _configuration["AzureOpenAI:Endpoint"];
            var openAiKey = _configuration["AzureOpenAI:ApiKey"];
            
            if (string.IsNullOrEmpty(openAiEndpoint) || string.IsNullOrEmpty(openAiKey) || _chatCompletionService == null)
            {
                _logger.LogWarning("Azure OpenAI not configured or chat service unavailable, using enhanced mock responses with Semantic Kernel plugins");
                return await GetEnhancedMockResponseAsync(message);
            }

            // Add user message to chat history
            _chatHistory.AddUserMessage(message);

            // Configure execution settings
            var executionSettings = new OpenAIPromptExecutionSettings
            {
                MaxTokens = 500,
                Temperature = 0.7,
                TopP = 0.9,
                FrequencyPenalty = 0.1,
                PresencePenalty = 0.1,
                ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
            };

            // Get response using Semantic Kernel
            var response = await _chatCompletionService.GetChatMessageContentAsync(
                _chatHistory,
                executionSettings,
                _kernel);

            // Add assistant response to chat history
            _chatHistory.AddAssistantMessage(response.Content ?? "I apologize, but I couldn't generate a response.");

            // Limit chat history to last 20 messages to manage memory
            while (_chatHistory.Count > 21) // 20 + 1 system message
            {
                _chatHistory.RemoveAt(1); // Keep system message, remove oldest user/assistant messages
            }

            _logger.LogInformation("Successfully generated response using Semantic Kernel");
            return response.Content ?? "I'm sorry, I couldn't generate a response right now.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat response with Semantic Kernel");
            
            // Fallback to enhanced mock response
            _logger.LogInformation("Falling back to enhanced mock response");
            return await GetEnhancedMockResponseAsync(message);
        }
    }

    private async Task<string> GetEnhancedMockResponseAsync(string message)
    {
        try
        {
            // Simulate processing delay
            var delay = new Random().Next(1000, 3000);
            await Task.Delay(delay);

            var lowercaseMessage = message.ToLowerInvariant();

            // Use Semantic Kernel plugins to enhance responses
            var chatbotPlugin = _kernel.Plugins["ChatbotPlugin"];
            var utilityPlugin = _kernel.Plugins["UtilityPlugin"];

            // Analyze sentiment using plugin
            var sentimentResult = await _kernel.InvokeAsync(
                chatbotPlugin["AnalyzeSentiment"],
                new() { ["message"] = message });
            var sentiment = sentimentResult.ToString();

            _logger.LogInformation("Message sentiment analyzed as: {Sentiment}", sentiment);

            // Context-aware responses using plugins
            if (lowercaseMessage.Contains("hello") || lowercaseMessage.Contains("hi") || lowercaseMessage.Contains("hey"))
            {
                var timeResult = await _kernel.InvokeAsync(chatbotPlugin["GetCurrentDateTime"]);
                var dayResult = await _kernel.InvokeAsync(chatbotPlugin["GetCurrentDayOfWeek"]);
                
                return $"Hello! It's great to meet you on this {dayResult}. I'm Vibe, your AI assistant powered by Semantic Kernel! How can I help you today?";
            }

            if (lowercaseMessage.Contains("time") || lowercaseMessage.Contains("date"))
            {
                var timeResult = await _kernel.InvokeAsync(chatbotPlugin["GetCurrentDateTime"]);
                return $"The current date and time is: {timeResult}. Is there anything specific about time management or scheduling I can help you with?";
            }

            if (lowercaseMessage.Contains("fact") || lowercaseMessage.Contains("interesting"))
            {
                var factResult = await _kernel.InvokeAsync(utilityPlugin["GetRandomFact"]);
                return $"Here's an interesting fact for you: {factResult}\n\nWould you like to know more about any particular topic?";
            }

            if (lowercaseMessage.Contains("write") || lowercaseMessage.Contains("creative") || lowercaseMessage.Contains("story"))
            {
                var promptResult = await _kernel.InvokeAsync(utilityPlugin["GetWritingPrompt"]);
                return $"I love creativity! Here's a writing prompt to spark your imagination:\n\n{promptResult}\n\nWould you like to explore this idea together, or would you prefer a different type of creative exercise?";
            }

            if (lowercaseMessage.Contains("productivity") || lowercaseMessage.Contains("organize") || lowercaseMessage.Contains("efficient"))
            {
                var tipResult = await _kernel.InvokeAsync(utilityPlugin["GetProductivityTip"]);
                return $"Here's a productivity tip that might help: {tipResult}\n\nWould you like more suggestions on staying organized and efficient?";
            }

            if (lowercaseMessage.Contains("puzzle") || lowercaseMessage.Contains("math") || lowercaseMessage.Contains("brain teaser"))
            {
                var puzzleResult = await _kernel.InvokeAsync(utilityPlugin["GetMathPuzzle"]);
                return $"I love a good mental challenge! Here's a puzzle for you:\n\n{puzzleResult}\n\nTake your time thinking about it, and let me know if you'd like a hint or another puzzle!";
            }

            if (lowercaseMessage.Contains("reflect") || lowercaseMessage.Contains("think") || lowercaseMessage.Contains("mindful"))
            {
                var reflectionResult = await _kernel.InvokeAsync(utilityPlugin["GetReflectionPrompt"]);
                return $"Reflection is such a valuable practice. Here's something to ponder:\n\n{reflectionResult}\n\nTake your time with this - there's no rush. Sometimes the best insights come when we give ourselves space to think.";
            }

            if (lowercaseMessage.Contains("thank") || lowercaseMessage.Contains("thanks"))
            {
                var encouragementResult = await _kernel.InvokeAsync(chatbotPlugin["GetEncouragingMessage"]);
                return $"You're very welcome! {encouragementResult} Is there anything else I can help you with?";
            }

            if (lowercaseMessage.Contains("sad") || lowercaseMessage.Contains("down") || sentiment == "negative")
            {
                var encouragementResult = await _kernel.InvokeAsync(chatbotPlugin["GetEncouragingMessage"]);
                var tipResult = await _kernel.InvokeAsync(chatbotPlugin["GetConversationTip"]);
                
                return $"I'm sorry you're feeling down. {encouragementResult}\n\nSometimes talking can help - {tipResult}\n\nI'm here to listen if you'd like to share what's on your mind.";
            }

            if (lowercaseMessage.Contains("happy") || lowercaseMessage.Contains("great") || sentiment == "positive")
            {
                var topicResult = await _kernel.InvokeAsync(chatbotPlugin["SuggestConversationTopic"]);
                return $"That's wonderful to hear! Your positive energy is contagious. Since you're in such a great mood, would you like to chat about {topicResult}? Or is there something specific that's making you happy that you'd like to share?";
            }

            if (lowercaseMessage.Contains("help") || lowercaseMessage.Contains("assistance"))
            {
                var tipResult = await _kernel.InvokeAsync(chatbotPlugin["GetConversationTip"]);
                return $"I'm absolutely here to help! I can assist with questions, provide information, offer creative prompts, share interesting facts, suggest productivity tips, and much more.\n\nHere's a helpful tip: {tipResult}\n\nWhat specifically would you like help with today?";
            }

            if (sentiment == "inquisitive" || lowercaseMessage.Contains("what") || lowercaseMessage.Contains("how") || lowercaseMessage.Contains("why"))
            {
                var topicResult = await _kernel.InvokeAsync(chatbotPlugin["SuggestConversationTopic"]);
                return $"I love curious minds! Your question shows you're thinking deeply. While I'd love to give you the perfect answer, I'd need a bit more context to be most helpful.\n\nWould you like to explore {topicResult}, or could you tell me more about what specifically you're curious about?";
            }

            // Default response with plugin enhancement
            var defaultTopicResult = await _kernel.InvokeAsync(chatbotPlugin["SuggestConversationTopic"]);
            var defaultTipResult = await _kernel.InvokeAsync(chatbotPlugin["GetConversationTip"]);
            
            return $"That's really interesting! I can sense you're thinking about something meaningful.\n\n{defaultTipResult}\n\nWould you like to explore {defaultTopicResult}, or is there something else on your mind you'd like to discuss?";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in enhanced mock response generation");
            return "I'm experiencing some technical difficulties, but I'm still here to chat! What would you like to talk about?";
        }
    }
}
