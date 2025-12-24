
const XLSX = require('xlsx');

const filePath = 'd:\\Downloads\\[Thực tập] Phiếu công tác vận tải\\2023.03.31- Bảng ke xe van chuyen_CS Vận tải - external.xlsx';
const workbook = XLSX.readFile(filePath);

const sheetNames = workbook.SheetNames;
console.log('Sheets:', sheetNames);

// Read first sheet
const firstSheetName = sheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log(`--- First 5 rows of sheet "${firstSheetName}" ---`);
console.log(JSON.stringify(data.slice(0, 10), null, 2));

// Read second sheet
if (sheetNames.length > 1) {
    const secondSheetName = sheetNames[1];
    const worksheet2 = workbook.Sheets[secondSheetName];
    const data2 = XLSX.utils.sheet_to_json(worksheet2, { header: 1, defval: null });
    console.log(`--- First 5 rows of sheet "${secondSheetName}" ---`);
    console.log(JSON.stringify(data2.slice(0, 10), null, 2));
}
