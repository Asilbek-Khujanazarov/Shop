using ECommerceAPI.Data;
using Microsoft.EntityFrameworkCore;

public class CartCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeSpan _interval = TimeSpan.FromHours(4); // Har 24 soatda ishlaydi

    public CartCleanupService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var _context = scope.ServiceProvider.GetRequiredService<ECommerceDbContext>();

                DateTime oneDayAgo = DateTime.UtcNow.AddDays(-1);

                var oldCartItems = await _context.CartItems
                    .Where(ci => ci.CreatedAt < oneDayAgo)
                    .ToListAsync();

                if (oldCartItems.Any())
                {
                    _context.CartItems.RemoveRange(oldCartItems);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"⏳ {oldCartItems.Count} ta eski savat mahsuloti o‘chirildi.");
                }
            }

            await Task.Delay(_interval, stoppingToken); // 24 soatdan keyin yana ishlaydi
        }
    }
}
