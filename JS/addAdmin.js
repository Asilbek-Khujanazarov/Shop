document.getElementById('roleChangeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const phoneNumberInput = document.getElementById('phoneNumber').value;
    const newRole = document.getElementById('newRole').value;
    const messageElement = document.getElementById('message');

    // Telefon raqamiga +998 qo‘shish
    const phoneNumber = '+998' + phoneNumberInput;
    
    // Yuboriladigan ma'lumot
    const data = {
        phoneNumber: phoneNumber,
        newRole: newRole
    };

    // Yuborilayotgan ma'lumotni konsolda ko‘rish
    console.log('Yuborilayotgan ma\'lumot:', data);

    try {
        const response = await fetch('http://localhost:5004/api/User/change-role', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.text(); // Server matn qaytaradi
        console.log('Server javobi:', result);
        console.log('Response status:', response.status); // Status kodini ko‘rish uchun

        // Status kodiga qarab natijani ko‘rsatish
        if (response.status === 200) {
            messageElement.textContent = result || "Rol muvaffaqiyatli o'zgartirildi!";
            messageElement.className = 'success';
        } else if (response.status === 400) {
            messageElement.textContent = result || "Noto‘g‘ri so‘rov yuborildi.";
            messageElement.className = 'error';
        } else if (response.status === 404) {
            messageElement.textContent = result || "Foydalanuvchi topilmadi.";
            messageElement.className = 'error';
        } else {
            messageElement.textContent = "Noma'lum xatolik yuz berdi.";
            messageElement.className = 'error';
        }
    } catch (error) {
        messageElement.textContent = "Server bilan bog‘lanishda xatolik.";
        messageElement.className = 'error';
        console.error('Xatolik detallari:', error);
    }
});

// Telefon raqami uchun faqat raqam va 9 ta belgidan oshmaslik
document.getElementById('phoneNumber').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 9) this.value = this.value.slice(0, 9);
});