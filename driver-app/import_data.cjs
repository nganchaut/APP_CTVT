
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'd:\\Downloads\\[Thực tập] Phiếu công tác vận tải\\2023.03.31- Bảng ke xe van chuyen_CS Vận tải - external.xlsx';
const workbook = XLSX.readFile(filePath);

const sheetNames = workbook.SheetNames.slice(0, 2); // First 2 sheets
const allTickets = [];

// Mock Customers for random assignment
const customerIds = ['cust_qzy', 'cust_steinweg', 'cust_vantuong', 'cust_ast', 'cust_phunggiaphat', 'cust_hyosung', 'cust_xidadong'];

function generateUsername(fullName) {
    // Nguyen Van Han -> hannv
    // NGUYỄN VĂN SỸ -> synv
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return fullName.toLowerCase();

    const firstName = parts[parts.length - 1].toLowerCase(); // Han
    const surnameInitial = parts[0][0].toLowerCase(); // n
    const middleInitial = parts.length > 2 ? parts[1][0].toLowerCase() : ''; // v

    // Handle diacritics removal (approximate)
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

    return normalize(firstName + surnameInitial + middleInitial);
}

function parseDate(dateStr) {
    // dd/MM/yyyy
    if (!dateStr) return new Date().toISOString().split('T')[0];
    if (typeof dateStr === 'number') {
        const d = XLSX.SSF.parse_date_code(dateStr);
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return new Date().toISOString().split('T')[0];
}

sheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    // Hardcode Row access based on debug dump
    // Row 0: [null, "PHIẾU CÔNG TÁC VẬN TẢI"]
    // Row 1: ["Tên lái xe: NGUYỄN VĂN SỸ", null, ...]
    // Row 2: ["Biển số xe: 43C-112.02/51R-145.45"]

    let driverName = "";
    let licensePlate = "";

    // Permissive Search for "BKS" row
    for (let i = 0; i < 5; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        const txt = String(row[0]).trim();

        if (txt.includes('BKS')) {
            // Format: "Tháng 03/2023 - BKS 43C 112.02 - Phan văn Hải"
            // Split by '-'
            const parts = txt.split('-');

            // Assume Name is the LAST part
            const possibleName = parts[parts.length - 1].trim();
            if (possibleName && possibleName.length > 2) {
                driverName = possibleName;
            }

            // Assume Plate is part containing BKS
            const platePart = parts.find(p => p.includes('BKS'));
            if (platePart) {
                // " BKS 43C 112.02" or " BKS 43C 11394"
                // standardized to just the matches for \d{2}[A-Z]... ?
                // For now, just strip "BKS"
                licensePlate = platePart.replace(/BKS/gi, '').trim();
            }
        }
    }

    if (!driverName) {
        console.warn(`Warning: Could not extract driver name from sheet ${sheetName}`);
        console.warn(`DUMP First 3 rows:`);
        console.warn(JSON.stringify(data.slice(0, 3)));
        driverName = `Unknown_${sheetName}`;
    }

    const username = generateUsername(driverName);

    // 3. Data Rows start at index 4
    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[1]) continue; // Skip empty rows or rows without date

        // Map fields
        // [0: STT, 1: Ngày, 2: Container, 3: Type, 4: SL, 5: N/X, 6: Route, 7: Phi, 8: Luu ca, 9: Thuong dau, 10: Phat dau, 11: Note, 12: Total]

        const dateStr = row[1];
        const containerNo = row[2] || "Unknown";
        const containerSize = row[3] || "40";
        const routeName = row[6] || "Không xác định";
        const notes = row[11] || "";

        const parsedDate = parseDate(dateStr);

        // Random Customer
        const randomCustId = customerIds[Math.floor(Math.random() * customerIds.length)];

        const ticket = {
            id: `imported_${username}_${i}_${Date.now()}`,
            startDate: parsedDate,
            endDate: parsedDate, // Assume same day
            licensePlate: licensePlate,
            customerId: randomCustId,
            customerName: "Khách hàng (Imported)", // Should lookup but simple for now
            routeId: 'r_imported',
            route: routeName,
            containerNo: String(containerNo),
            containerSize: String(containerSize),
            containerType: 'F', // Default
            tripCount: 1,
            overnightStay: false,
            overnightNights: 0,
            notes: notes,
            status: 'approved', // Past data
            statusText: 'Đã duyệt',
            createdBy: username,
            vehicleId: licensePlate,
            createdAt: new Date().toISOString(),
            approvedDate: new Date().toISOString()
        };

        allTickets.push(ticket);
    }

    console.log(`Processed sheet ${sheetName}: Driver ${driverName} (${username}), ${allTickets.length} tickets total so far.`);
});

fs.writeFileSync('c:/Users/HP/.gemini/antigravity/scratch/driver-app/imported_tickets.json', JSON.stringify(allTickets, null, 2));
console.log('Done. Data saved to imported_tickets.json');
