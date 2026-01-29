// js/inventory.js
const API_URL = 'http://localhost:5000/api';
let allProducts = [];
let allCategories = [];

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

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Item"><div class="product-name">${p.name}</div></td>
            <td data-label="Category"><span class="cat-badge">${p.category}</span></td>
            <td data-label="Details">${details}</td>
            <td data-label="Price">$${p.price.toFixed(2)}</td>
            <td data-label="Quantity">${quantityHTML}</td>
            <td data-label="Status">${statusHTML}</td>
            <td data-label="Actions" class="text-right">
                <button class="action-btn delete" onclick="deleteProduct('${p._id}')"><span class="material-icons-round">delete</span></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- DYNAMIC LOGIC ---
function populateCategoryDropdowns() {
    const filter = document.getElementById('categoryFilter');
    const modal = document.getElementById('pCategory');
    if(!filter || !modal) return;

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

function setupModalLogic() {
    const catSelect = document.getElementById('pCategory');
    const stockContainer = document.getElementById('stockContainer');
    const thresholdContainer = document.getElementById('thresholdContainer');
    const serviceMessage = document.getElementById('serviceMessage');
    const stockInput = document.getElementById('pStock');

    if(catSelect) {
        catSelect.addEventListener('change', () => {
            const selectedOption = catSelect.options[catSelect.selectedIndex];
            const type = selectedOption.dataset.type; 

            if (type === 'service') {
                stockContainer.style.display = 'none';
                thresholdContainer.style.display = 'none';
                serviceMessage.style.display = 'flex';
                stockInput.value = 0; 
                stockInput.removeAttribute('required');
            } else {
                stockContainer.style.display = 'block';
                thresholdContainer.style.display = 'block';
                serviceMessage.style.display = 'none';
                stockInput.setAttribute('required', 'true');
            }
        });
    }
}

// --- MODAL UTILS ---
function openProductModal() { 
    document.getElementById('productModal').classList.add('active'); 
}

function openCatModal() { 
    document.getElementById('categoryModal').classList.add('active'); 
}

function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
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
    } catch(err) { alert("Error adding category"); }
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const catSelect = document.getElementById('pCategory');
    const selectedType = catSelect.options[catSelect.selectedIndex]?.dataset.type || 'product';

    const newProduct = {
        name: document.getElementById('pName').value,
        category: catSelect.value,
        price: parseFloat(document.getElementById('pPrice').value),
        stock: parseInt(document.getElementById('pStock').value) || 0,
        isService: selectedType === 'service',
        color: document.getElementById('pColor').value,
        lowStockThreshold: parseInt(document.getElementById('pThreshold').value) || 10,
        description: document.getElementById('pDesc').value
    };

    try {
        await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        closeModal('productModal');
        fetchInventory();
        e.target.reset();
        
        document.getElementById('stockContainer').style.display = 'block';
        document.getElementById('thresholdContainer').style.display = 'block';
        document.getElementById('serviceMessage').style.display = 'none';
    } catch(err) { alert("Error adding product"); }
});

async function deleteProduct(id) {
    if(confirm("Delete item?")) {
        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        fetchInventory();
    }
}

function updateLowStockAlert(products) {
    const count = products.filter(p => !p.isService && p.stock <= (p.lowStockThreshold || 10)).length;
    const banner = document.getElementById('lowStockBanner');
    if(banner) {
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