using System.Text.Json.Serialization;

namespace ChatbotApp.Backend.Models;

public class Player
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; } = 0;
    public string? CurrentAnswer { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool HasAnswered { get; set; } = false;
}

public class QuizQuestion
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectAnswerIndex { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
}

public class QuizAnswer
{
    public string PlayerId { get; set; } = string.Empty;
    public int SelectedOption { get; set; }
    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
}

public enum GameState
{
    WaitingForPlayers,
    Starting,
    QuestionDisplay,
    WaitingForAnswers,
    ShowingResults,
    GameOver
}

public class QuizGame
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public GameState State { get; set; } = GameState.WaitingForPlayers;
    public List<Player> Players { get; set; } = new();
    public List<QuizQuestion> Questions { get; set; } = new();
    public int CurrentQuestionIndex { get; set; } = 0;
    public DateTime QuestionStartTime { get; set; }
    public int QuestionTimeLimit { get; set; } = 60; // seconds
    public int MaxPlayers { get; set; } = 10;
    public int TotalQuestions { get; set; } = 10;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<QuizAnswer> CurrentQuestionAnswers { get; set; } = new();

    public QuizQuestion? CurrentQuestion => CurrentQuestionIndex < Questions.Count ? Questions[CurrentQuestionIndex] : null;
    public bool IsGameFull => Players.Count >= MaxPlayers;
    public bool CanStart => Players.Count >= 1 && State == GameState.WaitingForPlayers;
    public int RemainingTime => Math.Max(0, QuestionTimeLimit - (int)(DateTime.UtcNow - QuestionStartTime).TotalSeconds);
    public bool AllPlayersAnswered => Players.All(p => CurrentQuestionAnswers.Any(a => a.PlayerId == p.Id));
}

public class GameUpdate
{
    public GameState State { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class QuestionDisplay
{
    public QuizQuestion Question { get; set; } = new();
    public int QuestionNumber { get; set; }
    public int TotalQuestions { get; set; }
    public int TimeLimit { get; set; }
    public List<PlayerInfo> Players { get; set; } = new();
}

public class PlayerInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool HasAnswered { get; set; }
}

public class QuestionResult
{
    public QuizQuestion Question { get; set; } = new();
    public int CorrectAnswer { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<PlayerResult> PlayerResults { get; set; } = new();
    public Dictionary<int, int> OptionCounts { get; set; } = new();
}

public class PlayerResult
{
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public int SelectedOption { get; set; }
    public bool IsCorrect { get; set; }
    public int ScoreGained { get; set; }
    public int TotalScore { get; set; }
}

public class FinalResults
{
    public List<PlayerResult> FinalScores { get; set; } = new();
    public PlayerResult? Winner { get; set; }
    public GameStatistics Statistics { get; set; } = new();
}

public class GameStatistics
{
    public TimeSpan GameDuration { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalPlayers { get; set; }
    public double AverageScore { get; set; }
    public string MostDifficultQuestion { get; set; } = string.Empty;
    public string EasiestQuestion { get; set; } = string.Empty;
}
