// js/transactions.js
const API_URL = 'http://localhost:5000/api/sales';
let allSales = [];
let allCustomers = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupSearch();
});

async function fetchData() {
    try {
        const res = await fetch(API_URL);
        if(!res.ok) throw new Error("Failed to fetch");
        allSales = await res.json();
        
        // Process Customers
        processCustomers();
        
        renderSales(allSales);
        renderCustomers(allCustomers);
    } catch (err) {
        console.error(err);
        document.getElementById('salesTable').innerHTML = `<tr><td colspan="7" class="loading-row" style="color:red">Failed to load data. Is server running?</td></tr>`;
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
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No transactions found</td></tr>`;
        return;
    }

    data.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        const items = sale.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        const statusClass = sale.payment.status === 'paid' ? 'paid' : 'unpaid';
        const typeClass = sale.type === 'quote' ? 'quote' : 'sale';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Date">${date}</td>
            <td data-label="Customer">
                <div style="font-weight:600">${sale.customer.name}</div>
                <div style="font-size:0.8rem; color:#999">${sale.customer.phone}</div>
            </td>
            <td data-label="Type"><span class="badge ${typeClass}">${sale.type}</span></td>
            <td data-label="Items"><div class="item-summary" title="${items}">${items}</div></td>
            <td data-label="Payment">${sale.payment.method}</td>
            <td data-label="Total" style="font-weight:bold">$${sale.totals.total.toFixed(2)}</td>
            <td data-label="Status"><span class="badge ${statusClass}">${sale.payment.status}</span></td>
        `;
        tbody.appendChild(row);
    });
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