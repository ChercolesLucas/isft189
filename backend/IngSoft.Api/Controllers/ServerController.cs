using Microsoft.AspNetCore.Mvc;
using IngSoft.Api.DTOs;
namespace IngSoft.Api.Controllers;
[ApiController, Route("api/server")]
public class ServerController : ControllerBase
{
    [HttpGet("status"), ProducesResponseType(typeof(ServerStatusResponse), 200)] public IActionResult Status() => Ok(new ServerStatusResponse("ACTIVO"));
    [HttpGet("date"), ProducesResponseType(typeof(ServerDateResponse), 200)] public IActionResult Date() => Ok(new ServerDateResponse(DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss")));
}
