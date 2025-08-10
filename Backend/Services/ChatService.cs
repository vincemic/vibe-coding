using Azure.AI.OpenAI;
using Azure;
using OpenAI;

namespace ChatbotApp.Backend.Services;

public class ChatService : IChatService
{
    private readonly AzureOpenAIClient? _openAiClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatService> _logger;

    public ChatService(IServiceProvider serviceProvider, IConfiguration configuration, ILogger<ChatService> logger)
    {
        _openAiClient = serviceProvider.GetService<AzureOpenAIClient>();
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetChatResponseAsync(string message)
    {
        try
        {
            _logger.LogInformation("Processing chat request: {Message}", message);

            if (_openAiClient == null)
            {
                _logger.LogWarning("Azure OpenAI client not configured, returning mock response");
                return await GetMockResponseAsync(message);
            }

            // For now, always use mock responses for testing
            _logger.LogInformation("Using mock responses for testing");
            return await GetMockResponseAsync(message);

            // TODO: Uncomment this section when Azure OpenAI is configured
            /*
            var deploymentName = _configuration["AzureOpenAI:DeploymentName"] ?? "gpt-4";

            var chatCompletionsOptions = new ChatCompletionsOptions()
            {
                DeploymentName = deploymentName,
                Messages =
                {
                    new ChatRequestSystemMessage("You are a helpful AI assistant. Provide friendly, informative, and concise responses."),
                    new ChatRequestUserMessage(message)
                },
                MaxTokens = 500,
                Temperature = 0.7f
            };

            var response = await _openAiClient.GetChatCompletionsAsync(chatCompletionsOptions);
            var result = response.Value.Choices[0].Message.Content;

            _logger.LogInformation("Successfully generated AI response");
            return result ?? "I'm sorry, I couldn't generate a response right now.";
            */
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat response from Azure OpenAI");
            return "I'm sorry, I'm having trouble responding right now. Please try again later.";
        }
    }

    private async Task<string> GetMockResponseAsync(string message)
    {
        // Simulate API delay (1-3 seconds)
        var delay = new Random().Next(1000, 3000);
        await Task.Delay(delay);

        var lowercaseMessage = message.ToLowerInvariant();
        
        // Context-aware responses based on user input
        if (lowercaseMessage.Contains("hello") || lowercaseMessage.Contains("hi") || lowercaseMessage.Contains("hey"))
        {
            var greetings = new[]
            {
                "Hello! It's great to meet you. How can I help you today?",
                "Hi there! I'm excited to chat with you. What's on your mind?",
                "Hey! Welcome to our conversation. What would you like to talk about?",
                "Hello! I'm here and ready to assist you with anything you need."
            };
            return greetings[new Random().Next(greetings.Length)];
        }

        if (lowercaseMessage.Contains("how are you") || lowercaseMessage.Contains("how do you feel"))
        {
            var statusResponses = new[]
            {
                "I'm doing great, thank you for asking! I'm functioning well and ready to help.",
                "I'm feeling excellent today! All my systems are running smoothly. How are you doing?",
                "I'm in a great mood and ready to tackle any questions you might have!",
                "I'm doing wonderfully! It's always a good day when I get to chat with interesting people like you."
            };
            return statusResponses[new Random().Next(statusResponses.Length)];
        }

        if (lowercaseMessage.Contains("weather") || lowercaseMessage.Contains("temperature"))
        {
            var weatherResponses = new[]
            {
                "I don't have access to real-time weather data, but I'd suggest checking a reliable weather app or website for current conditions in your area!",
                "For accurate weather information, I recommend checking your local weather service. Is there anything else I can help you with?",
                "I wish I could tell you about the weather, but I don't have access to current weather data. Try checking Weather.com or your phone's weather app!"
            };
            return weatherResponses[new Random().Next(weatherResponses.Length)];
        }

        if (lowercaseMessage.Contains("time") || lowercaseMessage.Contains("date"))
        {
            var timeResponses = new[]
            {
                $"I don't have access to real-time data, but you can check the current time and date on your device. Is there something specific about time management I can help with?",
                "For the current time and date, check your computer or phone's clock. Is there anything else I can assist you with?",
                "I can't provide real-time information, but your device should show you the current time and date. What else can I help you with?"
            };
            return timeResponses[new Random().Next(timeResponses.Length)];
        }

        if (lowercaseMessage.Contains("thank") || lowercaseMessage.Contains("thanks"))
        {
            var thankResponses = new[]
            {
                "You're very welcome! I'm happy I could help. Is there anything else you'd like to know?",
                "My pleasure! I'm here whenever you need assistance. Feel free to ask me anything else.",
                "You're most welcome! It's always a joy to help. What else can I do for you?",
                "Glad I could help! Don't hesitate to reach out if you have more questions."
            };
            return thankResponses[new Random().Next(thankResponses.Length)];
        }

        if (lowercaseMessage.Contains("help") || lowercaseMessage.Contains("assistance"))
        {
            var helpResponses = new[]
            {
                "I'm here to help! I can answer questions, provide information, have conversations, or assist with various topics. What specifically would you like help with?",
                "Absolutely! I'm designed to assist with a wide range of topics. Just let me know what you need help with and I'll do my best to provide useful information.",
                "Of course! I'm happy to help with questions, explanations, advice, or just have a friendly chat. What's on your mind?",
                "I'd be delighted to help! Whether you need information, want to discuss something, or just chat, I'm here for you. What can I assist with?"
            };
            return helpResponses[new Random().Next(helpResponses.Length)];
        }

        if (lowercaseMessage.Contains("joke") || lowercaseMessage.Contains("funny"))
        {
            var jokes = new[]
            {
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "I told my computer a joke about UDP... but I'm not sure if it got it! 😂",
                "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
                "How do you comfort a JavaScript bug? You console it! 😊"
            };
            return jokes[new Random().Next(jokes.Length)];
        }

        if (lowercaseMessage.Contains("bye") || lowercaseMessage.Contains("goodbye") || lowercaseMessage.Contains("see you"))
        {
            var farewells = new[]
            {
                "Goodbye! It was wonderful chatting with you. Feel free to come back anytime!",
                "See you later! Thanks for the great conversation. Have a fantastic day!",
                "Farewell! I enjoyed our chat. Don't be a stranger - I'm always here when you need me!",
                "Take care! It's been a pleasure talking with you. Until next time!"
            };
            return farewells[new Random().Next(farewells.Length)];
        }

        // General conversational responses
        var generalResponses = new[]
        {
            "That's really interesting! Tell me more about what you're thinking.",
            "I find that fascinating. Could you elaborate on that topic?",
            "That's a great point you've brought up. What made you think about that?",
            "Interesting perspective! I'd love to hear more of your thoughts on this.",
            "That sounds intriguing. Can you share more details about what you mean?",
            "I appreciate you sharing that with me. What aspects of this interest you most?",
            "That's thought-provoking! I'm curious to learn more about your viewpoint.",
            "Thanks for bringing that up. It's always great to explore new ideas together.",
            "I can see why that would be on your mind. What other thoughts do you have about it?",
            "That's a wonderful topic to discuss. I'm here to explore it with you!"
        };

        return generalResponses[new Random().Next(generalResponses.Length)];
    }
}
