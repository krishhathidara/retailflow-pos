const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';
let allProducts = [];
let allCategories = [];
let editingSoldVariants = []; // Temporarily hold sold variants during an edit to preserve them in the DB

document.addEventListener('DOMContentLoaded', () => {
    fetchInventory().catch(console.error);
    fetchCategories().catch(console.error);
    setupSearch();
    setupModalLogic();
});

// --- API ---
async function fetchInventory() {
    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("API Error");
        allProducts = await res.json();
        renderTable(allProducts);
        updateLowStockAlert(allProducts);
    } catch (err) { console.error(err); }
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        if (!res.ok) return;
        allCategories = await res.json();
        populateCategoryDropdowns();
    } catch (err) { console.error(err); }
}

// --- RENDER TABLE ---
function renderTable(products) {
    const tableBody = document.getElementById('inventoryTable');
    tableBody.innerHTML = '';

    if (products.length === 0) {
        // ADDED class="empty-row" for CSS to handle it correctly
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="7">No items found</td></tr>`;
        return;
    }

    products.forEach(p => {
        let quantityHTML, statusHTML;
        const threshold = p.lowStockThreshold || 10;

        if (p.isService) {
            quantityHTML = `<span style="color:#aaa;">—</span>`;
            statusHTML = `<span class="status-pill" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">Service</span>`;
        } else {
            const isLow = p.stock <= threshold;
            quantityHTML = `<span style="${isLow ? 'color:#ea580c;font-weight:700' : ''}">${p.stock}</span>`;
            statusHTML = isLow
                ? `<span class="status-pill low-stock"><span class="material-icons-round" style="font-size:14px">warning</span> Low Stock</span>`
                : `<span class="status-pill in-stock">In Stock</span>`;
        }

        const details = p.color ? `<span style="color:#666; font-size:0.85rem">${p.color}</span>` : `<span style="color:#ccc;">—</span>`;

        // Price display logic
        let displayPrice = p.price;
        if ((!displayPrice || displayPrice === 0) && p.variants && p.variants.length > 0) {
            displayPrice = Math.min(...p.variants.map(v => v.price || 0));
        }

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = (e) => openViewModal(p._id); // Click row to view

        row.innerHTML = `
            <td data-label="Item"><div class="product-name">${p.name}</div></td>
            <td data-label="Category"><span class="cat-badge">${p.category}</span></td>
            <td data-label="Details">${details}</td>
            <td data-label="Price">$${displayPrice.toFixed(2)}</td>
            <td data-label="Quantity">${quantityHTML}</td>
            <td data-label="Status">${statusHTML}</td>
            <td data-label="Actions" class="text-right">
                <button class="action-btn edit" onclick="event.stopPropagation(); openEditModal('${p._id}')"><span class="material-icons-round">edit</span></button>
                <button class="action-btn delete" onclick="event.stopPropagation(); deleteProduct('${p._id}')"><span class="material-icons-round">delete</span></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- DYNAMIC LOGIC ---
function populateCategoryDropdowns() {
    const filter = document.getElementById('categoryFilter');
    const modal = document.getElementById('pCategory');
    if (!filter || !modal) return;

    filter.innerHTML = `<option value="All">All Categories</option>`;
    modal.innerHTML = `<option value="" disabled selected>Select Category</option>`;

    allCategories.forEach(cat => {
        const opt1 = document.createElement('option');
        opt1.value = cat.name;
        opt1.innerText = cat.name;
        filter.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = cat.name;
        opt2.innerText = cat.name;
        opt2.dataset.type = cat.type;
        modal.appendChild(opt2);
    });
}

function updateModalUI() {
    const catSelect = document.getElementById('pCategory');
    const hasVariantsCbx = document.getElementById('hasVariants');
    if (!catSelect) return;

    const selectedOption = catSelect.options[catSelect.selectedIndex];
    const isService = selectedOption?.dataset.type === 'service';
    const hasV = hasVariantsCbx ? hasVariantsCbx.checked : false;

    const stockContainer = document.getElementById('stockContainer');
    const thresholdContainer = document.getElementById('thresholdContainer');
    const serviceMessage = document.getElementById('serviceMessage');
    const variantsContainer = document.getElementById('variantsContainer');

    const priceContainer = document.getElementById('globalPriceContainer');
    const descContainer = document.getElementById('globalDescContainer');
    const colorContainer = document.getElementById('globalColorContainer');
    const storageContainer = document.getElementById('globalStorageContainer');

    const stockInput = document.getElementById('pStock');
    const priceInput = document.getElementById('pPrice');

    // Logic priority: Service > Variants > Standard
    if (isService) {
        if (stockContainer) stockContainer.style.display = 'none';
        if (thresholdContainer) thresholdContainer.style.display = 'none';
        if (serviceMessage) serviceMessage.style.display = 'flex';
        if (variantsContainer) variantsContainer.style.display = 'none';

        if (priceContainer) priceContainer.style.display = 'block';
        if (descContainer) descContainer.style.display = 'block';
        if (colorContainer) colorContainer.style.display = 'none';
        if (storageContainer) storageContainer.style.display = 'none';

        if (stockInput) stockInput.value = 0;
        document.getElementById('variantsToggleContainer').style.display = 'none';
    } else {
        document.getElementById('variantsToggleContainer').style.display = 'block';
        serviceMessage.style.display = 'none';
        thresholdContainer.style.display = 'block';

        if (hasV) {
            if (variantsContainer) variantsContainer.style.display = 'block';
            if (stockContainer) stockContainer.style.display = 'none';
            if (priceContainer) priceContainer.style.display = 'none';
            if (descContainer) descContainer.style.display = 'none';
            if (colorContainer) colorContainer.style.display = 'none';
            if (storageContainer) storageContainer.style.display = 'none';

            if (document.getElementById('variantRows').children.length === 0) {
                addVariantRow();
            }
        } else {
            if (variantsContainer) variantsContainer.style.display = 'none';
            if (stockContainer) stockContainer.style.display = 'block';
            if (priceContainer) priceContainer.style.display = 'block';
            if (descContainer) descContainer.style.display = 'block';
            if (colorContainer) colorContainer.style.display = 'block';
            if (storageContainer) storageContainer.style.display = 'block';
        }
    }
}

function setupModalLogic() {
    const catSelect = document.getElementById('pCategory');
    const hasVariantsCbx = document.getElementById('hasVariants');

    if (catSelect) catSelect.addEventListener('change', updateModalUI);
    if (hasVariantsCbx) hasVariantsCbx.addEventListener('change', updateModalUI);
}


// --- ADD VARIANT ROW ---
function addVariantRow(data = {}) {
    const div = document.createElement('div');
    div.className = 'variant-row fade-in-up';
    div.innerHTML = `
        <input type="text" class="v-color" placeholder="Color" value="${data.color || ''}">
        <input type="text" class="v-storage" placeholder="Storage" value="${data.storage || ''}">
        <input type="text" class="v-imei" placeholder="IMEI / Serial" value="${data.imei || ''}">
        <input type="number" class="v-qty" placeholder="Qty" value="${data.stock || 1}" min="0">
        <input type="number" class="v-price" placeholder="Price ($)" value="${data.price || ''}" step="0.01"> 
        <input type="text" class="v-desc" placeholder="Desc (Optional)" value="${data.description || ''}">
        <div class="remove-btn" onclick="this.parentElement.remove()">
            <span class="material-icons-round">remove_circle_outline</span>
        </div>
    `;
    document.getElementById('variantRows').appendChild(div);
}

// --- MODAL UTILS ---
function openViewModal(id) {
    const p = allProducts.find(x => x._id === id);
    if (!p) return;

    // Basic Info
    document.getElementById('viewName').innerText = p.name;
    document.getElementById('viewCategory').innerText = p.category;
    document.getElementById('viewStockBadge').innerText = p.isService ? 'Service' : `Total Stock: ${p.stock}`;
    document.getElementById('viewDesc').innerText = p.description || 'No description provided.';

    // Elements
    const globalSection = document.getElementById('viewGlobalDetails');
    const variantSection = document.getElementById('viewVariantsContainer');
    const variantList = document.getElementById('viewVariantsList');

    if (p.variants && p.variants.length > 0) {
        // Show Variants, Hide Global
        globalSection.style.display = 'none';
        variantSection.style.display = 'block';
        variantList.innerHTML = '';

        p.variants.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:10px; border-bottom:1px solid #eee;"><strong>${v.color || '-'}</strong></td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${v.storage || '-'}</td>
                <td style="padding:10px; border-bottom:1px solid #eee; font-family:monospace; color:#666;">${v.imei || '-'}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">${v.stock}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">$${(v.price || 0).toFixed(2)}</td>
                <td style="padding:10px; border-bottom:1px solid #eee; font-size:0.85rem; color:#555;">${v.description || '-'}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">
                    ${v.stock > 0
                    ? '<span style="color:#10b981; font-weight:600; font-size:0.8rem;">Available</span>'
                    : '<span style="color:#ef4444; font-weight:600; font-size:0.8rem;">Sold</span>'}
                </td>
            `;
            variantList.appendChild(tr);
        });

    } else {
        // Show Global, Hide Variants
        globalSection.style.display = 'block';
        variantSection.style.display = 'none';

        document.getElementById('viewPrice').innerText = `$${p.price.toFixed(2)}`;
        document.getElementById('viewColor').innerText = p.color || '-';
        document.getElementById('viewStorage').innerText = p.storage || '-';
    }

    document.getElementById('viewProductModal').classList.add('active');
}

