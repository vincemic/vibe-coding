namespace ChatbotApp.Backend.Services;

public interface IChatService
{
    Task<string> GetChatResponseAsync(string message);
}
