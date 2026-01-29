// api/sales.js
module.exports = async (req, res) => {
    if (req.method === 'GET') {
        // Fetch data from MongoDB or use static data as a placeholder
        const salesData = [
            { date: '2026-01-28', totals: { total: 100.5 }, type: 'sale', customer: { name: 'John Doe' } },
            { date: '2026-01-29', totals: { total: 150.0 }, type: 'quote', customer: { name: 'Jane Doe' } }
        ];
        return res.status(200).json(salesData);
    }
    res.status(405).send('Method Not Allowed');
};
