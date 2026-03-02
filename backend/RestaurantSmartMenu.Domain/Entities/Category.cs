namespace RestaurantSmartMenu.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }

    public List<MenuItem> Items { get; set; } = new();
}