document.getElementById("order-button").addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Foydalanuvchi tokeni topilmadi. Iltimos, tizimga kiring.");
        return;
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (e) {
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.userId) {
        alert("Token yaroqsiz yoki unda userId mavjud emas.");
        return;
    }
    
    const userId = decodedToken.userId;
    const location = document.getElementById("location-input").value.trim();
    
    if (!location) {
        alert("Iltimos, yetkazish manzilini kiriting.");
        return;
    }

    const apiUrl = `http://localhost:5004/api/Orders/checkout/${userId}?location=${encodeURIComponent(location)}`;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Xatolik kodi: ${response.status}, Javob: ${errorText}`);
        }
        
        alert("Buyurtma muvaffaqiyatli qabul qilindi!\nByurtmalarim saxifasidan buyurtmangizga  to'lovni amalga oshiring yo'qsa bekor qilinadi");
        window.location.reload(); // Sahifani yangilash
    } catch (error) {
        console.error("Buyurtma jo‘natishda xatolik: ", error);
        alert("Tarmoqda muammo yuz berdi. Tafsilotlar: " + error.message);
    }
});
