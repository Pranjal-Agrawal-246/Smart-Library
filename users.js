const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get user's due date reminders
router.get('/:id/reminders', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT b.id, b.title, b.due_date 
        FROM books b 
        WHERE b.borrowed_by = ? AND b.status = 'borrowed' AND b.due_date IS NOT NULL
        ORDER BY b.due_date ASC
    `;

    db.all(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get user info
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT id, username, email, full_name, avatar FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(row);
    });
});

// Get library statistics
router.get('/stats/overview', (req, res) => {
    const stats = {};

    // Get total available seats
    db.get('SELECT COUNT(*) as count FROM seats WHERE status = "available"', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.availableSeats = row.count;

        // Get total visitors (occupied + reserved seats)
        db.get('SELECT COUNT(*) as count FROM seats WHERE status IN ("occupied", "reserved")', (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.currentVisitors = row.count;

            // Get total available books
            db.get('SELECT COUNT(*) as count FROM books WHERE status = "available"', (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.availableBooks = row.count;

                res.json(stats);
            });
        });
    });
});

module.exports = router;