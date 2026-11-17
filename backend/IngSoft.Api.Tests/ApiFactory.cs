using IngSoft.Api.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace IngSoft.Api.Tests;

public sealed class ApiFactory(bool simulateIisPathBase) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Routing:StripApiPrefixWhenHostedUnderApi", simulateIisPathBase.ToString());
        builder.UseSetting("InternalLogging:Enabled", "false");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase($"IngSoftTests-{Guid.NewGuid()}"));
            if (simulateIisPathBase) services.AddSingleton<IStartupFilter>(new TestPathBaseStartupFilter("/api"));
        });
    }

    private sealed class TestPathBaseStartupFilter(string pathBase) : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            app.UsePathBase(pathBase);
            next(app);
        };
    }
}
