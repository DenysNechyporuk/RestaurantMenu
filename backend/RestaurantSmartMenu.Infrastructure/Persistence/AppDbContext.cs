using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Domain.Entities;
using RestaurantSmartMenu.Domain.Enums;

namespace RestaurantSmartMenu.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Table>()
            .HasIndex(t => t.Number)
            .IsUnique();

        modelBuilder.Entity<MenuItem>()
            .Property(x => x.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(x => x.UnitPrice)
            .HasPrecision(10, 2);
        
        modelBuilder.Entity<Category>()
            .HasIndex(x => x.Name)
            .IsUnique();
        
        modelBuilder.Entity<MenuItem>()
            .HasIndex(x => x.Name)
            .IsUnique();
        
        modelBuilder
            .Entity<OrderItem>()
            .Property(e => e.Status)
            .HasConversion(
                v => v.ToString(),
                v => (OrderItemStatus)Enum.Parse(typeof(OrderItemStatus), v));
    }
}