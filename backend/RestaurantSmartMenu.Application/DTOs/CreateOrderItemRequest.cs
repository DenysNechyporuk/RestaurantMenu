namespace RestaurantSmartMenu.Application.DTOs;

public class CreateOrderItemRequest
{
    public int MenuItemId { get; set; }
    public int Qty { get; set; }
}