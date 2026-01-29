import mongoose from 'mongoose';

// MongoDB Connection URI (use your Atlas URI)
const mongoURI = process.env.MONGODB_URI;

let cachedDb = null;

const connectToDatabase = async () => {
    if (cachedDb) return cachedDb;

    try {
        cachedDb = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        return cachedDb;
    } catch (err) {
        throw new Error('Failed to connect to MongoDB');
    }
};

const ProductSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    stock: { type: Number, default: 0 },
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default async function handler(req, res) {
    await connectToDatabase();

    if (req.method === 'GET') {
        try {
            const products = await Product.find();
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    } else if (req.method === 'POST') {
        try {
            const newProduct = new Product(req.body);
            await newProduct.save();
            res.status(201).json(newProduct);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create product' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
