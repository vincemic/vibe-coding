using ChatbotApp.Backend.Hubs;
using ChatbotApp.Backend.Services;
using Azure.AI.OpenAI;
using Azure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add Application Insights telemetry
builder.Services.AddApplicationInsightsTelemetry();

// Add Azure OpenAI client
var openAiEndpoint = builder.Configuration["AzureOpenAI:Endpoint"];
var openAiKey = builder.Configuration["AzureOpenAI:ApiKey"];

if (!string.IsNullOrEmpty(openAiEndpoint) && !string.IsNullOrEmpty(openAiKey))
{
    builder.Services.AddSingleton<OpenAIClient>(provider =>
        new OpenAIClient(new Uri(openAiEndpoint), new AzureKeyCredential(openAiKey)));
}

// Add custom services
builder.Services.AddScoped<IChatService, ChatService>();

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
    logging.AddApplicationInsights();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseCors("AllowAngularApp");
}
else
{
    app.UseCors("AllowAngularApp");
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/chathub");

app.Run();
