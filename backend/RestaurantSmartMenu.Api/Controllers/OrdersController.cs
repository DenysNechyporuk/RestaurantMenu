using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Domain.Entities;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrdersController(AppDbContext db) => _db = db;

    // POST /api/orders
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderRequest request)
    {
        if (request.TableId <= 0) return BadRequest("TableId is required");
        if (request.Items.Count == 0) return BadRequest("Items are required");
        if (request.Items.Any(x => x.Qty <= 0)) return BadRequest("Qty must be > 0");

        var tableExists = await _db.Tables.AnyAsync(t => t.Id == request.TableId);
        if (!tableExists) return NotFound("Table not found");

        var ids = request.Items.Select(i => i.MenuItemId).Distinct().ToList();
        var menuItems = await _db.MenuItems
            .Where(m => ids.Contains(m.Id) && m.IsAvailable)
            .ToListAsync();

        if (menuItems.Count != ids.Count)
            return BadRequest("Some menu items not found or not available");

        var order = new Order
        {
            TableId = request.TableId,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Items = request.Items.Select(x =>
            {
                var mi = menuItems.First(m => m.Id == x.MenuItemId);
                return new OrderItem
                {
                    MenuItemId = mi.Id,
                    Qty = x.Qty,
                    UnitPrice = mi.Price
                };
            }).ToList()
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        // Повертаємо DTO
        var dto = new OrderDto
        {
            Id = order.Id,
            TableId = order.TableId,
            CreatedAtUtc = order.CreatedAtUtc,
            Status = order.Status,
            Note = order.Note,
            Items = order.Items.Select(oi =>
            {
                var mi = menuItems.First(m => m.Id == oi.MenuItemId);
                return new OrderItemDto
                {
                    MenuItemId = oi.MenuItemId,
                    Name = mi.Name,
                    Qty = oi.Qty,
                    UnitPrice = oi.UnitPrice,
                    LineTotal = oi.UnitPrice * oi.Qty
                };
            }).ToList()
        };
        dto.Total = dto.Items.Sum(x => x.LineTotal);

        return Ok(dto);
    }
}