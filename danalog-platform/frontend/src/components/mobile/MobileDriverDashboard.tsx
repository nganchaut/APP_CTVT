import React, { useState } from 'react';
import { PlusCircle, List, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CreateTicketMobile } from './CreateTicketMobile';
import { TicketListMobile } from './TicketListMobile';
import { SalarySlipMobile } from './SalarySlipMobile';

type DriverTab = 'create' | 'history' | 'salary';

interface MobileDriverDashboardProps {
    tickets: any[];
    onUpdateTickets: (tickets: any[]) => void;
    onCreateTicket?: (ticket: any) => Promise<void>;
    routeConfigs: any[];
    notifications: any[];
}

export const MobileDriverDashboard: React.FC<MobileDriverDashboardProps> = ({
    tickets,
    onUpdateTickets,
    onCreateTicket,
    routeConfigs,
    notifications
}) => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<DriverTab>('create');

    const unreadCount = notifications.filter(n => n.to === user?.username && !n.read).length;

    const renderContent = () => {
        switch (activeTab) {
            case 'create':
                return <CreateTicketMobile tickets={tickets} onUpdateTickets={onUpdateTickets} onCreateTicket={onCreateTicket} routeConfigs={routeConfigs} onComplete={() => setActiveTab('history')} />;
            case 'history':
                return <TicketListMobile tickets={tickets} onUpdateTickets={onUpdateTickets} routeConfigs={routeConfigs} onCreateNew={() => setActiveTab('create')} />;
            case 'salary':
                return <SalarySlipMobile tickets={tickets} notifications={notifications} routeConfigs={routeConfigs} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex justify-center items-start">
            <div className="w-full h-[100dvh] bg-slate-50 flex flex-col overflow-hidden shadow-2xl relative">
                {/* Header */}
                <header className="bg-[#1e293b] text-white p-4 shadow-md flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                            {user?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 leading-tight">Xin chào,</p>
                            <p className="text-sm font-bold leading-tight">{user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 pb-20">
                    {renderContent()}
                </main>

                {/* Bottom Navigation */}
                <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                    <NavBtn
                        icon={<PlusCircle size={24} />}
                        label="Tạo phiếu"
                        active={activeTab === 'create'}
                        onClick={() => setActiveTab('create')}
                    />
                    <NavBtn
                        icon={<List size={24} />}
                        label="Danh sách phiếu"
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                    />
                    <NavBtn
                        icon={
                            <div className="relative">
                                <DollarSign size={24} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                        }
                        label="Lương"
                        active={activeTab === 'salary'}
                        onClick={() => setActiveTab('salary')}
                    />
                </nav>
            </div>
        </div>
    );
};

interface NavBtnProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavBtn: React.FC<NavBtnProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'
            }`}
    >
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-tight">{label}</span>
        {active && <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5"></div>}
    </button>
);
