using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using ECommerceAPI.Data;
using ECommerceAPI.Helpers;
using ECommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ECommerceAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ECommerceDbContext _context;
        private readonly AuthSettings _authSettings;
        private readonly IMapper _mapper;

        public UserController(
            ECommerceDbContext context,
            IOptions<AuthSettings> authSettings,
            IMapper mapper
        )
        {
            _context = context;
            _authSettings = authSettings.Value;
            _mapper = mapper;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserDTO userDTO)
        {
            if (await _context.Users.AnyAsync(u => u.PhoneNumber == userDTO.PhoneNumber))
            {
                return BadRequest("Bu foydalanuvchi allaqachon mavjud.");
            }
            var user = _mapper.Map<User>(userDTO);

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            user.Role = string.IsNullOrEmpty(user.Role) ? "Customer" : user.Role; // Agar bo'sh bo‘lsa, "Customer" belgilanadi.
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok("Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDTO userLoginDTO)
        {
            var user = _mapper.Map<User>(userLoginDTO);
            var dbUser = await _context.Users.SingleOrDefaultAsync(u =>
                u.PhoneNumber == user.PhoneNumber
            );
            if (dbUser == null || !BCrypt.Net.BCrypt.Verify(user.PasswordHash, dbUser.PasswordHash))
            {
                return Unauthorized("Invalid username or password.");
            }

            var token = GenerateJwtToken(dbUser);
            return Ok(new { Token = token });
        }
        
        [HttpPut("change-role")]
        [Authorize(Roles = "SupperAdmin")]
        public async Task<IActionResult> ChangeUserRole(ChangeRoleDTO changeRoleDTO)
        {
            // Telefon raqami bo'yicha foydalanuvchini qidirish
            var user = await _context.Users.SingleOrDefaultAsync(u =>
                u.PhoneNumber == changeRoleDTO.PhoneNumber
            );

            if (user == null)
            {
                return NotFound("Foydalanuvchi topilmadi.");
            }

            // Yangi rolni tekshirish va qo'yish
            if (
                string.IsNullOrEmpty(changeRoleDTO.NewRole)
                || (changeRoleDTO.NewRole != "Admin" && changeRoleDTO.NewRole != "Customer")
            )
            {
                return BadRequest("Yangi rol 'Admin' yoki 'Customer' bo'lishi kerak.");
            }

            user.Role = changeRoleDTO.NewRole;
            await _context.SaveChangesAsync();

            return Ok(
                $"Foydalanuvchi roli muvaffaqiyatli {changeRoleDTO.NewRole} ga o'zgartirildi."
            );
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_authSettings.Secret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                    new Claim[]
                    {
                        new Claim("userId", user.Id.ToString(), ClaimValueTypes.Integer),
                        new Claim(ClaimTypes.Role, user.Role), // Rol tokenga qo‘shildi
                    }
                ),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                ),
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
