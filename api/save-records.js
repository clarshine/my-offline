// /api/save-records.js

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const records = req.body;

            // Validasi data
            if (!Array.isArray(records)) {
                return res.status(400).json({ success: false, message: 'Invalid data format' });
            }

            // Simpan data ke database atau proses lainnya
            // Misalnya:
            // await db.collection('records').insertMany(records);

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error saving records:', error);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    } else {
        // Method Not Allowed
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
}
