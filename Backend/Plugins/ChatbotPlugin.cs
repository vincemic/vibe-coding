using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace ChatbotApp.Backend.Plugins;

/// <summary>
/// Semantic Kernel plugin for chatbot-specific functionality
/// </summary>
public class ChatbotPlugin
{
    /// <summary>
    /// Gets current timestamp for conversation context
    /// </summary>
    [KernelFunction, Description("Gets the current date and time")]
    public string GetCurrentDateTime()
    {
        return DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    }

    /// <summary>
    /// Gets current day of the week for contextual responses
    /// </summary>
    [KernelFunction, Description("Gets the current day of the week")]
    public string GetCurrentDayOfWeek()
    {
        return DateTime.Now.DayOfWeek.ToString();
    }

    /// <summary>
    /// Generates a random encouraging message
    /// </summary>
    [KernelFunction, Description("Generates an encouraging or motivational message")]
    public string GetEncouragingMessage()
    {
        var messages = new[]
        {
            "You're doing great! Keep up the excellent work!",
            "Every challenge is an opportunity to grow. You've got this!",
            "Your curiosity and questions show your dedication to learning.",
            "Remember, progress is progress, no matter how small!",
            "You're more capable than you realize. Believe in yourself!",
            "Each conversation is a step forward in your journey.",
            "Your thoughtful questions make our conversation meaningful.",
            "Keep exploring and asking questions - that's how we grow!"
        };
        
        return messages[new Random().Next(messages.Length)];
    }

    /// <summary>
    /// Analyzes the sentiment/mood of a message
    /// </summary>
    [KernelFunction, Description("Analyzes the basic sentiment or mood of a message")]
    public string AnalyzeSentiment([Description("The message to analyze")] string message)
    {
        var lowercaseMessage = message.ToLowerInvariant();
        
        // Simple keyword-based sentiment analysis
        var positiveWords = new[] { "happy", "great", "awesome", "wonderful", "excellent", "good", "love", "amazing", "fantastic", "brilliant" };
        var negativeWords = new[] { "sad", "bad", "terrible", "awful", "hate", "horrible", "angry", "frustrated", "disappointed", "upset" };
        var questionWords = new[] { "what", "why", "how", "when", "where", "who", "which", "can", "could", "would", "should" };
        
        int positiveCount = positiveWords.Count(word => lowercaseMessage.Contains(word));
        int negativeCount = negativeWords.Count(word => lowercaseMessage.Contains(word));
        int questionCount = questionWords.Count(word => lowercaseMessage.Contains(word));
        
        if (questionCount > 0)
            return "inquisitive";
        else if (positiveCount > negativeCount)
            return "positive";
        else if (negativeCount > positiveCount)
            return "negative";
        else
            return "neutral";
    }

    /// <summary>
    /// Suggests conversation topics based on user interest
    /// </summary>
    [KernelFunction, Description("Suggests interesting conversation topics")]
    public string SuggestConversationTopic()
    {
        var topics = new[]
        {
            "technology and innovation",
            "books and literature",
            "science and discoveries",
            "travel and cultures",
            "hobbies and interests",
            "learning and education",
            "creativity and arts",
            "health and wellness",
            "environment and sustainability",
            "future trends and possibilities"
        };
        
        return topics[new Random().Next(topics.Length)];
    }

    /// <summary>
    /// Provides helpful tips for better conversations
    /// </summary>
    [KernelFunction, Description("Provides a helpful tip for better communication")]
    public string GetConversationTip()
    {
        var tips = new[]
        {
            "Ask open-ended questions to encourage deeper discussions.",
            "Active listening involves focusing fully on what the other person is saying.",
            "Sharing personal experiences can make conversations more engaging.",
            "It's okay to pause and think before responding - it shows you're considering the question.",
            "Showing genuine curiosity about others' perspectives enriches conversations.",
            "Don't be afraid to ask for clarification if something isn't clear.",
            "Building on previous topics shows you're engaged in the conversation.",
            "Sometimes the best conversations happen when you're genuinely curious about learning something new."
        };
        
        return tips[new Random().Next(tips.Length)];
    }
}
