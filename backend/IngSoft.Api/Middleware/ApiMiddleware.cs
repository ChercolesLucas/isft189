using System.Diagnostics;
using System.Globalization;
using IngSoft.Api.DTOs;
using Microsoft.Extensions.Options;

namespace IngSoft.Api.Middleware;

public sealed class FileLogOptions
{
    public string Directory { get; set; } = "logs";
    public int RetentionDays { get; set; } = 30;
    public long FileSizeLimitBytes { get; set; } = 10 * 1024 * 1024;
    public bool Enabled { get; set; } = true;
}

internal static class FileLogWriter
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private const string ActivityPrefix = "IngSoft_Api_Log_";
    private const string ErrorPrefix = "IngSoft_Api_Error_";

    public static async Task TryAppendAsync(string kind, string content, FileLogOptions options, ILogger logger)
    {
        if (!options.Enabled) return;
        try
        {
            var directory = Path.IsPathRooted(options.Directory) ? options.Directory : Path.Combine(AppContext.BaseDirectory, options.Directory);
            Directory.CreateDirectory(directory);
            await Gate.WaitAsync();
            try
            {
                var date = DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
                var prefix = kind == "error" ? ErrorPrefix : ActivityPrefix;
                var extension = kind == "error" ? ".err" : ".log";
                var path = GetAvailablePath(directory, prefix, date, extension, content.Length, options.FileSizeLimitBytes);
                await File.AppendAllTextAsync(path, content);
                CleanupOldFiles(directory, options.RetentionDays);
            }
            finally { Gate.Release(); }
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "No se pudo escribir el archivo de log.");
        }
    }

    private static string GetAvailablePath(string directory, string prefix, string date, string extension, int contentLength, long limit)
    {
        var index = 0;
        while (true)
        {
            var suffix = index == 0 ? string.Empty : $"_{index}";
            var path = Path.Combine(directory, $"{prefix}{date}{suffix}{extension}");
            if (!File.Exists(path) || limit <= 0 || new FileInfo(path).Length + contentLength <= limit) return path;
            index++;
        }
    }

    private static void CleanupOldFiles(string directory, int retentionDays)
    {
        if (retentionDays <= 0) return;
        var threshold = DateTime.UtcNow.Date.AddDays(-retentionDays);
        var info = new DirectoryInfo(directory);
        foreach (var file in info.EnumerateFiles("IngSoft_Api_*.log").Concat(info.EnumerateFiles("IngSoft_Api_*.err")))
            if (file.LastWriteTimeUtc < threshold) file.Delete();
    }
}

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger, IOptions<FileLogOptions> options)
{
    public async Task Invoke(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            var traceId = context.TraceIdentifier;
            logger.LogError(exception, "Unhandled error. TraceId: {TraceId}, Method: {Method}, Path: {Path}", traceId, context.Request.Method, context.Request.Path);
            var entry = LogFormatter.Error(DateTime.UtcNow, traceId, context.Request.Method, context.Request.Path, 500, "ErrorHandlingMiddleware", "Error inesperado durante el procesamiento de la solicitud.", exception);
            await FileLogWriter.TryAppendAsync("error", entry, options.Value, logger);
            if (context.Response.HasStarted)
            {
                logger.LogWarning("La respuesta ya había comenzado y no pudo reemplazarse. TraceId: {TraceId}", traceId);
                return;
            }
            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ErrorResponse("Ocurrió un error interno en el servidor.", 500));
        }
    }
}

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger, IOptions<FileLogOptions> options)
{
    public async Task Invoke(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        try { await next(context); }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;
            var level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARNING" : "INFORMATION";
            var entry = LogFormatter.Activity(DateTime.UtcNow, level, context.TraceIdentifier, context.Request.Method, context.Request.Path, statusCode, stopwatch.ElapsedMilliseconds, "Request", $"Solicitud HTTP finalizada con nivel {level}.");
            await FileLogWriter.TryAppendAsync("activity", entry, options.Value, logger);
            logger.LogInformation("HTTP {Method} {Path} responded {StatusCode} in {Duration} ms. TraceId: {TraceId}", context.Request.Method, context.Request.Path, statusCode, stopwatch.ElapsedMilliseconds, context.TraceIdentifier);
        }
    }
}

internal static class LogFormatter
{
    public static string Activity(DateTime timestamp, string level, string traceId, string method, string path, int statusCode, long duration, string routine, string message) => $"----------------------------------------------------------------{Environment.NewLine}F/H UTC: {timestamp:O}{Environment.NewLine}Nivel: {level}{Environment.NewLine}Rutina: {routine}{Environment.NewLine}Metodo: {method}{Environment.NewLine}Endpoint: {path}{Environment.NewLine}Estado HTTP: {statusCode}{Environment.NewLine}Duracion: {duration} ms{Environment.NewLine}TraceId: {traceId}{Environment.NewLine}LOG: {message}{Environment.NewLine}----------------------------------------------------------------{Environment.NewLine}";
    public static string Error(DateTime timestamp, string traceId, string method, string path, int statusCode, string routine, string message, Exception exception) => $"----------------------------------------------------------------{Environment.NewLine}F/H UTC: {timestamp:O}{Environment.NewLine}Nivel: ERROR{Environment.NewLine}Rutina: {routine}{Environment.NewLine}Metodo: {method}{Environment.NewLine}Endpoint: {path}{Environment.NewLine}Estado HTTP: {statusCode}{Environment.NewLine}TraceId: {traceId}{Environment.NewLine}Error: {message}{Environment.NewLine}Exception: {exception}{Environment.NewLine}----------------------------------------------------------------{Environment.NewLine}";
}