function openProductModal() {
    editingSoldVariants = []; // Reset for new product
    updateModalUI();
    document.getElementById('productModal').classList.add('active');
}

function openCatModal() {
    document.getElementById('categoryModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'productModal') {
        editingSoldVariants = []; // Reset on close
        const form = document.getElementById('addProductForm');
        form.reset();

        document.getElementById('productModal').dataset.mode = 'create';
        document.getElementById('productModal').dataset.id = '';
        document.querySelector('#productModal h2').innerText = 'Add New Item';
        document.querySelector('#productModal button[type="submit"]').innerText = 'Save Item';

        // Clear dynamic elements
        document.getElementById('variantRows').innerHTML = '';

        // Trigger UI reset
        updateModalUI();
    }
}

function openEditModal(id) {
    const product = allProducts.find(p => p._id === id);
    if (!product) return;

    // Set Modal Mode
    const modal = document.getElementById('productModal');
    modal.dataset.mode = 'edit';
    modal.dataset.id = id;
    editingSoldVariants = product.variants ? product.variants.filter(v => (v.stock || 0) <= 0) : [];

    document.querySelector('#productModal h2').innerText = 'Edit Item';
    document.querySelector('#productModal button[type="submit"]').innerText = 'Update Item';

    // Populate Fields
    document.getElementById('pName').value = product.name;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pColor').value = product.color || '';
    document.getElementById('pStorage').value = product.storage || '';
    document.getElementById('pThreshold').value = product.lowStockThreshold || 10;
    document.getElementById('pDesc').value = product.description || '';

    // VARIANTS POPULATION
    const hasVariantsCbx = document.getElementById('hasVariants');
    const vContainer = document.getElementById('variantRows');
    vContainer.innerHTML = ''; // Clear

    if (product.variants && product.variants.length > 0) {
        hasVariantsCbx.checked = true;
        hasVariantsCbx.dispatchEvent(new Event('change'));

        const availableVariants = product.variants.filter(v => v.stock > 0);

        if (availableVariants.length === 0) {
            // RESTOCK STATE: All sold out
            vContainer.innerHTML = `
                <div style="padding:12px; margin-bottom:15px; background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; display:flex; gap:10px; align-items:center; font-size:0.9rem; color:#92400e;">
                    <span class="material-icons-round">notification_important</span> 
                    <strong>Product Sold Out!</strong> Add new stock below.
                </div>
            `;
            addVariantRow(); // Add a fresh row for new stock
        } else {
            // Show only remaining items
            availableVariants.forEach(v => addVariantRow(v));
        }
    } else {
        hasVariantsCbx.checked = false;
        hasVariantsCbx.dispatchEvent(new Event('change'));
        document.getElementById('pStock').value = product.stock;
    }

    // Handle Category & Service Type
    const catSelect = document.getElementById('pCategory');
    catSelect.value = product.category;

    // Trigger UI Update
    updateModalUI();

    // Open Modal
    modal.classList.add('active');
}


