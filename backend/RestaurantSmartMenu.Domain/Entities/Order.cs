using RestaurantSmartMenu.Domain.Enums;

namespace RestaurantSmartMenu.Domain.Entities;

public class Order
{
    public int Id { get; set; }

    public int TableId { get; set; }
    public Table? Table { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.New;

    public string? Note { get; set; }

    public List<OrderItem> Items { get; set; } = new();
}