using RestaurantSmartMenu.Domain.Enums;

namespace RestaurantSmartMenu.Application.DTOs;

public class OrderItemDto
{
    public int MenuItemId { get; set; }
    public string Name { get; set; } = "";
    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    
    public OrderItemStatus Status { get; set; }
}