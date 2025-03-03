public class AddToCartDto
{
    public int UserId { get; set; }
    public List<AddToCartItemDto> Items { get; set; } = new List<AddToCartItemDto>();
}

public class AddToCartItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
