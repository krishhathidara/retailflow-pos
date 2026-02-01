const URL_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';
const API_URL = `${URL_BASE}/products`;

// --- LOAD SALES PAGE ---
if (document.getElementById('productGrid')) {
    fetchProducts();
}

// --- LOAD INVENTORY PAGE ---
if (document.getElementById('inventoryTableBody')) {
    fetchInventory();

    // Add Product Form Handler
    const form = document.getElementById('addProductForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newProduct = {
            name: document.getElementById('name').value,
            category: document.getElementById('category').value,
            price: document.getElementById('price').value,
            stock: document.getElementById('stock').value
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });

            if (res.ok) {
                alert('Product Added!');
                form.reset();
                fetchInventory(); // Refresh table
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server. Is node index.js running?');
        }
    });
}

// --- FUNCTIONS ---

async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    try {
        const res = await fetch(API_URL);
        const products = await res.json();

        grid.innerHTML = ''; // Clear loading text

        if (products.length === 0) {
            grid.innerHTML = '<p>No products found. Go to Inventory to add some!</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => addToCart(product);
            card.innerHTML = `
                <span class="material-icons-round p-icon">inventory_2</span>
                <span class="p-name">${product.name}</span>
                <span class="p-price">$${product.price}</span>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<p style="color:red">Error: Cannot connect to Backend Server. Make sure "node index.js" is running.</p>';
    }
}

async function fetchInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    try {
        const res = await fetch(API_URL);
        const products = await res.json();

        tbody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td><span style="background:#e5e7eb; padding:2px 8px; border-radius:10px; font-size:12px">${product.category}</span></td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td><button onclick="deleteProduct('${product._id}')" style="color:red; border:none; background:none; cursor:pointer"><span class="material-icons-round">delete</span></button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error(err);
    }
}

async function deleteProduct(id) {
    if (confirm('Delete this item?')) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchInventory();
    }
}

// --- CART LOGIC (Simple) ---
let cart = [];

function addToCart(product) {
    cart.push(product);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const btn = document.querySelector('.checkout-btn');

    container.innerHTML = '';

    let total = 0;

    cart.forEach((item, index) => {
        total += Number(item.price);
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span>${item.name}</span>
            <span>$${item.price}</span>
        `;
        container.appendChild(div);
    });

    totalEl.innerText = `$${total.toFixed(2)}`;
    btn.innerText = `Charge $${total.toFixed(2)}`;
    document.querySelector('.cart-count').innerText = `${cart.length} items`;
}