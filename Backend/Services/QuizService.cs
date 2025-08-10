using ChatbotApp.Backend.Models;
using ChatbotApp.Backend.Services;
using Microsoft.SemanticKernel;

namespace ChatbotApp.Backend.Services;

public interface IQuizService
{
    Task<QuizGame> CreateGameAsync();
    Task<Player?> AddPlayerAsync(string gameId, string playerName, string connectionId);
    Task<bool> StartGameAsync(string gameId);
    Task<QuizAnswer?> SubmitAnswerAsync(string gameId, string playerId, int selectedOption);
    Task<QuestionResult?> GetQuestionResultAsync(string gameId);
    Task<FinalResults?> GetFinalResultsAsync(string gameId);
    Task<QuizGame?> GetGameAsync(string gameId);
    Task<bool> NextQuestionAsync(string gameId);
    Task<bool> RemovePlayerAsync(string gameId, string connectionId);
    QuizGame? GetActiveGame();
}

public class QuizService : IQuizService
{
    private readonly ILogger<QuizService> _logger;
    private readonly IChatService _chatService;
    private readonly Kernel _kernel;
    private readonly Dictionary<string, QuizGame> _games = new();
    private readonly object _gamesLock = new();

    public QuizService(ILogger<QuizService> logger, IChatService chatService, Kernel kernel)
    {
        _logger = logger;
        _chatService = chatService;
        _kernel = kernel;
    }

    public async Task<QuizGame> CreateGameAsync()
    {
        var game = new QuizGame
        {
            Questions = await GenerateQuestionsAsync()
        };

        lock (_gamesLock)
        {
            // Remove any existing games (single game mode for now)
            _games.Clear();
            _games[game.Id] = game;
        }

        _logger.LogInformation("Created new quiz game with ID: {GameId}", game.Id);
        return game;
    }

    public async Task<Player?> AddPlayerAsync(string gameId, string playerName, string connectionId)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return null;

            if (game.IsGameFull || game.State != GameState.WaitingForPlayers)
                return null;

            // Check if player already exists (reconnection)
            var existingPlayer = game.Players.FirstOrDefault(p => p.Name.Equals(playerName, StringComparison.OrdinalIgnoreCase));
            if (existingPlayer != null)
            {
                existingPlayer.Id = connectionId; // Update connection ID
                return existingPlayer;
            }

            var player = new Player
            {
                Id = connectionId,
                Name = playerName,
                JoinedAt = DateTime.UtcNow
            };

            game.Players.Add(player);
            _logger.LogInformation("Player {PlayerName} joined game {GameId}", playerName, gameId);
            
