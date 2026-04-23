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

    public void ChangeStatus(OrderStatus status)
    {
        Status = status;

        var itemStatus = status switch
        {
            OrderStatus.InProgress => OrderItemStatus.Confirm,
            OrderStatus.Cancelled => OrderItemStatus.Decline,
            _ => (OrderItemStatus?)null
        };

        if (itemStatus is null)
            return;

        foreach (var item in Items)
        {
            item.Status = itemStatus.Value;
        }
    }
}
