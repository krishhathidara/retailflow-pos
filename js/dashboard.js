// Use NEXT_PUBLIC_API_URL for frontend to point to the correct API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Fallback to local server for local development

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // 1. Fetch Data from API
        const [salesRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/sales`).catch(err => null),
            fetch(`${API_URL}/products`).catch(err => null)
        ]);

        // 2. Safety Check
        if (!salesRes || !productsRes || !salesRes.ok || !productsRes.ok) {
            throw new Error("Cannot connect to server. Is your backend deployed on Vercel?");
        }

        const allTransactions = await salesRes.json();
        const products = await productsRes.json();

        // --- FILTERING LOGIC (THE FIX) ---
        // We separate "Real Sales" from "Unpaid Quotes"
        const validSales = allTransactions.filter(txn => {
            // If it is a Quote AND it is NOT paid, ignore it for stats
            if (txn.type === 'quote' && txn.payment.status !== 'paid') {
                return false;
            }
            return true; // Keep Sales and Paid Quotes
        });

        // Use 'validSales' for the Math (Revenue, Counts, Charts)
        updateKPIs(validSales, products);
        renderChart(validSales);
        renderTopProducts(validSales);
        
        // We still show ALL transactions in the "Recent" table so you can see quotes came in
        renderRecentTable(allTransactions); 

    } catch (err) {
        console.error("Dashboard Error:", err);
        document.getElementById('totalRevenue').innerText = "$-.--";
    }
}

// --- 1. KPI CARDS ---
function updateKPIs(sales, products) {
    // Sum Revenue (Only from valid sales)
    const totalRev = sales.reduce((sum, s) => sum + (s.totals?.total || 0), 0);
    // Count Orders (Only valid sales)
    const totalOrders = sales.length; 
    // Avg Value
    const avgOrder = totalOrders > 0 ? totalRev / totalOrders : 0;
    
    // Low Stock (Checks real inventory)
    const lowStock = products.filter(p => !p.isService && p.stock <= (p.lowStockThreshold || 10)).length;

    // Update UI
    document.getElementById('totalRevenue').innerText = `$${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('totalOrders').innerText = totalOrders;
    document.getElementById('avgOrderVal').innerText = `$${avgOrder.toFixed(2)}`;
    
    const lowStockEl = document.getElementById('lowStockCount');
    lowStockEl.innerText = lowStock;
    
    // Turn card red if low stock
    const iconWrapper = lowStockEl.closest('.stat-card').querySelector('.stat-icon-wrapper');
    if(lowStock > 0) {
        iconWrapper.classList.remove('red');
        iconWrapper.style.backgroundColor = '#fee2e2';
        iconWrapper.style.color = '#ef4444';
        iconWrapper.style.animation = 'pulse 2s infinite';
    }
}

// --- 2. SALES CHART ---
function renderChart(sales) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [0,0,0,0,0,0,0];
    const labels = [];
    const today = new Date();

    // Labels for last 7 days
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        labels.push(days[d.getDay()]);
    }

    // Aggregate Data (Only valid sales)
    sales.forEach(s => {
        const sDate = new Date(s.date);
        const diffTime = Math.abs(today - sDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        if(diffDays < 7) data[6 - diffDays] += s.totals.total;
    });

    if (window.mySalesChart) window.mySalesChart.destroy();

    window.mySalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: data,
                backgroundColor: '#10b981',
                borderRadius: 4,
                hoverBackgroundColor: '#059669'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } }
            }
        }
    });
}

// --- 3. TOP PRODUCTS LIST ---
function renderTopProducts(sales) {
    const list = document.getElementById('topProductsList');
    list.innerHTML = '';

    if(sales.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:#999">No confirmed sales yet</div>';
        return;
    }

    const counts = {};
    sales.forEach(s => {
        if(s.items && Array.isArray(s.items)) {
            s.items.forEach(i => {
                if(!counts[i.name]) counts[i.name] = { qty: 0, rev: 0 };
                counts[i.name].qty += i.qty;
                counts[i.name].rev += (i.price * i.qty);
            });
        }
    });

    const sorted = Object.entries(counts).sort((a,b) => b[1].qty - a[1].qty).slice(0, 5);

    sorted.forEach(([name, data]) => {
        const div = document.createElement('div');
        div.className = 'top-product-item';
        div.innerHTML = ` 
            <div class="tp-left">
                <div class="tp-icon"><span class="material-icons-round">inventory_2</span></div>
                <div class="tp-details">
                    <span class="tp-name">${name}</span>
                    <span class="tp-sales">${data.qty} sold</span>
                </div>
            </div>
            <div class="tp-price">$${data.rev.toFixed(2)}</div>
        `;
        list.appendChild(div);
    });
}

// --- 4. RECENT TRANSACTIONS TABLE ---
function renderRecentTable(transactions) {
    const tbody = document.getElementById('recentSalesTable');
    tbody.innerHTML = '';
    
    // Show latest 5
    const recent = transactions.slice(0, 5);

    if(recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#999">No recent activity</td></tr>';
        return;
    }

    recent.forEach(s => {
        const tr = document.createElement('tr');
        const time = new Date(s.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        
        // Determine Badge Color & Label
        let statusClass = 'paid';
        let statusText = s.payment.status;
        
        if (s.type === 'quote') {
            statusText = 'QUOTE'; // Explicitly label it as QUOTE
            statusClass = 'unpaid'; // Make it red/orange
        } else if (s.payment.status !== 'paid') {
            statusClass = 'unpaid';
        }

        tr.innerHTML = `
            <td>${time}</td>
            <td style="font-weight:600">${s.customer.name}</td>
            <td style="font-weight:700">$${s.totals.total.toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}
