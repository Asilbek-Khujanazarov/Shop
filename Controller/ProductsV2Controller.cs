using Microsoft.AspNetCore.Mvc;

[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class ProductsV2Controller : ControllerBase
{
    /// <summary>
    /// API versiyasi 2.0 uchun mahsulotlarni olish.
    /// </summary>
    /// <returns>Bu 2.0 versiya ekanligini bildiruvchi xabar.</returns>
    [HttpGet]
    public ActionResult<string> GetProducts()
    {
        return "This is version 2.0 of the Products API.";
    }
}
