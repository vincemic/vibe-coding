using Microsoft.AspNetCore.SignalR;
using ChatbotApp.Backend.Services;
using ChatbotApp.Backend.Models;

namespace ChatbotApp.Backend.Hubs;

public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    public async Task SendMessage(string user, string message)
    {
        try
        {
            _logger.LogInformation("Received message from user {User}: {Message}", user, message);

            // Echo the user message back to all clients
            await Clients.All.SendAsync("ReceiveMessage", user, message, DateTime.UtcNow);

            // Get AI response
            var aiResponse = await _chatService.GetChatResponseAsync(message);
            
            _logger.LogInformation("AI response generated for user {User}", user);

            // Send AI response to all clients
            await Clients.All.SendAsync("ReceiveMessage", "Assistant", aiResponse, DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message from user {User}", user);
            await Clients.Caller.SendAsync("ReceiveMessage", "System", "Sorry, I encountered an error. Please try again.", DateTime.UtcNow);
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        
        try
        {
            // Wait a short moment to ensure the client is ready to receive messages
            await Task.Delay(500);
            
            // Send welcome message to the newly connected client
            _logger.LogInformation("Sending welcome message to client: {ConnectionId}", Context.ConnectionId);
            await Clients.Caller.SendAsync("ReceiveMessage", "Assistant", 
                "Hello! I'm your AI assistant. How can I help you today?", DateTime.UtcNow);
            
            _logger.LogInformation("Welcome message sent successfully to client: {ConnectionId}", Context.ConnectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending welcome message to client: {ConnectionId}", Context.ConnectionId);
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
