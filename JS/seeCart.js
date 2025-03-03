document.addEventListener("DOMContentLoaded", async function () {
    const cartItemsContainer = document.querySelector(".cart-items");
    const totalSumElement = document.querySelector("#total-sum");

    function getUserId() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Iltimos, avval hisobga kiring!");
            return null;
        }
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.userId;
        } catch (error) {
            console.error("Tokenni o‘qishda xatolik:", error);
            return null;
        }
    }

    async function fetchCart() {
        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await fetch(`http://localhost:5004/api/Cart/${userId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("Savat ma'lumotlarini yuklashda xatolik");

            const cart = await response.json();
            if (!cart.cartItems || cart.cartItems.length === 0) {
                cartItemsContainer.innerHTML = "<p>Savat bo‘sh!</p>";
                totalSumElement.textContent = "0 so'm";
                return;
            }

            cartItemsContainer.innerHTML = "";
            cart.cartItems.forEach(cartItem => fetchProductDetails(cartItem));
        } catch (error) {
            console.error("Xatolik yuz berdi:", error);
        }
    }

    async function deleteProduct(cartItemId, productId) {
        const userId = getUserId();
        if (!userId) return;
        if (!confirm("Siz ushbu mahsulotni savatdan o'chirmoqchimisiz?")) return;

        try {
            const response = await fetch(`http://localhost:5004/api/Cart/remove/${userId}/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!response.ok) {
                throw new Error("Mahsulotni o‘chirishda xatolik yuz berdi");
            }

            document.querySelector(`[data-cart-item-id="${cartItemId}"]`).remove();
            updateTotalSum();
        } catch (error) {
            console.error("Xatolik yuz berdi: ", error);
        }
    }

    async function fetchProductDetails(cartItem) {
        try {
            const response = await fetch(`http://localhost:5004/api/v1/Products/${cartItem.productId}`);
            if (!response.ok) throw new Error("Mahsulot ma'lumotlarini yuklashda xatolik");

            const product = await response.json();
            const baseUrl = "http://localhost:5004";
            const imageUrl = product.imageUrl
                ? (product.imageUrl.startsWith("/") ? baseUrl + product.imageUrl : product.imageUrl)
                : "https://via.placeholder.com/150";

            const productHTML = `
                <div class="product-item" data-cart-item-id="${cartItem.id}" data-product-id="${cartItem.productId}">
                    <img src="${imageUrl}" alt="${product.name}">
                    <div class="product-info">
                        <div class="cart-controls-deleate">
                            <button class="delete-btn" data-cart-item-id="${cartItem.id}" data-product-id="${cartItem.productId}"><i class="bi bi-trash"></i></button>
                        </div>

                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p><strong>Narxi:</strong> ${product.price} so'm</p>
                        <p><strong>Jami:</strong> <span class="total-price">${product.price * cartItem.quantity}</span> so'm</p>
                        <div class="cart-controls">
                            <button class="PushButton decrease" data-cart-item-id="${cartItem.id}" data-product-id="${cartItem.productId}">−</button>
                            <span class="quantity">${cartItem.quantity}</span>
                            <button class="PushButton increase" data-cart-item-id="${cartItem.id}" data-product-id="${cartItem.productId}">+</button>
                        </div>
                    </div>
                </div>
            `;

            cartItemsContainer.insertAdjacentHTML("beforeend", productHTML);
            updateTotalSum();
        } catch (error) {
            console.error("Xatolik yuz berdi:", error);
        }
    }

    cartItemsContainer.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
    
        if (!button) return;
    
        if (button.classList.contains("decrease") || button.classList.contains("increase")) {
            // Miqdorni oshirish yoki kamaytirish
            const cartItemId = button.getAttribute("data-cart-item-id");
            const productId = button.getAttribute("data-product-id");
            const action = button.classList.contains("increase") ? "increase" : "decrease";
            const quantitySpan = button.parentElement.querySelector(".quantity");
            const totalPriceElement = button.closest(".product-item").querySelector(".total-price");
    
            try {
                let currentQuantity = parseInt(quantitySpan.textContent);
                if (isNaN(currentQuantity)) currentQuantity = 1;
    
                let newQuantity = action === "increase" ? currentQuantity + 1 : Math.max(1, currentQuantity - 1);
    
                const response = await fetch(`http://localhost:5004/api/Cart/UpdateQuantity`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        cartItemId: cartItemId,
                        productId: productId,
                        quantity: newQuantity
                    })
                });
    
                if (!response.ok) throw new Error("Savat miqdorini yangilashda xatolik");
    
                quantitySpan.textContent = newQuantity;
                const productPrice = parseFloat(totalPriceElement.textContent) / currentQuantity;
                totalPriceElement.textContent = (productPrice * newQuantity).toFixed(2) + " so'm";
    
                updateTotalSum();
            } catch (error) {
                console.error("Xatolik yuz berdi:", error);
            }
        } 
        else if (button.classList.contains("delete-btn")) {
            // Mahsulotni o‘chirish
            const cartItemId = button.getAttribute("data-cart-item-id");
            const productId = button.getAttribute("data-product-id");
    
            await deleteProduct(cartItemId, productId);
        }
    });
    

    function updateTotalSum() {
        let total = 0;
        document.querySelectorAll(".total-price").forEach(item => {
            total += parseFloat(item.textContent) || 0;
        });
        totalSumElement.textContent = total.toFixed(2) + " so'm";
    }

    fetchCart();
});


