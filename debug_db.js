require('dotenv').config();
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: String,
    variants: Array
});

const Product = mongoose.model('Product', ProductSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const products = await Product.find({});
        console.log("--- PRODUCTS DUMP ---");
        products.forEach(p => {
            console.log(`ID: ${p._id}`);
            console.log(`Name: ${p.name}`);
            console.log(`Variants: ${JSON.stringify(p.variants)}`);
            console.log('-------------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

run();
