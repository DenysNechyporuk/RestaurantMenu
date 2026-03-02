using Microsoft.EntityFrameworkCore;
using RestaurantSmartMenu.Infrastructure.Persistence;
using RestaurantSmartMenu.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// DB (SQLite)
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("Default");
    opt.UseSqlite(cs);
});

// CORS (щоб React міг звертатись)
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("frontend", p =>
        p.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true));
});

var app = builder.Build();

app.UseCors("frontend");


app.MapControllers();

// Seed при старті
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.Run();  