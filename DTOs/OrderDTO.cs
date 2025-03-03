using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AtirAPI.DTOs
{
    public class OrderDto
    {
        public int UserId { get; set; }
        public virtual List<OrderItemDto> OrderItems { get; set; }
    }
}
