
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');
const DATA_DIR = path.join(__dirname, 'src', 'data');
const SEED_FILE = path.join(DATA_DIR, 'seedTickets.json');

app.use(cors());
app.use(bodyParser.json());

// Helper to read DB
function readDb() {
    if (!fs.existsSync(DB_FILE)) {
        // Initialize from seed if db.json doesn't exist
        const seedData = fs.existsSync(SEED_FILE) ? JSON.parse(fs.readFileSync(SEED_FILE)) : [];
        const initialDb = { tickets: seedData };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
        return initialDb;
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// Helper to write DB
function writeDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API Routes
// GET /api/tickets
app.get('/api/tickets', (req, res) => {
    try {
        const db = readDb();
        res.json(db.tickets || []);
    } catch (err) {
        console.error("Error reading DB:", err);
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST /api/tickets (Create new or save list)
app.post('/api/tickets', (req, res) => {
    try {
        const db = readDb();
        const newTicket = req.body;

        // If body is an array, we assume it's a bulk/sync update (less common but supported)
        if (Array.isArray(newTicket)) {
            db.tickets = newTicket;
        } else {
            // Append single
            db.tickets.push(newTicket);
        }

        writeDb(db);
        res.json(newTicket);
    } catch (err) {
        console.error("Error writing DB:", err);
        res.status(500).json({ error: 'Failed to save ticket' });
    }
});

// PUT /api/tickets/:id (Update)
app.put('/api/tickets/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = readDb();

        const index = db.tickets.findIndex(t => t.id === id);
        if (index !== -1) {
            db.tickets[index] = { ...db.tickets[index], ...updates };
            writeDb(db);
            res.json(db.tickets[index]);
        } else {
            res.status(404).json({ error: 'Ticket not found' });
        }
    } catch (err) {
        console.error("Error updating DB:", err);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Ensure DB exists on start
    readDb();
});
