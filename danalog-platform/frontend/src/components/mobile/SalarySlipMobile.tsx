import React, { useState, useMemo } from 'react';
import { Calendar, ChevronRight, ArrowLeft, User, Truck, FileText, ChevronDown } from 'lucide-react';
import { TransportTicket, RouteConfig } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SalarySlipMobileProps {
    tickets: TransportTicket[];
    notifications?: any[];
    routeConfigs: RouteConfig[];
}

export const SalarySlipMobile: React.FC<SalarySlipMobileProps> = ({ tickets, notifications, routeConfigs }) => {
    const { user } = useAuth();
    console.log('Notifications count:', notifications?.length || 0);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('vi-VN') + ' đ';
    };

    // Filter tickets for the current user
    const userTickets = useMemo(() => {
        if (!user) return [];
        return tickets.filter(t => t.createdBy === user.username || t.driverName === user.name);
    }, [tickets, user]);

    // Calculate totals for a month
    const calculateMonthSalary = (monthStr: string) => {
        const monthTickets = userTickets.filter(t => {
            const d = t.dateEnd || t.dateStart;
            return d && d.startsWith(monthStr) && t.status === 'APPROVED';
        });

        const routeGrouping: Record<string, { name: string; count: number; price: number; total: number }> = {};
        let totalOvernight = 0;
        const overnightDetails: { name: string; quantity: number; price: number; total: number }[] = [];

        monthTickets.forEach(t => {
            // Group by route
            const routeName = t.route;
            if (!routeGrouping[routeName]) {
                routeGrouping[routeName] = {
                    name: routeName,
                    count: 0,
                    price: t.driverPrice || Math.round((t.driverSalary || 0) / (t.trips || 1)),
                    total: 0
                };
            }
            routeGrouping[routeName].count += (t.trips || 1);
            routeGrouping[routeName].total += (t.driverSalary || 0);

            if (t.nightStay) {
                // FIX: Enhanced location detection to match DriverSalaryTable logic
                let location = t.nightStayLocation;
                if (!location) {
                    const routeConfig = routeConfigs.find(rc => rc.routeName === t.route);
                    location = routeConfig?.nightStayLocation || 'OUTER_CITY';
                }

                // Find config for pricing
                const isInnerCity = (location === 'INNER_CITY' || location === 'IN_CITY');
                const nightConfigId = isInnerCity ? 'RT-NIGHT-02' : 'RT-NIGHT-01';

                const nightConfig = routeConfigs.find(rc => rc.id === nightConfigId);
                const price = nightConfig?.salary.driverSalary || 0;

                const dailyTotal = (t.nightStayDays || 1) * price;
                totalOvernight += dailyTotal;

                // FIX: Label logic must match the detected location
                const label = isInnerCity ? 'Lưu đêm (Trong TP)' : 'Lưu đêm (Ngoài TP)';
                const existing = overnightDetails.find(d => d.name === label);
                if (existing) {
                    existing.quantity += (t.nightStayDays || 1);
                    existing.total += dailyTotal;
                } else {
                    overnightDetails.push({ name: label, quantity: (t.nightStayDays || 1), price, total: dailyTotal });
                }
            }
        });

        const grandTotal = Object.values(routeGrouping).reduce((sum, item) => sum + item.total, 0) + totalOvernight;

        return {
            month: monthStr,
            tripCount: monthTickets.length,
            routeDetails: Object.values(routeGrouping),
            overnightDetails,
            grandTotal
        };
    };

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        userTickets.forEach(t => {
            if (t.status === 'APPROVED') {
                const d = t.dateEnd || t.dateStart;
                if (d) months.add(d.slice(0, 7));
            }
        });

        let list = Array.from(months).sort().reverse();
        if (filterYear) list = list.filter(m => m.startsWith(filterYear));
        if (filterMonth) list = list.filter(m => m.endsWith(`-${filterMonth.padStart(2, '0')}`));
        return list;
    }, [userTickets, filterYear, filterMonth]);

    if (viewMode === 'list') {
        return (
            <div className="space-y-6 pb-10 animate-slide-up">
                <header>
                    <h2 className="text-2xl font-bold text-slate-800">Bảng Lương</h2>
                    <p className="text-slate-500 text-sm">Phiếu lương đã được công ty gửi</p>

                    <div className="mt-6 bg-slate-50 rounded-2xl p-1.5 flex items-center justify-between relative border border-slate-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer">
                        <div className="flex items-center gap-3 px-3">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {filterYear && filterMonth ? `Tháng ${filterMonth}/${filterYear}` : 'Chọn tháng lương'}
                                </p>
                            </div>
                        </div>
                        <div className="pr-3 text-slate-400">
                            <ChevronDown size={20} />
                        </div>

                        <input
                            type="month"
                            value={filterMonth && filterYear ? `${filterYear}-${filterMonth.padStart(2, '0')}` : ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                    setFilterYear(val.split('-')[0]);
                                    setFilterMonth(val.split('-')[1]);
                                } else {
                                    setFilterMonth('');
                                }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </header>

                <div className="space-y-3">
                    {availableMonths.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                            <FileText className="mx-auto mb-3 opacity-20" size={48} />
                            <p className="text-sm font-medium">Chưa có phiếu lương nào được gửi.</p>
                        </div>
                    ) : (
                        availableMonths.map(month => {
                            const data = calculateMonthSalary(month);
                            return (
                                <div key={month} onClick={() => { setSelectedMonth(month); setViewMode('detail'); }} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center active:bg-slate-50 transition-colors gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm truncate">Tháng {month.split('-').reverse().join('/')}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                            <p className="text-blue-600 font-bold text-sm">{formatMoney(data.grandTotal)}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{data.tripCount} chuyến</p>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    const salaryData = calculateMonthSalary(selectedMonth!);

    return (
        <div className="space-y-4 pb-10 animate-slide-up">
            <header className="flex items-center gap-3">
                <button onClick={() => setViewMode('list')} className="p-2 -ml-2 text-slate-400">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Lương Tháng {selectedMonth!.split('-').reverse().join('/')}</h2>
            </header>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 border-dashed">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-slate-400">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tài xế</p>
                            <p className="text-xs font-bold text-slate-700">{user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-slate-400">
                            <Truck size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Biển số</p>
                            <p className="text-xs font-bold text-slate-700">{userTickets[0]?.licensePlate || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="text-center pb-4 border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng thực lĩnh</p>
                    <h1 className="text-2xl font-black text-blue-600 tracking-tight">
                        {formatMoney(salaryData.grandTotal)}
                    </h1>
                </div>

                <div className="mt-6 space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Chi tiết chạy xe</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-2 py-2 rounded-l-lg">Tuyến</th>
                                        <th className="px-1 py-2 text-center">SLC</th>
                                        <th className="px-1 py-2 text-right">Đơn giá</th>
                                        <th className="px-2 py-2 text-right rounded-r-lg">Tổng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {salaryData.routeDetails.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-2 py-2 font-medium text-slate-700">{item.name}</td>
                                            <td className="px-1 py-2 text-center font-bold text-slate-500">{item.count}</td>
                                            <td className="px-1 py-2 text-right text-slate-500">{item.price.toLocaleString()}</td>
                                            <td className="px-2 py-2 text-right font-bold text-slate-800">{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {salaryData.routeDetails.length === 0 && (
                                        <tr><td colSpan={4} className="py-8 text-center text-slate-300 italic">Không có dữ liệu</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {salaryData.overnightDetails.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phụ cấp lưu đêm</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-2 py-2 rounded-l-lg">Loại</th>
                                            <th className="px-1 py-2 text-center">Đêm</th>
                                            <th className="px-1 py-2 text-right">Đơn giá</th>
                                            <th className="px-2 py-2 text-right rounded-r-lg">Tổng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {salaryData.overnightDetails.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-2 py-2 font-medium text-slate-700">{item.name}</td>
                                                <td className="px-1 py-2 text-center font-bold text-slate-500">{item.quantity}</td>
                                                <td className="px-1 py-2 text-right text-slate-500">{item.price.toLocaleString()}</td>
                                                <td className="px-2 py-2 text-right font-bold text-slate-800">{item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
