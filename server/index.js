require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors()); // Allows your frontend to talk to this server
app.use(express.json()); // Allows server to read JSON data

// --- MONGODB CONNECTION ---
// Make sure you have a .env file with MONGO_URI, or replace process.env.MONGO_URI with your actual string
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ DB Error:', err));

// --- SCHEMAS ---

// 1. Category Schema
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['product', 'service'], required: true }
});

// 2. Product Schema
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    isService: { type: Boolean, default: false },
    // Optional fields for details
    color: String,
    description: String,
    lowStockThreshold: { type: Number, default: 10 }
});

// 3. Sale Schema (Transaction History)
const SaleSchema = new mongoose.Schema({
    customer: { 
        name: { type: String, default: 'Guest' }, 
        phone: { type: String, default: 'N/A' } 
    },
    items: { type: Array, required: true }, // Stores the cart items
    totals: { 
        subtotal: Number, 
        tax: Number, 
        total: Number 
    },
    payment: { 
        method: String, // 'cash', 'card', 'etransfer'
        status: String  // 'paid', 'unpaid'
    },
    type: { type: String, default: 'sale' }, // 'sale' or 'quote'
    date: { type: Date, default: Date.now }
});

// --- MODELS ---
const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const Sale = mongoose.model('Sale', SaleSchema);

// --- API ROUTES ---

// ==========================
// PRODUCTS ROUTES
// ==========================
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================
// CATEGORIES ROUTES
// ==========================
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const newCat = new Category(req.body);
        await newCat.save();
        res.status(201).json(newCat);
    } catch (err) {
        res.status(400).json({ error: "Category likely exists already" });
    }
});

// ==========================
// SALES ROUTES (For Dashboard & Transactions)
// ==========================
app.get('/api/sales', async (req, res) => {
    try {
        // Sort by date descending (Newest first)
        const sales = await Sale.find().sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        console.error("Error fetching sales:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        console.log("📥 Receiving New Sale:", req.body.totals.total);
        
        const newSale = new Sale(req.body);
        await newSale.save();
        
        // AUTOMATIC INVENTORY DEDUCTION
        // Only deduct if it is a 'sale' (not a quote) and item is a 'product' (not service)
        if (req.body.type === 'sale') {
            for (const item of req.body.items) {
                if (item._id && !item.isService) {
                    await Product.findByIdAndUpdate(item._id, { 
                        $inc: { stock: -item.qty } 
                    });
                }
            }
        }
        
        console.log("✅ Sale Saved & Inventory Updated");
        res.status(201).json(newSale);
    } catch (err) {
        console.error("❌ Error Saving Sale:", err);
        res.status(400).json({ error: err.message });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`---------------------------------------`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 API Address: http://localhost:${PORT}`);
    console.log(`---------------------------------------`);
});