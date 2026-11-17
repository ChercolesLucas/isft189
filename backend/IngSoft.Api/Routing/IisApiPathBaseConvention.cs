using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace IngSoft.Api.Routing;

/// <summary>
/// Removes exactly the first "api" route segment when IIS already supplies
/// /api as PathBase for the application. The convention is opt-in through
/// configuration and does not inspect client-controlled headers.
/// </summary>
public sealed class IisApiPathBaseConvention : IApplicationModelConvention
{
    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers)
        foreach (var selector in controller.Selectors)
        {
            var route = selector.AttributeRouteModel;
            if (route?.Template is not { } template) continue;

            var leadingSlash = template.StartsWith('/');
            var normalized = template.TrimStart('/');
            if (string.Equals(normalized, "api", StringComparison.OrdinalIgnoreCase))
                route.Template = leadingSlash ? "/" : string.Empty;
            else if (normalized.StartsWith("api/", StringComparison.OrdinalIgnoreCase))
                route.Template = (leadingSlash ? "/" : string.Empty) + normalized[4..];
        }
    }
}
