// api/products.js
module.exports = async (req, res) => {
    if (req.method === 'GET') {
        // Fetch products from MongoDB or use static data as a placeholder
        const products = [
            { _id: 1, name: 'Product 1', price: 100, stock: 10, isService: false },
            { _id: 2, name: 'Product 2', price: 50, stock: 0, isService: false }
        ];
        return res.status(200).json(products);
    }
    res.status(405).send('Method Not Allowed');
};
