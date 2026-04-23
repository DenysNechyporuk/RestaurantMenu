using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Domain.Entities;
using RestaurantSmartMenu.Domain.Enums;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrdersController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderRequest request)
    {
        if (request.TableId <= 0) return BadRequest("TableId is required");
        if (request.Items.Count == 0) return BadRequest("Items are required");
        if (request.Items.Any(x => x.MenuItemId <= 0)) return BadRequest("MenuItemId is required");
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

        var createdOrder = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(oi => oi.MenuItem)
            .FirstAsync(o => o.Id == order.Id);

        return Ok(ToDto(createdOrder));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<OrderDto>> Update(int id, [FromBody] UpdateOrderRequest request)
    {
        if (request.Items.Count == 0) return BadRequest("Items are required");
        if (request.Items.Any(x => x.MenuItemId <= 0)) return BadRequest("MenuItemId is required");
        if (request.Items.Any(x => x.Qty <= 0)) return BadRequest("Qty must be > 0");

        var normalizedItems = request.Items
            .GroupBy(x => x.MenuItemId)
            .Select(g => new
            {
                MenuItemId = g.Key,
                Qty = g.Sum(x => x.Qty)
            })
            .ToList();

        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        if (order.Status != OrderStatus.New && order.Status != OrderStatus.InProgress)
            return BadRequest("Only orders with status New or InProgress can be edited");

        var existingMenuItemIds = order.Items
            .Select(x => x.MenuItemId)
            .ToHashSet();

        var menuItemIds = normalizedItems.Select(x => x.MenuItemId).ToList();
        var menuItems = await _db.MenuItems
            .AsNoTracking()
            .Where(m => menuItemIds.Contains(m.Id))
            .ToListAsync();

        if (menuItems.Count != menuItemIds.Count)
            return BadRequest("Some menu items not found");

        var unavailableNewItems = menuItems
            .Where(m => !m.IsAvailable && !existingMenuItemIds.Contains(m.Id))
            .Select(m => m.Id)
            .ToHashSet();

        if (normalizedItems.Any(x => unavailableNewItems.Contains(x.MenuItemId)))
            return BadRequest("Some menu items not found or not available");

        order.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        var requestedQtyByMenuItemId = normalizedItems.ToDictionary(x => x.MenuItemId, x => x.Qty);
        var existingItemsByMenuItemId = order.Items
            .GroupBy(x => x.MenuItemId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).ToList());

        var newItemsToRemove = new List<OrderItem>();

        foreach (var (menuItemId, existingItems) in existingItemsByMenuItemId)
        {
            var lockedItems = existingItems
                .Where(x => x.Status != OrderItemStatus.New)
                .ToList();
            var editableItems = existingItems
                .Where(x => x.Status == OrderItemStatus.New)
                .OrderBy(x => x.Id)
                .ToList();

            var lockedQty = lockedItems.Sum(x => x.Qty);
            var requestedQty = requestedQtyByMenuItemId.GetValueOrDefault(menuItemId);

            if (requestedQty < lockedQty)
                return BadRequest($"Cannot reduce quantity for menu item {menuItemId} below already processed items");

            var editableQty = requestedQty - lockedQty;

            if (editableQty == 0)
            {
                newItemsToRemove.AddRange(editableItems);
            }
            else if (editableItems.Count > 0)
            {
                editableItems[0].Qty = editableQty;
                newItemsToRemove.AddRange(editableItems.Skip(1));
            }
            else if (requestedQtyByMenuItemId.ContainsKey(menuItemId))
            {
                var menuItem = menuItems.First(m => m.Id == menuItemId);
                order.Items.Add(new OrderItem
                {
                    MenuItemId = menuItem.Id,
                    Qty = editableQty,
                    UnitPrice = menuItem.Price
                });
            }

            requestedQtyByMenuItemId.Remove(menuItemId);
        }

        if (newItemsToRemove.Count > 0)
        {
            _db.OrderItems.RemoveRange(newItemsToRemove);
        }

        foreach (var item in requestedQtyByMenuItemId)
        {
            var menuItem = menuItems.First(m => m.Id == item.Key);
            order.Items.Add(new OrderItem
            {
                MenuItemId = menuItem.Id,
                Qty = item.Value,
                UnitPrice = menuItem.Price
            });
        }

        await _db.SaveChangesAsync();

        var updatedOrder = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(oi => oi.MenuItem)
            .FirstAsync(o => o.Id == id);

        return Ok(ToDto(updatedOrder));
    }

    private static OrderDto ToDto(Order order)
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
                LineTotal = oi.UnitPrice * oi.Qty,
                Status = oi.Status
            }).ToList()
        };

        dto.Total = dto.Items.Sum(x => x.LineTotal);
        return dto;
    }
}
