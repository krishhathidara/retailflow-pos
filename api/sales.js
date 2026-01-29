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

const SaleSchema = new mongoose.Schema({
    customer: { name: String, phone: String },
    items: Array,
    totals: Object,
    payment: Object,
    type: String,
    date: { type: Date, default: Date.now },
});

const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

export default async function handler(req, res) {
    await connectToDatabase();

    if (req.method === 'GET') {
        try {
            const sales = await Sale.find().sort({ date: -1 });
            res.status(200).json(sales);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    } else if (req.method === 'POST') {
        try {
            const newSale = new Sale(req.body);
            await newSale.save();
            res.status(201).json(newSale);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create sale' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
