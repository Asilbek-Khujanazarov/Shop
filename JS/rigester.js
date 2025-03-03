function formatPhoneNumber(input) {
    let numbers = input.value.replace(/\D/g, ""); // Faqat raqamlarni qoldiramiz
    if (numbers.length > 9) numbers = numbers.slice(0, 9); // Maksimal 9 ta raqam

    let formatted = "";
    if (numbers.length > 2) {
        formatted += numbers.slice(0, 2) + " ";
        if (numbers.length > 5) {
            formatted += numbers.slice(2, 5) + " ";
            if (numbers.length > 7) {
                formatted += numbers.slice(5, 7) + " ";
                formatted += numbers.slice(7);
            } else {
                formatted += numbers.slice(5);
            }
        } else {
            formatted += numbers.slice(2);
        }
    } else {
        formatted = numbers;
    }

    input.value = formatted;
}

function registerUser() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value.trim();
    const messageEl = document.getElementById("message");

    // 🔴 **Barcha maydonlar to‘ldirilganligini tekshiramiz**
    if (!firstName || !lastName || !email || !phoneNumber || !address || !password) {
        messageEl.textContent = "Barcha maydonlarni to‘ldiring!";
        messageEl.className = "message error";
        return;
    }

    // 🔴 **Telefon raqami validatsiyasi**
    let rawPhone = phoneNumber.replace(/\D/g, ""); // Bo'shliqlarni olib tashlaymiz
    if (rawPhone.length !== 9) {
        messageEl.textContent = "Telefon raqami 9 xonali bo‘lishi kerak!";
        messageEl.className = "message error";
        return;
    }

    const fullPhoneNumber = "+998" + rawPhone;

    const userData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneNumber: fullPhoneNumber,
        address: address,
        passwordHash: password
    };

    fetch("http://localhost:5004/api/User/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.text())
    .then(data => {
        messageEl.textContent = data;
        messageEl.className = "message success";
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error("Xatolik yuz berdi:", error);
        messageEl.textContent = "Server bilan bog‘lanishda xatolik yuz berdi!";
        messageEl.className = "message error";
    });
}