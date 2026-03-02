using RestaurantSmartMenu.Domain.Enums;

namespace RestaurantSmartMenu.Application.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public OrderStatus Status { get; set; }
    public string? Note { get; set; }
    public decimal Total { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}