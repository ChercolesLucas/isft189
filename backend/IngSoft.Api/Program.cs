using System.Text.Json;
using System.Text.Json.Serialization;
using IngSoft.Api.Data;
using IngSoft.Api.Logging;
using IngSoft.Api.Middleware;
using IngSoft.Api.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
Log.Logger = InternalLoggerFactory.Create(builder.Configuration, builder.Environment);
builder.Host.UseSerilog(Log.Logger, dispose: true);
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
var stripApiPrefix = builder.Configuration.GetValue<bool>("Routing:StripApiPrefixWhenHostedUnderApi");
builder.Services.AddControllers(options =>
{
    if (stripApiPrefix) options.Conventions.Add(new IisApiPathBaseConvention());
}).AddJsonOptions(o => { o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase; o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => { o.SwaggerDoc("v1", new OpenApiInfo { Title = "IngSoft API", Version = "v1", Description = "API REST de gestión comercial" }); });
var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173", "http://localhost:3000"];
builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader()));
var app = builder.Build();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(options => options.SwaggerEndpoint("./v1/swagger.json", "IngSoft API v1"));
app.UseCors("Frontend");
app.MapControllers();
app.Run();

public partial class Program;
