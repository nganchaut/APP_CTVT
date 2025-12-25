import { useState, useMemo } from 'react';
import { TransportTicket, RouteConfig } from '../types';
import XLSX from 'xlsx-js-style';
import { Calendar, Bell, ChevronRight, Search, FileSpreadsheet, User } from 'lucide-react';

interface DriverSalaryTableProps {
    tickets: TransportTicket[];
    routeConfigs: RouteConfig[];
    onNotifySalary?: (driverUsername: string) => void;
}

interface SalaryItem {
    id: string; // Composite key
    cargoName: string; // "V/c cont", "Lưu đêm"...
    content: string; // Route Name
    unit: string; // "chuyến", "đêm"
    quantity: number;
    unitPrice: number;
    total: number;
    note: string;
}

interface DriversalarySheet {
    driverName: string;
    items: SalaryItem[];
    totalQuantity: number;
    totalSalary: number;
    month: number;
    year: number;
    trips: number;
}
export function DriverSalaryTable({ tickets, routeConfigs, onNotifySalary }: DriverSalaryTableProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');
    const [expandedDrivers, setExpandedDrivers] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // 1. Filter Tickets by Status (APPROVED) and Date (Month/Year)
    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            if (t.status !== 'APPROVED') return false;
            const date = new Date(t.dateEnd);
            // Filter by Driver if selected (or enforced by Role)
            if (selectedDriver && t.driverName !== selectedDriver) return false;

            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
    }, [tickets, selectedMonth, selectedYear, selectedDriver]);

    // Get unique drivers from the filtered tickets (or all tickets if desired, but contextual usage suggests relevant drivers)
    const uniqueDrivers = useMemo(() => {
        const drivers = new Set(filteredTickets.map(t => t.driverName).filter((d): d is string => !!d));
        return Array.from(drivers).sort();
    }, [filteredTickets]);

    // 2. Aggregate Data per Driver
    const salarySheets = useMemo(() => {
        const sheets: DriversalarySheet[] = [];
        const driverMap: Record<string, TransportTicket[]> = {};

        // Group by Driver first
        filteredTickets.forEach(t => {
            const name = t.driverName || 'Unknown';
            if (!driverMap[name]) driverMap[name] = [];
            driverMap[name].push(t);
        });

        // Process each driver's tickets into Aggegrated Lines
        Object.keys(driverMap).forEach(driverName => {
            const driverTickets = driverMap[driverName];
            const itemMap: Record<string, SalaryItem> = {};

            driverTickets.forEach(t => {
                // 1. PRIMARY ITEM (The Transport Trip)
                // Logic to deduce "Cargo Name" and "Unit" from Ticket Data
                let cargoName = "V/c cont";
                let unit = "chuyến";

                const routeName = t.route || '';
                const routeLower = routeName.toLowerCase();

                if (routeLower.includes("lưu đêm")) {
                    cargoName = "Lưu đêm";
                    unit = "đêm";
                } else if (routeLower.includes("trung chuyển") || routeLower.includes("tr/c")) {
                    cargoName = "Tr/c cont";
                }

                // If ticket is purely an overnight ticket (manual), use it as is.
                // But typically, nightStay is an add-on.

                const key = `${t.route}-${t.driverSalary}-${cargoName}`;

                if (!itemMap[key]) {
                    itemMap[key] = {
                        id: key,
                        cargoName,
                        content: t.route,
                        unit,
                        quantity: 0,
                        unitPrice: t.driverSalary || 0,
                        total: 0,
                        note: ""
                    };
                }

                itemMap[key].quantity += 1;
                itemMap[key].total += (t.driverSalary || 0);

                // 2. NIGHT STAY ADD-ON (if applicable)
                if (t.nightStay && t.nightStayDays && t.nightStayDays > 0) {
                    // Check if this is NOT already a manual "Lưu đêm" route
                    if (!routeLower.includes("lưu đêm")) {
                        // FIX: Prioritize the location saved on the ticket. 
                        // Only look up RouteConfig if ticket doesn't specify location.
                        let location = t.nightStayLocation;

                        if (!location) {
                            const routeConfig = routeConfigs.find(rc => rc.routeName === t.route);
                            location = routeConfig?.nightStayLocation || 'OUTER_CITY';
                        }

                        // Find the appropriate Night Config
                        const nightConfigId = (location === 'INNER_CITY' || location === 'IN_CITY') ? 'RT-NIGHT-02' : 'RT-NIGHT-01';
                        // Handle potential casing mismatch or legacy values

                        const nightConfig = routeConfigs.find(rc => rc.id === nightConfigId);

                        if (nightConfig) {
                            const nightPrice = nightConfig.salary.driverSalary;
                            const nightKey = `NIGHT-${location}-${nightPrice}`;

                            if (!itemMap[nightKey]) {
                                itemMap[nightKey] = {
                                    id: nightKey,
                                    cargoName: 'Lưu đêm',
                                    content: nightConfig.routeName,
                                    unit: 'đêm',
                                    quantity: 0,
                                    unitPrice: nightPrice,
                                    total: 0,
                                    note: ""
                                };
                            }

                            itemMap[nightKey].quantity += t.nightStayDays;
                            itemMap[nightKey].total += (t.nightStayDays * nightPrice);
                        }
                    }
                }
            });

            const items = Object.values(itemMap);
            // Sort items by Cargo Name for better readability
            items.sort((a, b) => a.cargoName.localeCompare(b.cargoName));

            const totalSalary = items.reduce((sum, item) => sum + item.total, 0);
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

            sheets.push({
                driverName,
                items,
                totalQuantity,
                totalSalary,
                month: selectedMonth,
                year: selectedYear,
                trips: driverTickets.length
            });
        });

        // Filter by Search Term and Selected Driver
        return sheets.filter(s => {
            const matchesSearch = s.driverName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDriver = selectedDriver ? s.driverName === selectedDriver : true;
            return matchesSearch && matchesDriver;
        });
    }, [filteredTickets, searchTerm, selectedDriver, selectedMonth, selectedYear]);

    // Toggle Expand
    const toggleExpand = (driverName: string) => {
        setExpandedDrivers(prev =>
            prev.includes(driverName) ? prev.filter(n => n !== driverName) : [...prev, driverName]
        );
    };

    // Bulk Export Logic
    const handleBulkExport = () => {
        setIsExporting(true);
        try {
            const wb = XLSX.utils.book_new();

            salarySheets.forEach(sheet => {
                // Find ALL License Plates from tickets for this driver
                const driverPlates = tickets
                    .filter(t => t.driverName === sheet.driverName && t.licensePlate && t.licensePlate.trim() !== '')
                    .map(t => t.licensePlate?.trim())
                    .filter((plate): plate is string => !!plate);

                // Deduplicate plates
                const uniquePlates = Array.from(new Set(driverPlates));
                const plate = uniquePlates.length > 0 ? uniquePlates.join(', ') : '';

                // Header Information
                // Note: Standard 'xlsx' may allow 's' (style) on some builds, or we define it for compatibility.
                const centerStyle = { alignment: { horizontal: 'center', vertical: 'center' }, font: { bold: true } };

                // Row 1: Title (Merged A1:H1) - Centered
                const row1 = [
                    { v: 'BẢNG TỔNG HỢP THANH TOÁN LƯƠNG', t: 's', s: centerStyle },
                    '', '', '', '', '', '', ''
                ];

                // Row 2: Period (Merged A2:H2) - Centered
                const row2 = [
                    { v: `Kỳ thanh toán: ${sheet.month}/${sheet.year}`, t: 's', s: centerStyle },
                    '', '', '', '', '', '', ''
                ];

                // Row 3: Name (Merged A3:D3) & Plate (Merged E3:H3)
                // User requested "Họ và tên canh giữa" (Name centered).
                const row3 = [
                    { v: `Họ và tên: ${sheet.driverName}`, t: 's', s: centerStyle },
                    '', '', '',
                    { v: `Biển kiểm soát: ${plate}`, t: 's', s: centerStyle },
                    '', '', ''
                ];

                const headerRows = [row1, row2, row3, ['', '', '', '', '', '', ''], ['', '', '', '', '', '', '']];

                // Table Data
                const tableData = sheet.items.map((item, index) => ({
                    'STT': index + 1,
                    'Tên hàng': item.cargoName,
                    'Nội dung': item.content,
                    'ĐVT': item.unit,
                    'Số lượng': item.quantity,
                    'Đơn giá tiền lương': item.unitPrice,
                    'Tổng lương': item.total,
                    'Ghi chú': item.note
                }));

                // Total Row
                const totalRow = {
                    'STT': '', 'Tên hàng': 'Cộng', 'Nội dung': '', 'ĐVT': '',
                    'Số lượng': sheet.totalQuantity,
                    'Đơn giá tiền lương': '',
                    'Tổng lương': sheet.totalSalary,
                    'Ghi chú': ''
                };

                const ws = XLSX.utils.json_to_sheet([]);

                // Add Headers
                XLSX.utils.sheet_add_aoa(ws, headerRows, { origin: 'A1' });

                // Add Data starting at A6
                XLSX.utils.sheet_add_json(ws, tableData, { origin: 'A6' });

                // Add Total Row
                XLSX.utils.sheet_add_json(ws, [totalRow], { origin: -1, skipHeader: true });

                // Cell Merges
                ws['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title: A1-H1
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Period: A2-H2
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Name: A3-D3
                    { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } }  // Plate: E3-H3
                ];

                // Column Widths
                ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

                // Safe Sheet Name
                const sheetName = sheet.driverName.replace(/[\\/?*[\]]/g, '').slice(0, 30);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });

            XLSX.writeFile(wb, `Bang_Ke_Luong_Thang_${selectedMonth}_${selectedYear}.xlsx`);

            setTimeout(() => {
                alert(`Đã xuất bảng lương cho ${salarySheets.length} lái xe.`);
            }, 500);

        } catch (error) {
            console.error(error);
            alert('Lỗi xuất file');
        } finally {
            setIsExporting(false);
        }
    };

    const handleNotifyDriver = (driverName: string) => {
        // Attempt to find username based on driverName. 
        // In a real app, this mapping would be better handled.
        // For now, let's derive it or just pass the name.
        const driverTicket = tickets.find(t => t.driverName === driverName);
        if (driverTicket?.createdBy && onNotifySalary) {
            onNotifySalary(driverTicket.createdBy);
        } else {
            alert(`Đã gửi thông báo lương (Email & SMS) cho lái xe: ${driverName}`);
        }
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Bảng Kê Lương Lái Xe</h2>
                    <p className="text-slate-500 mt-1">Tổng hợp và đối soát lương theo tháng.</p>
                </div>
                <button
                    onClick={handleBulkExport}
                    disabled={isExporting || salarySheets.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileSpreadsheet size={20} />}
                    Xuất Bảng Kê (Excel)
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400 mr-4 border-r border-slate-200 pr-4">
                    <Calendar size={20} />
                    <span className="font-bold text-xs uppercase">Kỳ thanh toán</span>
                </div>

                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 cursor-pointer"
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Tháng {m}</option>
                    ))}
                </select>

                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 cursor-pointer"
                >
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                </select>

                <div className="relative">
                    <select
                        value={selectedDriver}
                        onChange={e => setSelectedDriver(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 cursor-pointer appearance-none min-w-[150px]"
                    >
                        <option value="">Tất cả lái xe</option>
                        {uniqueDrivers.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="ml-auto relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm tên lái xe..."
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {salarySheets.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <Calendar size={48} className="mb-4 opacity-20" />
                        <p>Không có dữ liệu lương cho tháng {selectedMonth}/{selectedYear}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {salarySheets.map(sheet => (
                            <div key={sheet.driverName} className="group">
                                {/* Driver Header Row */}
                                <div
                                    onClick={() => toggleExpand(sheet.driverName)}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-1 rounded-full text-slate-400 transition-transform duration-200 ${expandedDrivers.includes(sheet.driverName) ? 'rotate-90 text-blue-600' : ''}`}>
                                            <ChevronRight size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base">{sheet.driverName}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{sheet.trips} phiếu • {sheet.totalQuantity} chuyến/đêm</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="block text-2xl font-bold text-emerald-600">
                                                {sheet.totalSalary.toLocaleString()} <span className="text-sm font-medium text-slate-400">đ</span>
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNotifyDriver(sheet.driverName);
                                            }}
                                            className="p-2 text-slate-400 hover:text-blue-600 rounded-full"
                                            title="Gửi thông báo lương"
                                        >
                                            <Bell size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Aggregated Detail Table */}
                                {expandedDrivers.includes(sheet.driverName) && (
                                    <div className="bg-white border-t border-slate-100 p-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 border-r border-slate-200">STT</th>
                                                        <th className="px-4 py-3 border-r border-slate-200">Tên hàng</th>
                                                        <th className="px-4 py-3 border-r border-slate-200 w-1/3">Nội dung</th>
                                                        <th className="px-4 py-3 border-r border-slate-200 text-center">ĐVT</th>
                                                        <th className="px-4 py-3 border-r border-slate-200 text-center">Số lượng</th>
                                                        <th className="px-4 py-3 border-r border-slate-200 text-right">Đơn giá tiền lương</th>
                                                        <th className="px-4 py-3 border-r border-slate-200 text-right">Tổng lương</th>
                                                        <th className="px-4 py-3">Ghi chú</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {sheet.items.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-center text-slate-500 border-r border-slate-200">{index + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-200">{item.cargoName}</td>
                                                            <td className="px-4 py-3 text-slate-600 border-r border-slate-200">{item.content}</td>
                                                            <td className="px-4 py-3 text-center text-slate-500 border-r border-slate-200">{item.unit}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-slate-700 border-r border-slate-200">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-200">{item.unitPrice.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-emerald-600 border-r border-slate-200">{item.total.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-slate-500 italic">{item.note}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50 font-bold text-slate-800">
                                                        <td className="px-4 py-3 text-center border-r border-slate-200"></td>
                                                        <td className="px-4 py-3 border-r border-slate-200">Cộng</td>
                                                        <td className="px-4 py-3 border-r border-slate-200"></td>
                                                        <td className="px-4 py-3 border-r border-slate-200"></td>
                                                        <td className="px-4 py-3 text-center border-r border-slate-200">{sheet.totalQuantity}</td>
                                                        <td className="px-4 py-3 text-right border-r border-slate-200"></td>
                                                        <td className="px-4 py-3 text-right text-emerald-700 border-r border-slate-200">{sheet.totalSalary.toLocaleString()}</td>
                                                        <td className="px-4 py-3"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
