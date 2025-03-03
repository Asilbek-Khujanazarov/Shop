using ECommerceAPI.Models;

namespace AtirAPI.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Location { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public virtual User User { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
