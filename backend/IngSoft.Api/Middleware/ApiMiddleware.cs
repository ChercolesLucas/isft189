using System.Text;
using IngSoft.Api.DTOs;

namespace IngSoft.Api.Middleware;

internal static class FileLogWriter
{
    private static readonly SemaphoreSlim Gate = new(1, 1);

    public static async Task AppendAsync(string fileName, string content)
    {
        var directory = Path.Combine(AppContext.BaseDirectory, "logs");
        Directory.CreateDirectory(directory);
        await Gate.WaitAsync();
        try { await File.AppendAllTextAsync(Path.Combine(directory, fileName), content); }
        finally { Gate.Release(); }
    }
}

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled error processing {Method} {Path}", context.Request.Method, context.Request.Path);
            await TryWriteErrorLog(exception);
            if (context.Response.HasStarted)
            {
                logger.LogWarning("The response had already started; the HTTP status could not be replaced with 500.");
                return;
            }
            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ErrorResponse("Ocurrió un error interno en el servidor.", 500));
        }
    }

    private async Task TryWriteErrorLog(Exception exception)
    {
        try { await FileLogWriter.AppendAsync($"errors_{DateTime.Now:yyyyMMdd}.log", $"{DateTime.Now:O}{Environment.NewLine}{exception}{Environment.NewLine}"); }
        catch (Exception logException) { logger.LogError(logException, "The error could not be written to the text log."); }
    }
}

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        context.Request.EnableBuffering();
        var body = string.Empty;
        if (context.Request.ContentLength is > 0 and < 1_000_000)
        {
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
        }
        await next(context);
        try
        {
            var query = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : string.Empty;
            await FileLogWriter.AppendAsync($"requests_{DateTime.Now:yyyyMMdd}.log", $"{DateTime.Now:O} | {context.Request.Method} | {context.Request.Path}{query} | Body: {body} | Status: {context.Response.StatusCode}{Environment.NewLine}");
        }
        catch (Exception exception) { logger.LogWarning(exception, "The request could not be written to the text log."); }
    }
}
