using RestaurantSmartMenu.Domain.Enums;

namespace RestaurantSmartMenu.Application.DTOs;

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
}