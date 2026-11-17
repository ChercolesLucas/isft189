using IngSoft.Api.Logging;
using IngSoft.Api.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Xunit;

namespace IngSoft.Api.Tests;

public sealed class LoggingTests
{
    [Fact]
    public async Task Unexpected_exception_creates_correlated_activity_and_error_files_without_request_body()
    {
        var directory = NewTemporaryDirectory();
        var serilog = CreateLogger(directory);
        using var loggerFactory = LoggerFactory.Create(builder => builder.AddSerilog(serilog, dispose: false));
        var context = NewContext("/api/test-error", "password=super-secret");
        var errorMiddleware = new ErrorHandlingMiddleware(
            _ => throw new InvalidOperationException("Fallo controlado para la prueba."),
            loggerFactory.CreateLogger<ErrorHandlingMiddleware>());
        var requestMiddleware = new RequestLoggingMiddleware(
            errorMiddleware.Invoke,
            loggerFactory.CreateLogger<RequestLoggingMiddleware>());

        await requestMiddleware.Invoke(context);
        (serilog as IDisposable)?.Dispose();

        var activity = ReadSingle(directory, "IngSoft_Log_*.log");
        var error = ReadSingle(directory, "IngSoft_Error_*.err");
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Contains("Estado HTTP: 500", activity);
        Assert.Contains("TraceId:", activity);
        Assert.Contains("System.InvalidOperationException", error);
        Assert.Contains("Estado HTTP: 500", error);
        Assert.Equal(1, CountOccurrences(error, "Exception:"));
        Assert.DoesNotContain("super-secret", activity);
        Assert.DoesNotContain("super-secret", error);
    }

    [Fact]
    public async Task Validation_error_is_activity_warning_and_not_an_exception()
    {
        var directory = NewTemporaryDirectory();
        var serilog = CreateLogger(directory);
        using var loggerFactory = LoggerFactory.Create(builder => builder.AddSerilog(serilog, dispose: false));
        var context = NewContext("/api/validation", "correo=private@example.test");
        var middleware = new RequestLoggingMiddleware(
            nextContext => { nextContext.Response.StatusCode = StatusCodes.Status400BadRequest; return Task.CompletedTask; },
            loggerFactory.CreateLogger<RequestLoggingMiddleware>());

        await middleware.Invoke(context);
        (serilog as IDisposable)?.Dispose();

        var activity = ReadSingle(directory, "IngSoft_Log_*.log");
        Assert.Contains("Nivel: WARNING", activity);
        Assert.Contains("Estado HTTP: 400", activity);
        Assert.Empty(Directory.GetFiles(directory, "IngSoft_Error_*.err"));
        Assert.DoesNotContain("private@example.test", activity);
    }

    [Fact]
    public void Activity_log_rolls_when_the_configured_size_is_reached()
    {
        var directory = NewTemporaryDirectory();
        var serilog = CreateLogger(directory, fileSizeLimitBytes: 512);

        for (var index = 0; index < 30; index++)
            serilog.Information("Evento de prueba {Index}: {Payload}", index, new string('x', 200));

        (serilog as IDisposable)?.Dispose();

        Assert.True(Directory.GetFiles(directory, "IngSoft_Log_*.log").Length > 1);
        Assert.Empty(Directory.GetFiles(directory, "IngSoft_Error_*.err"));
    }

    private static DefaultHttpContext NewContext(string path, string body)
    {
        var context = new DefaultHttpContext();
        context.TraceIdentifier = Guid.NewGuid().ToString("N");
        context.Request.Method = HttpMethods.Post;
        context.Request.Path = path;
        context.Request.Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(body));
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static Serilog.ILogger CreateLogger(string directory, long fileSizeLimitBytes = 1_048_576)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["InternalLogging:Enabled"] = "true",
            ["InternalLogging:Directory"] = directory,
            ["InternalLogging:RetentionDays"] = "30",
            ["InternalLogging:FileSizeLimitBytes"] = fileSizeLimitBytes.ToString(),
            ["InternalLogging:MinimumLevel"] = "Information"
        }).Build();
        return InternalLoggerFactory.Create(configuration, new TestEnvironment(directory));
    }

    private static string NewTemporaryDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), $"IngSoft.Api.Tests-{Guid.NewGuid():N}");
        Directory.CreateDirectory(path);
        return path;
    }

    private static string ReadSingle(string directory, string pattern) => File.ReadAllText(Assert.Single(Directory.GetFiles(directory, pattern)));
    private static int CountOccurrences(string value, string search) => (value.Length - value.Replace(search, string.Empty).Length) / search.Length;

    private sealed class TestEnvironment(string contentRootPath) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Testing";
        public string ApplicationName { get; set; } = "IngSoft.Api.Tests";
        public string ContentRootPath { get; set; } = contentRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
