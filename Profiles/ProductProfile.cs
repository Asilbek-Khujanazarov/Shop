using AtirAPI.DTOs;
using AtirAPI.Models;
using AutoMapper;

namespace AtirAPI.Profiles
{
    public class ProductProfile : Profile
    {
        public ProductProfile()
        {
            CreateMap<ProductCreateDTO, Product>()
               .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => src.CategoryId))
               .ForMember(dest => dest.Category, opt => opt.Ignore());
            //    .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImageUrl));
            CreateMap<Product, ProductDTO>();
            CreateMap<Product, ProductUpdateDTO>().ReverseMap();
        }
    }
}
