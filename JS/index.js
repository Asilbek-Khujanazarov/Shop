const API_ENDPOINT_PRODUCTS = "http://localhost:5004/api/v1/Products";
const API_ENDPOINT_CATEGORIES = "http://localhost:5004/api/Categories";

let allProducts = [];
let selectedCategoryId = null;

// Kategoriyalarni yuklash
async function fetchCategories() {
    try {
        const response = await fetch(API_ENDPOINT_CATEGORIES);
        if (!response.ok) throw new Error("Kategoriyalarni yuklashda xato!");
        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error("Kategoriyalarni yuklashda xatolik:", error);
    }
}

// Kategoriyalarni ko‘rsatish
function displayCategories(categories) {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';

    // "Hammasi" tugmasi qo‘shish
    const allCategory = document.createElement('div');
    allCategory.classList.add('category-item');
    allCategory.textContent = 'Hammasi';
    allCategory.addEventListener('click', () => {
        selectedCategoryId = null;
        updateActiveCategory(allCategory);
        searchProducts(document.getElementById('searchInput').value);
    });
    categoryList.appendChild(allCategory);

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category-item');
        categoryDiv.textContent = category.name;
        categoryDiv.addEventListener('click', () => {
            selectedCategoryId = category.id;
            updateActiveCategory(categoryDiv);
            searchProducts(document.getElementById('searchInput').value);
        });
        categoryList.appendChild(categoryDiv);
    });

    if (categories.length > 0) {
        allCategory.classList.add('active');
    }
}

// Aktiv kategoriyani yangilash
function updateActiveCategory(selectedElement) {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => item.classList.remove('active'));
    selectedElement.classList.add('active');
}

// Mahsulotlarni yuklash
async function fetchProducts() {
    try {
        const response = await fetch(API_ENDPOINT_PRODUCTS);
        if (!response.ok) throw new Error("Serverdan xato qaytdi!");
        allProducts = await response.json();
        displayProducts(allProducts); // Dastlab barcha mahsulotlar ko‘rsatiladi
    } catch (error) {
        console.error("Mahsulotlarni yuklashda xatolik:", error);
    }
}

// Mahsulotlarni ko‘rsatish
function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = "";

    if (products.length === 0) {
        productList.innerHTML = '<p>Hech nima topilmadi.</p>';
        return;
    }

    products.forEach(product => {
        const imageUrl = `http://localhost:5004${product.imageUrl}`;
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");

        productDiv.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}">
            <h5>${product.name}</h5>
            <h5 class="price">${product.price} so'm</h5>
        `;

        productDiv.addEventListener("click", () => {
            window.location.href = `../HTML/productDetails.html?id=${product.id}`;
        });

        productList.appendChild(productDiv);
    });
}

// Qidiruv funksiyasi
function searchProducts(searchTerm) {
    let filteredProducts = allProducts;

    // Kategoriya bo‘yicha filtr
    if (selectedCategoryId) {
        filteredProducts = filteredProducts.filter(product => product.categoryId === selectedCategoryId);
    }

    // Agar qidiruv so‘zi bo‘sh bo‘lsa, filtrlangan mahsulotlarni ko‘rsat
    if (!searchTerm || searchTerm.trim() === '') {
        displayProducts(filteredProducts);
        return;
    }

    // Qidiruv so‘zini kichik harflarga aylantirish
    searchTerm = searchTerm.toLowerCase();

    // Nom bo‘yicha filtr va tartib
    filteredProducts = filteredProducts
        .filter(product => product.name.toLowerCase().includes(searchTerm))
        .sort((a, b) => {
            const indexA = a.name.toLowerCase().indexOf(searchTerm);
            const indexB = b.name.toLowerCase().indexOf(searchTerm);
            return indexA - indexB; // Eng yaqin mosliklar yuqoriga
        });

    displayProducts(filteredProducts);
}

// Qidiruv hodisasi
function performSearch(event) {
    event.preventDefault();
    const searchTerm = document.getElementById('searchInput').value;
    searchProducts(searchTerm);
}

// Sahifa yuklanganda kategoriyalar va mahsulotlarni yuklash
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCategories();
    await fetchProducts();
});