            return player;
        }
    }

    public async Task<bool> StartGameAsync(string gameId)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return false;

            if (!game.CanStart)
                return false;

            game.State = GameState.Starting;
            _logger.LogInformation("Starting game {GameId} with {PlayerCount} players", gameId, game.Players.Count);
            
            // Start first question after a brief delay
            _ = Task.Run(async () =>
            {
                await Task.Delay(3000); // 3 second countdown
                await NextQuestionAsync(gameId);
            });

            return true;
        }
    }

    public async Task<QuizAnswer?> SubmitAnswerAsync(string gameId, string playerId, int selectedOption)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return null;

            if (game.State != GameState.WaitingForAnswers)
                return null;

            var player = game.Players.FirstOrDefault(p => p.Id == playerId);
            if (player == null)
                return null;

            // Check if player already answered
            if (game.CurrentQuestionAnswers.Any(a => a.PlayerId == playerId))
                return null;

            var answer = new QuizAnswer
            {
                PlayerId = playerId,
                SelectedOption = selectedOption,
                AnsweredAt = DateTime.UtcNow
            };

            game.CurrentQuestionAnswers.Add(answer);
            player.HasAnswered = true;
            player.CurrentAnswer = selectedOption.ToString();

            _logger.LogInformation("Player {PlayerId} submitted answer {Answer} for game {GameId}", 
                playerId, selectedOption, gameId);

            return answer;
        }
    }

    public async Task<QuestionResult?> GetQuestionResultAsync(string gameId)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return null;

            var currentQuestion = game.CurrentQuestion;
            if (currentQuestion == null)
                return null;

            var result = new QuestionResult
            {
                Question = currentQuestion,
                CorrectAnswer = currentQuestion.CorrectAnswerIndex,
                Explanation = currentQuestion.Explanation,
                PlayerResults = new List<PlayerResult>(),
                OptionCounts = new Dictionary<int, int>()
            };

            // Initialize option counts
            for (int i = 0; i < currentQuestion.Options.Count; i++)
            {
                result.OptionCounts[i] = 0;
            }

            // Calculate results for each player
            foreach (var player in game.Players)
            {
                var answer = game.CurrentQuestionAnswers.FirstOrDefault(a => a.PlayerId == player.Id);
                var selectedOption = answer?.SelectedOption ?? -1;
                var isCorrect = selectedOption == currentQuestion.CorrectAnswerIndex;
                var scoreGained = isCorrect ? CalculateScore(answer?.AnsweredAt ?? DateTime.MaxValue, game.QuestionStartTime) : 0;

                if (isCorrect)
                {
                    player.Score += scoreGained;
                }

                var playerResult = new PlayerResult
                {
                    PlayerId = player.Id,
                    PlayerName = player.Name,
                    SelectedOption = selectedOption,
                    IsCorrect = isCorrect,
                    ScoreGained = scoreGained,
                    TotalScore = player.Score
                };

                result.PlayerResults.Add(playerResult);

                // Count option selections
                if (selectedOption >= 0 && selectedOption < currentQuestion.Options.Count)
                {
                    result.OptionCounts[selectedOption]++;
                }
            }

            return result;
        }
    }

    public async Task<FinalResults?> GetFinalResultsAsync(string gameId)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return null;

            var sortedPlayers = game.Players.OrderByDescending(p => p.Score).ToList();
            var winner = sortedPlayers.FirstOrDefault();

            var finalResults = new FinalResults
            {
                FinalScores = sortedPlayers.Select((p, index) => new PlayerResult
                {
                    PlayerId = p.Id,
                    PlayerName = p.Name,
                    TotalScore = p.Score,
                    IsCorrect = index == 0 // Winner
                }).ToList(),
                Winner = winner != null ? new PlayerResult
                {
                    PlayerId = winner.Id,
                    PlayerName = winner.Name,
                    TotalScore = winner.Score,
                    IsCorrect = true
                } : null,
                Statistics = new GameStatistics
                {
                    GameDuration = DateTime.UtcNow - game.CreatedAt,
                    TotalQuestions = game.TotalQuestions,
                    TotalPlayers = game.Players.Count,
                    AverageScore = game.Players.Count > 0 ? game.Players.Average(p => p.Score) : 0
                }
            };

            return finalResults;
        }
    }

    public async Task<QuizGame?> GetGameAsync(string gameId)
    {
        lock (_gamesLock)
        {
            return _games.TryGetValue(gameId, out var game) ? game : null;
        }
    }

    public async Task<bool> NextQuestionAsync(string gameId)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return false;

            // Clear previous question answers and reset player states
            game.CurrentQuestionAnswers.Clear();
            foreach (var player in game.Players)
            {
                player.HasAnswered = false;
                player.CurrentAnswer = null;
            }

            if (game.CurrentQuestionIndex >= game.TotalQuestions)
            {
                game.State = GameState.GameOver;
                return true;
            }

            game.State = GameState.QuestionDisplay;
            game.QuestionStartTime = DateTime.UtcNow;

            _logger.LogInformation("Starting question {QuestionIndex} for game {GameId}", 
                game.CurrentQuestionIndex + 1, gameId);

            // Start answer collection after brief display
            _ = Task.Run(async () =>
            {
                await Task.Delay(5000); // 5 seconds to read question
                
                lock (_gamesLock)
                {
                    if (_games.TryGetValue(gameId, out var g) && g.State == GameState.QuestionDisplay)
                    {
                        g.State = GameState.WaitingForAnswers;
                        g.QuestionStartTime = DateTime.UtcNow; // Reset timer for answers
                    }
                }

                // Auto-advance after time limit
                await Task.Delay(game.QuestionTimeLimit * 1000);
                
                lock (_gamesLock)
                {
                    if (_games.TryGetValue(gameId, out var g) && g.State == GameState.WaitingForAnswers)
                    {
                        g.State = GameState.ShowingResults;
                        g.CurrentQuestionIndex++;
                    }
                }
            });

            return true;
        }
    }

    public async Task<bool> RemovePlayerAsync(string gameId, string connectionId)
    {
        lock (_gamesLock)
        {
            if (!_games.TryGetValue(gameId, out var game))
                return false;

            var player = game.Players.FirstOrDefault(p => p.Id == connectionId);
            if (player == null)
                return false;

            game.Players.Remove(player);
            _logger.LogInformation("Player {PlayerId} removed from game {GameId}", connectionId, gameId);

            // Remove the game if no players left
            if (game.Players.Count == 0)
            {
                _games.Remove(gameId);
                _logger.LogInformation("Game {GameId} removed - no players remaining", gameId);
            }

            return true;
        }
    }

    public QuizGame? GetActiveGame()
    {
        lock (_gamesLock)
        {
            return _games.Values.FirstOrDefault();
        }
    }

    private async Task<List<QuizQuestion>> GenerateQuestionsAsync()
    {
        // For now, return a curated set of questions
        // Later, this could use Semantic Kernel to generate questions dynamically
        return new List<QuizQuestion>
        {
            new QuizQuestion
            {
                Id = 1,
                Question = "Which planet is known as the Red Planet?",
                Options = ["Venus", "Mars", "Jupiter", "Saturn"],
                CorrectAnswerIndex = 1,
                Category = "Astronomy",
                Explanation = "Mars is called the Red Planet because of its reddish appearance, which comes from iron oxide (rust) on its surface."
            },
            new QuizQuestion
            {
                Id = 2,
                Question = "What is the capital of Australia?",
                Options = ["Sydney", "Melbourne", "Canberra", "Perth"],
                CorrectAnswerIndex = 2,
                Category = "Geography",
                Explanation = "Canberra is the capital city of Australia, chosen as a compromise between rivals Sydney and Melbourne."
            },
            new QuizQuestion
            {
                Id = 3,
                Question = "Which programming language was created by Guido van Rossum?",
                Options = ["Java", "Python", "C++", "JavaScript"],
                CorrectAnswerIndex = 1,
                Category = "Technology",
                Explanation = "Python was created by Guido van Rossum and first released in 1991."
            },
            new QuizQuestion
            {
                Id = 4,
                Question = "What is the largest mammal in the world?",
                Options = ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
                CorrectAnswerIndex = 1,
                Category = "Biology",
                Explanation = "The Blue Whale is the largest mammal and the largest animal that has ever lived on Earth."
            },
            new QuizQuestion
            {
                Id = 5,
                Question = "In which year did World War II end?",
                Options = ["1944", "1945", "1946", "1947"],
                CorrectAnswerIndex = 1,
                Category = "History",
                Explanation = "World War II ended in 1945 with the surrender of Japan in September."
            },
            new QuizQuestion
            {
                Id = 6,
                Question = "What is the chemical symbol for gold?",
                Options = ["Go", "Gd", "Au", "Ag"],
                CorrectAnswerIndex = 2,
                Category = "Chemistry",
                Explanation = "Au is the chemical symbol for gold, derived from the Latin word 'aurum'."
            },
            new QuizQuestion
            {
                Id = 7,
                Question = "Which Shakespearean play features the characters Romeo and Juliet?",
                Options = ["Hamlet", "Macbeth", "Romeo and Juliet", "Othello"],
                CorrectAnswerIndex = 2,
                Category = "Literature",
                Explanation = "Romeo and Juliet is one of Shakespeare's most famous tragedies about star-crossed lovers."
            },
            new QuizQuestion
            {
                Id = 8,
                Question = "What is the square root of 144?",
                Options = ["11", "12", "13", "14"],
                CorrectAnswerIndex = 1,
                Category = "Mathematics",
                Explanation = "The square root of 144 is 12, because 12 × 12 = 144."
            },
            new QuizQuestion
            {
                Id = 9,
                Question = "Which ocean is the largest?",
                Options = ["Atlantic", "Indian", "Pacific", "Arctic"],
                CorrectAnswerIndex = 2,
                Category = "Geography",
                Explanation = "The Pacific Ocean is the largest ocean, covering about one-third of Earth's surface."
            },
            new QuizQuestion
            {
                Id = 10,
                Question = "Who painted the Mona Lisa?",
                Options = ["Pablo Picasso", "Leonardo da Vinci", "Vincent van Gogh", "Michelangelo"],
                CorrectAnswerIndex = 1,
                Category = "Art",
                Explanation = "The Mona Lisa was painted by Leonardo da Vinci during the Italian Renaissance."
            }
        };
    }

    private int CalculateScore(DateTime answeredAt, DateTime questionStartTime)
    {
        // Base score of 100, reduced by time taken
        var timeTaken = (answeredAt - questionStartTime).TotalSeconds;
        var baseScore = 100;
        var timeBonus = Math.Max(0, 60 - timeTaken); // Bonus for quick answers
        return (int)(baseScore + timeBonus);
    }
}
