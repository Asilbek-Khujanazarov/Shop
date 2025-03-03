using AtirAPI.DTOs;
using AtirAPI.Models;
using AutoMapper;
using ECommerceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AtirAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ECommerceDbContext _context;
        private readonly IMapper _mapper;

        public OrdersController(ECommerceDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Orders

        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context
                .Orders.Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .ToListAsync();

            if (!orders.Any())
            {
                return NotFound(new { Message = "No orders found!" });
            }

            var ordersDto = orders.Select(order => new
            {
                order.Id,
                User = new
                {
                    order.User.Id,
                    order.User.FirstName,
                    order.User.LastName,
                    order.User.PhoneNumber,
                },
                order.OrderDate,
                order.TotalAmount,
                order.PaymentStatus,
                order.Location,
                OrderItems = order.OrderItems.Select(oi => new
                {
                    oi.ProductId,
                    ProductName = oi.Product.Name,
                    oi.Quantity,
                    oi.Price,
                    oi.Subtotal,
                }),
            });

            return Ok(ordersDto);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetOrdersByUserId(int userId)
        {
            var orders = await _context
                .Orders.Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .ToListAsync();

            if (!orders.Any())
            {
                return NotFound(new { Message = "Orders not found for this user!" });
            }

            var orderDtos = orders.Select(order => new
            {
                order.Id,
                User = new
                {
                    order.User.Id,
                    order.User.FirstName,
                    order.User.LastName,
                    order.User.PhoneNumber,
                },
                order.OrderDate,
                order.TotalAmount,
                order.PaymentStatus,
                order.Location,
                OrderItems = order.OrderItems.Select(oi => new
                {
                    oi.ProductId,
                    ProductName = oi.Product.Name,
                    oi.Quantity,
                    oi.Price,
                    oi.Subtotal,
                }),
            });

            return Ok(orderDtos);
        }

        // // POST: api/Orders

        // [HttpPost]
        // public async Task<IActionResult> CreateOrder([FromBody] OrderDto orderDto)
        // {
        //     if (orderDto == null || orderDto.OrderItems == null || !orderDto.OrderItems.Any())
        //     {
        //         return BadRequest(new { Message = "Order must contain at least one product." });
        //     }

        //     var order = new Order
        //     {
        //         UserId = orderDto.UserId,
        //         OrderDate = DateTime.UtcNow,
        //         PaymentStatus = "Pending",
        //         OrderItems = new List<OrderItem>(),
        //     };

        //     decimal totalAmount = 0;

        //     foreach (var item in orderDto.OrderItems)
        //     {
        //         var product = await _context.Products.FindAsync(item.ProductId);
        //         if (product == null)
        //         {
        //             return BadRequest(
        //                 new { Message = $"Product with ID {item.ProductId} not found." }
        //             );
        //         }

        //         if (product.Stock < item.Quantity)
        //         {
        //             return BadRequest(new { Message = $"Product {product.Name} is out of stock!" });
        //         }

        //         var orderItem = new OrderItem
        //         {
        //             ProductId = item.ProductId,
        //             Quantity = item.Quantity,
        //             Price = product.Price,
        //         };

        //         totalAmount += product.Price * item.Quantity;
        //         order.OrderItems.Add(orderItem);

        //         product.Stock -= item.Quantity;
        //     }

        //     order.TotalAmount = totalAmount;

        //     _context.Orders.Add(order);
        //     await _context.SaveChangesAsync();

        //     return Ok(new { Message = "Order created successfully!", OrderId = order.Id });
        // }

        // 🔹 Savatni buyurtmaga o‘tkazish
        [HttpPost("checkout/{userId}")]
        public async Task<IActionResult> Checkout(int userId, string location)
        {
            var cart = await _context
                .Carts.Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.CartItems.Any())
                return BadRequest("Savat bo‘sh");
            decimal totalAmount = 0;
            foreach (var cartItem in cart.CartItems)
            {
                var product = await _context.Products.FindAsync(cartItem.ProductId);
                if (product == null)
                    return NotFound($"Mahsulot ID {cartItem.ProductId} topilmadi!");

                if (product.Stock < cartItem.Quantity)
                    return BadRequest(
                        $"Mahsulot '{product.Name}' yetarli emas! Omborda: {product.Stock} ta."
                    );

                totalAmount += cartItem.Quantity * product.Price;
            }
            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                Location = location,
                PaymentStatus = "Pending",
                TotalAmount = totalAmount,
                OrderItems = cart
                    .CartItems.Select(ci => new OrderItem
                    {
                        ProductId = ci.ProductId,
                        Quantity = ci.Quantity,
                        Price = ci.Product.Price,
                        Subtotal = ci.Quantity * ci.Product.Price,
                    })
                    .ToList(),
            };

            _context.Orders.Add(order);

            foreach (var cartItem in cart.CartItems)
            {
                var product = await _context.Products.FindAsync(cartItem.ProductId);
                if (product != null)
                {
                    product.Stock -= cartItem.Quantity; // Stokdan ayirish
                }
            }

            _context.Carts.Remove(cart);
            await _context.SaveChangesAsync();

            return Ok($"Buyurtma yaratildi! Order ID: {order.Id}");
        }

        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context
                .Orders.Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return NotFound();
            }

            // Return stock for deleted order items
            foreach (var item in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.Stock += item.Quantity;
                }
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
