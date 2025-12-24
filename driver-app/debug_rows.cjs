
const XLSX = require('xlsx');

const filePath = 'd:\\Downloads\\[Thực tập] Phiếu công tác vận tải\\2023.03.31- Bảng ke xe van chuyen_CS Vận tải - external.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0]; // First sheet
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('--- First 10 Rows Raw Dump ---');
for (let i = 0; i < 10; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
}
