import { useState } from 'react';
import { RouteConfig } from '../types';
import { Edit3, Trash2, Plus, Filter, Search } from 'lucide-react';
import { RouteConfigModal } from './RouteConfigModal';
import { CUSTOMERS } from '../constants';

interface RouteConfigListProps {
    configs: RouteConfig[];
    onUpdateConfigs: (configs: RouteConfig[]) => void;
}

export function RouteConfigList({ configs, onUpdateConfigs }: RouteConfigListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('ALL');
    const [filterCargoType, setFilterCargoType] = useState('ALL');
    const [editingConfig, setEditingConfig] = useState<RouteConfig | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredConfigs = configs.filter(config => {
        const matchesSearch =
            config.routeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCustomer = filterCustomer === 'ALL' || config.customer === filterCustomer;
        const matchesCargoType = filterCargoType === 'ALL' || config.cargoType === filterCargoType;
        return matchesSearch && matchesCustomer && matchesCargoType;
    });

    const uniqueCargoTypes = Array.from(new Set(configs.map(c => c.cargoType)));

    const handleSaveConfig = (newConfig: RouteConfig) => {
        if (editingConfig) {
            // Update existing
            const updated = configs.map(c => c.id === newConfig.id ? newConfig : c);
            onUpdateConfigs(updated);
            setEditingConfig(null);
        } else {
            // Create new
            onUpdateConfigs([...configs, newConfig]);
            setIsCreateModalOpen(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa cấu hình này không?')) {
            onUpdateConfigs(configs.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cấu Hình Tuyến Đường</h2>
                    <p className="text-slate-500 mt-1">Quản lý định mức doanh thu, lương và nhiên liệu cho từng tuyến.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white font-bold rounded-xl shadow-md hover:bg-blue-900 transition-all hover:shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    Thêm Tuyến Mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400 mr-4 border-r border-slate-200 pr-4">
                    <Filter size={20} />
                    <span className="font-bold text-xs uppercase">Bộ lọc</span>
                </div>

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên tuyến..."
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 cursor-pointer"
                    value={filterCustomer}
                    onChange={e => setFilterCustomer(e.target.value)}
                >
                    <option value="ALL">Tất cả Khách Hàng</option>
                    {CUSTOMERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 cursor-pointer"
                    value={filterCargoType}
                    onChange={e => setFilterCargoType(e.target.value)}
                >
                    <option value="ALL">Tất cả Loại Hàng</option>
                    {uniqueCargoTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConfigs.map(config => (
                    <div key={config.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {config.status === 'ACTIVE' ? (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active"></span>
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-slate-300" title="Inactive"></span>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-800 line-clamp-1" title={config.routeName}>{config.routeName}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                        {config.customer}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                        {config.cargoType}
                                    </span>
                                    {config.isNightStay && (
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></span>
                                            Lưu đêm ({config.nightStayLocation === 'INNER_CITY' ? 'Trong TP' : 'Ngoài TP'})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingConfig(config)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(config.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Doanh thu</span>
                                <span className="text-lg font-bold text-emerald-600">
                                    {config.revenue.price40F?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-normal">đ</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium mt-1">(40' Full)</span>
                            </div>

                            <div className="flex justify-between items-end border-t border-dashed border-slate-100 pt-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Lương LX</span>
                                <span className="text-base font-bold text-blue-600">
                                    {config.salary?.driverSalary?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-normal">đ</span>
                                </span>
                            </div>

                            <div className="flex justify-between items-end border-t border-dashed border-slate-100 pt-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-slate-400 uppercase">Nhiên liệu</span>
                                    <span className="text-[10px] text-slate-400 font-medium">({config.fuel?.truckType === 'TRACTOR' ? 'Đầu kéo' : 'Xe tải'})</span>
                                </div>
                                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                    {config.fuel?.quota || 0} <span className="text-xs text-slate-500 font-normal">Lít</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <RouteConfigModal
                isOpen={isCreateModalOpen || !!editingConfig}
                config={editingConfig}
                isNew={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingConfig(null);
                }}
                onSave={handleSaveConfig}
            />
        </div>
    );
}
