using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Domain.Entities;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/admin/menu")]
public class AdminMenuController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminMenuController(AppDbContext db) => _db = db;

    // ------------------- CATEGORIES -------------------

    // GET /api/admin/menu/categories
    [HttpGet("categories")]
    public async Task<ActionResult> GetCategories()
    {
        var cats = await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new { c.Id, c.Name, c.SortOrder })
            .ToListAsync();

        return Ok(cats);
    }

    // POST /api/admin/menu/categories
    [HttpPost("categories")]
    public async Task<ActionResult> CreateCategory([FromBody] CreateCategoryRequest req)
    {
        var name = (req.Name ?? "").Trim();
        if (name.Length == 0) return BadRequest("Name is required");

        var cat = new Category
        {
            Name = name,
            SortOrder = req.SortOrder
        };

        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();

        return Ok(new { cat.Id });
    }

    // PUT /api/admin/menu/categories/{id}
    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryRequest req)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id);
        if (cat == null) return NotFound();

        var name = (req.Name ?? "").Trim();
        if (name.Length == 0) return BadRequest("Name is required");

        cat.Name = name;
        cat.SortOrder = req.SortOrder;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/admin/menu/categories/{id}
    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        // якщо є товари в категорії — не даємо видалити (щоб не ламати FK)
        var hasItems = await _db.MenuItems.AnyAsync(x => x.CategoryId == id);
        if (hasItems) return BadRequest("Category has menu items. Move/delete items first.");

        var cat = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id);
        if (cat == null) return NotFound();

        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ------------------- ITEMS -------------------

    // GET /api/admin/menu/items
    [HttpGet("items")]
    public async Task<ActionResult> GetItems()
    {
        var items = await _db.MenuItems
            .AsNoTracking()
            .OrderBy(i => i.CategoryId)
            .ThenBy(i => i.Name)
            .Select(i => new {
                i.Id,
                i.CategoryId,
                i.Name,
                i.Description,
                i.Price,
                i.ImageUrl,
                i.IsAvailable
            })
            .ToListAsync();

        return Ok(items);
    }

    // POST /api/admin/menu/items
    [HttpPost("items")]
    public async Task<ActionResult> CreateItem([FromBody] UpsertMenuItemRequest req)
    {
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == req.CategoryId);
        if (!categoryExists) return BadRequest("CategoryId not found");

        var name = (req.Name ?? "").Trim();
        if (name.Length == 0) return BadRequest("Name is required");

        var item = new MenuItem
        {
            CategoryId = req.CategoryId,
            Name = name,
            Description = req.Description?.Trim(),
            Price = req.Price,
            ImageUrl = req.ImageUrl?.Trim(),
            IsAvailable = req.IsAvailable
        };

        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new { item.Id });
    }

    // PUT /api/admin/menu/items/{id}
    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpsertMenuItemRequest req)
    {
        var item = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound();

        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == req.CategoryId);
        if (!categoryExists) return BadRequest("CategoryId not found");

        var name = (req.Name ?? "").Trim();
        if (name.Length == 0) return BadRequest("Name is required");

        item.CategoryId = req.CategoryId;
        item.Name = name;
        item.Description = req.Description?.Trim();
        item.Price = req.Price;
        item.ImageUrl = req.ImageUrl?.Trim();
        item.IsAvailable = req.IsAvailable;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/admin/menu/items/{id}
    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound();

        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}