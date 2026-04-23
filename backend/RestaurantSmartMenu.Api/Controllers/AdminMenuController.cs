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
    private readonly IWebHostEnvironment _environment;
    public AdminMenuController(AppDbContext db, IWebHostEnvironment environment)
    {
        _db = db;
        _environment = environment;
    }

    
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
    
    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var hasItems = await _db.MenuItems.AnyAsync(x => x.CategoryId == id);
        if (hasItems) return BadRequest("Category has menu items. Move/delete items first.");

        var cat = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id);
        if (cat == null) return NotFound();

        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    
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

    
    [HttpPost("items")]
    public async Task<ActionResult> CreateItem([FromForm] UpsertMenuItemRequest req)
    {
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == req.CategoryId);
        if (!categoryExists) return BadRequest("CategoryId not found");

        var name = (req.Name ?? "").Trim();
        if (name.Length == 0) return BadRequest("Name is required");
        var imageUrl = await SaveImageAsync(req.ImageUrl);

        var item = new MenuItem
        {
            CategoryId = req.CategoryId,
            Name = name,
            Description = req.Description?.Trim(),
            Price = req.Price,
            ImageUrl = imageUrl,
            IsAvailable = req.IsAvailable
        };

        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new { item.Id });
    }

    
    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromForm] UpsertMenuItemRequest req)
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
        if (req.ImageUrl is not null)
        {
            DeleteImage(item.ImageUrl);
            item.ImageUrl = await SaveImageAsync(req.ImageUrl);
        }
        item.IsAvailable = req.IsAvailable;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    
    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound();

        DeleteImage(item.ImageUrl);
        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> SaveImageAsync(IFormFile? image)
    {
        if (image is null || image.Length == 0) return null;

        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        }

        var uploadsDir = Path.Combine(webRoot, "uploads", "menu-items");
        Directory.CreateDirectory(uploadsDir);

        var extension = Path.GetExtension(image.FileName);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await image.CopyToAsync(stream);

        return $"/uploads/menu-items/{fileName}";
    }

    private void DeleteImage(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return;
        if (!imageUrl.StartsWith("/uploads/menu-items/", StringComparison.OrdinalIgnoreCase)) return;

        var relativePath = imageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        }

        var filePath = Path.Combine(webRoot, relativePath);
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }
    }
}
