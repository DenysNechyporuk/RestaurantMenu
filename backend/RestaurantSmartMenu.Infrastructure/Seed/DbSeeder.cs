using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Domain.Entities;
using RestaurantSmartMenu.Infrastructure.Persistence;

namespace RestaurantSmartMenu.Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        if (!await db.Tables.AnyAsync())
        {
            db.Tables.AddRange(
                new Table { Number = 1 },
                new Table { Number = 2 },
                new Table { Number = 3 },
                new Table { Number = 4 },
                new Table { Number = 5 }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Categories.AnyAsync())
        {
            var pizza = new Category { Name = "Піца", SortOrder = 1 };
            var drinks = new Category { Name = "Напої", SortOrder = 2 };

            db.Categories.AddRange(pizza, drinks);
            await db.SaveChangesAsync();

            db.MenuItems.AddRange(
                new MenuItem { CategoryId = pizza.Id, Name = "Маргарита", Description = "Томат, моцарела, базилік", Price = 169m, IsAvailable = true },
                new MenuItem { CategoryId = pizza.Id, Name = "Пепероні", Description = "Салямі, моцарела", Price = 199m, IsAvailable = true },
                new MenuItem { CategoryId = pizza.Id, Name = "4 сири", Description = "Мікс сирів", Price = 219m, IsAvailable = true },

                new MenuItem { CategoryId = drinks.Id, Name = "Кола 0.5", Description = null, Price = 45m, IsAvailable = true },
                new MenuItem { CategoryId = drinks.Id, Name = "Вода 0.5", Description = null, Price = 25m, IsAvailable = true }
            );

            await db.SaveChangesAsync();
        }
    }
}