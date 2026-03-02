using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;

    public MenuController(AppDbContext db) => _db = db;

    // GET /api/menu?tableId=5
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> Get([FromQuery] int tableId)
    {
        var tableExists = await _db.Tables.AnyAsync(t => t.Id == tableId);
        if (!tableExists) return NotFound("Table not found");

        var categories = await _db.Categories
            .Include(c => c.Items)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var result = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            SortOrder = c.SortOrder,
            Items = c.Items
                .Where(i => i.IsAvailable)
                .Select(i => new MenuItemDto
                {
                    Id = i.Id,
                    CategoryId = i.CategoryId,
                    Name = i.Name,
                    Description = i.Description,
                    Price = i.Price,
                    ImageUrl = i.ImageUrl,
                    IsAvailable = i.IsAvailable
                })
                .ToList()
        }).ToList();

        return Ok(result);
    }
}