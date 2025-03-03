using System.Text;
using System.Text.Json.Serialization;
using AtirAPI.Helpers;
using ECommerceAPI.Data;
using ECommerceAPI.Helpers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// 🔹 Configurations
var authSettings = builder.Configuration.GetSection("AuthSettings").Get<AuthSettings>();
builder.Services.Configure<PaymentSettings>(builder.Configuration.GetSection("PaymentSettings"));
builder.Services.Configure<AuthSettings>(builder.Configuration.GetSection("AuthSettings"));

// 🔹 AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// 🔹 API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

// 🔹 CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});
// 🔹 Serilog Logging
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();
builder.Host.UseSerilog();

// 🔹 Authentication (JWT)
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(authSettings.Secret)
            ),
            ValidateIssuer = false,
            ValidateAudience = false,
        };
    });

// 🔹 Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Version = "1.0",
            Title = "E-Commerce API",
            Description = "API for managing an e-commerce platform (v1.0)",
        }
    );

    options.SwaggerDoc(
        "v2",
        new OpenApiInfo
        {
            Version = "2.0",
            Title = "E-Commerce API",
            Description = "API for managing an e-commerce platform (v2.0)",
        }
    );

    // 🔹 JWT Security Definition
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Description = "Please insert JWT with Bearer into field",
            Name = "Authorization",
            Type = SecuritySchemeType.ApiKey,
        }
    );

    // 🔹 Apply JWT to all endpoints
    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                new string[] { }
            },
        }
    );
});

// 🔹 Database Connection
builder.Services.AddDbContext<ECommerceDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// 🔹 Hosted Services
builder.Services.AddHostedService<OrderCleanupService>();
builder.Services.AddHostedService<CartCleanupService>();

// 🔹 Controllers & JSON Config (🚀 ReferenceHandler.IgnoreCycles ishlatilgan)
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

var app = builder.Build();

// 🔹 Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "E-Commerce API v1.0");
        options.SwaggerEndpoint("/swagger/v2/swagger.json", "E-Commerce API v2.0");
    });
}

// 🔹 Middleware & Security
app.UseCors("AllowAll");
app.UseSerilogRequestLogging();
app.UseMiddleware<ECommerceAPI.Middlewares.ErrorHandlerMiddleware>();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();
app.Run();
