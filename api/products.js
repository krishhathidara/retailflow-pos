import mongoose from 'mongoose';

// MongoDB Connection URI (use your Atlas URI or other MongoDB URI)
const mongoURI = process.env.MONGODB_URI;

let cachedDb = null;

// Function to connect to the MongoDB database
const connectToDatabase = async () => {
    // Check if already connected to the database
    if (cachedDb) return cachedDb;

    try {
        // Connect to MongoDB
        cachedDb = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        return cachedDb;
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB', err);
        throw new Error('Failed to connect to MongoDB');
    }
};

// Define Product schema
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
});

// Create or get the Product model from mongoose
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default async function handler(req, res) {
    // Ensure the database connection is established
    await connectToDatabase();

    if (req.method === 'GET') {
        // Handle GET requests to fetch all products
        try {
            const products = await Product.find();
            res.status(200).json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    } else if (req.method === 'POST') {
        // Handle POST requests to create a new product
        try {
            const { name, category, price, stock } = req.body;

            // Validate required fields
            if (!name || !category || !price) {
                return res.status(400).json({ error: 'Name, category, and price are required' });
            }

            const newProduct = new Product({ name, category, price, stock });
            await newProduct.save();
            res.status(201).json(newProduct);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    } else {
        // If method is not GET or POST, return 405 Method Not Allowed
        res.status(405).json({ error: 'Method not allowed' });
    }
}
