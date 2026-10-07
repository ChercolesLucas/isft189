using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/auth")]
public class AuthController(AppDbContext db) : ControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var correo = request.Correo.Trim().ToLowerInvariant();
        var usuario = await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(x => x.Correo == correo && x.Contrasena == request.Contrasena);
        if (usuario is null) return Unauthorized(new ErrorResponse("Correo o contraseña incorrectos.", 401));
        return Ok(new LoginResponse(usuario.IdUsuario, usuario.Nombre, usuario.Correo));
    }
}
