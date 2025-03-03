using AutoMapper;
using ECommerceAPI.Models;

namespace AtirAPI.Profiles
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User,UserDTO>().ReverseMap();
            CreateMap<User, UserLoginDTO>().ReverseMap();
        }
    }
}
