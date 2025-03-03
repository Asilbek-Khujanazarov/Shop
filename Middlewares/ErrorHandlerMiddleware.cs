using Microsoft.AspNetCore.Http;
using Serilog;
using System.Net;
using System.Text.Json;

namespace ECommerceAPI.Middlewares
{
    public class ErrorHandlerMiddleware
    {
        private readonly RequestDelegate _next;

        public ErrorHandlerMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            Log.Error(ex, "So‘rovni qayta ishlashda xatolik yuz berdi.");

            var response = context.Response;
            response.ContentType = "application/json";
            response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var result = JsonSerializer.Serialize(new
            {
                Message = "Kutilmagan xatolik yuz berdi.",
                Details = ex.Message
            });

            return response.WriteAsync(result);
        }
    }
}
