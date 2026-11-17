using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace IngSoft.Api.Tests;

public sealed class RoutingTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Public_routes_are_identical_locally_and_under_iis(bool simulateIis)
    {
        await using var factory = new ApiFactory(simulateIis);
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/server/status")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/server/date")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/productos")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/auth/login", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/api/server/status")).StatusCode);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CreatedAtAction_preserves_the_public_api_prefix(bool simulateIis)
    {
        await using var factory = new ApiFactory(simulateIis);
        using var client = factory.CreateClient();
        var request = new
        {
            razonSocial = "Cliente de prueba",
            cuit = "20-00000000-1",
            tipoCliente = "MINORISTA",
            estadoCredito = "HABILITADO"
        };

        var response = await client.PostAsJsonAsync("/api/clientes", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Equal("/api/clientes/1", response.Headers.Location!.AbsolutePath);
    }

    [Fact]
    public async Task Swagger_is_available_under_the_iis_path_base()
    {
        await using var factory = new ApiFactory(true);
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/swagger/index.html")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/swagger/v1/swagger.json")).StatusCode);
    }
}
