import { useState, useMemo } from 'react';
import { TransportTicket } from '../types';
import { History, Edit3, CheckCircle, User, Filter, ArrowRight, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { isWithinInterval, parseISO, isSameMonth, format } from 'date-fns';
import { TicketModal } from './TicketModal';
import { HistoryModal } from './HistoryModal';

import { RouteConfig } from '../types';

export function TicketList({ tickets, onUpdateTickets, routeConfigs, currentUser }: { tickets: TransportTicket[], onUpdateTickets: (t: TransportTicket[]) => void, routeConfigs: RouteConfig[], currentUser?: any }) {
    const [editingTicket, setEditingTicket] = useState<TransportTicket | null>(null);
    const [viewingHistoryTicket, setViewingHistoryTicket] = useState<TransportTicket | null>(null);

    // Filter State
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        driver: '',
        status: '',
        month: ''
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const uniqueDrivers = useMemo(() => {
        const drivers = new Set(tickets.map(t => t.driverName).filter(Boolean));
        return Array.from(drivers);
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // Date Range
            if (filters.fromDate && filters.toDate) {
                const start = parseISO(filters.fromDate);
                const end = parseISO(filters.toDate);
                const ticketDate = parseISO(ticket.dateEnd);
                if (!isWithinInterval(ticketDate, { start, end })) return false;
            }

            // Driver
            if (filters.driver && filters.driver !== 'Tất cả') {
                if (ticket.driverName !== filters.driver) return false;
            }

            // Status
            if (filters.status && filters.status !== 'Tất cả') {
                const statusMap: Record<string, string> = {
                    'Chờ duyệt': 'PENDING',
                    'Đã duyệt': 'APPROVED'
                };
                if (ticket.status !== statusMap[filters.status]) return false;
            }

            // Month
            if (filters.month) {
                const filterDate = parseISO(filters.month + '-01'); // yyyy-MM
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


    const handleApprove = (id: string) => {
        const ticket = tickets.find(t => t.id === id);
        if (!ticket) return;

        const initialApprovedLog = {
            status: 'Đã duyệt',
            timestamp: format(new Date(), 'HH:mm dd/MM/yy'),
            user: currentUser?.name || currentUser?.username || 'CS',
            action: 'Phê duyệt phiếu'
        };

        const intermediateTicket: TransportTicket = {
            ...ticket,
            status: 'APPROVED',
            statusHistory: [initialApprovedLog, ...(ticket.statusHistory || [])]
        };

        onUpdateTickets(tickets.map(t => t.id === id ? intermediateTicket : t));
    };

    const handleEdit = (ticket: TransportTicket) => {
        setEditingTicket(ticket);
    };

    const handleSaveTicket = (updatedTicket: TransportTicket) => {
        const editLog = {
            status: 'Đã chỉnh sửa',
            timestamp: format(new Date(), 'HH:mm dd/MM/yy'),
            user: currentUser?.name || currentUser?.username || 'CS',
            action: 'Cập nhật thông tin phiếu'
        };

        const finalTicket = {
            ...updatedTicket,
            statusHistory: [editLog, ...(updatedTicket.statusHistory || [])]
        };

        onUpdateTickets(tickets.map(t => t.id === finalTicket.id ? finalTicket : t));
        setEditingTicket(null);
    };

    // Pagination (Mock UI Only)
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE);
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="space-y-6 font-sans">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Kinh Doanh Vận Tải</h2>

            {/* Filter Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-6">
                    <Filter size={20} className="text-blue-600" />
                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Bộ Lọc Tìm Kiếm</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Status Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</label>
                        <div className="relative">
                            <select
                                value={filters.status}
                                onChange={e => handleFilterChange('status', e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
                            >
                                <option>Tất cả</option>
                                <option>Chờ duyệt</option>
                                <option>Đã duyệt</option>
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Driver Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lái xe</label>
                        <div className="relative">
                            <select
                                value={filters.driver}
                                onChange={e => handleFilterChange('driver', e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer hover:bg-slate-100"
                            >
                                <option>Tất cả</option>
                                {uniqueDrivers.map((driver, idx) => (
                                    <option key={idx} value={driver}>{driver}</option>
                                ))}
                            </select>
                            <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Ngày Vận Chuyển</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Khách hàng</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Ph. Án / Tuyến</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Container No.</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Ảnh Container</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Size</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">F/E</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Doanh thu</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Lưu đêm</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs w-24 text-center">Trạng Thái</th>

                                {/* Sticky Action Column */}
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs sticky right-0 bg-white z-10 text-center w-32 shadow-[-5px_0px_10px_rgba(0,0,0,0.02)]">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedTickets.map((ticket, index) => (
                                <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-center text-slate-400 font-medium">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{ticket.dateStart ? format(new Date(ticket.dateStart), 'dd/MM/yy') : '-'}</span>
                                            {ticket.dateEnd !== ticket.dateStart && (
                                                <span className="text-xs text-slate-400">→ {format(new Date(ticket.dateEnd), 'dd/MM')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{ticket.customerCode}</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate" title={ticket.route}>
                                        <div className="font-medium text-slate-700">{ticket.route}</div>
                                        {ticket.fe === 'E' && <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wide">Bốc rỗng</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50 rounded px-2">{ticket.containerNo}</td>
                                    <td className="px-6 py-4 text-center">
                                        {ticket.imageUrl ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 mx-auto group/img relative">
                                                <img
                                                    src={ticket.imageUrl}
                                                    alt="Container"
                                                    className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-300">
                                                <ImageIcon size={16} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">{ticket.size}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${ticket.fe === 'F' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                            {ticket.fe}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                        {(ticket.revenue || 0).toLocaleString()} ₫
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-600">
                                        {ticket.nightStay ? (ticket.nightStayDays || 'Có') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {ticket.status === 'APPROVED' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Đã duyệt
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                Chờ duyệt
                                            </span>
                                        )}
                                    </td>

                                    {/* Sticky Action Cell */}
                                    <td className="px-6 py-4 sticky right-0 bg-white z-10 shadow-[-5px_0px_10px_rgba(0,0,0,0.02)] text-center transition-colors">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewingHistoryTicket(ticket)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all"
                                                title="Lịch sử"
                                            >
                                                <History size={18} />
                                            </button>

                                            {ticket.status !== 'APPROVED' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(ticket)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-full transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(ticket.id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-full transition-all"
                                                        title="Phê duyệt"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
                    <div className="font-medium">
                        Hiển thị <span className="text-slate-900 font-bold">{paginatedTickets.length}</span> / <span className="text-slate-900 font-bold">{filteredTickets.length}</span> phiếu
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <span className="font-medium text-slate-700">Trang {currentPage} / {totalPages || 1}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <TicketModal
                isOpen={!!editingTicket}
                ticket={editingTicket}
                onClose={() => setEditingTicket(null)}
                onSave={handleSaveTicket}
                routeConfigs={routeConfigs}
            />

            <HistoryModal
                isOpen={!!viewingHistoryTicket}
                ticket={viewingHistoryTicket}
                onClose={() => setViewingHistoryTicket(null)}
            />
        </div>
    );
}

