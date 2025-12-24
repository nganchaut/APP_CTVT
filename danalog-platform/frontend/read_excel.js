
import * as XLSX from 'xlsx';

const filePath = '/Users/tranvuhamy/Downloads/PHIẾU CTVT/2025.03.24-File_Mau_Cau_Hinh_Don_Gia_San_Pham_danalog -PKDVan Tai update - gửi Đức.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read raw data
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("Headers (Row 1):", data[0]);
    console.log("Headers (Row 2):", data[1]);
    console.log("Headers (Row 3):", data[2]);
    console.log("First 3 rows of data:");
    console.log(data.slice(3, 6));

} catch (error) {
    console.error("Error reading file:", error.message);
}
