// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error: ', err));

// Product schema definition
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
});

const Product = mongoose.model('Product', productSchema);

// Sales schema definition
const salesSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    customer: {
        name: String,
        phone: String
    },
    type: String, // 'sale' or 'quote'
    items: [{
        name: String,
        qty: Number,
        price: Number
    }],
    payment: {
        method: String,
        status: String // 'paid' or 'unpaid'
    },
    totals: {
        subtotal: Number,
        tax: Number,
        total: Number
    }
});

const Sale = mongoose.model('Sale', salesSchema);

// API route to fetch products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from DB
        res.json(products);  // Send products as JSON
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// API route to fetch sales/transactions
app.get('/api/sales', async (req, res) => {
    try {
        const sales = await Sale.find().sort({ date: -1 }); // Fetch all sales, newest first
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sales' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
