using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Domain.Enums;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminOrdersController(AppDbContext db) => _db = db;

    
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> Get([FromQuery] OrderStatus[]? statuses = null)
    {
        var query = _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(oi => oi.MenuItem)
            .OrderByDescending(o => o.CreatedAtUtc)
            .AsQueryable();

        if (statuses is { Length: > 0 })
            query = query.Where(o => statuses.Contains(o.Status));

        var orders = await query.Take(200).ToListAsync();

        var result = orders.Select(o =>
        {
            var dto = new OrderDto
            {
                Id = o.Id,
                TableId = o.TableId,
                CreatedAtUtc = o.CreatedAtUtc,
                Status = o.Status,
                Note = o.Note,
                Items = o.Items.Select(oi => new OrderItemDto
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
        }).ToList();

        return Ok(result);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.Status = request.Status;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
