
const XLSX = require('xlsx');
const filePath = '/Users/tranvuhamy/Downloads/PHIẾU CTVT/2025.03.24-File_Mau_Cau_Hinh_Don_Gia_San_Pham_danalog -PKDVan Tai update - gửi Đức.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    console.log("All Sheet Names:", workbook.SheetNames);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read raw data
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Print first 5 rows to see where headers are
    // Print rows 100-130
    for (let i = 100; i <= 130; i++) {
        if (data[i]) console.log(`--- Row ${i} ---`, data[i]);
    }

} catch (error) {
    console.error("Error reading file:", error.message);
}
