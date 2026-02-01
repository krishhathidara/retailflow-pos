// js/sales.js - VERSION 2.0 (Price Fix)
console.log("Sales JS v2.0 Loaded");
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

let products = [];
let cart = [];

let state = {
    mode: 'sale',
    taxRate: 0.13,
    paymentMethod: 'cash',
    quoteStatus: 'paid'
};

let authenticatedStaff = null;

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

    console.log("Rendering items:", items.length);
    console.table(items.map(i => ({ name: i.name, price: i.price, variants: i.variants?.length || 0 })));

    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:#999; margin-top:40px;">No products found</p>';
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => addToCart(product);

        // ROBUST PRICE CALCULATION
        let baseVal = parseFloat(product.price);
        let displayPrice = isNaN(baseVal) ? 0 : baseVal;

        // If price is 0 and we have variants, find the minimum variant price
        if (displayPrice === 0 && product.variants && product.variants.length > 0) {
            console.log(`Checking variants for ${product.name}...`);
            const variantPrices = product.variants
                .map(v => parseFloat(v.price))
                .filter(p => !isNaN(p) && p > 0);

            if (variantPrices.length > 0) {
                displayPrice = Math.min(...variantPrices);
                console.log(`Found min price: ${displayPrice}`);
            }
        }

        card.innerHTML = `
            <div class="p-image">
                <span class="material-icons-round">inventory_2</span>
            </div>
            <div class="p-info">
                <div class="p-title">${product.name}</div>
                <div class="p-meta">
                    <span class="p-price">$${displayPrice.toFixed(2)}</span>
                    <span class="p-cat">${product.category || 'Item'}</span>
                </div>
                ${product.variants && product.variants.length > 0
                ? `<div style="margin-top:4px; font-size:0.75rem; color:#059669; font-weight:600; background:#ecfdf5; padding:2px 6px; border-radius:4px; display:inline-block;">${product.variants.length} Options</div>`
                : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- CART LOGIC ---

function addToCart(product) {
    // 1. Check for Variants
    if (product.variants && product.variants.length > 0) {
        openVariantModal(product);
        return;
    }

    // 2. Standard Product Logic
    if (product.stock <= 0) {
        alert("This item is out of stock!");
        return;
    }

    const existing = cart.find(item => item._id === product._id && !item.variant);
    if (existing) {
        if (existing.qty + 1 > product.stock) {
            alert(`Only ${product.stock} items available in stock.`);
            return;
        }
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function addVariantToCart(product, variant) {
    closeVariantModal();

    if (variant.stock <= 0) {
        alert("This variant is out of stock!");
        return;
    }

    const existing = cart.find(item => item._id === product._id && item.variant && item.variant.imei === variant.imei && item.variant.color === variant.color);

    if (existing) {
        if (existing.qty + 1 > variant.stock) {
            alert(`Only ${variant.stock} items available in stock for this variant.`);
            return;
        }
        existing.qty++;
    } else {
        // Create Cart Item with Variant Info
        cart.push({
            ...product, // Gets base info
            _id: product._id,
            name: `${product.name} (${variant.color || ''} ${variant.imei || ''})`.trim(),
            price: variant.price || product.price, // USE VARIANT PRICE
            qty: 1,
            variant: variant,
            stock: variant.stock
        });
    }
    updateCartUI();
}

// --- VARIANT MODAL ---
function openVariantModal(product) {
    console.log("OPENING VARIANT MODAL FOR:", product);
    const modal = document.getElementById('variantModal');
    if (!modal) {
        console.error("ERROR: Modal element #variantModal not found in DOM");
        return;
    }

    const list = document.getElementById('variantOptions');
    document.getElementById('vmProductName').innerText = `Select Option for ${product.name}`;
    list.innerHTML = '';

    // Clear search
    const searchInput = document.getElementById('variantSearch');
    if (searchInput) searchInput.value = '';

    function renderOptions(filterTerm = '') {
        list.innerHTML = '';
        const term = filterTerm.toLowerCase();

        console.log("Rendering variants:", product.variants);
        product.variants.forEach(v => {
            // Filter Logic
            const match = (v.color || '').toLowerCase().includes(term) ||
                (v.imei || '').toLowerCase().includes(term) ||
                (v.storage || '').toLowerCase().includes(term);
            if (!match) return;

            const div = document.createElement('div');
            div.className = `variant-option ${v.stock <= 0 ? 'out-of-stock' : ''}`;
            div.innerHTML = `
                <div class="v-info">
                    <span class="v-color">
                        ${v.color || ''} 
                        ${v.storage ? `<span style="background:#f3f4f6; color:#333; padding:2px 6px; border-radius:4px; font-size:0.75em; margin-left:4px;">${v.storage}</span>` : ''}
                    </span> 
                    <span class="v-imei">${v.imei || 'No IMEI'}</span>
                    ${v.price ? `<span style="font-size:0.75rem; color:#666; margin-top:2px;">$${v.price.toFixed(2)}</span>` : ''}
                </div>
                <span class="v-stock">
                    ${v.stock > 0 ? 'Available' : 'Sold Out'}
                </span>
            `;
            div.onclick = () => {
                if (v.stock > 0) addVariantToCart(product, v);
            };
            list.appendChild(div);
        });

        if (list.children.length === 0) {
            list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#aaa;">No matches found</div>`;
        }
    }

    renderOptions();

    // Attach Search Listener
    if (searchInput) searchInput.oninput = (e) => renderOptions(e.target.value);

    console.log("Adding 'active' class to modal");
    modal.classList.add('active');
    console.log("Modal classes:", modal.className);
}

