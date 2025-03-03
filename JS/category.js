function getToken() {
    return localStorage.getItem('token');
}

// Bearer token qaytarish
function getBearerToken() {
    const token = getToken();
    if (!token) {
        console.log("LocalStorage'da token topilmadi!");
        return null;
    }
    return `Bearer ${token}`;
}

// Role'ni token'dan olish
function getRoleFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || payload.Role || payload.userRole || null;
    } catch (error) {
        console.error("Token dekodlashda xatolik:", error);
        return null;
    }
}

// LocalStorage'dan role'ni olish
function getRoleFromLocalStorage() {
    const token = getToken();
    if (!token) {
        console.log("Token topilmadi!");
        return null;
    }
    return getRoleFromToken(token);
}

// Authorization header'larni yaratish
function getAuthHeaders() {
    const bearerToken = getBearerToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': bearerToken || ''
    };
}

// Logout funksiyasi
document.getElementById('logout').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    alert("Tizimdan chiqdingiz!");
    window.location.href = "login.html"; // Login sahifasiga yo'naltirish
});

// Kategoriya yaratish
document.getElementById('categoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const messageDiv = document.getElementById('message');

    const data = { name, description };

    try {
        const response = await fetch('http://localhost:5004/api/Categories', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
        }

        messageDiv.textContent = 'Category successfully created!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        
        document.getElementById('categoryForm').reset();
        fetchCategories();
    } catch (error) {
        messageDiv.textContent = 'Error creating category: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
});

// Barcha kategoriyalarni olish va ko'rsatish
async function fetchCategories() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    try {
        const response = await fetch('http://localhost:5004/api/Categories', {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
        }

        const categories = await response.json();
        console.log('Fetched categories:', categories);

        if (categories.length === 0) {
            container.innerHTML = '<p>No categories found.</p>';
            return;
        }

        categories.forEach(category => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <div class="category-actions">
                    <button class="edit-btn" onclick="editCategory('${category.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteCategory('${category.id}')">Delete</button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        container.innerHTML = `<p class="error">Error loading categories: ${error.message}</p>`;
    }
}

// Kategoriyani o'chirish
async function deleteCategory(id) {
    const messageDiv = document.getElementById('message');
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
        console.log(`Deleting category with ID: ${id}`);
        const response = await fetch(`http://localhost:5004/api/Categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
        }

        messageDiv.textContent = 'Category successfully deleted!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        fetchCategories();
    } catch (error) {
        messageDiv.textContent = 'Error deleting category: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

// Kategoriyani yangilash
async function editCategory(id) {
    const name = prompt('Enter new name:');
    if (name === null) return;
    const description = prompt('Enter new description:');
    if (description === null) return;

    const data = { name, description };
    const messageDiv = document.getElementById('message');

    try {
        console.log(`Updating category with ID: ${id}`, data);
        const response = await fetch(`http://localhost:5004/api/Categories/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
        }

        messageDiv.textContent = 'Category successfully updated!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        fetchCategories();
    } catch (error) {
        messageDiv.textContent = 'Error updating category: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

// Sahifa yuklanganda kategoriyalarni yuklash va role'ni tekshirish
window.onload = function() {
    const role = getRoleFromLocalStorage();
    console.log("Joriy ro'l:", role);

    if (!role || (role.toLowerCase() !== "admin" && role.toLowerCase() !== "superadmin")) {
        alert("Bu sahifaga faqat adminlar kira oladi!");
        window.location.href = "index.html"; // Redirect agar admin bo'lmasa
        return;
    }

    fetchCategories(); // Faqat admin bo'lsa kategoriyalarni yuklash
};