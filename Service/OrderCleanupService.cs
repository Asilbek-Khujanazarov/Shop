using ECommerceAPI.Data;
using Microsoft.EntityFrameworkCore;

public class OrderCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public OrderCleanupService(IServiceScopeFactory scopeFactory)
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

                // 2 kundan eski va hali "Paid" bo‘lmagan orderlarni olish
                var oldOrders = await _context.Orders
                    .Where(o => o.OrderDate < DateTime.UtcNow.AddDays(-2) && o.PaymentStatus != "Paid")
                    .ToListAsync();

                if (oldOrders.Any())
                {
                    _context.Orders.RemoveRange(oldOrders);
                    await _context.SaveChangesAsync();
                }
            }

            await Task.Delay(TimeSpan.FromHours(2), stoppingToken); // Har 24 soatda ishga tushadi
        }
    }
}
