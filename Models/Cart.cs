using ECommerceAPI.Models;

public class Cart
{
    public int Id { get; set; }
    public int UserId { get; set; } // Kimning savati ekanligini ko'rsatadi
    public virtual User User { get; set; }
    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}
