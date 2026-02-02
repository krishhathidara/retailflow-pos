const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    if (document.getElementById('employeesSection').classList.contains('active')) {
        fetchEmployees();
    }
    fetchCategoriesForSettings();
});

async function fetchCategoriesForSettings() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const categories = await res.json();
        const select = document.getElementById('importCategory');
        if (!select) return;

        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.innerText = cat.name;
            select.appendChild(opt);
        });
    } catch (err) { console.error("Error fetching categories:", err); }
}

function switchTab(tabId) {
    // UI Tab Switching Logic
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));

    // Activate target
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById(tabId + 'Section').classList.add('active');

    // Contextual Loading
    if (tabId === 'employees') fetchEmployees();
}

// --- SAVE SETTINGS ---
function saveSettings() {
    const settings = {
        // Store Info
        storeName: document.getElementById('storeName').value,
        storePhone: document.getElementById('storePhone').value,
        storeAddress: document.getElementById('storeAddress').value,

        // Receipt Preferences
        showAddress: document.getElementById('toggleAddress').checked,
        showPhone: document.getElementById('togglePhone').checked,
        showDesc: document.getElementById('toggleDesc').checked,
        receiptDesc: document.getElementById('receiptDesc').value
    };

    localStorage.setItem('swiftPosSettings', JSON.stringify(settings));
    alert("Settings Saved Successfully!");
}

// --- LOAD SETTINGS ---
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('swiftPosSettings'));
    if (!settings) return;

    // Fill Inputs
    if (document.getElementById('storeName')) document.getElementById('storeName').value = settings.storeName || "";
    if (document.getElementById('storePhone')) document.getElementById('storePhone').value = settings.storePhone || "";
    if (document.getElementById('storeAddress')) document.getElementById('storeAddress').value = settings.storeAddress || "";
    if (document.getElementById('receiptDesc')) document.getElementById('receiptDesc').value = settings.receiptDesc || "";

    // Set Toggles
    if (document.getElementById('toggleAddress')) document.getElementById('toggleAddress').checked = settings.showAddress;
    if (document.getElementById('togglePhone')) document.getElementById('togglePhone').checked = settings.showPhone;
    if (document.getElementById('toggleDesc')) document.getElementById('toggleDesc').checked = settings.showDesc;
}

// --- EMPLOYEE MANAGEMENT ---

async function fetchEmployees() {
    const tbody = document.getElementById('employeeTableBody');
    try {
        const res = await fetch(`${API_URL}/employees`);
        const employees = await res.json();

        tbody.innerHTML = '';
        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:40px; color:#999;">No employees found. Click "Add Employee" to start.</td></tr>';
            return;
        }

        employees.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.name}</strong><br><small class="text-muted">${emp.userId}</small></td>
                <td><span class="badge ${emp.authority === 'owner' ? 'paid' : 'partial'}" style="text-transform:capitalize;">${emp.authority}</span></td>
                <td>••••</td>
                <td><span class="status-pill in-stock">${emp.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                <td class="text-right">
                    <button class="icon-btn delete" onclick="deleteEmployee('${emp._id}')"><span class="material-icons-round">delete</span></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:40px; color:red;">Error loading employees.</td></tr>';
    }
}

function openEmployeeModal() {
    document.getElementById('employeeModal').classList.add('active');
    document.getElementById('employeeForm').reset();
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.remove('active');
}

async function handleEmployeeSubmit(event) {
    event.preventDefault();

    const empData = {
        name: document.getElementById('empName').value,
        userId: document.getElementById('empUserId').value,
        pin: document.getElementById('empPin').value,
        authority: document.getElementById('empAuthority').value
    };

    try {
        const res = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empData)
        });

        const result = await res.json();
        if (res.ok) {
            closeEmployeeModal();
            fetchEmployees();
        } else {
            alert(result.error || "Failed to save employee");
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
    }
}

