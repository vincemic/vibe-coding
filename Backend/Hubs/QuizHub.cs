using Microsoft.AspNetCore.SignalR;
using ChatbotApp.Backend.Services;
using ChatbotApp.Backend.Models;

namespace ChatbotApp.Backend.Hubs;

public class QuizHub : Hub
{
    private readonly IQuizService _quizService;
    private readonly IChatService _chatService;
    private readonly ILogger<QuizHub> _logger;

    public QuizHub(IQuizService quizService, IChatService chatService, ILogger<QuizHub> logger)
    {
        _quizService = quizService;
        _chatService = chatService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected to QuizHub: {ConnectionId}", Context.ConnectionId);
        
        try
        {
            // Check if there's an active game
            var activeGame = _quizService.GetActiveGame();
            if (activeGame == null)
            {
                // Create a new game
                activeGame = await _quizService.CreateGameAsync();
                await Clients.Caller.SendAsync("GameCreated", activeGame.Id);
            }

            // Send welcome message and game state
            await Clients.Caller.SendAsync("QuizMasterMessage", 
                "🎯 Welcome to the Ultimate Quiz Challenge! I'm your Quiz Master AI. " +
                "Please tell me your name to join the game!", 
                DateTime.UtcNow);

            await Clients.Caller.SendAsync("GameStateUpdate", new GameUpdate
            {
                State = activeGame.State,
                Message = $"Game {activeGame.Id} - {activeGame.Players.Count}/{activeGame.MaxPlayers} players",
                Data = new { 
                    GameId = activeGame.Id,
                    PlayerCount = activeGame.Players.Count,
                    MaxPlayers = activeGame.MaxPlayers,
                    State = activeGame.State.ToString()
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnConnectedAsync for QuizHub");
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinGame(string playerName)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(playerName))
            {
                await Clients.Caller.SendAsync("QuizMasterMessage", 
                    "❌ Please provide a valid name to join the game!", DateTime.UtcNow);
                return;
            }

            var activeGame = _quizService.GetActiveGame();
            if (activeGame == null)
            {
                activeGame = await _quizService.CreateGameAsync();
            }

            var player = await _quizService.AddPlayerAsync(activeGame.Id, playerName, Context.ConnectionId);
            if (player == null)
            {
                if (activeGame.IsGameFull)
                {
                    await Clients.Caller.SendAsync("QuizMasterMessage", 
                        "❌ Sorry, the game is full! Please wait for the next round.", DateTime.UtcNow);
                }
                else if (activeGame.State != GameState.WaitingForPlayers)
                {
                    await Clients.Caller.SendAsync("QuizMasterMessage", 
                        "❌ Sorry, the game has already started! Please wait for the next round.", DateTime.UtcNow);
                }
                return;
            }

            // Welcome the player
            await Clients.Caller.SendAsync("QuizMasterMessage", 
                $"🎉 Welcome {player.Name}! You've joined the quiz game. " +
                $"Players: {activeGame.Players.Count}/{activeGame.MaxPlayers}", 
                DateTime.UtcNow);

            // Notify other players
            await Clients.Others.SendAsync("QuizMasterMessage", 
                $"👋 {player.Name} has joined the game! " +
                $"Players: {activeGame.Players.Count}/{activeGame.MaxPlayers}", 
                DateTime.UtcNow);

            // Send player info to the caller
            await Clients.Caller.SendAsync("PlayerJoined", player);

            // Update all clients with current game state
            await Clients.All.SendAsync("GameStateUpdate", new GameUpdate
            {
                State = activeGame.State,
                Message = $"{activeGame.Players.Count} players in game",
                Data = new 
                { 
                    Players = activeGame.Players.Select(p => new PlayerInfo 
                    { 
                        Id = p.Id, 
                        Name = p.Name, 
                        Score = p.Score 
                    }).ToList(),
                    GameId = activeGame.Id,
                    CanStart = activeGame.CanStart
                }
            });

            // Auto-start if we have enough players (optional)
            if (activeGame.Players.Count >= 2 && activeGame.CanStart)
            {
                await Task.Delay(5000); // Wait 5 seconds for more players
                var currentGame = _quizService.GetActiveGame();
                if (currentGame != null && currentGame.CanStart)
                {
                    await StartGame(currentGame.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in JoinGame for player {PlayerName}", playerName);
            await Clients.Caller.SendAsync("QuizMasterMessage", 
                "❌ An error occurred while joining the game. Please try again.", DateTime.UtcNow);
        }
    }

    public async Task StartGame(string gameId)
    {
        try
        {
            var started = await _quizService.StartGameAsync(gameId);
            if (!started)
            {
                await Clients.Caller.SendAsync("QuizMasterMessage", 
                    "❌ Cannot start the game right now.", DateTime.UtcNow);
                return;
            }

            var game = await _quizService.GetGameAsync(gameId);
            if (game == null) return;

            // Announce game start
            await Clients.All.SendAsync("QuizMasterMessage", 
                $"🚀 Let the Quiz Challenge begin! We have {game.Players.Count} brave contestants. " +
                "Get ready for 10 exciting questions! First question coming up in 3 seconds...", 
                DateTime.UtcNow);

            await Clients.All.SendAsync("GameStateUpdate", new GameUpdate
            {
                State = GameState.Starting,
                Message = "Game starting...",
                Data = new { Countdown = 3 }
            });

            // Monitor game progress
            _ = Task.Run(() => MonitorGameProgress(gameId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting game {GameId}", gameId);
        }
    }

    public async Task SubmitAnswer(string gameId, int selectedOption)
    {
        try
        {
            var answer = await _quizService.SubmitAnswerAsync(gameId, Context.ConnectionId, selectedOption);
            if (answer == null)
            {
                await Clients.Caller.SendAsync("QuizMasterMessage", 
                    "❌ Could not submit your answer. Time might be up or you already answered.", 
                    DateTime.UtcNow);
                return;
            }

            await Clients.Caller.SendAsync("AnswerSubmitted", new { 
                SelectedOption = selectedOption,
                SubmittedAt = answer.AnsweredAt
            });

            var game = await _quizService.GetGameAsync(gameId);
            if (game != null)
            {
                // Update all clients with answer counts
                var answeredCount = game.CurrentQuestionAnswers.Count;
                var totalPlayers = game.Players.Count;
                
                await Clients.All.SendAsync("AnswerUpdate", new {
                    AnsweredCount = answeredCount,
                    TotalPlayers = totalPlayers,
                    AllAnswered = answeredCount == totalPlayers
                });

                // If all players answered, show results immediately
                if (game.AllPlayersAnswered)
                {
                    await ShowQuestionResults(gameId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting answer for game {GameId}", gameId);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected from QuizHub: {ConnectionId}", Context.ConnectionId);
        
        try
        {
            var activeGame = _quizService.GetActiveGame();
            if (activeGame != null)
            {
                var removed = await _quizService.RemovePlayerAsync(activeGame.Id, Context.ConnectionId);
                if (removed)
                {
                    var game = await _quizService.GetGameAsync(activeGame.Id);
                    if (game != null)
                    {
                        await Clients.Others.SendAsync("QuizMasterMessage", 
                            $"👋 A player has left the game. " +
                            $"Players remaining: {game.Players.Count}/{game.MaxPlayers}", 
                            DateTime.UtcNow);

                        await Clients.Others.SendAsync("GameStateUpdate", new GameUpdate
                        {
                            State = game.State,
                            Message = $"{game.Players.Count} players in game",
                            Data = new 
                            { 
                                Players = game.Players.Select(p => new PlayerInfo 
                                { 
                                    Id = p.Id, 
                                    Name = p.Name, 
                                    Score = p.Score 
                                }).ToList()
                            }
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in OnDisconnectedAsync for QuizHub");
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task MonitorGameProgress(string gameId)
    {
        try
        {
            while (true)
            {
                await Task.Delay(1000); // Check every second
                
                var game = await _quizService.GetGameAsync(gameId);
                if (game == null) break;

                switch (game.State)
                {
                    case GameState.QuestionDisplay:
                        await SendCurrentQuestion(gameId);
                        break;
                    
                    case GameState.WaitingForAnswers:
                        await SendTimeUpdate(gameId);
                        break;
                    
                    case GameState.ShowingResults:
                        await ShowQuestionResults(gameId);
                        break;
                    
                    case GameState.GameOver:
                        await ShowFinalResults(gameId);
                        return; // Exit monitoring
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error monitoring game progress for {GameId}", gameId);
        }
    }

    private async Task SendCurrentQuestion(string gameId)
    {
        var game = await _quizService.GetGameAsync(gameId);
        if (game?.CurrentQuestion == null) return;

        var questionDisplay = new QuestionDisplay
        {
            Question = new QuizQuestion
            {
                Id = game.CurrentQuestion.Id,
                Question = game.CurrentQuestion.Question,
                Options = game.CurrentQuestion.Options,
                Category = game.CurrentQuestion.Category
                // Don't send correct answer or explanation yet
            },
            QuestionNumber = game.CurrentQuestionIndex + 1,
            TotalQuestions = game.TotalQuestions,
            TimeLimit = game.QuestionTimeLimit,
            Players = game.Players.Select(p => new PlayerInfo
            {
                Id = p.Id,
                Name = p.Name,
                Score = p.Score,
                HasAnswered = p.HasAnswered
            }).ToList()
        };

        await Clients.All.SendAsync("QuestionDisplay", questionDisplay);
        await Clients.All.SendAsync("QuizMasterMessage", 
            $"📚 Question {game.CurrentQuestionIndex + 1} of {game.TotalQuestions}: {game.CurrentQuestion.Category}", 
            DateTime.UtcNow);
    }

    private async Task SendTimeUpdate(string gameId)
    {
        var game = await _quizService.GetGameAsync(gameId);
        if (game == null) return;

        var remainingTime = game.RemainingTime;
        
        await Clients.All.SendAsync("TimeUpdate", new {
            RemainingTime = remainingTime,
            AnsweredCount = game.CurrentQuestionAnswers.Count,
            TotalPlayers = game.Players.Count
        });

        // Time's up warning
        if (remainingTime <= 10 && remainingTime > 0)
        {
            await Clients.All.SendAsync("QuizMasterMessage", 
                $"⏰ {remainingTime} seconds remaining!", DateTime.UtcNow);
        }
        else if (remainingTime <= 0)
        {
            await Clients.All.SendAsync("QuizMasterMessage", 
                "⏰ Time's up! Let's see the results...", DateTime.UtcNow);
        }
    }

    private async Task ShowQuestionResults(string gameId)
    {
        var result = await _quizService.GetQuestionResultAsync(gameId);
        if (result == null) return;

        await Clients.All.SendAsync("QuestionResult", result);
        
        var correctCount = result.PlayerResults.Count(r => r.IsCorrect);
        var totalPlayers = result.PlayerResults.Count;
        
        await Clients.All.SendAsync("QuizMasterMessage", 
            $"📊 Results: {correctCount}/{totalPlayers} got it right! " +
            $"The correct answer was: {result.Question.Options[result.CorrectAnswer]}. " +
            $"{result.Explanation}", 
            DateTime.UtcNow);

        // Wait before next question
        await Task.Delay(7000);
        
        var game = await _quizService.GetGameAsync(gameId);
        if (game != null && game.CurrentQuestionIndex < game.TotalQuestions)
        {
            await _quizService.NextQuestionAsync(gameId);
            await Clients.All.SendAsync("QuizMasterMessage", 
                "🔄 Get ready for the next question...", DateTime.UtcNow);
        }
    }

    private async Task ShowFinalResults(string gameId)
    {
        var finalResults = await _quizService.GetFinalResultsAsync(gameId);
        if (finalResults == null) return;

        await Clients.All.SendAsync("GameComplete", finalResults);
        
        if (finalResults.Winner != null)
        {
            await Clients.All.SendAsync("QuizMasterMessage", 
                $"🏆 GAME OVER! Congratulations {finalResults.Winner.PlayerName}! " +
                $"You are the Quiz Champion with {finalResults.Winner.TotalScore} points! " +
                $"🎉 Amazing performance everyone! Thanks for playing!", 
                DateTime.UtcNow);
        }
        else
        {
            await Clients.All.SendAsync("QuizMasterMessage", 
                "🏁 Game complete! Thanks everyone for playing the Ultimate Quiz Challenge! " +
                "A new game will start soon...", 
                DateTime.UtcNow);
        }

        // Auto-create new game after delay
        await Task.Delay(10000);
        await _quizService.CreateGameAsync();
        
        await Clients.All.SendAsync("QuizMasterMessage", 
            "🆕 A new quiz game is ready! Tell me your name to join!", 
            DateTime.UtcNow);
    }
}
