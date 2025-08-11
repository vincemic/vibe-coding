using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using ChatbotApp.Backend.Plugins;

namespace ChatbotApp.Backend.Extensions;

public static class SemanticKernelExtensions
{
    /// <summary>
    /// Configures Semantic Kernel with Azure OpenAI and plugins for the quiz application
    /// </summary>
    public static IServiceCollection AddSemanticKernel(this IServiceCollection services, IConfiguration configuration)
    {
        // Get Azure OpenAI configuration
        var openAiEndpoint = configuration["AzureOpenAI:Endpoint"];
        var openAiKey = configuration["AzureOpenAI:ApiKey"];
        var deploymentName = configuration["AzureOpenAI:DeploymentName"] ?? "gpt-4";
        
        // Create kernel builder
        var kernelBuilder = Kernel.CreateBuilder();
        
        // Add Azure OpenAI chat completion service if configured
        if (!string.IsNullOrEmpty(openAiEndpoint) && !string.IsNullOrEmpty(openAiKey))
        {
            kernelBuilder.AddAzureOpenAIChatCompletion(
                deploymentName: deploymentName,
                endpoint: openAiEndpoint,
                apiKey: openAiKey);
        }
        
        // Add plugins
        kernelBuilder.Plugins.AddFromType<UtilityPlugin>("UtilityPlugin");
        
        // Build kernel
        var kernel = kernelBuilder.Build();
        
        // Register kernel as singleton
        services.AddSingleton(kernel);
        
        // Register chat completion service if available
        if (!string.IsNullOrEmpty(openAiEndpoint) && !string.IsNullOrEmpty(openAiKey))
        {
            services.AddSingleton(provider =>
                kernel.GetRequiredService<Microsoft.SemanticKernel.ChatCompletion.IChatCompletionService>());
        }
        
        return services;
    }
    
    /// <summary>
    /// Adds enhanced logging for Semantic Kernel operations
    /// </summary>
    public static IServiceCollection AddSemanticKernelLogging(this IServiceCollection services)
    {
        services.AddLogging(builder =>
        {
            builder.AddFilter("Microsoft.SemanticKernel", LogLevel.Information);
        });
        
        return services;
    }
}
