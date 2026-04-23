using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Application.DTOs;
using RestaurantSmartMenu.Domain.Entities;
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

        var result = orders.Select(ToDto).ToList();

        return Ok(result);
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

        var menuItemIds = normalizedItems.Select(x => x.MenuItemId).ToList();
        var menuItems = await _db.MenuItems
            .AsNoTracking()
            .Where(m => menuItemIds.Contains(m.Id))
            .ToListAsync();

        if (menuItems.Count != menuItemIds.Count)
            return BadRequest("Some menu items not found");

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

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.ChangeStatus(request.Status);

        if (request.Status == OrderStatus.InProgress)
        {
            MergeConfirmedItems(order);
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private void MergeConfirmedItems(Order order)
    {
        var duplicatesToRemove = new List<OrderItem>();

        foreach (var group in order.Items
                     .Where(x => x.Status == OrderItemStatus.Confirm)
                     .GroupBy(x => x.MenuItemId)
                     .Where(g => g.Count() > 1))
        {
            var primaryItem = group
                .OrderBy(x => x.Id)
                .First();

            primaryItem.Qty = group.Sum(x => x.Qty);

            var redundantItems = group
                .Where(x => x.Id != primaryItem.Id)
                .ToList();

            duplicatesToRemove.AddRange(redundantItems);
        }

        if (duplicatesToRemove.Count == 0)
            return;

        foreach (var item in duplicatesToRemove)
        {
            order.Items.Remove(item);
        }

        _db.OrderItems.RemoveRange(duplicatesToRemove);
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