async function deleteEmployee(id) {
    if (!confirm("Are you sure you want to delete this employee? This cannot be undone.")) return;

    try {
        const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchEmployees();
        } else {
            alert("Failed to delete employee");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- INVENTORY IMPORT ---

function downloadTemplate() {
    const data = [
        ["Name", "Price", "Description", "Color", "Storage", "IMEI", "Stock", "Low Stock Threshold"],
        ["iPhone 15 Pro", 999.99, "Latest iPhone", "Natural Titanium", "128GB", "IMEI_12345", 1, 10],
        ["iPhone 15 Pro", 979.99, "Latest iPhone", "Blue Titanium", "256GB", "IMEI_67890", 1, 10],
        ["AirPods Pro", 249.00, "Noise cancelling", "-", "-", "-", 50, 5]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Layout");
    XLSX.writeFile(wb, "Inventory_Layout_Template.xlsx");
}

let selectedImportFile = null;

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedImportFile = file;
        document.getElementById('fileNameDisplay').innerText = file.name;
    }
}

async function processImport() {
    const category = document.getElementById('importCategory').value;
    if (!category) {
        alert("Please select a category first.");
        return;
    }
    if (!selectedImportFile) {
        alert("Please select an Excel file first.");
        return;
    }

    // --- FETCH CURRENT INVENTORY ---
    let currentInventory = [];
    try {
        const res = await fetch(`${API_URL}/products`);
        if (res.ok) currentInventory = await res.json();
    } catch (e) {
        console.error("Error fetching inventory for merge check:", e);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const rawData = new Uint8Array(e.target.result);
        const workbook = XLSX.read(rawData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) {
            alert("The Excel file is empty.");
            return;
        }

        // --- GROUPING & MERGING LOGIC ---
        const productsMap = {};

        rows.forEach(row => {
            const name = (row.Name || row.name || "").trim();
            if (!name) return;

            if (!productsMap[name]) {
                const existingInDb = currentInventory.find(p => p.name.trim().toLowerCase() === name.toLowerCase());

                if (existingInDb) {
                    productsMap[name] = {
                        _id: existingInDb._id,
                        name: existingInDb.name,
                        category: category, // source of truth for import
                        description: existingInDb.description || row.Description || "",
                        price: existingInDb.price,
                        stock: existingInDb.stock,
                        variants: existingInDb.variants || [],
                        lowStockThreshold: existingInDb.lowStockThreshold || 10,
                        isService: existingInDb.isService || false,
                        isExisting: true
                    };

                    // Convert to variant product if it wasn't one
                    if (productsMap[name].variants.length === 0 && !productsMap[name].isService) {
                        if (productsMap[name].stock > 0) {
                            productsMap[name].variants.push({
                                color: (existingInDb.color || "Original").toString(),
                                storage: (existingInDb.storage || "-").toString(),
                                imei: "N/A",
                                price: existingInDb.price,
                                stock: existingInDb.stock,
                                description: (existingInDb.description || "").toString()
                            });
                        }
                    }
                } else {
                    productsMap[name] = {
                        name: name,
                        category: category,
                        description: row.Description || row.description || "",
                        price: parseFloat(row.Price || row.price || 0),
                        stock: 0,
                        variants: [],
                        lowStockThreshold: parseInt(row["Low Stock Threshold"] || row.threshold || 10) || 10,
                        isService: false,
                        isExisting: false
                    };
                }
            }

            const itemStock = parseInt(row.Stock || row.stock || 0) || 0;
            const itemPrice = parseFloat(row.Price || row.price || 0) || 0;

            const variant = {
                color: (row.Color || row.color || "Standard").toString(),
                storage: (row.Storage || row.storage || "-").toString(),
                imei: (row.IMEI || row.imei || "N/A").toString(),
                price: itemPrice,
                stock: itemStock,
                description: (row.Description || row.description || "").toString()
            };

            // --- VARIANT DEDUPLICATION ---
            const existingV = productsMap[name].variants.find(v => {
                if (variant.imei !== "N/A" && v.imei === variant.imei) return true;
                if (variant.imei === "N/A" && v.color === variant.color && v.storage === variant.storage) return true;
                return false;
            });

            if (existingV) {
                // If it exists, update stock instead of doubling
                if (variant.imei !== "N/A") {
                    existingV.stock = itemStock; // Overwrite for unique serialized items
                } else {
                    existingV.stock += itemStock; // Accumulate for bulk items
                }
                existingV.price = itemPrice;
                if (variant.description) existingV.description = variant.description;
            } else {
                productsMap[name].variants.push(variant);
            }

            if (!productsMap[name].isExisting) {
                productsMap[name].stock += itemStock;
            }
        });

        const finalProducts = Object.values(productsMap).map(p => {
            // Aggregated values
            if (p.variants.length > 0) {
                p.stock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                p.price = Math.min(...p.variants.map(v => v.price || p.price));
            }

            // Cleanup if only 1 variant and it has no specific details
            if (p.variants.length === 1 && !p.isExisting) {
                const v = p.variants[0];
                if ((!v.color || v.color === "Standard" || v.color === "-") &&
                    (!v.storage || v.storage === "-") &&
                    (!v.imei || v.imei === "N/A")) {
                    p.variants = [];
                    p.price = v.price;
                    p.stock = v.stock;
                    p.color = "";
                    p.storage = "";
                }
            }
            return p;
        });

        try {
            let successCount = 0;
            for (const prod of finalProducts) {
                const url = prod.isExisting ? `${API_URL}/products/${prod._id}` : `${API_URL}/products`;
                const method = prod.isExisting ? 'PUT' : 'POST';

                // Cleanup temporary flag
                delete prod.isExisting;

                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prod)
                });
                if (res.ok) successCount++;
            }

            alert(`Successfully processed ${successCount} products!`);
            location.reload();
        } catch (err) {
            console.error("Import Error:", err);
            alert("Error during import. Check console.");
        }
    };
    reader.readAsArrayBuffer(selectedImportFile);
}