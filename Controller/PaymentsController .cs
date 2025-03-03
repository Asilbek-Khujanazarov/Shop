using AtirAPI.Helpers;
using AtirAPI.Models;
using ECommerceAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Stripe;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AtirAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly ECommerceDbContext _context;
        private readonly PaymentSettings _paymentSettings;

        public PaymentsController(ECommerceDbContext context, IOptions<PaymentSettings> paymentSettings)
        {
            _context = context;
            _paymentSettings = paymentSettings.Value;
            StripeConfiguration.ApiKey = _paymentSettings.SecretKey;
        }

        // PaymentIntent yaratish
        [HttpPost("create-payment-intent")]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] PaymentRequest request)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order == null)
                return NotFound("Buyurtma topilmadi.");
            if (order.PaymentStatus == "Paid")
                return BadRequest("Buyurtma allaqachon to‘langan.");

            try
            {
                var paymentIntentService = new PaymentIntentService();
                var paymentIntent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
                {
                    Amount = (long)(order.TotalAmount * 100), // TotalAmount centda
                    Currency = "usd",
                    PaymentMethodTypes = new List<string> { "card" },
                    Metadata = new Dictionary<string, string>
                    {
                        { "order_id", order.Id.ToString() }
                    }
                });

                return Ok(new
                {
                    ClientSecret = paymentIntent.ClientSecret
                });
            }
            catch (StripeException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        // To‘lovni tasdiqlash
        [HttpPost("confirm-payment")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order == null)
                return NotFound("Buyurtma topilmadi.");
            if (order.PaymentStatus == "Paid")
                return BadRequest("Buyurtma allaqachon to‘langan.");

            try
            {
                var paymentIntentService = new PaymentIntentService();
                var paymentIntent = await paymentIntentService.GetAsync(request.PaymentIntentId);

                if (paymentIntent.Status == "succeeded")
                {
                    order.PaymentStatus = "Paid";
                    _context.Entry(order).State = EntityState.Modified;
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        Message = "To‘lov muvaffaqiyatli amalga oshirildi.",
                        PaymentIntentId = paymentIntent.Id
                    });
                }

                return BadRequest(new { Message = "To‘lov amalga oshmadi." });
            }
            catch (StripeException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    // Request modellari
    public class PaymentRequest
    {
        public int OrderId { get; set; }
    }

    public class ConfirmPaymentRequest
    {
        public int OrderId { get; set; }
        public string PaymentIntentId { get; set; }
    }
}