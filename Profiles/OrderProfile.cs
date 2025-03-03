using AtirAPI.DTOs;
using AtirAPI.Models;
using AutoMapper;

public class OrderProfile : Profile
{
    public OrderProfile()
    {
        //     CreateMap<OrderCreateDto, Order>()
        //         .ForMember(dest => dest.OrderDate, opt => opt.MapFrom(src => DateTime.UtcNow))
        //         .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
        //         .ForMember(dest => dest.TotalAmount, opt => opt.Ignore());

        //     CreateMap<OrderItemDto, OrderItem>();

        //     CreateMap<Order, OrderDto>()
        //         .ForMember(dest => dest.OrderItems, opt => opt.MapFrom(src => src.OrderItems));
        // }

        CreateMap<Order, OrderDto>().ReverseMap();
        CreateMap<OrderItem, OrderItemDto>().ReverseMap();
    }
}
