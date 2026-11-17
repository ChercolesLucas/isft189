using System.Diagnostics;
using System.Globalization;
using Serilog;
using Serilog.Events;
using Serilog.Formatting;

namespace IngSoft.Api.Logging;

public sealed class InternalLogOptions
{
    public bool Enabled { get; set; } = true;
    public string Directory { get; set; } = "logs";
    public int RetentionDays { get; set; } = 30;
    public long FileSizeLimitBytes { get; set; } = 10 * 1024 * 1024;
    public string MinimumLevel { get; set; } = "Information";
}

public static class InternalLoggerFactory
{
    public static Serilog.ILogger Create(IConfiguration configuration, IHostEnvironment environment)
    {
        var options = configuration.GetSection("InternalLogging").Get<InternalLogOptions>() ?? new InternalLogOptions();
        var minimumLevel = Enum.TryParse<LogEventLevel>(options.MinimumLevel, true, out var parsed)
            ? parsed
            : LogEventLevel.Information;

        var logger = new LoggerConfiguration()
            .MinimumLevel.Is(minimumLevel)
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "IngSoft.Api")
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}");

        if (!options.Enabled) return logger.CreateLogger();

        try
        {
            var directory = Path.IsPathRooted(options.Directory)
                ? options.Directory
                : Path.Combine(environment.ContentRootPath, options.Directory);
            Directory.CreateDirectory(directory);
            var formatter = new AcademicLogTextFormatter();
            var retention = options.RetentionDays > 0 ? TimeSpan.FromDays(options.RetentionDays) : (TimeSpan?)null;

            logger.WriteTo.Logger(activity => activity
                .Filter.ByIncludingOnly(logEvent => logEvent.Level < LogEventLevel.Error)
                .WriteTo.File(
                    formatter,
                    Path.Combine(directory, "IngSoft_Log_.log"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: null,
                    retainedFileTimeLimit: retention,
                    fileSizeLimitBytes: options.FileSizeLimitBytes > 0 ? options.FileSizeLimitBytes : null,
                    rollOnFileSizeLimit: true,
                    shared: true));

            logger.WriteTo.Logger(errors => errors
                .Filter.ByIncludingOnly(logEvent => logEvent.Level >= LogEventLevel.Error)
                .WriteTo.File(
                    formatter,
                    Path.Combine(directory, "IngSoft_Error_.err"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: null,
                    retainedFileTimeLimit: retention,
                    fileSizeLimitBytes: options.FileSizeLimitBytes > 0 ? options.FileSizeLimitBytes : null,
                    rollOnFileSizeLimit: true,
                    shared: true));
        }
        catch (Exception exception)
        {
            Debug.WriteLine($"No se pudo configurar el logging en archivos: {exception}");
        }

        return logger.CreateLogger();
    }
}

public sealed class AcademicLogTextFormatter : ITextFormatter
{
    private const string Separator = "------------------------------------------------------------";

    public void Format(LogEvent logEvent, TextWriter output)
    {
        output.WriteLine(Separator);
        output.WriteLine($"F/H UTC: {logEvent.Timestamp.UtcDateTime:dd/MM/yyyy HH:mm:ss.fff}");
        output.WriteLine($"Nivel: {logEvent.Level.ToString().ToUpperInvariant()}");
        WriteProperty(output, "Rutina", GetProperty(logEvent, "Routine") ?? ShortSourceContext(logEvent));
        WriteProperty(output, "Metodo", GetProperty(logEvent, "Method"));
        WriteProperty(output, "Endpoint", GetProperty(logEvent, "Endpoint"));
        WriteProperty(output, "Estado HTTP", GetProperty(logEvent, "StatusCode"));
        var duration = GetProperty(logEvent, "DurationMs");
        WriteProperty(output, "Duracion", duration is null ? null : $"{duration} ms");
        WriteProperty(output, "TraceId", GetProperty(logEvent, "TraceId"));

        if (logEvent.Exception is null)
        {
            output.WriteLine($"LOG: {logEvent.RenderMessage(CultureInfo.InvariantCulture)}");
        }
        else
        {
            output.WriteLine($"Error: {logEvent.RenderMessage(CultureInfo.InvariantCulture)}");
            output.WriteLine($"Exception: {logEvent.Exception.GetType().FullName}");
            output.WriteLine($"Detalle: {logEvent.Exception.Message}");
            if (!string.IsNullOrWhiteSpace(logEvent.Exception.StackTrace))
                output.WriteLine($"StackTrace: {logEvent.Exception.StackTrace}");
        }

        output.WriteLine(Separator);
    }

    private static string? GetProperty(LogEvent logEvent, string name) =>
        logEvent.Properties.TryGetValue(name, out var value)
            ? value is ScalarValue scalar ? Convert.ToString(scalar.Value, CultureInfo.InvariantCulture) : value.ToString().Trim('"')
            : null;

    private static string ShortSourceContext(LogEvent logEvent)
    {
        var source = GetProperty(logEvent, "SourceContext") ?? "Application";
        return source.StartsWith("IngSoft.Api.", StringComparison.Ordinal) ? source[12..] : source;
    }

    private static void WriteProperty(TextWriter output, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value)) output.WriteLine($"{label}: {value}");
    }
}
