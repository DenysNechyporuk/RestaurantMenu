using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/admin/tables")]
public class AdminTablesController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminTablesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var tables = await _db.Tables
            .AsNoTracking()
            .OrderBy(t => t.Number)
            .Select(t => new { t.Id, t.Number, t.IsActive })
            .ToListAsync();

        return Ok(tables);
    }
}