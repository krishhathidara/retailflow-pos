// js/transactions.js
const URL_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';
const API_URL = `${URL_BASE}/sales`;
let allSales = [];
let allCustomers = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupSearch();
});

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch");
        allSales = await res.json();

        // Process Customers
        processCustomers();

        renderSales(allSales);
        renderCustomers(allCustomers);
    } catch (err) {
        console.error(err);
        document.getElementById('salesTable').innerHTML = `<tr><td colspan="8" class="loading-row" style="color:red">Failed to load data. Is server running?</td></tr>`;
    }
}

function processCustomers() {
    const custMap = new Map();

    allSales.forEach(sale => {
        const phone = sale.customer.phone || 'N/A';
        const name = sale.customer.name || 'Guest';

        if (name === 'Guest') return;

        if (!custMap.has(phone)) {
            custMap.set(phone, {
                name: name,
                phone: phone,
                visits: 0,
                spent: 0
            });
        }

        const cust = custMap.get(phone);
        cust.visits++;
        cust.spent += sale.totals.total;
    });

    allCustomers = Array.from(custMap.values());
}

// --- RENDER ---
function renderSales(data) {
    const tbody = document.getElementById('salesTable');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No transactions found</td></tr>`;
        return;
    }

    data.forEach(sale => {
        const date = new Date(sale.date).toLocaleString();
        const items = sale.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        const total = sale.totals.total || 0;
        const paid = sale.amountPaid || 0;
        const pct = Math.min((paid / total) * 100, 100);

        let status = sale.payment.status || 'unpaid';
        let statusClass = status.toLowerCase();
        let displayStatus = status.toUpperCase();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Date">${date}</td>
            <td data-label="Customer">
                <div style="font-weight:600">${sale.customer.name}</div>
                <div style="font-size:0.8rem; color:#999">${sale.customer.phone}</div>
            </td>
            <td data-label="Type"><span class="badge ${sale.type === 'quote' ? 'quote' : 'sale'}">${sale.type}</span></td>
            <td data-label="Items"><div class="item-summary" title="${items}">${items}</div></td>
            <td data-label="Payment">${sale.payment.method}</td>
            <td data-label="Total" style="font-weight:bold">$${total.toFixed(2)}</td>
            <td data-label="Status">
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <span class="badge ${statusClass}">${displayStatus}</span>
                    ${status !== 'paid' ? `
                        <div style="font-size:0.75rem; font-weight:600; color:#ef4444">Remaining: $${(total - paid).toFixed(2)}</div>
                        <div class="progress-mini">
                            <div class="progress-inner" style="width: ${pct}%"></div>
                        </div>
                    ` : ''}
                </div>
            </td>
            <td data-label="Actions" class="text-right">
                <div style="display:flex; gap:8px; justify-content:flex-end;">
                    <button class="action-btn edit" onclick="openTxnModal('${sale._id}')">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="action-btn delete" onclick="deleteSale('${sale._id}')">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- MODAL LOGIC ---
let activeSaleId = null;

function openTxnModal(id) {
    const sale = allSales.find(s => s._id === id);
    if (!sale) return;

    activeSaleId = id;
    document.getElementById('modalTxnId').innerText = `Transaction ID: ...${id.slice(-6)}`;
    document.getElementById('modalTxnDate').innerText = new Date(sale.date).toLocaleString();
    document.getElementById('modalCustName').innerText = sale.customer.name;
    document.getElementById('modalCustPhone').innerText = sale.customer.phone;

    // Items
    const itemsList = document.getElementById('modalItemsList');
    itemsList.innerHTML = sale.items.map(item => `
        <div class="modal-item">
            <span>${item.qty}x ${item.name}</span>
            <span class="val">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
    `).join('');

    // Totals in items list
    itemsList.innerHTML += `
        <div class="modal-item" style="background:#f8fafb; border-top:2px solid #eee;">
            <strong>Total</strong>
            <strong class="val">$${(sale.totals.total).toFixed(2)}</strong>
        </div>
    `;

    // Balance Label
    const balance = sale.totals.total - (sale.amountPaid || 0);
    const balanceLabel = document.getElementById('modalBalanceLabel');
    balanceLabel.innerText = balance <= 0 ? 'FULLY PAID' : `BALANCE: $${balance.toFixed(2)}`;
    balanceLabel.className = `badge ${balance <= 0 ? 'paid' : 'unpaid'}`;

    // History
    const historyBody = document.getElementById('modalPaymentHistory');
    historyBody.innerHTML = (sale.paymentHistory || []).map(entry => `
        <tr>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td>${entry.method}</td>
            <td class="text-right" style="font-weight:600">$${entry.amount.toFixed(2)}</td>
        </tr>
    `).join('');

    if (!sale.paymentHistory || sale.paymentHistory.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:10px;">No history recorded</td></tr>';
    }

    // Toggle Payment Form
    document.getElementById('addPaymentSection').style.display = balance <= 0 ? 'none' : 'block';

    document.getElementById('txnDetailModal').classList.add('active');
}

function closeTxnModal() {
    document.getElementById('txnDetailModal').classList.remove('active');
    activeSaleId = null;
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    const amount = document.getElementById('payAmount').value;
    const method = document.getElementById('payMethod').value;

    if (!amount || amount <= 0) return;

    try {
        const res = await fetch(`${API_URL}/${activeSaleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                newPayment: {
                    amount: parseFloat(amount),
                    method,
                    note: 'Manual Payment'
                }
            })
        });

        if (!res.ok) throw new Error("Payment update failed");

        document.getElementById('payAmount').value = '';
        await fetchData(); // Refresh local list
        openTxnModal(activeSaleId); // Refresh modal view
    } catch (err) {
        alert("Error: " + err.message);
    }
}

async function deleteSale(id) {
    if (!confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
        fetchData(); // Refresh table
    } catch (err) {
        alert("Error deleting sale: " + err.message);
    }
}

function renderCustomers(data) {
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No registered customers found</td></tr>`;
        return;
    }

    data.forEach(cust => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Name" style="font-weight:600">${cust.name}</td>
            <td data-label="Phone">${cust.phone}</td>
            <td data-label="Visits">${cust.visits}</td>
            <td data-label="Total Spent" style="font-weight:bold; color:var(--primary-dark)">$${cust.spent.toFixed(2)}</td>
            <td data-label="Action" class="text-right">
                <button class="action-btn" onclick="alert('Call ${cust.phone}')"><span class="material-icons-round">phone</span></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- UTILS ---
function switchView(view) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(view === 'sales' ? 'salesView' : 'customersView').classList.add('active');
}

function applyFilters() {
    const timeFilter = document.getElementById('filterTime').value;
    const term = document.getElementById('searchBox').value.toLowerCase();

    const filteredSales = allSales.filter(s => {
        const date = new Date(s.date);
        const today = new Date();
        let timeMatch = true;

        if (timeFilter === 'today') {
            timeMatch = date.toDateString() === today.toDateString();
        } else if (timeFilter === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(today.getDate() - 7);
            timeMatch = date >= oneWeekAgo;
        }

        const textMatch = s.customer.name.toLowerCase().includes(term) ||
            s.customer.phone.includes(term) ||
            s.type.includes(term);

        return timeMatch && textMatch;
    });
    renderSales(filteredSales);

    const filteredCust = allCustomers.filter(c =>
        c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
    renderCustomers(filteredCust);
}

function setupSearch() {
    document.getElementById('searchBox').addEventListener('input', applyFilters);
}