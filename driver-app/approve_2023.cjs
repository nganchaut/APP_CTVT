const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

function approve2023Tickets() {
    if (!fs.existsSync(DB_FILE)) {
        console.error('db.json not found!');
        process.exit(1);
    }

    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    let updatedCount = 0;

    if (db.tickets && Array.isArray(db.tickets)) {
        db.tickets.forEach(ticket => {
            // Check if startDate is in 2023
            if (ticket.startDate && ticket.startDate.includes('2023')) {
                // Mark as approved if not already
                if (ticket.status !== 'approved') {
                    ticket.status = 'approved';
                    ticket.statusText = 'Đã duyệt';
                    ticket.approvedDate = new Date().toISOString();
                    ticket.approvedBy = 'system_migration';
                    updatedCount++;
                }
            }
        });
    }

    if (updatedCount > 0) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        console.log(`Successfully approved ${updatedCount} tickets from 2023.`);
    } else {
        console.log('No tickets from 2023 needed approval.');
    }
}

approve2023Tickets();
