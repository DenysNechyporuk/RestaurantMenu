namespace RestaurantSmartMenu.Application.DTOs;

public class UpsertMenuItemRequest
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
}