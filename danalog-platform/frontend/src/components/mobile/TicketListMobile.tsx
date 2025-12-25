import React, { useState, useMemo } from 'react';
import { Clock, CheckCircle, FileText, ChevronRight, Edit, Calendar, PlusCircle, ChevronDown } from 'lucide-react';
import { TransportTicket } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { CreateTicketMobile } from './CreateTicketMobile';

interface TicketListMobileProps {
    tickets: TransportTicket[];
    onUpdateTickets: (tickets: any[]) => void;
    routeConfigs: any[];
    onCreateNew: () => void;
}

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-start py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
        <span className="text-xs text-slate-400 font-medium shrink-0 pt-0.5">{label}</span>
        <span className="text-xs text-slate-700 font-bold text-right flex-1 ml-4 break-words">{value}</span>
    </div>
);

const FilterBtn: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${active
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-500 border-slate-100'
            }`}
    >
        {label}
    </button>
);

export const TicketListMobile: React.FC<TicketListMobileProps> = ({ tickets = [], onUpdateTickets, routeConfigs, onCreateNew }) => {
    const { user } = useAuth();

    const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED'>('ALL');
    const [filterTime, setFilterTime] = useState<'month' | 'range'>('range');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [viewingTicket, setViewingTicket] = useState<TransportTicket | null>(null);

    // Filter Logic matching driver-app
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // User Filter
            if (user && ticket.createdBy !== user.username) return false;

            // Status Filter
            if (filterStatus === 'DRAFT' && ticket.status !== 'DRAFT') return false;
            if (filterStatus === 'PENDING' && ticket.status !== 'PENDING') return false;
            if (filterStatus === 'APPROVED' && ticket.status !== 'APPROVED') return false;

            // Time Filter
            const tDate = ticket.dateEnd || ticket.dateStart;
            const ticketDate = new Date(tDate);

            if (filterTime === 'month') {
                return tDate && tDate.startsWith(selectedMonth);
            } else if (filterTime === 'range') {
                if (dateRange.start && ticketDate < new Date(dateRange.start)) return false;
                if (dateRange.end && ticketDate > new Date(dateRange.end)) return false;
            }
            return true;
        }).sort((a, b) => {
            const dateA = new Date(a.dateEnd || a.dateStart).getTime();
            const dateB = new Date(b.dateEnd || b.dateStart).getTime();
            return dateB - dateA;
        });
    }, [tickets, user, filterStatus, filterTime, selectedMonth, dateRange]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        // dd/mm/yy
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'APPROVED': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={14} />, label: 'Đã duyệt' };
            case 'DRAFT': return { color: 'text-slate-500', bg: 'bg-slate-100', icon: <FileText size={14} />, label: 'Bản nháp' };
            case 'PENDING': return { color: 'text-orange-600', bg: 'bg-orange-50', icon: <Clock size={14} />, label: 'Chưa duyệt' };
            default: return { color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock size={14} />, label: 'Chờ duyệt' };
        }
    };

    if (viewingTicket) {
        if (viewingTicket.status === 'DRAFT') {
            return (
                <div className="fixed inset-0 z-[60] bg-white overflow-y-auto p-4">
                    <button onClick={() => setViewingTicket(null)} className="absolute top-4 right-4 z-[70] p-2 text-slate-400">
                        <PlusCircle className="rotate-45" size={24} />
                    </button>
                    <CreateTicketMobile
                        tickets={tickets}
                        onUpdateTickets={onUpdateTickets}
                        routeConfigs={routeConfigs}
                        onComplete={() => setViewingTicket(null)}
                        ticketToEdit={viewingTicket}
                    />
                </div>
            );
        }

        return (

            <div className="absolute inset-0 z-[60] flex flex-col bg-white animate-slide-up overflow-hidden w-full h-full">
                <header className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setViewingTicket(null)} className="p-1">
                            <PlusCircle className="rotate-45" size={24} />
                        </button>
                        <h2 className="font-bold text-sm">Chi tiết phiếu vận chuyển</h2>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusInfo(viewingTicket.status).bg} ${getStatusInfo(viewingTicket.status).color}`}>
                        {getStatusInfo(viewingTicket.status).label}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar overscroll-contain bg-white">
                    <div className="flex justify-between items-start mb-6 gap-2">
                        <h3 className="text-xl font-bold text-slate-800 break-words flex-1">{viewingTicket.route}</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusInfo(viewingTicket.status).bg} ${getStatusInfo(viewingTicket.status).color} shrink-0`}>
                            {getStatusInfo(viewingTicket.status).label}
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <DetailRow label="Ngày bắt đầu" value={formatDate(viewingTicket.dateStart)} />
                        <DetailRow label="Ngày kết thúc" value={formatDate(viewingTicket.dateEnd || viewingTicket.dateStart)} />
                        <DetailRow label="Khách hàng" value={viewingTicket.customerCode} />
                        <DetailRow label="Biển số" value={viewingTicket.licensePlate} />
                        <DetailRow label="Tuyến đường" value={viewingTicket.route} />
                        <DetailRow label="Container No." value={`${viewingTicket.containerNo} (${viewingTicket.size}')`} />
                        <DetailRow label="Số chuyến" value={viewingTicket.trips?.toString() || '1'} />
                        <DetailRow label="F/E" value={viewingTicket.fe === 'E' ? 'Empty' : 'Full'} />
                        <DetailRow
                            label="Lưu đêm"
                            value={viewingTicket.nightStay
                                ? `${viewingTicket.nightStayDays} đêm (${viewingTicket.nightStayLocation === 'INNER_CITY' ? 'Trong TP' : 'Ngoài TP'})`
                                : 'Không'}
                        />

                        <div className="mt-6">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ghi chú</label>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                                {viewingTicket.notes || 'Không có ghi chú'}
                            </div>
                        </div>

                        {viewingTicket.imageUrl && (
                            <div className="mt-6">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ảnh container</label>
                                <img src={viewingTicket.imageUrl} alt="Container" className="w-full h-auto object-cover rounded-xl border border-slate-200" />
                            </div>
                        )}

                        {viewingTicket.onChainStatus === 'VERIFIED' && (
                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-3">Xác minh On-Chain (Blockchain)</label>
                                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                                        <CheckCircle size={16} />
                                        <span className="text-xs font-bold">Chứng thực bởi Monad Network</span>
                                    </div>
                                    <p className="text-[8px] font-mono text-blue-400 break-all bg-white/50 p-2 rounded">
                                        TX: {viewingTicket.onChainHash}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
                    <button
                        onClick={() => setViewingTicket(null)}
                        className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl active:bg-slate-900 transition-all text-sm uppercase tracking-wide"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-10 animate-slide-up">
            <header className="flex justify-between items-center px-1">
                <h2 className="text-xl font-bold text-slate-800">Danh sách phiếu</h2>
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm shadow-blue-200 active:scale-95 transition-all"
                >
                    <PlusCircle size={16} /> Tạo mới
                </button>
            </header>

            {/* Filter Controls - Exactly like driver-app */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <FilterBtn label="Tất cả" active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')} />
                    <FilterBtn label="Bản nháp" active={filterStatus === 'DRAFT'} onClick={() => setFilterStatus('DRAFT')} />
                    <FilterBtn label="Chưa duyệt" active={filterStatus === 'PENDING'} onClick={() => setFilterStatus('PENDING')} />
                    <FilterBtn label="Đã duyệt" active={filterStatus === 'APPROVED'} onClick={() => setFilterStatus('APPROVED')} />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2 relative">
                        <Calendar size={16} className="text-blue-600 shrink-0" />
                        <select
                            value={filterTime}
                            onChange={(e) => setFilterTime(e.target.value as any)}
                            className="appearance-none bg-transparent text-xs font-bold text-slate-700 outline-none pr-4 relative z-10 cursor-pointer py-1"
                        >
                            <option value="range">Khoảng thời gian</option>
                            <option value="month">Theo Tháng</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 z-0 pointer-events-none" />
                    </div>

                    {filterTime === 'range' ? (
                        <div className="flex items-center gap-2 flex-1 justify-end ml-auto">
                            <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-slate-50 rounded-lg px-2 py-1.5 text-[10px] font-bold border-none outline-none w-24 text-center text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-mono" />
                            <span className="text-slate-300 font-bold">-</span>
                            <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-slate-50 rounded-lg px-2 py-1.5 text-[10px] font-bold border-none outline-none w-24 text-center text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-mono" />
                        </div>
                    ) : (
                        <div className="relative ml-auto">
                            <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors px-3 py-1.5 rounded-lg border border-slate-100 cursor-pointer">
                                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                    {selectedMonth ? `Tháng ${selectedMonth.split('-')[1]}/${selectedMonth.split('-')[0]}` : 'Chọn tháng'}
                                </span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </div>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3">
                {filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => {
                        const status = getStatusInfo(ticket.status);
                        return (
                            <div
                                key={ticket.id}
                                onClick={() => setViewingTicket(ticket)}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 line-clamp-1 text-sm">{ticket.route}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{ticket.customerCode}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                            <span className="text-[10px] text-slate-400 font-bold">{ticket.licensePlate}</span>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.color} shrink-0`}>
                                        {status.icon}
                                        {status.label}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Thời gian</p>
                                        <p className="text-[11px] font-bold text-slate-600">
                                            {ticket.dateEnd ? formatDate(ticket.dateEnd) : formatDate(ticket.dateStart)}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Container</p>
                                        <p className="text-[11px] font-bold text-slate-600">
                                            {ticket.containerNo} ({ticket.size}')
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {ticket.status === 'DRAFT' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); /* edit logic */ }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
                                            >
                                                <Edit size={14} /> Sửa
                                            </button>
                                        )}
                                        {ticket.nightStay && (
                                            <div className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold">LƯU ĐÊM</div>
                                        )}
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300" />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 space-y-3">
                        <FileText size={48} opacity={0.3} />
                        <p className="text-sm font-medium">Không tìm thấy phiếu nào</p>
                    </div>
                )}
            </div>

        </div>
    );
};


