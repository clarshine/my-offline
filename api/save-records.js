const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = (req, res) => {
    if (req.method === 'POST') {
        const records = req.body;
        const queries = records.map(record => {
            return new Promise((resolve, reject) => {
                const query = 'INSERT INTO attendance_records (type, time, location) VALUES (?, ?, ?)';
                db.query(query, [record.type, record.time, record.location], (err, result) => {
                    if (err) {
                        console.error('Error inserting record:', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });

        Promise.all(queries)
            .then(() => {
                res.status(200).json({ success: true });
            })
            .catch(err => {
                res.status(500).json({ success: false, error: err.message });
            });
    } else {
        res.status(405).end(); // Method Not Allowed
    }
};
