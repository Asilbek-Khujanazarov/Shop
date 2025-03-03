using AutoMapper;
using AtirAPI.Models; // Model fayllaringizning namespace'iga qarab yozing

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Cart → CartDto
        CreateMap<Cart, CartDto>();

        // CartItem → CartItemDto
        CreateMap<CartItem, CartItemDto>();
    }
}
