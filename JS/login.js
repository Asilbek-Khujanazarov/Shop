function formatPhoneNumber(input) {
    let numbers = input.value.replace(/\D/g, ""); // Faqat raqamlarni qoldiramiz
    if (numbers.length > 9) numbers = numbers.slice(0, 9); // Maksimal 9 ta raqam

    let formatted = numbers;
    if (numbers.length > 2) formatted = numbers.slice(0, 2) + " " + numbers.slice(2);
    if (numbers.length > 5) formatted = numbers.slice(0, 2) + " " + numbers.slice(2, 5) + " " + numbers.slice(5);
    if (numbers.length > 7) formatted = numbers.slice(0, 2) + " " + numbers.slice(2, 5) + " " + numbers.slice(5, 7) + " " + numbers.slice(7);

    input.value = formatted;
}

async function login() {
    const phoneNumber = document.getElementById("phoneNumber").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = ""; // Xatoliklarni tozalash

    let rawPhone = phoneNumber.replace(/\D/g, "");
    if (rawPhone.length !== 9) {
        errorMessage.textContent = "Telefon raqami 9 xonali bo‘lishi kerak!";
        return;
    }

    const fullPhoneNumber = "+998" + rawPhone;

    try {
        const response = await fetch("http://localhost:5004/api/User/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phoneNumber: fullPhoneNumber,
                passwordHash: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                errorMessage.textContent = "Noto'g'ri telefon raqami yoki parol!";
            } else {
                errorMessage.textContent = data.message || "Serverda xatolik yuz berdi!";
            }
            return;
        }

        if (data.token) {
            localStorage.setItem('token', data.token);
            alert("Kirish muvaffaqiyatli! Token saqlandi.");

            const userRole = getRoleFromToken(data.token);
            const normalizedRole = userRole ? userRole.toLowerCase() : null;

            if (normalizedRole === "admin" || normalizedRole === "superadmin") {
                window.location.href = "category.html";
            } else {
                window.location.href = "index.html";
            }
        } else {
            errorMessage.textContent = data.message || "Xatolik yuz berdi!";
        }
    } catch (error) {
        errorMessage.textContent = "Moslik bo'lmadi! Ba'lki siz hali ro'yxatdan o'tmagandursiz?";
        console.error("Xatolik:", error);
    }
}

function getRoleFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Tokenning payload qismini dekodlash
        return payload.role || payload.Role || payload.userRole || null; // Har xil variantlarni tekshirish
    } catch (error) {
        console.error("Token dekodlashda xatolik:", error);
        return null;
    }
}

// Yangi: LocalStorage'dan role olish
function getRoleFromLocalStorage() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log("Token topilmadi!");
        return null;
    }
    return getRoleFromToken(token);
}

// Yangi: Bearer token qaytarish
function getBearerToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log("Token topilmadi!");
        return null;
    }
    return `Bearer ${token}`;
}

// Sahifa yuklanganda role va bearer tokenni tekshirish
document.addEventListener("DOMContentLoaded", () => {
    const role = getRoleFromLocalStorage();
    const bearerToken = getBearerToken();

    console.log("Joriy ro'l:", role);
    console.log("Bearer Token:", bearerToken);
});