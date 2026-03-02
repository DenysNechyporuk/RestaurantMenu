namespace RestaurantSmartMenu.Application.DTOs;

public class CreateOrderRequest
{
    public int TableId { get; set; }
    public string? Note { get; set; }
    public List<CreateOrderItemRequest> Items { get; set; } = new();
}