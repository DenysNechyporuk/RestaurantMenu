namespace RestaurantSmartMenu.Application.DTOs;

public class CreateCategoryRequest
{
    public string Name { get; set; } = "";
    public int SortOrder { get; set; } = 0;
}