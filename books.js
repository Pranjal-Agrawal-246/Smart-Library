const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all books with search
router.get('/', (req, res) => {
    const { search } = req.query;
    let query = `
        SELECT b.*, u.full_name as borrowed_by_name 
        FROM books b 
        LEFT JOIN users u ON b.borrowed_by = u.id
    `;
    let params = [];

    if (search) {
        query += ` WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?`;
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY b.title';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get book by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(row);
    });
});

// Borrow a book
router.post('/:id/borrow', (req, res) => {
    const { id } = req.params;
    const { user_id, due_days = 14 } = req.body;
    
    const dueDate = new Date(Date.now() + due_days * 24 * 60 * 60 * 1000);

    db.run(
        'UPDATE books SET status = "borrowed", borrowed_by = ?, due_date = ? WHERE id = ? AND status = "available"',
        [user_id, dueDate.toISOString(), id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(400).json({ error: 'Book not available for borrowing' });
            }
            res.json({ message: 'Book borrowed successfully', due_date: dueDate });
        }
    );
});

// Return a book
router.post('/:id/return', (req, res) => {
    const { id } = req.params;

    db.run(
        'UPDATE books SET status = "available", borrowed_by = NULL, due_date = NULL WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Book returned successfully' });
        }
    );
});

module.exports = router;