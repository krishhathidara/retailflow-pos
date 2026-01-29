// Get the API URL from environment variable (for Vercel, or fallback to local development)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://retailflow-pos.vercel.app/api'; // Default to Vercel production URL

let products = [];
let cart = [];

let state = {
    mode: 'sale',          
    taxRate: 0.13,        
    paymentMethod: 'cash',
    quoteStatus: 'paid'
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateTotals();
});

// --- API: FETCH PRODUCTS ---
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);  // API call to fetch products
        if (!res.ok) throw new Error("Failed to load products");
        products = await res.json();
        renderProducts(products);
        setupSearch();
    } catch (err) {
        console.error(err);
        document.getElementById('productGrid').innerHTML = `
            <div style="text-align:center; padding:20px; color:red">
                <span class="material-icons-round">error</span><br>
                <strong>Server Offline</strong><br>
                Is your API deployed and running?
            </div>`;
    }
}

// --- UI: RENDER PRODUCTS ---
function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:#999; margin-top:40px;">No products found</p>';
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => addToCart(product);
        card.innerHTML = `
            <div class="p-image">
                <span class="material-icons-round">inventory_2</span>
            </div>
            <div class="p-info">
                <div class="p-title">${product.name}</div>
                <div class="p-meta">
                    <span class="p-price">$${product.price.toFixed(2)}</span>
                    <span class="p-cat">${product.category || 'Item'}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- CART LOGIC ---
function addToCart(product) {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cartList');
    const emptyState = document.getElementById('emptyCartState');
    const badge = document.getElementById('mobileCartCount');

    // Mobile Badge
    if (badge) badge.innerText = cart.reduce((acc, item) => acc + item.qty, 0);

    // Empty State Toggle
    if (cart.length === 0) {
        if (list) list.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        updateTotals();
        return;
    }

    if (list) list.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (list) list.innerHTML = '';

    cart.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <div style="font-size:0.85rem; color:#666;">$${item.price.toFixed(2)} x ${item.qty}</div>
            </div>
            <div class="item-controls">
                <div class="qty-btn" onclick="changeQty(${index}, -1)">-</div>
                <span style="font-weight:600; font-size:0.9rem; min-width:20px; text-align:center;">${item.qty}</span>
                <div class="qty-btn" onclick="changeQty(${index}, 1)">+</div>
            </div>
        `;
        if (list) list.appendChild(row);
    });

    updateTotals();
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function clearCart() {
    if (cart.length > 0 && confirm("Clear current order?")) {
        cart = [];
        updateCartUI();
    }
}

// --- STATE & CALCULATIONS ---
function setMode(mode) {
    state.mode = mode;

    document.getElementById('btnModeSale').classList.toggle('active', mode === 'sale');
    document.getElementById('btnModeQuote').classList.toggle('active', mode === 'quote');

    const statusRow = document.getElementById('statusRow');
    if (statusRow) statusRow.style.display = (mode === 'quote') ? 'flex' : 'none';

    document.getElementById('txnTitle').innerText = (mode === 'sale') ? 'Current Sale' : 'New Quote';

    const btnText = document.getElementById('completeBtnText');
    if (btnText) btnText.innerText = (mode === 'sale') ? 'Complete Sale' : 'Save Quote';
}

function setTax(rate) {
    state.taxRate = rate;
    document.getElementById('btnTax0').classList.toggle('active', rate === 0);
    document.getElementById('btnTax13').classList.toggle('active', rate === 0.13);
    updateTotals();
}

function setMethod(method) {
    state.paymentMethod = method;
    ['Cash', 'Card', 'Etransfer'].forEach(m => {
        const btn = document.getElementById(`btnMethod${m}`);
        if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btnMethod${method.charAt(0).toUpperCase() + method.slice(1)}`);
    if (activeBtn) activeBtn.classList.add('active');
}

function setStatus(status) {
    state.quoteStatus = status;
    document.getElementById('btnStatusPaid').classList.toggle('active', status === 'paid');
    document.getElementById('btnStatusUnpaid').classList.toggle('active', status === 'unpaid');
}

function updateTotals() {
    const subTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subTotal * state.taxRate;
    const total = subTotal + tax;

    document.getElementById('subTotal').innerText = `$${subTotal.toFixed(2)}`;
    document.getElementById('taxAmount').innerText = `$${tax.toFixed(2)}`;
    document.getElementById('finalTotal').innerText = `$${total.toFixed(2)}`;

    return {
        subtotal: parseFloat(subTotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
}

// --- COMPLETE TRANSACTION (THE FIX) ---
async function completeTransaction() {
    console.log("Button Clicked..."); // DEBUG LOG

    if (cart.length === 0) return alert("Please add items to the cart first.");

    // 1. UI Feedback (So you know it's working)
    const btnTextSpan = document.getElementById('completeBtnText');
    const originalText = btnTextSpan ? btnTextSpan.innerText : "Complete";
    if (btnTextSpan) btnTextSpan.innerText = "Processing...";

    // 2. Gather Data
    const customerName = document.getElementById('customerName').value || 'Guest';
    const customerPhone = document.getElementById('customerPhone').value || 'N/A';
    const totals = updateTotals();

    const saleData = {
        customer: { name: customerName, phone: customerPhone },
        items: cart,
        totals: totals,
        payment: { 
            method: state.paymentMethod, 
            status: state.mode === 'sale' ? 'paid' : state.quoteStatus 
        },
        type: state.mode
    };

    try {
        // 3. Send to Server
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        const result = await res.json();

        // 4. Handle Response
        if (res.ok) {
            // SUCCESS: Save data & Redirect
            localStorage.setItem('lastSale', JSON.stringify(saleData));
            console.log("Success! Redirecting to receipt...");
            window.location.href = 'receipt.html'; 
        } else {
            // FAILURE: Server rejected it (Likely Low Stock)
            alert("Transaction Failed: " + (result.error || "Unknown error"));
            if (btnTextSpan) btnTextSpan.innerText = originalText;
        }
    } catch (err) {
        // NETWORK ERROR: Server is down
        console.error("Network Error:", err);
        alert("Cannot connect to server.\n\nMake sure you are running 'node index.js' in your terminal.");
        if (btnTextSpan) btnTextSpan.innerText = originalText;
    }
}

// --- NAVIGATION & SEARCH ---
function goToCartStep() {
    const name = document.getElementById('customerName').value || 'Guest';
    const phone = document.getElementById('customerPhone').value || 'No phone';
    document.getElementById('summaryName').innerText = name;
    document.getElementById('summaryPhone').innerText = phone;

    document.getElementById('customerStep').classList.remove('active');
    document.getElementById('cartStep').classList.add('active');
    if (window.innerWidth <= 900) switchMobileTab('cart');
}

function goToCustomerStep() {
    document.getElementById('cartStep').classList.remove('active');
    document.getElementById('customerStep').classList.add('active');
}

function switchMobileTab(tab) {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));

    if (tab === 'cart') {
        document.body.classList.add('mobile-view-cart');
        btns[1].classList.add('active');
    } else {
        document.body.classList.remove('mobile-view-cart');
        btns[0].classList.add('active');
    }
}

function setupSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = products.filter(p => p.name.toLowerCase().includes(term));
            renderProducts(filtered);
        });
    }
}

function filterCategory(cat) {
    document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.innerText === cat) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    if (cat === 'All') renderProducts(products);
    else renderProducts(products.filter(p => p.category === cat));
}
