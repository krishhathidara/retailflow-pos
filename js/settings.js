const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    if (document.getElementById('employeesSection').classList.contains('active')) {
        fetchEmployees();
    }
});

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