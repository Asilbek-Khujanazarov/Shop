  // Tokenni localStorage'dan olish
  const getToken = () => localStorage.getItem('token');

  // Headers'ga Bearer token qo'shish
  const getHeaders = () => ({
      'Authorization': `Bearer ${getToken()}`
  });

  // Kategoriyalarni saqlash uchun ob'ekt
  let categoryMap = {};
  let allProducts = [];

  // Kategoriyalarni olish va select ga qo'shish
  async function fetchCategories() {
      const categorySelect = document.getElementById('categoryId');
      const editCategorySelect = document.getElementById('editCategoryId');
      categorySelect.innerHTML = '<option value="">Select a category</option>';
      editCategorySelect.innerHTML = '<option value="">Select a category</option>';

      try {
          const response = await fetch('http://localhost:5004/api/Categories', {
              method: 'GET',
              headers: getHeaders()
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to fetch categories: ${response.status} - ${errorText}`);
          }

          const categories = await response.json();
          console.log('Fetched categories:', categories);

          categoryMap = {};
          categories.forEach(category => {
              categoryMap[category.id] = category.name;
              const option = document.createElement('option');
              option.value = category.id;
              option.textContent = category.name;
              categorySelect.appendChild(option);
              const editOption = option.cloneNode(true);
              editCategorySelect.appendChild(editOption);
          });
          console.log('Category map:', categoryMap);
      } catch (error) {
          console.error('Error loading categories:', error.message);
          categorySelect.innerHTML += '<option value="">Error loading categories</option>';
          editCategorySelect.innerHTML += '<option value="">Error loading categories</option>';
      }
  }

  // Mahsulot yaratish (avval ma'lumotlar, keyin rasm)
  document.getElementById('productForm').addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = document.getElementById('productName').value;
      const description = document.getElementById('productDescription').value;
      const price = parseFloat(document.getElementById('price').value);
      const stock = parseInt(document.getElementById('stock').value);
      const categoryId = parseInt(document.getElementById('categoryId').value);
      const imageFile = document.getElementById('productImage').files[0];
      const messageDiv = document.getElementById('productMessage');

      const data = { name, description, price, stock, categoryId };

      try {
          // 1-qadam: Mahsulotni yaratish
          const createResponse = await fetch('http://localhost:5004/api/v1/Products', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${getToken()}`
              },
              body: JSON.stringify(data)
          });

          if (!createResponse.ok) {
              const errorText = await createResponse.text();
              throw new Error(`Network response was not ok: ${createResponse.status} - ${errorText}`);
          }

          const createdProduct = await createResponse.json();
          const productId = createdProduct.id;
          console.log('Created product ID:', productId);

          // 2-qadam: Rasmni yuklash
          if (imageFile) {
              const imageFormData = new FormData();
              imageFormData.append('file', imageFile);

              const imageResponse = await fetch(`http://localhost:5004/api/v1/Products/${productId}/upload-image`, {
                  method: 'POST',
                  headers: getHeaders(),
                  body: imageFormData
              });

              if (!imageResponse.ok) {
                  const errorText = await imageResponse.text();
                  throw new Error(`Image upload failed: ${imageResponse.status} - ${errorText}`);
              }
          }

          messageDiv.textContent = 'Product successfully created!';
          messageDiv.className = 'message success';
          messageDiv.style.display = 'block';

          document.getElementById('productForm').reset();
          fetchProducts();
      } catch (error) {
          messageDiv.textContent = 'Error creating product: ' + error.message;
          messageDiv.className = 'message error';
          messageDiv.style.display = 'block';
      }
  });

  // Logout funksiyasi
  document.getElementById('logout').addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('token');
      alert("Tizimdan chiqdingiz!");
      window.location.href = "login.html"; // Login sahifasiga yo'naltirish
  });

  // Barcha mahsulotlarni olish
  async function fetchProducts() {
      const container = document.getElementById('productsContainer');
      container.innerHTML = '';

      try {
          const response = await fetch('http://localhost:5004/api/v1/Products', {
              method: 'GET',
              headers: getHeaders()
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
          }

          allProducts = await response.json();
          console.log('Fetched products:', allProducts);
          displayProducts(allProducts);
      } catch (error) {
          container.innerHTML = `<p class="error">Error loading products: ${error.message}</p>`;
      }
  }

  // Mahsulotlarni ko'rsatish
  function displayProducts(products) {
      const container = document.getElementById('productsContainer');
      container.innerHTML = '';

      if (products.length === 0) {
          container.innerHTML = '<p>No products found.</p>';
          return;
      }

      products.forEach(product => {
          const categoryName = categoryMap[product.categoryId] || 'Unknown Category';
          const imageUrl = product.imageUrl || 'https://via.placeholder.com/100';
          const div = document.createElement('div');
          div.className = 'product-item';
          div.innerHTML = `
              <img src="http://localhost:5004${product.imageUrl}" alt="${product.name}">
              <div class="product-details">
                  <h3>${product.name}</h3>
                  <p>${product.description}</p>
                  <p>Price: $${product.price} | Stock: ${product.stock} | Category: ${categoryName}</p>
                  <div class="product-actions">
                      <button class="edit-btn">Edit</button>
                      <button class="delete-btn">Delete</button>
                  </div>
              </div>
          `;

          div.querySelector('.edit-btn').addEventListener('click', () => {
              openEditModal(product);
          });

          div.querySelector('.delete-btn').addEventListener('click', () => {
              deleteProduct(product.id);
          });

          container.appendChild(div);
      });
  }

  // Mahsulotlarni qidirish
  function searchProducts() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      console.log('Search term:', searchTerm);

      const filteredProducts = allProducts
          .filter(product => product.name.toLowerCase().includes(searchTerm))
          .sort((a, b) => {
              const aMatch = a.name.toLowerCase().indexOf(searchTerm);
              const bMatch = b.name.toLowerCase().indexOf(searchTerm);
              if (aMatch === bMatch) return 0;
              if (aMatch === -1) return 1;
              if (bMatch === -1) return -1;
              return aMatch - bMatch;
          });

      displayProducts(filteredProducts);
  }

  // Mahsulotni o'chirish
  async function deleteProduct(id) {
      const messageDiv = document.getElementById('productMessage');
      if (!confirm('Are you sure you want to delete this product?')) return;

      try {
          console.log(`Deleting product with ID: ${id}`);
          const response = await fetch(`http://localhost:5004/api/v1/Products/${id}`, {
              method: 'DELETE',
              headers: getHeaders()
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
          }

          messageDiv.textContent = 'Product successfully deleted!';
          messageDiv.className = 'message success';
          messageDiv.style.display = 'block';
          fetchProducts();
      } catch (error) {
          messageDiv.textContent = 'Error deleting product: ' + error.message;
          messageDiv.className = 'message error';
          messageDiv.style.display = 'block';
      }
  }

  // Modalni ochish
  function openEditModal(product) {
      const modal = document.getElementById('editModal');
      document.getElementById('editName').value = product.name;
      document.getElementById('editDescription').value = product.description;
      document.getElementById('editPrice').value = product.price;
      document.getElementById('editStock').value = product.stock;
      document.getElementById('editCategoryId').value = product.categoryId;
      modal.style.display = 'flex';

      document.getElementById('editForm').onsubmit = async function (e) {
          e.preventDefault();

          const name = document.getElementById('editName').value;
          const description = document.getElementById('editDescription').value;
          const price = parseFloat(document.getElementById('editPrice').value);
          const stock = parseInt(document.getElementById('editStock').value);
          const categoryId = parseInt(document.getElementById('editCategoryId').value);
          const imageFile = document.getElementById('editImage').files[0];
          const messageDiv = document.getElementById('productMessage');

          // 1-qadam: Mahsulot ma'lumotlarini yangilash
          const data = { name, description, price, stock, categoryId };
          try {
              console.log(`Updating product with ID: ${product.id}`, data);
              const response = await fetch(`http://localhost:5004/api/v1/Products/${product.id}`, {
                  method: 'PUT',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${getToken()}`
                  },
                  body: JSON.stringify(data)
              });

              if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
              }

              // 2-qadam: Agar rasm tanlangan bo'lsa, rasmni yangilash
              if (imageFile) {
                  const imageFormData = new FormData();
                  imageFormData.append('file', imageFile);

                  const imageResponse = await fetch(`http://localhost:5004/api/v1/Products/${product.id}/upload-image`, {
                      method: 'POST',
                      headers: getHeaders(),
                      body: imageFormData
                  });

                  if (!imageResponse.ok) {
                      const errorText = await imageResponse.text();
                      throw new Error(`Image upload failed: ${imageResponse.status} - ${errorText}`);
                  }
              }

              messageDiv.textContent = 'Product successfully updated!';
              messageDiv.className = 'message success';
              messageDiv.style.display = 'block';
              closeModal();
              fetchProducts();
          } catch (error) {
              messageDiv.textContent = 'Error updating product: ' + error.message;
              messageDiv.className = 'message error';
              messageDiv.style.display = 'block';
          }
      };
  }

  // Modalni yopish
  function closeModal() {
      const modal = document.getElementById('editModal');
      modal.style.display = 'none';
  }

  // Sahifa yuklanganda mahsulotlar va kategoriyalarni yuklash
  window.onload = async function () {
      await fetchCategories();
      fetchProducts();
  };