function closeVariantModal() {
    document.getElementById('variantModal').classList.remove('active');
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

    updateTotals(true);
}


function changeQty(index, delta) {
    const item = cart[index];

    if (delta > 0 && item.qty + delta > item.stock) {
        alert(`Cannot add more. Only ${item.stock} in stock.`);
        return;
    }

    item.qty += delta;
    if (item.qty <= 0) {
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

function setDepositMode(isDeposit) {
    const section = document.getElementById('depositSection');
    const btnFull = document.getElementById('modeFull');
    const btnDeposit = document.getElementById('modeDeposit');

    if (isDeposit) {
        section.style.display = 'block';
        btnDeposit.style.background = 'white';
        btnDeposit.style.color = '#333';
        btnDeposit.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnFull.style.background = 'transparent';
        btnFull.style.color = '#666';
        btnFull.style.boxShadow = 'none';

        // Focus and select amount for quick entry
        const input = document.getElementById('amtPaid');
        input.focus();
        input.select();
    } else {
        section.style.display = 'none';
        btnFull.style.background = 'white';
        btnFull.style.color = '#333';
        btnFull.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        btnDeposit.style.background = 'transparent';
        btnDeposit.style.color = '#666';
        btnDeposit.style.boxShadow = 'none';

        // Reset to full total
        updateTotals(true);
    }
}

function updateTotals(isNewItem = false) {
    const subTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subTotal * state.taxRate;
    const total = subTotal + tax;

    document.getElementById('subTotal').innerText = `$${subTotal.toFixed(2)}`;
    document.getElementById('taxAmount').innerText = `$${tax.toFixed(2)}`;
    document.getElementById('finalTotal').innerText = `$${total.toFixed(2)}`;

    // Handle Amount Paid / Deposit
    const amtPaidInput = document.getElementById('amtPaid');
    if (isNewItem && amtPaidInput) {
        amtPaidInput.value = total.toFixed(2);
    }

    const paid = parseFloat(amtPaidInput?.value) || 0;
    const balance = total - paid;

    const balanceRow = document.getElementById('balanceRow');
    const balanceDue = document.getElementById('balanceDue');
    if (balanceRow && balanceDue) {
        if (balance > 0.01) {
            balanceRow.style.display = 'flex';
            balanceDue.innerText = `$${balance.toFixed(2)}`;
        } else {
            balanceRow.style.display = 'none';
        }
    }

    return {
        subtotal: parseFloat(subTotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        paid: paid,
        balance: parseFloat(balance.toFixed(2))
    };
}

// --- COMPLETE TRANSACTION ---
async function completeTransaction() {
    console.log("Button Clicked..."); // DEBUG LOG

    if (cart.length === 0) return alert("Please add items to the cart first.");

    // --- SECURITY CHECK ---
    if (!authenticatedStaff) {
        openAuthModal();
        return;
    }

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
        amountPaid: totals.paid,
        payment: {
            method: state.paymentMethod,
            status: state.mode === 'sale' ? (totals.balance <= 0 ? 'paid' : 'partial') : state.quoteStatus
        },
        type: state.mode,
        staff: authenticatedStaff
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
            // SUCCESS: Show Receipt Modal
            localStorage.setItem('lastSale', JSON.stringify({ ...saleData, balance: totals.balance, date: new Date() }));
            showReceipt(saleData, totals);
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

// --- STAFF AUTHENTICATION ---

function openAuthModal() {
    document.getElementById('staffAuthModal').classList.add('active');
    document.getElementById('authForm').reset();
    document.getElementById('authUserId').focus();
}

function closeAuthModal() {
    document.getElementById('staffAuthModal').classList.remove('active');
}

async function handleAuthSubmit(event) {
    event.preventDefault();

    const userId = document.getElementById('authUserId').value;
    const pin = document.getElementById('authPin').value;

    try {
        const res = await fetch(`${API_URL}/employees/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pin })
        });

        const result = await res.json();

        if (res.ok) {
            authenticatedStaff = { name: result.name, userId: result.userId };
            closeAuthModal();
            completeTransaction(); // Re-trigger with auth saved
        } else {
            alert(result.error || "Verification failed");
        }
    } catch (err) {
        console.error(err);
        alert("Security check failed. Please check your connection.");
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
function showReceipt(sale, totals) {
    document.getElementById('rcptTotal').innerText = `$${totals.total.toFixed(2)}`;
    document.getElementById('rcptPaid').innerText = `$${totals.paid.toFixed(2)}`;

    const balanceRow = document.getElementById('rcptBalanceRow');
    if (totals.balance > 0.01) {
        balanceRow.style.display = 'flex';
        document.getElementById('rcptBalance').innerText = `$${totals.balance.toFixed(2)}`;
    } else {
        balanceRow.style.display = 'none';
    }

    document.getElementById('receiptModal').classList.add('active');
}

function closeReceipt() {
    document.getElementById('receiptModal').classList.remove('active');
    authenticatedStaff = null; // Reset staff for next sale
    cart = [];
    updateCartUI();
    setDepositMode(false); // Reset to full payment
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    goToCustomerStep();
}

function printReceipt() {
    window.location.href = 'receipt.html';
}
