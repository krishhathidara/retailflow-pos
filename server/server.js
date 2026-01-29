// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error: ", err));

// Define the Product model
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
}));

// Middleware to handle JSON
app.use(express.json());

// Endpoint to get products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

// Handle the backend server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
