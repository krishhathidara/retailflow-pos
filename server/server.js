// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error: ', err));

// Product schema definition
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
});

const Product = mongoose.model('Product', productSchema);

// API route to fetch products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from DB
        res.json(products);  // Send products as JSON
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
