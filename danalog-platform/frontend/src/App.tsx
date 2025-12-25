import { useState, useEffect } from 'react'
import { api } from './services/api'
import { Settings, LogOut, ChevronDown, ChevronRight, Users, Map as MapIcon } from 'lucide-react'
import { TicketList } from './components/TicketList'
import { DriverRevenueTable } from './components/DriverRevenueTable'
import { CustomerRevenueTable } from './components/CustomerRevenueTable'
import { RouteConfigList } from './components/RouteConfigList'
import { DriverSalaryTable } from './components/DriverSalaryTable'
import { LoginPage } from './components/LoginPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MOCK_TICKETS, MOCK_ROUTES_CONFIG } from './types'
import { MobileDriverDashboard } from './components/mobile/MobileDriverDashboard'


type TabType = 'dashboard' | 'cs_check' | 'revenue_driver' | 'revenue_customer' | 'salary' | 'route_config' | 'settings';

function AppContent() {
    const { user, logout, isAuthenticated } = useAuth();
    // Default tab based on role
    const getInitialTab = (): TabType => {
        return 'cs_check';
    };
    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab())

    // State for expanding menus
    const [isCSOpen, setIsCSOpen] = useState(true);
    const [isRevenueOpen, setIsRevenueOpen] = useState(true);
    const [isDriverOpen, setIsDriverOpen] = useState(true);

    // State for Tickets & Configs (Persistence disabled as per user request)
    // State for Tickets & Configs (Persisted to localStorage)
    const [tickets, setTickets] = useState<any[]>([]);

    // Fetch tickets on mount
    useEffect(() => {
        const fetchTickets = async () => {
            const data = await api.getTickets();
            if (data && data.length > 0) {
                setTickets(data);
            } else {
                setTickets(MOCK_TICKETS); // Fallback if API fails or empty
            }
        };
        fetchTickets();
    }, []);

    const [routeConfigs, setRouteConfigs] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('danalog_route_configs');
            return saved ? JSON.parse(saved) : MOCK_ROUTES_CONFIG;
        } catch (e) {
            console.error("Failed to parse route configs", e);
            return MOCK_ROUTES_CONFIG;
        }
    });

    // Persist changes
    // Removed localStorage effect for tickets
    // useEffect(() => {
    //     localStorage.setItem('danalog_tickets', JSON.stringify(tickets));
    // }, [tickets]);

    useEffect(() => {
        localStorage.setItem('danalog_route_configs', JSON.stringify(routeConfigs));
    }, [routeConfigs]);

    // Notifications for Drivers
    const [notifications, setNotifications] = useState<any[]>([]);

    const handleNotifyDriver = (driverUsername: string, message: string) => {
        setNotifications(prev => [...prev, {
            id: Date.now(),
            to: driverUsername,
            message,
            timestamp: new Date().toLocaleTimeString(),
            read: false
        }]);
    };


    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Role-based Layout Switching: STRICT ISOLATION

    const handleUpdateTickets = async (updatedTickets: any[]) => {
        setTickets(updatedTickets);
        await api.saveTickets(updatedTickets);
    };

    const handleUpdateSingleTicket = async (updatedTicket: any) => {
        // Optimistic update
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        try {
            await api.updateTicket(updatedTicket.id, updatedTicket);
        } catch (error) {
            console.error("Failed to update ticket", error);
            alert("Lỗi cập nhật phiếu. Vui lòng thử lại.");
            // Revert could be added here if needed
        }
    };

    const handleCreateTicket = async (newTicket: any) => {
        // Optimistic update
        setTickets(prev => [newTicket, ...prev]);
        try {
            await api.createTicket(newTicket);
        } catch (error) {
            console.error("Failed to create ticket", error);
            // Rollback if needed, but for MVP keep it simple or show alert
            alert("Lỗi lưu phiếu. Vui lòng kiểm tra kết nối mạng.");
        }
    };

    if (user?.role === 'DRIVER') {
        return (
            <div className="bg-slate-900 min-h-screen flex justify-center">
                <MobileDriverDashboard
                    tickets={tickets}
                    onUpdateTickets={handleUpdateTickets}
                    onCreateTicket={handleCreateTicket}
                    routeConfigs={routeConfigs}
                    notifications={notifications}
                />
            </div>
        );
    }

    const handleNotifySalary = (driverUsername: string) => {
        handleNotifyDriver(driverUsername, 'Phiếu lương của bạn đã được phê duyệt và gửi đi.');
        alert(`Đã gửi thông báo lương cho lái xe ${driverUsername}`);
    };

    const handleUpdateRouteConfigs = (updatedConfigs: any[]) => {
        setRouteConfigs(updatedConfigs);

        // Cascade Update: Update all existing tickets to reflect new prices/salaries
        const configMap = new Map(updatedConfigs.map((c: any) => [c.routeName, c]));

        const updatedTickets = tickets.map(ticket => {
            const config = configMap.get(ticket.route);
            if (!config) return ticket; // No matching config, keep as is

            // Recalculate Revenue
            let newRevenue = 0;
            const size = ticket.size || '20';
            const fe = ticket.fe || 'F';
            const { revenue, salary } = config;

            if (size === '20') {
                newRevenue = fe === 'F' ? revenue.price20F : revenue.price20E;
            } else if (size === '40') {
                newRevenue = fe === 'F' ? revenue.price40F : revenue.price40E;
            } else {
                // Fallback
                newRevenue = fe === 'F' ? revenue.price40F : revenue.price40E;
            }

            // Recalculate Salary
            const newDriverSalary = salary.driverSalary || 0;

            // Only update if values changed to avoid unnecessary re-renders (though map creates new array anyway)
            if (ticket.revenue !== newRevenue || ticket.driverSalary !== newDriverSalary) {
                return {
                    ...ticket,
                    revenue: newRevenue,
                    driverSalary: newDriverSalary
                };
            }
            return ticket;
        });

        setTickets(updatedTickets);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'cs_check':
                return <TicketList tickets={tickets} onUpdateTickets={handleUpdateTickets} onUpdateTicket={handleUpdateSingleTicket} routeConfigs={routeConfigs} currentUser={user} />;
            case 'revenue_driver':
                return <DriverRevenueTable tickets={tickets} />;
            case 'revenue_customer':
                return <CustomerRevenueTable tickets={tickets} />;
            case 'salary':
                return <DriverSalaryTable tickets={tickets} routeConfigs={routeConfigs} onNotifySalary={handleNotifySalary} />;
            case 'route_config':
                return <RouteConfigList configs={routeConfigs} onUpdateConfigs={handleUpdateRouteConfigs} />;
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Phiếu Chờ Duyệt" value="12" subtext="Cập nhật 5 phút trước" color="blue" />
                        <StatCard label="Doanh Thu Tháng" value="1.2 Tỷ" subtext="+15% so với tháng trước" color="green" />
                        <StatCard label="Chuyến Xe Chạy" value="145" subtext="Đang hoạt động" color="orange" />
                    </div>
                );
        }
    };

    const getHeaderTitle = () => {
        switch (activeTab) {
            case 'cs_check': return 'CS Kiểm Tra / Phê Duyệt Phiếu';
            case 'revenue_driver': return 'Bảng Kê Doanh Thu (Lái Xe)';
            case 'revenue_customer': return 'Bảng Kê Doanh Thu (Khách Hàng)';
            case 'salary': return 'Quản Lý Lương Lái Xe';
            case 'route_config': return 'Cấu Hình Tuyến Đường & Định Mức';
            case 'settings': return 'Cài Đặt';
            default: return 'Dashboard';
        }
    }

    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-[#1e293b] text-slate-300 flex flex-col shadow-xl shrink-0">
                <div className="p-5 bg-[#0f172a]">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Kinh Doanh Vận Tải</h2>
                    <div className="flex items-center justify-between text-white font-semibold cursor-pointer">
                        <span>PHIẾU CÔNG TÁC VẬN TẢI</span>
                        <ChevronDown size={16} />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-2">
                    {/* Driver Features - Removed */}

                    {/* Lái xe - Hidden for CS & Driver */}
                    {isAdmin && (
                        <div
                            className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-3"
                            onClick={() => setIsDriverOpen(!isDriverOpen)}
                        >
                            <Users size={18} />
                            <span>Lái xe</span>
                        </div>
                    )}

                    {/* CS Group - Hidden for Driver */}
                    <div>
                        <div
                            className="px-4 py-2 hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-3 text-white"
                            onClick={() => setIsCSOpen(!isCSOpen)}
                        >
                            <span className="font-bold flex-1">CS</span>
                            {isCSOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>

                        {isCSOpen && (
                            <div className="bg-[#0f172a]/50 pb-2">
                                {/* CS Kiểm tra */}
                                <NavItem
                                    label="CS kiểm tra"
                                    active={activeTab === 'cs_check'}
                                    onClick={() => setActiveTab('cs_check')}
                                    indent
                                />

                                {/* Revenue Group */}
                                <div>
                                    <div
                                        className="px-4 py-2 pl-12 hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                                        onClick={() => setIsRevenueOpen(!isRevenueOpen)}
                                    >
                                        <span>Bảng kê Doanh thu vận tải</span>
                                        {isRevenueOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>

                                    {isRevenueOpen && (
                                        <div className="mt-1 space-y-1">
                                            <NavItem
                                                label="Bảng kê theo lái xe"
                                                active={activeTab === 'revenue_driver'}
                                                onClick={() => setActiveTab('revenue_driver')}
                                                indentDouble
                                            />
                                            <NavItem
                                                label="Bảng kê theo khách hàng"
                                                active={activeTab === 'revenue_customer'}
                                                onClick={() => setActiveTab('revenue_customer')}
                                                indentDouble
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Salary - Visible for Admin & CS (Driver has separate link above) */}
                    <div>
                        <NavItem
                            label="Bảng kê Lương"
                            active={activeTab === 'salary'}
                            onClick={() => setActiveTab('salary')}
                            indent
                        />
                    </div>

                    {/* Route Configuration - Admin Only */}
                    {isAdmin && (
                        <div className="mt-2">
                            <NavItem
                                label="Cấu hình Tuyến"
                                icon={<MapIcon size={18} />}
                                active={activeTab === 'route_config'}
                                onClick={() => setActiveTab('route_config')}
                            />
                        </div>
                    )}

                    {/* Settings - Admin Only */}
                    {isAdmin && (
                        <div className="mt-4 border-t border-slate-700 pt-4">
                            <NavItem
                                label="Cài đặt"
                                icon={<Settings size={18} />}
                                active={activeTab === 'settings'}
                                onClick={() => setActiveTab('settings')}
                            />
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800">
                        {getHeaderTitle()}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt={user?.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{user?.name}</p>
                            <p className="text-xs text-slate-500">
                                {user?.role === 'ADMIN' ? 'System Administrator' : user?.role === 'CS' ? 'CS Staff' : 'User'}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}

function NavItem({ label, active, onClick, indent, indentDouble, icon }: any) {
    return (
        <div
            onClick={onClick}
            className={`
        relative cursor-pointer select-none transition-all py-2 pr-4 flex items-center gap-3
        ${indent ? 'pl-10' : indentDouble ? 'pl-14' : 'pl-4'}
        ${active
                    ? 'bg-white text-blue-600 font-bold rounded-r-full mr-2 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
      `}
        >
            {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
            )}
            {icon}
            <span>{label}</span>
        </div>
    )
}

function StatCard({ label, value, subtext, color }: any) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
    }
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{value}</h3>
            <p className={`text-xs inline-block px-2 py-1 rounded-full font-medium ${colors[color as keyof typeof colors]}`}>{subtext}</p>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App
