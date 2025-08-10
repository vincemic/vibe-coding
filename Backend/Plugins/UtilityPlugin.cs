using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace ChatbotApp.Backend.Plugins;

/// <summary>
/// Semantic Kernel plugin for utility functions
/// </summary>
public class UtilityPlugin
{
    /// <summary>
    /// Generates a random fact
    /// </summary>
    [KernelFunction, Description("Provides an interesting random fact")]
    public string GetRandomFact()
    {
        var facts = new[]
        {
            "The human brain contains approximately 86 billion neurons.",
            "Octopuses have three hearts and blue blood.",
            "A day on Venus is longer than its year.",
            "Honey never spoils - archaeologists have found 3000-year-old honey that's still edible.",
            "The Great Wall of China isn't visible from space with the naked eye.",
            "A group of flamingos is called a 'flamboyance'.",
            "The shortest war in history lasted only 38-45 minutes.",
            "Bananas are berries, but strawberries aren't.",
            "The human nose can distinguish between 1 trillion different scents.",
            "Lightning strikes the Earth about 100 times per second."
        };
        
        return facts[new Random().Next(facts.Length)];
    }

    /// <summary>
    /// Suggests a creative writing prompt
    /// </summary>
    [KernelFunction, Description("Provides a creative writing prompt or idea")]
    public string GetWritingPrompt()
    {
        var prompts = new[]
        {
            "Write about a world where colors have sounds and sounds have colors.",
            "Imagine you wake up one day and can understand what animals are thinking.",
            "Describe a library where books choose their readers.",
            "Write about a character who collects forgotten memories.",
            "Imagine a city where every building tells the story of its inhabitants.",
            "Describe a conversation between the moon and the stars.",
            "Write about someone who discovers they can taste emotions.",
            "Imagine a world where dreams are traded as currency.",
            "Describe a character who paints with light instead of pigments.",
            "Write about a place where time moves differently for everyone."
        };
        
        return prompts[new Random().Next(prompts.Length)];
    }

    /// <summary>
    /// Provides a mindfulness or reflection prompt
    /// </summary>
    [KernelFunction, Description("Provides a mindfulness or reflection prompt")]
    public string GetReflectionPrompt()
    {
        var prompts = new[]
        {
            "What's one thing you learned about yourself recently?",
            "Describe a moment today when you felt grateful.",
            "What's a challenge you've overcome that you're proud of?",
            "Think of someone who has positively influenced your life. How?",
            "What's a skill you'd like to develop, and why does it interest you?",
            "Describe a place where you feel most at peace.",
            "What's something you've always wanted to try but haven't yet?",
            "Think about a time when you helped someone. How did it make you feel?",
            "What's a book, movie, or song that has stayed with you? Why?",
            "If you could have dinner with anyone, living or historical, who would it be and what would you ask them?"
        };
        
        return prompts[new Random().Next(prompts.Length)];
    }

    /// <summary>
    /// Generates a simple math puzzle or brain teaser
    /// </summary>
    [KernelFunction, Description("Provides a simple math puzzle or brain teaser")]
    public string GetMathPuzzle()
    {
        var puzzles = new[]
        {
            "I am an odd number. Take away a letter and I become even. What number am I? (Answer: Seven)",
            "What comes next in this sequence: 2, 6, 12, 20, 30, ...? (Answer: 42 - these are products of consecutive numbers)",
            "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? (Answer: $0.05)",
            "If you're running a race and you pass the person in 2nd place, what place are you in now? (Answer: 2nd place)",
            "How can you make the number 7 even without addition, subtraction, multiplication, or division? (Answer: Remove the 'S' from 'Seven')",
            "What's half of 2 + 2? (Answer: 3 - half of 2 is 1, plus 2 equals 3)",
            "A farmer has 17 sheep. All but 9 die. How many sheep are left? (Answer: 9)",
            "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets? (Answer: 5 minutes)"
        };
        
        return puzzles[new Random().Next(puzzles.Length)];
    }

    /// <summary>
    /// Suggests a daily productivity tip
    /// </summary>
    [KernelFunction, Description("Provides a productivity or life improvement tip")]
    public string GetProductivityTip()
    {
        var tips = new[]
        {
            "Try the 2-minute rule: if something takes less than 2 minutes, do it now.",
            "Use the Pomodoro Technique: work for 25 minutes, then take a 5-minute break.",
            "Prepare your workspace the night before to start the next day with clarity.",
            "Write down three priorities at the start of each day.",
            "Take regular breaks - your brain needs time to process and recharge.",
            "Practice the 'one-touch' email rule: handle each email only once.",
            "Create a 'someday/maybe' list for ideas that aren't immediate priorities.",
            "Use time-blocking to dedicate specific hours to specific tasks.",
            "Start your day with the most important or challenging task.",
            "Keep a 'done' list alongside your to-do list to track accomplishments."
        };
        
        return tips[new Random().Next(tips.Length)];
    }
}
