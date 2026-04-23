using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Domain.Entities;
using RestaurantSmartMenu.Domain.Enums;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;

    public MenuController(AppDbContext db) => _db = db;

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

    [HttpGet("order")]
    public async Task<ActionResult<OrderDto>> GetActiveOrder([FromQuery] int tableId)
    {
        if (tableId <= 0) return BadRequest("TableId is required");

        var tableExists = await _db.Tables.AnyAsync(t => t.Id == tableId);
        if (!tableExists) return NotFound("Table not found");

        var order = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(oi => oi.MenuItem)
            .Where(o => o.TableId == tableId &&
                        (o.Status == OrderStatus.New || o.Status == OrderStatus.InProgress))
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync();

        if (order == null) return NoContent();

        return Ok(ToOrderDto(order));
    }

    private static OrderDto ToOrderDto(Order order)
    {
        var dto = new OrderDto
        {
            Id = order.Id,
            TableId = order.TableId,
            CreatedAtUtc = order.CreatedAtUtc,
            Status = order.Status,
            Note = order.Note,
            Items = order.Items.Select(oi => new OrderItemDto
            {
                MenuItemId = oi.MenuItemId,
                Name = oi.MenuItem?.Name ?? "",
                Qty = oi.Qty,
                UnitPrice = oi.UnitPrice,
                LineTotal = oi.UnitPrice * oi.Qty
            }).ToList()
        };

        dto.Total = dto.Items.Sum(x => x.LineTotal);
        return dto;
    }
}
