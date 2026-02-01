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
  storage: { type: String }, // Global storage for single items
  isService: { type: Boolean, default: false },
  lowStockThreshold: { type: Number, default: 10 },
  variants: [
    {
      color: String,
      storage: String,    // Variant-specific storage (e.g., 128GB)
      imei: String,
      stock: { type: Number, default: 1 },
      price: Number,      // Variant-specific price
      description: String // Variant-specific description
    }
  ]
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['product', 'service'], required: true },
});

const SaleSchema = new mongoose.Schema({
  customer: { name: String, phone: String },
  items: Array,
  totals: Object,
  payment: {
    method: String,
    status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' }
  },
  amountPaid: { type: Number, default: 0 },
  paymentHistory: [{
    date: { type: Date, default: Date.now },
    amount: Number,
    method: String,
    note: String
  }],
  type: String,
  staff: { name: String, userId: String },
  date: { type: Date, default: Date.now },
});

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  authority: { type: String, enum: ['owner', 'employee'], default: 'employee' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const Sale = mongoose.model('Sale', SaleSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

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
    console.error("POST Error:", err);
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

app.put('/api/products/:id', async (req, res) => {
  try {
    console.log(`PUT /products/${req.params.id} Body:`, JSON.stringify(req.body, null, 2)); // DEBUG
    const db = await connectToDatabase();
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ error: "Product not found" });
    res.json(updatedProduct);
  } catch (err) {
    console.error("PUT Error:", err);
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
      // Process Items (Validate & Deduct in one go for simplicity/consistency)
      for (const item of req.body.items) {
        if (item._id && !item.isService) {
          const product = await Product.findById(item._id);
          if (!product) {
            return res.status(400).json({ error: `Product not found: ${item.name}` });
          }

          if (item.variant) {
            // Variant Deduction
            const vIndex = product.variants.findIndex(v =>
              v.imei === item.variant.imei && v.color === item.variant.color
            );

            if (vIndex === -1) {
              return res.status(400).json({ error: `Variant not found: ${item.name} (${item.variant.color} ${item.variant.imei})` });
            }

            if (product.variants[vIndex].stock < item.qty) {
              return res.status(400).json({ error: `Insufficient stock for ${item.name} (${item.variant.color})` });
            }

            product.variants[vIndex].stock -= item.qty;
            product.stock -= item.qty; // Sync total
          } else {
            // Standard Deduction
            if (product.stock < item.qty) {
              return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
            }
            product.stock -= item.qty;
          }

          await product.save();
        }
      }
    }

    const saleData = req.body;

    // Auto-calculate status and balance
    const total = saleData.totals.total || 0;
    const initialPaid = saleData.amountPaid || 0;

    if (initialPaid >= total) {
      saleData.payment.status = 'paid';
    } else if (initialPaid > 0) {
      saleData.payment.status = 'partial';
    } else {
      saleData.payment.status = 'unpaid';
    }

    // Initialize history if first payment exists
    if (initialPaid > 0 && (!saleData.paymentHistory || saleData.paymentHistory.length === 0)) {
      saleData.paymentHistory = [{
        date: new Date(),
        amount: initialPaid,
        method: saleData.payment.method || 'Cash',
        note: 'Initial payment'
      }];
    }

    const newSale = new Sale(saleData);
    await newSale.save();
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    // Restore Inventory Stock
    if (sale.type === 'sale' && sale.items) {
      for (const item of sale.items) {
        if (item._id && !item.isService) {
          const product = await Product.findById(item._id);
          if (product) {
            if (item.variant) {
              // Restore Variant Stock
              const vIndex = product.variants.findIndex(v =>
                v.imei === item.variant.imei && v.color === item.variant.color
              );
              if (vIndex !== -1) {
                product.variants[vIndex].stock += item.qty;
                product.stock += item.qty; // Sync total
              }
            } else {
              // Restore Standard Stock
              product.stock += item.qty;
            }
            await product.save();
          }
        }
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: "Sale deleted and inventory restored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const updateData = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    // Handle nested payment status update if string dot notation used
    if (updateData['payment.status']) {
      sale.payment.status = updateData['payment.status'];
    }

    // Handle adding a new payment record
    if (updateData.newPayment) {
      const { amount, method, note } = updateData.newPayment;
      sale.paymentHistory.push({
        date: new Date(),
        amount,
        method,
        note
      });
      sale.amountPaid += parseFloat(amount);

      // Re-calculate status
      const total = sale.totals.total;
      if (sale.amountPaid >= total) {
        sale.payment.status = 'paid';
      } else if (sale.amountPaid > 0) {
        sale.payment.status = 'partial';
      }
    }

    // Allow general updates (name, phone, etc)
    if (updateData.customer) sale.customer = updateData.customer;

    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMPLOYEE ROUTES ---

// GET ALL
app.get('/api/employees', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const employees = await Employee.find().select('-pin'); // Exclude PIN from lists
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
app.post('/api/employees', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { name, userId, pin, authority } = req.body;

    // Check if ID taken
    const existing = await Employee.findOne({ userId });
    if (existing) return res.status(400).json({ error: "User ID already taken" });

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin.toString(), 10);

    const newEmp = new Employee({ name, userId, pin: hashedPin, authority });
    await newEmp.save();
    res.status(201).json(newEmp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VERIFY (For Sales Security)
app.post('/api/employees/verify', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { userId, pin } = req.body;

    const employee = await Employee.findOne({ userId, status: 'active' });
    if (!employee) return res.status(401).json({ error: "Invalid User ID or inactive account" });

    const isMatch = await bcrypt.compare(pin.toString(), employee.pin);
    if (!isMatch) return res.status(401).json({ error: "Incorrect PIN" });

    res.json({ name: employee.name, userId: employee.userId, authority: employee.authority });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- START SERVER ---
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
