const fs = require('fs');
const path = require('path');

const dbPath = 'd:/123456/driver-app/db.json';
const impPath = 'd:/123456/driver-app/imported_tickets.json';

const extractTickets = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        const tickets = Array.isArray(data) ? data : (data.tickets || []);
        return tickets.filter(t => t.createdBy === 'tiennd' || t.createdBy === 'anhnt');
    } catch (e) {
        console.error('Error reading ' + filePath, e);
        return [];
    }
};

const allTickets = [
    ...extractTickets(dbPath),
    ...extractTickets(impPath)
];

// Deduplicate by ID
const uniqueTickets = [];
const seenIds = new Set();
for (const t of allTickets) {
    if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        uniqueTickets.push(t);
    }
}

// Map to danalog-platform format
const mappedTickets = uniqueTickets.map(t => {
    // Map anhnt to anhnv
    const createdBy = t.createdBy === 'anhnt' ? 'anhnv' : t.createdBy;
    const driverName = t.createdBy === 'tiennd' ? 'Nguyễn Đức Tiên' : 'Nguyễn Văn Anh';

    // Status mapping
    let status = 'APPROVED';
    if (t.status === 'draft') status = 'DRAFT';
    if (t.status === 'sent') status = 'PENDING';
    if (t.status === 'approved') status = 'APPROVED';

    return {
        id: t.id,
        stt: parseInt(t.id.split('_')[2]) || 999,
        dateStart: t.startDate || t.date,
        dateEnd: t.endDate || t.startDate || t.date,
        licensePlate: t.licensePlate || t.vehicleId,
        driverName: driverName,
        createdBy: createdBy,
        customerCode: (t.customerId || 'UNKNOWN').replace('cust_', '').toUpperCase(),
        containerNo: t.containerNo || 'N/A',
        route: t.route || 'Unknown Route',
        size: t.containerSize || '40',
        fe: t.containerType || 'F',
        trips: t.tripCount || 1,
        revenue: t.revenue || 1200000,
        driverSalary: t.driverSalary || 450000,
        status: status,
        nightStay: !!t.overnightStay,
        nightStayDays: t.overnightNights || 0
    };
});

const output = JSON.stringify(mappedTickets, null, 2);
fs.writeFileSync('legacy_data_full.json', output);
console.log(`Extracted ${mappedTickets.length} unique tickets to legacy_data_full.json`);
