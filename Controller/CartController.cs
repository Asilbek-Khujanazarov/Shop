using AutoMapper;
using ECommerceAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class CartController : ControllerBase
{
    private readonly ECommerceDbContext _context;
    private readonly IMapper _mapper;

    public CartController(ECommerceDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // 🔹 Foydalanuvchining savatini olish

    [HttpGet("{id}")]
    public IActionResult GetCartById(int id)
    {
        var cart = _context
            .Carts.Include(c => c.CartItems)
            .ThenInclude(ci => ci.Product)
            .FirstOrDefault(c => c.UserId == id);

        if (cart == null)
        {
            return NotFound("Savat topilmadi");
        }

        // AutoMapper orqali mapping qilish
        var cartDto = _mapper.Map<CartDto>(cart);

        return Ok(cartDto);
    }

    // 🔹 Savatga mahsulot qo'shish
    [HttpPost("add")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartDto request)
    {
        var cart = await _context
            .Carts.Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId);

        if (cart == null)
        {
            cart = new Cart { UserId = request.UserId };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        foreach (var item in request.Items)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product == null)
                return NotFound($"Mahsulot ID {item.ProductId} topilmadi!");

            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == item.ProductId);
            if (cartItem != null)
            {
                cartItem.Quantity += item.Quantity;
                cartItem.Price = product.Price * cartItem.Quantity;
            }
            else
            {
                cart.CartItems.Add(
                    new CartItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = product.Price * item.Quantity,
                    }
                );
            }
        }

        await _context.SaveChangesAsync();
        return Ok("Mahsulotlar savatga qo'shildi");
    }

    [HttpPut("UpdateQuantity")]
    public async Task<IActionResult> UpdateCartItemQuantity(
        [FromBody] UpdateCartItemRequest request
    )
    {
        // CartItemni ID orqali topamiz
        var cartItem = await _context.CartItems.FirstOrDefaultAsync(ci =>
            ci.Id == request.CartItemId
        );

        if (cartItem == null)
        {
            return NotFound("Savatda mahsulot topilmadi");
        }

        // Miqdorni yangilash
        cartItem.Quantity = request.Quantity;
        await _context.SaveChangesAsync();

        return Ok(cartItem); // Yangilangan cartItemni qaytarish
    }

    // 🔹 Savatdan mahsulotni o'chirish
    [HttpDelete("remove/{userId}/{productId}")]
    public async Task<IActionResult> RemoveFromCart(int userId, int productId)
    {
        var cart = await _context
            .Carts.Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return NotFound("Savat topilmadi");

        var cartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == productId);
        if (cartItem == null)
            return NotFound("Mahsulot savatda yo'q");

        cart.CartItems.Remove(cartItem);
        await _context.SaveChangesAsync();

        return Ok("Mahsulot savatdan o'chirildi");
    }
}
