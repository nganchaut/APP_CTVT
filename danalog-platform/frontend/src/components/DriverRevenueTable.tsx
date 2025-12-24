import { useState, useMemo } from 'react';
import { TransportTicket } from '../types';
import * as XLSX from 'xlsx';
import { format, isWithinInterval, parseISO, isSameMonth } from 'date-fns';
import { Filter, User, Download } from 'lucide-react';

export function DriverRevenueTable({ tickets }: { tickets: TransportTicket[] }) {
    const [filters, setFilters] = useState({
        driver: '',
        month: '',
        fromDate: '',
        toDate: ''
    });

    const uniqueDrivers = useMemo(() => {
        const drivers = new Set(tickets.map(t => t.driverName).filter((d): d is string => !!d));
        return Array.from(drivers);
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            if (ticket.status !== 'APPROVED') return false;

            // Driver
            if (filters.driver && filters.driver !== 'Tất cả') {
                if (ticket.driverName !== filters.driver) return false;
            }

            // Month
            if (filters.month) {
                const filterDate = parseISO(filters.month + '-01');
                const ticketDate = parseISO(ticket.dateEnd);
                if (!isSameMonth(filterDate, ticketDate)) return false;
            }

            // Date Range
            if (filters.fromDate && filters.toDate) {
                const start = parseISO(filters.fromDate);
                const end = parseISO(filters.toDate);
                const ticketDate = parseISO(ticket.dateEnd);
                if (!isWithinInterval(ticketDate, { start, end })) return false;
            }

            return true;
        }).sort((a, b) => {
            const dateA = new Date(a.dateEnd || a.dateStart).getTime();
            const dateB = new Date(b.dateEnd || b.dateStart).getTime();
            return dateB - dateA;
        });
    }, [tickets, filters]);

    const totals = useMemo(() => {
        return filteredTickets.reduce((acc, ticket) => ({
            trips: acc.trips + ticket.trips,
            revenue: acc.revenue + ticket.revenue,
            nightStay: acc.nightStay + (ticket.nightStayDays || (ticket.nightStay ? 1 : 0))
        }), { trips: 0, revenue: 0, nightStay: 0 });
    }, [filteredTickets]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const exportDriverSheet = () => {
        if (filteredTickets.length === 0) return;

        // Group by Driver
        const ticketsByDriver: Record<string, TransportTicket[]> = {};
        filteredTickets.forEach(t => {
            const d = t.driverName || 'Unknown';
            if (!ticketsByDriver[d]) ticketsByDriver[d] = [];
            ticketsByDriver[d].push(t);
        });

        const wb = XLSX.utils.book_new();

        Object.keys(ticketsByDriver).forEach(driverName => {
            const driverTickets = ticketsByDriver[driverName];

            // Map data
            const rows = driverTickets.map((t, idx) => ({
                'STT': idx + 1,
                'Ngày': format(new Date(t.dateStart), 'dd/MM/yy'),
                'Container No.': t.containerNo,
                'Size': t.size,
                'S/C': t.trips || 1,
                'F/E': t.fe,
                'Tuyến đường': t.route,
                'Tổng doanh thu': t.revenue,
                'Dthu vận chuyển (chưa VAT)': t.revenue,
                'Lưu đêm': t.nightStay ? (t.nightStayDays || 1) : '',
                'Ghi chú': t.notes || ''
            }));

            // Totals for this driver
            const totalRevenue = driverTickets.reduce((sum, t) => sum + t.revenue, 0);
            const totalNightStay = driverTickets.reduce((sum, t) => sum + (t.nightStayDays || (t.nightStay ? 1 : 0)), 0);

            const ws = XLSX.utils.json_to_sheet(rows);

            // Add totals row
            XLSX.utils.sheet_add_json(ws, [{
                'STT': 'TỔNG',
                'Tổng doanh thu': totalRevenue,
                'Dthu vận chuyển (chưa VAT)': totalRevenue,
                'Lưu đêm': totalNightStay
            }], { skipHeader: true, origin: -1 } as any);

            // Set col widths
            ws['!cols'] = [
                { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 8 },
                { wch: 10 }, { wch: 8 }, { wch: 30 },
                { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, driverName || 'Sheet1');
        });

        XLSX.writeFile(wb, `BangKe_LaiXe_${format(new Date(), 'ddMMyy')}.xlsx`);
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bảng Kê Doanh Thu Lái Xe</h2>
                <button
                    onClick={exportDriverSheet}
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
                    {/* Driver Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lái xe</label>
                        <div className="relative">
                            <select
                                value={filters.driver}
                                onChange={e => handleFilterChange('driver', e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
                            >
                                <option value="">Tất cả</option>
                                {uniqueDrivers.map(d => (
                                    <option key={d} value={d}>{d}</option>
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

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs w-16 text-center">STT</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Ngày</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Container No.</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Size</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">S/C</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">F/E</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Tuyến đường</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Tổng doanh thu</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Dthu vận chuyển</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Lưu đêm</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket, index) => (
                                    <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-center text-slate-400 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4 text-slate-600">{format(new Date(ticket.dateStart), 'dd/MM/yy')}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{ticket.containerNo}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{ticket.size}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{ticket.trips || 1}</td>
                                        <td className={`px-6 py-4 text-center font-bold ${ticket.fe === 'F' ? 'text-blue-600' : 'text-orange-600'}`}>{ticket.fe}</td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={ticket.route}>{ticket.route}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">{ticket.revenue?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">{ticket.revenue?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            {ticket.nightStay && (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-700 font-bold text-xs ring-1 ring-purple-100">
                                                    {ticket.nightStayDays || 1}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 italic text-xs max-w-[12rem] truncate">
                                            {ticket.notes}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-slate-400 italic">
                                        Không có dữ liệu phù hợp
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-700">
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-right uppercase text-xs tracking-wider">Tổng cộng</td>
                                <td className="px-6 py-4 text-right text-emerald-600">{totals.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-emerald-600">{totals.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center text-purple-700">{totals.nightStay}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
