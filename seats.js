const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all seats
router.get('/', (req, res) => {
    db.all('SELECT * FROM seats ORDER BY seat_number', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get seat by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM seats WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Seat not found' });
        }
        res.json(row);
    });
});

// Update seat status
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { status, user_id } = req.body;

    db.run(
        'UPDATE seats SET status = ?, user_id = ? WHERE id = ?',
        [status, user_id, id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Seat updated successfully', changes: this.changes });
        }
    );
});

// Reserve a seat
router.post('/:id/reserve', (req, res) => {
    const { id } = req.params;
    const { user_id, duration_minutes = 120 } = req.body;
    
    const reservedUntil = new Date(Date.now() + duration_minutes * 60000);

    db.run(
        'UPDATE seats SET status = "reserved", user_id = ?, reserved_until = ? WHERE id = ? AND status = "available"',
        [user_id, reservedUntil.toISOString(), id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(400).json({ error: 'Seat not available for reservation' });
            }
            res.json({ message: 'Seat reserved successfully', reserved_until: reservedUntil });
        }
    );
});

module.exports = router;