// --- FORMS ---
document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value;
    const type = document.querySelector('input[name="cType"]:checked').value;

    try {
        await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type })
        });
        closeModal('categoryModal');
        fetchCategories();
        e.target.reset();
    } catch (err) { alert("Error adding category"); }
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const catSelect = document.getElementById('pCategory');
    const pName = document.getElementById('pName').value.trim();
    const category = catSelect.value;
    const selectedType = catSelect.options[catSelect.selectedIndex]?.dataset.type || 'product';
    const hasVariants = document.getElementById('hasVariants').checked;

    // --- MANUAL VALIDATION ---
    let errors = [];
    if (!pName) errors.push("Item Name is required");
    if (!category) errors.push("Category is required");

    let variants = [];
    let totalStock = 0;

    if (hasVariants && selectedType !== 'service') {
        const rows = document.querySelectorAll('.variant-row');
        if (rows.length === 0) {
            errors.push("At least one variant is required when 'Has Variants' is checked");
        } else {
            rows.forEach((row, idx) => {
                const color = row.querySelector('.v-color').value.trim();
                const imei = row.querySelector('.v-imei').value.trim();
                const price = parseFloat(row.querySelector('.v-price').value);
                const qty = parseInt(row.querySelector('.v-qty').value) || 0;

                if (!color) errors.push(`Variant ${idx + 1}: Color is required`);
                if (!imei) errors.push(`Variant ${idx + 1}: IMEI/Serial is required`);
                if (isNaN(price)) errors.push(`Variant ${idx + 1}: Price is required`);

                variants.push({
                    color,
                    storage: row.querySelector('.v-storage').value.trim(),
                    imei,
                    price: price || 0,
                    description: row.querySelector('.v-desc').value.trim(),
                    stock: qty
                });
                totalStock += qty;
            });
        }
    } else {
        const globalPrice = parseFloat(document.getElementById('pPrice').value);
        if (isNaN(globalPrice)) errors.push("Price is required");

        if (selectedType !== 'service') {
            const globalStock = parseInt(document.getElementById('pStock').value);
            if (isNaN(globalStock)) errors.push("Stock Quantity is required");
            totalStock = globalStock || 0;
        }
    }

    if (errors.length > 0) {
        alert("Please fix the following errors:\n\n- " + errors.join("\n- "));
        return;
    }

    const minVariantPrice = variants.length > 0
        ? Math.min(...variants.map(v => v.price))
        : parseFloat(document.getElementById('pPrice').value || 0);

    const newProduct = {
        name: pName,
        category: category,
        price: minVariantPrice,
        description: variants.length > 0 ? "" : document.getElementById('pDesc').value,
        color: variants.length > 0 ? "" : (document.getElementById('pColor')?.value || ""),
        storage: variants.length > 0 ? "" : (document.getElementById('pStorage')?.value || ""),
        stock: totalStock + editingSoldVariants.reduce((sum, v) => sum + (v.stock || 0), 0),
        variants: [...variants, ...editingSoldVariants],
        isService: selectedType === 'service',
        lowStockThreshold: parseInt(document.getElementById('pThreshold').value) || 10,
    };

    try {
        const modal = document.getElementById('productModal');
        if (modal.dataset.mode === 'edit') {
            await fetch(`${API_URL}/products/${modal.dataset.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });
        } else {
            await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });
        }

        closeModal('productModal');
        fetchInventory();
    } catch (err) { alert("Error saving product"); }
});

async function deleteProduct(id) {
    if (confirm("Delete item?")) {
        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        fetchInventory();
    }
}

function updateLowStockAlert(products) {
    const count = products.filter(p => !p.isService && p.stock <= (p.lowStockThreshold || 10)).length;
    const banner = document.getElementById('lowStockBanner');
    if (banner) {
        banner.style.display = count > 0 ? 'flex' : 'none';
        document.getElementById('lowStockCount').innerText = count;
    }
}

function setupSearch() {
    const searchInput = document.getElementById('inventorySearch');
    const categoryFilter = document.getElementById('categoryFilter');

    function filterData() {
        const term = searchInput.value.toLowerCase();
        const cat = categoryFilter.value;
        const filtered = allProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(term);
            const matchesCat = cat === 'All' || p.category === cat;
            return matchesSearch && matchesCat;
        });
        renderTable(filtered);
    }
    searchInput.addEventListener('input', filterData);
    categoryFilter.addEventListener('change', filterData);
}