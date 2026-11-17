using System.Diagnostics;
using IngSoft.Api.DTOs;
using Microsoft.AspNetCore.Mvc.Controllers;
using Serilog.Context;

namespace IngSoft.Api.Middleware;

public sealed class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Error inesperado durante el procesamiento de la solicitud. Estado HTTP: {StatusCode}.", StatusCodes.Status500InternalServerError);

            if (context.Response.HasStarted)
            {
                logger.LogWarning("La respuesta ya había comenzado y no pudo reemplazarse.");
                return;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ErrorResponse("Ocurrió un error interno en el servidor.", 500));
        }
    }
}

public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var traceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
        var endpointPath = $"{context.Request.PathBase}{context.Request.Path}";
        var action = context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>();
        var routine = action is null ? "HTTP Request" : $"{action.ControllerName}Controller.{action.ActionName}";

        using (LogContext.PushProperty("TraceId", traceId))
        using (LogContext.PushProperty("Method", context.Request.Method))
        using (LogContext.PushProperty("Endpoint", endpointPath))
        using (LogContext.PushProperty("Routine", routine))
        {
            try
            {
                await next(context);
            }
            finally
            {
                stopwatch.Stop();
                var statusCode = context.Response.StatusCode;
                if (statusCode >= 400)
                    logger.LogWarning("Solicitud HTTP finalizada con estado {StatusCode} en {DurationMs} ms.", statusCode, stopwatch.ElapsedMilliseconds);
                else
                    logger.LogInformation("Solicitud HTTP finalizada con estado {StatusCode} en {DurationMs} ms.", statusCode, stopwatch.ElapsedMilliseconds);
            }
        }
    }
}
