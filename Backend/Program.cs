using ChatbotApp.Backend.Hubs;
using ChatbotApp.Backend.Services;
using ChatbotApp.Backend.Extensions;
using Azure.AI.OpenAI;
using Azure;
using System.ClientModel;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    
    // Add a development policy for testing
    options.AddPolicy("AllowDevelopment", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add Application Insights telemetry
builder.Services.AddApplicationInsightsTelemetry();

// Add Azure OpenAI client (keep for backwards compatibility)
var openAiEndpoint = builder.Configuration["AzureOpenAI:Endpoint"];
var openAiKey = builder.Configuration["AzureOpenAI:ApiKey"];

if (!string.IsNullOrEmpty(openAiEndpoint) && !string.IsNullOrEmpty(openAiKey))
{
    builder.Services.AddSingleton<AzureOpenAIClient>(provider =>
        new AzureOpenAIClient(new Uri(openAiEndpoint), new ApiKeyCredential(openAiKey)));
}

// Add Semantic Kernel with plugins
builder.Services.AddSemanticKernel(builder.Configuration);
builder.Services.AddSemanticKernelLogging();

// Add Quiz Service
builder.Services.AddScoped<IQuizService, QuizService>();

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
    logging.AddApplicationInsights();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseDeveloperExceptionPage();

// Apply CORS before other middleware
app.UseCors("AllowDevelopment");

app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapHub<QuizHub>("/quizhub");

app.Run();
