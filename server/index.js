require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Needed for security

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Connection Setup ---
let cachedDb = null;

const connectToDatabase = async () => {
  // Avoid opening new connections in each serverless invocation
  if (cachedDb) {
    console.log('Using cached MongoDB connection');
    return cachedDb;
  }

  console.log('Establishing new MongoDB connection');
  const mongoURI = process.env.MONGODB_URI;

  try {
    cachedDb = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
    return cachedDb;
  } catch (err) {
    console.error('❌ DB Error:', err);
    throw new Error('Failed to connect to MongoDB');
  }
};

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  isService: { type: Boolean, default: false },
  lowStockThreshold: { type: Number, default: 10 },
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['product', 'service'], required: true },
});

const SaleSchema = new mongoose.Schema({
  customer: { name: String, phone: String },
  items: Array,
  totals: Object,
  payment: Object,
  type: String,
  date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const Sale = mongoose.model('Sale', SaleSchema);

// --- AUTH ROUTES ---

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already taken" });

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res.json({ message: "Login success", email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXISTING ROUTES (Products, Categories, Sales) ---

app.get('/api/products', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const cats = await Category.find();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newCat = new Category(req.body);
    await newCat.save();
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sales = await Sale.find().sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    // Stock Deduction Logic
    if (req.body.type === 'sale') {
      for (const item of req.body.items) {
        if (item._id && !item.isService) {
          await Product.findByIdAndUpdate(item._id, { $inc: { stock: -item.qty } });
        }
      }
    }

    const newSale = new Sale(req.body);
    await newSale.save();
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
