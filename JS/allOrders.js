function getToken() {
    return localStorage.getItem('token');
}

function getBearerToken() {
    const token = getToken();
    if (!token) {
        console.log("LocalStorage'da token topilmadi!");
        return null;
    }
    return `Bearer ${token}`;
}

function getRoleFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || payload.Role || payload.userRole || null;
    } catch (error) {
        console.error("Token dekodlashda xatolik:", error);
        return null;
    }
}

function getRoleFromLocalStorage() {
    const token = getToken();
    if (!token) {
        console.log("Token topilmadi!");
        return null;
    }
    return getRoleFromToken(token);
}

function getHeaders() {
    return {
        'Authorization': getBearerToken() || '',
        'Content-Type': 'application/json'
    };
}

// Logout funksiyasi
document.getElementById('logout').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    alert("Tizimdan chiqdingiz!");
    window.location.href = "login.html"; // Adjust to your login page filename
});

let allOrders = [];
let showPaid = true; // Default: Show Paid orders when "ON"

// Barcha buyurtmalarni olish
async function fetchOrders() {
    const messageDiv = document.getElementById('message');
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = "";

    try {
        const response = await fetch('http://localhost:5004/api/Orders', {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Orders fetch failed: ${response.status}`);
        allOrders = await response.json();
        console.log("All orders received:", allOrders);

        displayOrders();
    } catch (error) {
        console.error("Error fetching orders:", error);
        messageDiv.textContent = 'Buyurtmalarni yuklashda xato yuz berdi.';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

// Buyurtmalarni ko'rsatish
function displayOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = "";

    const filteredOrders = allOrders.filter(order => 
        showPaid ? order.paymentStatus === 'Paid' : order.paymentStatus !== 'Paid'
    );

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = `<p>Hech qanday ${showPaid ? 'to‘langan' : 'kutilayotgan'} buyurtma topilmadi.</p>`;
        return;
    }

    filteredOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order';
        orderDiv.innerHTML = `
            <h3>Buyurtma ID: ${order.id}</h3>
            <p><strong>Foydalanuvchi:</strong> ${order.user.firstName} ${order.user.lastName}</p>
            <p><strong>Telefon:</strong> ${order.user.phoneNumber}</p>
            <p><strong>Buyurtma kuni:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            <p><strong>Jami summa:</strong> $${order.totalAmount}</p>
            <p><strong>To'lov statusi:</strong> ${order.paymentStatus}</p>
            <p><strong>Manzil:</strong> ${order.location}</p>
            <div class="order-items">
                <h4>Mahsulotlar:</h4>
                <ul>
                    ${order.orderItems.map(item => `
                        <li>
                            <span>${item.productName}</span>
                            <span>${item.quantity} ta | $${item.subtotal}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            ${order.paymentStatus === 'Paid' ? '<button class="delete-btn" onclick="deleteOrder(' + order.id + ')">O‘chirish</button>' : ''}
        `;
        ordersContainer.appendChild(orderDiv);
    });
}

// Buyurtmani o'chirish
async function deleteOrder(orderId) {
    const messageDiv = document.getElementById('message');
    if (!confirm('Ushbu buyurtmani o‘chirishni xohlaysizmi?')) return;

    try {
        const response = await fetch(`http://localhost:5004/api/Orders/${orderId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Order delete failed: ${response.status} - ${errorText}`);
        }

        messageDiv.textContent = 'Buyurtma muvaffaqiyatli o‘chirildi!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        setTimeout(() => { messageDiv.style.display = 'none'; }, 2000);

        // Refresh orders after deletion
        await fetchOrders();
    } catch (error) {
        console.error("Error deleting order:", error);
        messageDiv.textContent = 'Buyurtmani o‘chirishda xato yuz berdi: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

// Toggle funksiyasi
function toggleOrders() {
    showPaid = document.getElementById('toggleSwitch').checked;
    document.getElementById('toggleLabel').textContent = showPaid ? "To'langan Buyurtmalar" : "Kutilayotgan Buyurtmalar";
    displayOrders();
}

// Sahifa yuklanganda buyurtmalarni yuklash va role'ni tekshirish
window.onload = function() {
    const role = getRoleFromLocalStorage();
    console.log("Joriy ro'l:", role);

    if (!role || (role.toLowerCase() !== "admin" && role.toLowerCase() !== "superadmin")) {
        alert("Bu sahifaga faqat adminlar kira oladi!");
        window.location.href = "index.html";
        return;
    }

    fetchOrders();
};