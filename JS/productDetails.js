// URL'dan ID ni olish funksiyasi
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// LocalStorage-dan userId olish
function getUserId() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Iltimos, avval hisobga kiring!");
        return null;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // JWT'dan userId olish
        return payload.userId;
    } catch (error) {
        console.error("Tokenni o‘qishda xatolik:", error);
        return null;
    }
}

// Mahsulotni API'dan yuklash
async function fetchProductDetails() {
    const productId = getProductIdFromUrl();
    if (!productId) {
        console.error("Mahsulot ID aniqlanmadi!");
        return;
    }

    const API_URL = `http://localhost:5004/api/v1/Products/${productId}`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Mahsulot ma'lumotlarini yuklashda xatolik!");
        }

        const product = await response.json();
        console.log("Yuklangan mahsulot:", product); // Debug uchun
        displayProductDetails(product);
    } catch (error) {
        console.error("Xatolik:", error);
    }
}

// Mahsulot ma'lumotlarini sahifaga chiqarish
function displayProductDetails(product) {
    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-price").textContent = product.price + " so'm";
    document.getElementById("product-description").textContent = product.description || "Tavsif mavjud emas.";
    document.getElementById("product-image").src = `http://localhost:5004${product.imageUrl}`;
}

// Quantityni oshirish va kamaytirish funksiyalari
function updateQuantity(change) {
    const quantityElement = document.getElementById("quantity");
    let quantity = parseInt(quantityElement.textContent, 10);
    quantity += change;

    if (quantity < 1) {
        quantity = 1; // Minimal miqdor 1 bo‘lishi kerak
    }

    quantityElement.textContent = quantity;
}

// Savatga qo'shish funksiyasi
async function addToCart() {
    const userId = getUserId();
    if (!userId) return;

    const productId = getProductIdFromUrl();
    const quantity = parseInt(document.getElementById("quantity").textContent, 10);

    const cartItem = {
        userId: userId,
        items: [
            {
                productId: productId,
                quantity: quantity
            }
        ]
    };

    try {
        const response = await fetch("http://localhost:5004/api/Cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cartItem)
        });

        if (!response.ok) {
            throw new Error("Savatga qo‘shishda xatolik!");
        }

        alert("Mahsulot savatga qo‘shildi!");
    } catch (error) {
        console.error("Xatolik:", error);
        alert("Xatolik yuz berdi, iltimos qayta urinib ko‘ring.");
    }
}

// Eventlarni tugmalarga qo‘shish
document.getElementById("increase").addEventListener("click", () => updateQuantity(1));
document.getElementById("decrease").addEventListener("click", () => updateQuantity(-1));
document.getElementById("addToCart").addEventListener("click", addToCart);

// Sahifa yuklanganda mahsulotni yuklash
document.addEventListener("DOMContentLoaded", fetchProductDetails);
