namespace RestaurantSmartMenu.Application.DTOs;

public class UpdateOrderRequest
{
    public string? Note { get; set; }
    public List<CreateOrderItemRequest> Items { get; set; } = new();
}
