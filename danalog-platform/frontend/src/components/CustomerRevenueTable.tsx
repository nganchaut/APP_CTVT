import { useState, useMemo } from 'react';
import { TransportTicket } from '../types';
import { Download, Filter, User } from 'lucide-react';
import { format, parseISO, isSameMonth, isWithinInterval } from 'date-fns';
import * as XLSX from 'xlsx';

export function CustomerRevenueTable({ tickets }: { tickets: TransportTicket[] }) {
    const [filters, setFilters] = useState({
        customer: '',
        fromDate: '',
        toDate: '',
        month: ''
    });

    const uniqueCustomers = useMemo(() => {
        const approvedTickets = tickets.filter(t => t.status === 'APPROVED');
        const customers = new Set(approvedTickets.map(t => t.customerCode).filter(Boolean));
        return Array.from(customers).sort();
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // Must be APPROVED
            if (ticket.status !== 'APPROVED') return false;

            // Customer Filter
            if (filters.customer && filters.customer !== 'Tất cả') {
                if (ticket.customerCode !== filters.customer) return false;
            }

            // Date Range
            if (filters.fromDate && filters.toDate) {
                const start = parseISO(filters.fromDate);
                const end = parseISO(filters.toDate);
                const ticketDate = parseISO(ticket.dateEnd);
                if (!isWithinInterval(ticketDate, { start, end })) return false;
            }

            // Month Filter
            if (filters.month) {
                const filterDate = parseISO(filters.month + '-01');
                const ticketDate = parseISO(ticket.dateEnd);
                if (!isSameMonth(filterDate, ticketDate)) return false;
            }

            return true;
        }).sort((a, b) => {
            const dateA = new Date(a.dateEnd || a.dateStart).getTime();
            const dateB = new Date(b.dateEnd || b.dateStart).getTime();
            return dateB - dateA;
        });
    }, [tickets, filters]);

    // Totals
    const totals = useMemo(() => {
        return filteredTickets.reduce((acc, ticket) => ({
            trips: acc.trips + (ticket.trips || 0),
            revenue: acc.revenue + (ticket.revenue || 0) + (ticket.liftOnFee || 0) + (ticket.liftOffFee || 0) + (ticket.airportFee || 0),
            nightStay: acc.nightStay + (ticket.nightStayDays || (ticket.nightStay ? 1 : 0))
        }), { trips: 0, revenue: 0, nightStay: 0 });
    }, [filteredTickets]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = () => {
        // Validation removed to allow export of whatever is filtered
        if (filteredTickets.length === 0) {
            alert("Không có dữ liệu để xuất!");
            return;
        }

        if (filters.customer && filters.customer !== 'Tất cả') {
            exportCustomerSheet(filters.customer, filteredTickets);
        } else {
            // Bulk Export
            uniqueCustomers.forEach(customer => {
                const customerTickets = filteredTickets.filter(t => t.customerCode === customer);
                if (customerTickets.length > 0) {
                    exportCustomerSheet(customer, customerTickets);
                }
            });
            alert("Đã bắt đầu tải xuống các file báo cáo.");
        }
    };

    const exportCustomerSheet = (customerName: string, data: TransportTicket[]) => {
        // Headers
        const header1 = [
            "STT", "Khách hàng", "Ngày Vận Chuyển", "Số Bill Nhập", "Số cont:", "BKS:", "Số lượng", "", "",
            "Tuyến đường Vận chuyển", "Đơn giá (VND/chuyến)", "Cước VC",
            "Nâng Full tại Cảng Đà Nẵng (mức 1)", "Hạ rỗng tại Đà Nẵng", "Phí lấy hàng ở sân bay",
            "Thành Tiền", "Lưu đêm", "Ghi chú"
        ];
        const header2 = [
            "", "", "", "", "", "", "20", "40", "40R0",
            "", "", "",
            "", "", "",
            "", "", ""
        ];

        // Data
        const rows = data.map((t, idx) => {
            const unitPrice = t.revenue || 0;
            const size20 = t.size === '20' ? 1 : '';
            const size40 = t.size === '40' ? 1 : '';
            const size40R0 = t.size === '40R0' ? 1 : '';

            return [
                idx + 1,
                t.customerCode,
                format(new Date(t.dateStart), 'dd/MM/yy'),
                "", // Bill No
                t.containerNo,
                t.licensePlate || "",
                size20,
                size40,
                size40R0,
                t.route,
                unitPrice,
                t.revenue,
                "", // Nâng Full
                "", // Hạ Rỗng
                "", // Phí lấy hàng
                t.revenue,
                t.nightStayDays ? t.nightStayDays : (t.nightStay ? 1 : ''),
                t.notes || ""
            ];
        });

        // Totals
        const totalTrips20 = data.reduce((sum, t) => sum + (t.size === '20' ? 1 : 0), 0);
        const totalTrips40 = data.reduce((sum, t) => sum + (t.size === '40' ? 1 : 0), 0);
        const totalTrips40R0 = data.reduce((sum, t) => sum + (t.size === '40R0' ? 1 : 0), 0);
        const totalRevenue = data.reduce((sum, t) => sum + (t.revenue || 0), 0);
        const totalNightStay = data.reduce((sum, t) => sum + (t.nightStayDays || (t.nightStay ? 1 : 0)), 0);

        const totalRow = [
            "TỔNG CỘNG", "", "", "", "", "", totalTrips20, totalTrips40, totalTrips40R0,
            "", "", totalRevenue,
            0, 0, 0,
            totalRevenue, totalNightStay, ""
        ];

        const wsData = [header1, header2, ...rows, totalRow];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Merges
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // STT
            { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Khách hàng
            { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Ngày
            { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Bill
            { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // Cont
            { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // BKS
            { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, // Số lượng (3 cols)
            { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // Tuyến đường
            { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // Đơn giá
            { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } }, // Cước VC
            { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } }, // Nâng Full
            { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } }, // Hạ Rỗng
            { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } }, // Phí lấy hàng
            { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } }, // Thành Tiền
            { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } }, // Lưu đêm
            { s: { r: 0, c: 17 }, e: { r: 1, c: 17 } }, // Ghi chú
            { s: { r: rows.length + 2, c: 0 }, e: { r: rows.length + 2, c: 5 } } // TỔNG CỘNG
        ];

        // Col Widths
        ws['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
            { wch: 4 }, { wch: 4 }, { wch: 4 }, // Sizes
            { wch: 25 }, { wch: 12 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 15 }, { wch: 8 }, { wch: 20 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `BangKe_KH_${customerName}_${format(new Date(), 'ddMMyy')}.xlsx`);
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bảng Kê Doanh Thu Khách Hàng</h2>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-all transform active:scale-95"
                >
                    <Download size={18} />
                    Xuất Excel
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-6">
                    <Filter size={20} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Bộ Lọc Thống Kê</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Customer Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Khách hàng</label>
                        <div className="relative">
                            <select
                                value={filters.customer}
                                onChange={e => handleFilterChange('customer', e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
                            >
                                <option value="">Tất cả</option>
                                {uniqueCustomers.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Month Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tháng</label>
                        <div className="relative">
                            <input
                                type="month"
                                value={filters.month}
                                onChange={e => handleFilterChange('month', e.target.value)}
                                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-100 block"
                            />
                        </div>
                    </div>

                    {/* Date Range - From */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Từ ngày</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={e => handleFilterChange('fromDate', e.target.value)}
                                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-100 block"
                            />
                        </div>
                    </div>

                    {/* Date Range - To */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Đến ngày</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={e => handleFilterChange('toDate', e.target.value)}
                                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-100 block"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white border boundary-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col relative">
                <div className="overflow-auto flex-1 w-full">
                    <table className="w-full text-sm text-left border-collapse min-w-[1600px]">
                        <thead className="text-xs uppercase bg-slate-50 sticky top-0 z-20 shadow-sm font-bold text-slate-600">
                            <tr>
                                <th rowSpan={2} className="px-4 py-3 sticky left-0 bg-slate-50 border-r border-slate-200 w-16 text-center z-30 align-middle">STT</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle w-48 text-left">Khách hàng</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle">Ngày Vận<br />Chuyển</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle">Số Bill Nhập</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle">Số cont:</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle">BKS:</th>
                                <th colSpan={3} className="px-4 py-2 border-r border-b border-slate-200 text-center bg-slate-100">Số lượng</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle w-48">Tuyến đường Vận<br />chuyển</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-right align-middle">Đơn giá<br />(VND/chuyến)</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-right align-middle">Cước VC</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-right align-middle w-24">Nâng Full tại<br />Cảng Đà Nẵng<br />(mức 1)</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-right align-middle w-24">Hạ rỗng tại<br />Đà Nẵng</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-right align-middle w-24">Phí lấy<br />hàng ở<br />sân bay</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-right align-middle text-blue-700">Thành Tiền</th>
                                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle w-20">Lưu đêm</th>
                                <th rowSpan={2} className="px-4 py-3 border-l border-slate-200 text-center align-middle">Ghi chú</th>
                            </tr>
                            <tr className="bg-slate-100">
                                <th className="px-2 py-1 border-r border-slate-200 text-center w-12">20</th>
                                <th className="px-2 py-1 border-r border-slate-200 text-center w-12">40</th>
                                <th className="px-2 py-1 border-r border-slate-200 text-center w-12">40R0</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={17} className="p-12 text-center text-slate-400 italic">
                                        Không có dữ liệu phù hợp (Chỉ hiển thị phiếu đã duyệt)
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket, index) => {
                                    const unitPrice = ticket.revenue || 0;
                                    const liftOnFee = ticket.liftOnFee || 0;
                                    const liftOffFee = ticket.liftOffFee || 0;
                                    const airportFee = ticket.airportFee || 0;


                                    return (
                                        <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-3 sticky left-0 bg-white border-r border-slate-100 font-medium text-center z-10 text-slate-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-700 w-48 truncate" title={ticket.customerCode}>{ticket.customerCode}</td>
                                            <td className="px-4 py-3 text-center text-slate-600">{format(new Date(ticket.dateStart), 'dd/MM/yy')}</td>
                                            <td className="px-4 py-3 text-center text-slate-500">-</td>
                                            <td className="px-4 py-3 font-mono text-slate-600 font-bold">{ticket.containerNo}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{ticket.licensePlate || ""}</td>

                                            <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-slate-600">{ticket.size === '20' ? '1' : ''}</td>
                                            <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-slate-600">{ticket.size === '40' ? '1' : ''}</td>
                                            <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-slate-600">{ticket.size === '40R0' ? '1' : ''}</td>

                                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={ticket.route}>{ticket.route}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{unitPrice.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-700">{ticket.revenue?.toLocaleString()}</td>

                                            <td className="px-4 py-3 text-right text-slate-600">{liftOnFee ? liftOnFee.toLocaleString() : '-'}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{liftOffFee ? liftOffFee.toLocaleString() : '-'}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{airportFee ? airportFee.toLocaleString() : '-'}</td>

                                            <td className="px-4 py-3 text-right font-bold text-blue-700"></td>
                                            <td className="px-4 py-3 text-center border-r border-slate-50">
                                                {ticket.nightStay && (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-700 font-bold text-xs ring-1 ring-purple-100">
                                                        {ticket.nightStayDays || (ticket.nightStay ? 1 : '')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 border-l border-slate-100 text-slate-400 italic text-xs truncate max-w-[12rem]">
                                                {ticket.notes}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                        {filteredTickets.length > 0 && (
                            <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200 sticky bottom-0 z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
                                <tr>
                                    <td colSpan={6} className="px-4 py-4 text-center sticky left-0 bg-slate-50 border-r border-slate-200 z-30 uppercase text-xs tracking-wider">TỔNG CỘNG</td>

                                    <td className="px-2 py-4 text-center text-blue-800">
                                        {filteredTickets.filter(t => t.size === '20').length}
                                    </td>
                                    <td className="px-2 py-4 text-center text-blue-800">
                                        {filteredTickets.filter(t => t.size === '40').length}
                                    </td>
                                    <td className="px-2 py-4 text-center text-blue-800">
                                        {filteredTickets.filter(t => t.size === '40R0').length}
                                    </td>

                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 text-right text-blue-800">{totals.revenue.toLocaleString()}</td>

                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4"></td>

                                    <td className="px-4 py-4 text-right text-blue-800"></td>
                                    <td className="px-4 py-4 text-center text-purple-700 font-bold">{totals.nightStay}</td>
                                    <td className="px-4 py-4 border-l border-slate-200"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
