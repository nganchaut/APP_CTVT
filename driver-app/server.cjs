
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');
const DATA_DIR = path.join(__dirname, 'src', 'data');
const SEED_FILE = path.join(DATA_DIR, 'seedTickets.json');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(async () => {
            console.log('Connected to MongoDB');
            isMongoConnected = true;

            // Auto-Seed: If Mongo is empty, load from db.json
            try {
                const count = await Ticket.countDocuments();
                if (count === 0 && fs.existsSync(DB_FILE)) {
                    console.log('MongoDB is empty. Seeding from db.json...');
                    const localData = JSON.parse(fs.readFileSync(DB_FILE));
                    const tickets = localData.tickets || [];
                    if (tickets.length > 0) {
                        await Ticket.insertMany(tickets);
                        console.log(`Seeded ${tickets.length} tickets into MongoDB.`);
                    }
                }
            } catch (err) {
                console.error('Auto-seed error:', err);
            }
        })
        .catch(err => console.error('MongoDB connection error:', err));
}

// Ticket Schema for MongoDB
const TicketSchema = new mongoose.Schema({
    id: String,
    startDate: String,
    endDate: String,
    licensePlate: String,
    customerId: String,
    customerName: String,
    routeId: String,
    route: String,
    containerNo: String,
    containerSize: String,
    containerType: String,
    tripCount: Number,
    overnightStay: Boolean,
    overnightNights: Number,
    notes: String,
    status: String,
    statusText: String,
    createdBy: String,
    vehicleId: String,
    createdAt: String,
    approvedDate: String,
    revenue: Number,
    driverSalary: Number
}, {
    timestamps: true
});

const Ticket = mongoose.model('Ticket', TicketSchema);


app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
    res.send('Backend Server is Running correctly!');
});

// Helper to read DB (Abstracted)
async function getAllTickets() {
    if (isMongoConnected) {
        return await Ticket.find({}).lean();
    } else {
        // Local File Fallback
        if (!fs.existsSync(DB_FILE)) {
            const seedData = fs.existsSync(SEED_FILE) ? JSON.parse(fs.readFileSync(SEED_FILE)) : [];
            const initialDb = { tickets: seedData };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
            return initialDb.tickets || [];
        }
        const data = JSON.parse(fs.readFileSync(DB_FILE));
        return data.tickets || [];
    }
}

async function saveNewTicket(ticketData) {
    if (isMongoConnected) {
        // Handle array (bulk) or single object
        if (Array.isArray(ticketData)) {
            // This is a full sync/overwrite usually. Use with caution.
            // For simplicity in this app's context, we might delete all and insert? 
            // Or just insertMany? The frontend sends a full list sometimes? 
            // Looking at api.ts: saveTickets sends a LIST.
            // BE CAREFUL: api.saveTickets sends the ENTIRE list to overwrite the DB in the file version.
            // For Mongo, dropping and recreating is inefficient but mimics the file behavior correctly for now.
            await Ticket.deleteMany({});
            return await Ticket.insertMany(ticketData);
        } else {
            const ticket = new Ticket(ticketData);
            return await ticket.save();
        }
    } else {
        const db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : { tickets: [] };
        if (Array.isArray(ticketData)) {
            db.tickets = ticketData;
        } else {
            db.tickets.push(ticketData);
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        return ticketData;
    }
}

async function updateSingleTicket(id, updates) {
    if (isMongoConnected) {
        return await Ticket.findOneAndUpdate({ id: id }, updates, { new: true });
    } else {
        const db = JSON.parse(fs.readFileSync(DB_FILE));
        const index = db.tickets.findIndex(t => t.id === id);
        if (index !== -1) {
            db.tickets[index] = { ...db.tickets[index], ...updates };
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
            return db.tickets[index];
        }
        return null;
    }
}


// API Routes
// GET /api/tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const tickets = await getAllTickets();
        res.json(tickets);
    } catch (err) {
        console.error("Error reading DB:", err);
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// POST /api/tickets (Create new or save list)
app.post('/api/tickets', async (req, res) => {
    try {
        const newTicket = req.body;
        const saved = await saveNewTicket(newTicket);
        res.json(saved);
    } catch (err) {
        console.error("Error writing DB:", err);
        res.status(500).json({ error: 'Failed to save ticket' });
    }
});

// PUT /api/tickets/:id (Update)
app.put('/api/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await updateSingleTicket(id, updates);

        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Ticket not found' });
        }
    } catch (err) {
        console.error("Error updating DB:", err);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Ensure DB exists on start if local
    if (!isMongoConnected && !fs.existsSync(DB_FILE)) {
        // Trigger read to create file
        getAllTickets();
    }
});
