namespace RestaurantSmartMenu.Application.DTOs;

public class UpdateCategoryRequest
{
    public string Name { get; set; } = "";
    public int SortOrder { get; set; } = 0;
}