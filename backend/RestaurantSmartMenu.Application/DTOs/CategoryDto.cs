namespace RestaurantSmartMenu.Application.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }
    public List<MenuItemDto> Items { get; set; } = new();
}