const stripe = Stripe('pk_test_51QVXuNCt6xaIDErgvIk04WUU5l8ya6e9Dz9V2NKKsffoRgkwC3lwUc7m2c5ZAfiCDPsvk7sOmainktY6wE5JQWDo00BIzglbkn'); // Stripe publishable key
let elements;

function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        console.error("Tokenni dekodlashda xato:", error);
        return null;
    }
}

function getHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

async function fetchOrders() {
    const userId = getUserIdFromToken();
    if (!userId) {
        console.error("User ID topilmadi");
        return;
    }

    console.log("Fetching orders for user:", userId);
    try {
        const response = await fetch(`http://localhost:5004/api/Orders/user/${userId}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Orders fetch failed: ${response.status}`);
        const orders = await response.json();
        console.log("Order data received:", orders);

        const ordersContainer = document.getElementById('orders');
        ordersContainer.innerHTML = "";

        orders.forEach(order => {
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
                ${order.paymentStatus === 'Pending' ? `<button class="pay-button" onclick="payNow(${order.id})">To‘lov qilish</button>` : ''}
            `;

            ordersContainer.appendChild(orderDiv);
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        document.getElementById('paymentMessage').innerHTML = 'Buyurtmalarni yuklashda xato yuz berdi.';
        document.getElementById('paymentMessage').className = 'message error';
        document.getElementById('paymentMessage').style.display = 'block';
    }
}

async function payNow(orderId) {
    const messageDiv = document.getElementById('paymentMessage');
    console.log("Starting payment process for order:", orderId);

    try {
        console.time("Payment Intent Creation");
        const paymentResponse = await fetch('http://localhost:5004/api/payments/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders()
            },
            body: JSON.stringify({ orderId })
        });
        console.timeEnd("Payment Intent Creation");

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            throw new Error(`Payment intent creation failed: ${errorText}`);
        }

        const { clientSecret } = await paymentResponse.json();
        console.log("Client Secret received:", clientSecret);

        const modal = document.getElementById('paymentModal');
        modal.style.display = 'flex';

        elements = stripe.elements({ clientSecret });
        const paymentElement = elements.create('payment');
        console.log("Payment Element created");

        paymentElement.mount('#payment-element');
        console.log("Payment Element mounted");

        paymentElement.on('ready', () => {
            console.log("Payment Element is ready");
        });

        document.getElementById('submitPayment').onclick = async () => {
            console.log("Submitting payment...");
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required' // Redirectni o‘chirib, frontendda tasdiqlaymiz
            });

            if (error) {
                console.error("Payment error:", error);
                messageDiv.textContent = error.message;
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            } else {
                console.log("Payment confirmed, PaymentIntent:", paymentIntent);
                const confirmResponse = await fetch('http://localhost:5004/api/payments/confirm-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getHeaders()
                    },
                    body: JSON.stringify({
                        orderId,
                        paymentIntentId: paymentIntent.id
                    })
                });

                const result = await confirmResponse.json();

                if (confirmResponse.ok) {
                    console.log("Payment successful:", result);
                    messageDiv.textContent = result.message;
                    messageDiv.className = 'message success';
                    messageDiv.style.display = 'block';
                    setTimeout(() => {
                        closePaymentModal();
                        fetchOrders();
                    }, 2000);
                } else {
                    console.error("Confirmation failed:", result);
                    messageDiv.textContent = result.message;
                    messageDiv.className = 'message error';
                    messageDiv.style.display = 'block';
                }
            }
        };
    } catch (error) {
        console.error("Payment process error:", error);
        messageDiv.textContent = 'Error: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Sahifa yuklanganda buyurtmalarni yuklash
fetchOrders();