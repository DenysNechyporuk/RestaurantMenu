namespace RestaurantSmartMenu.Domain.Entities;

public class Table
{
    public int Id { get; set; }
    public int Number { get; set; }
    public bool IsActive { get; set; } = true;

    public List<Order> Orders { get; set; } = new();
}