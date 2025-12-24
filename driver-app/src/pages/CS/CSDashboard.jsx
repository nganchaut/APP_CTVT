import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Check, X, Filter, Search, Calendar, ChevronDown, ChevronUp, Edit2, Save } from 'lucide-react';

export default function CSDashboard() {
    const { tickets, updateTicket, updateTicketStatus, getDriversList, mockMetadata } = useAppContext();
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTicket, setExpandedTicket] = useState(null);

    // Modal State
    const [editingTicket, setEditingTicket] = useState(null);
    const [editForm, setEditForm] = useState({
        revenueNorm: '',
        fuelNorm: '',
        adminNote: ''
    });

    // Helper for dd/mm/yyyy
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    // Filter tickets
    const filteredTickets = tickets.filter(t => {
        // Pending = sent
        if (filterStatus === 'pending' && t.status !== 'sent') return false;
        if (filterStatus === 'approved' && t.status !== 'approved') return false;
        if (filterStatus === 'rejected' && t.status !== 'rejected') return false;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                t.createdBy?.toLowerCase().includes(searchLower) ||
                t.customerName?.toLowerCase().includes(searchLower) ||
                t.licensePlate?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleEditClick = (ticket) => {
        setEditingTicket(ticket);

        // Find Norms from Metadata
        let foundFuelNorm = '---';
        let foundRevenueNorm = ticket.price;

        // Iterate customers to find route
        // In a real app, we'd have a flat lookup or better structure
        if (ticket.customerName && ticket.route) {
            // Try to find the customer and route in mockMetadata
            // Note: Ticket currently stores names, not IDs. 
            // We'll try to match by name or just use what we have if strict matching isn't possible yet.
            // For this demo, we can iterate:
            const customer = mockMetadata.customers.find(c => c.name === ticket.customerName);
            if (customer) {
                const route = customer.routes.find(r => r.name === ticket.route);
                if (route) {
                    foundFuelNorm = route.fuelNorm || '---';
                    foundRevenueNorm = route.price;
                }
            }
        }

        setEditForm({
            revenueNorm: foundRevenueNorm,
            fuelNorm: foundFuelNorm,
            adminNote: ticket.adminNote || ''
        });
    };

    const handleEditSave = (approve = false) => {
        if (!editingTicket) return;

        const updates = {
            revenueNorm: Number(editForm.revenueNorm),
            fuelNorm: editForm.fuelNorm,
            adminNote: editForm.adminNote
        };
        // ... previous code continues ...

        if (approve) {
            if (window.confirm('Xác nhận duyệt phiếu và lưu thông tin?')) {
                updates.status = 'approved';
                updates.approvedDate = new Date().toISOString();
                updateTicket(editingTicket.id, updates);
                setEditingTicket(null);
            }
        } else {
            updateTicket(editingTicket.id, updates);
            alert('Đã lưu thông tin (Chưa duyệt)');
            setEditingTicket(null);
        }
    };

    const handleReject = (id) => {
        const reason = window.prompt('Nhập lý do từ chối:');
        if (reason) {
            updateTicketStatus(id, 'rejected', reason);
        }
    };

    return (
        <div className="cs-dashboard">
            <header className="page-header">
                <div>
                    <h1>Duyệt Phiếu Công Tác</h1>
                    <p>Quản lý và phê duyệt các phiếu vận tải gửi lên từ tài xế</p>
                </div>
                <div className="stats-cards">
                    <div className="stat-card pending">
                        <span className="label">Chờ duyệt</span>
                        <span className="value">{tickets.filter(t => t.status === 'sent').length}</span>
                    </div>
                    <div className="stat-card approved">
                        <span className="label">Đã duyệt (Tháng này)</span>
                        <span className="value">{tickets.filter(t => t.status === 'approved').length}</span>
                    </div>
                </div>
            </header>

            <div className="controls-bar">
                <div className="search-box">
                    <Search size={20} className="icon" />
                    <input
                        type="text"
                        placeholder="Tìm theo tài xế, khách hàng, số xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters">
                    <button
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >Tất cả</button>
                    <button
                        className={`filter-btn pending ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >Chờ duyệt</button>
                    <button
                        className={`filter-btn approved ${filterStatus === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('approved')}
                    >Đã duyệt</button>
                </div>
            </div>

            <div className="tickets-list">
                {filteredTickets.length === 0 ? (
                    <div className="empty-state">
                        <p>Không tìm thấy phiếu nào phù hợp.</p>
                    </div>
                ) : (
                    filteredTickets.map(ticket => (
                        <div key={ticket.id} className={`ticket-card ${ticket.status}`}>
                            <div className="card-main">
                                <div className="ticket-info">
                                    <div className="info-header">
                                        <span className="ticket-id">#{ticket.id.slice(-6)}</span>
                                        <span className={`status-badge ${ticket.status}`}>
                                            {ticket.status === 'sent' ? 'Chờ duyệt' :
                                                ticket.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                                        </span>
                                        <span className="date">
                                            <Calendar size={14} />
                                            {formatDate(ticket.date)}
                                        </span>
                                    </div>
                                    <h3 className="route-name">{ticket.routeName}</h3>
                                    <div className="details-row">
                                        <span className="detail-item"><strong>NV:</strong> {ticket.createdBy}</span>
                                        <span className="detail-item"><strong>Xe:</strong> {ticket.licensePlate}</span>
                                        <span className="detail-item"><strong>KH:</strong> {ticket.customerName}</span>
                                    </div>
                                </div>
                                <div className="actions">
                                    {ticket.status === 'sent' && (
                                        <>
                                            <button onClick={() => handleEditClick(ticket)} className="btn-edit" title="Xem/Sửa">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleReject(ticket.id)} className="btn-reject" title="Từ chối">
                                                <X size={20} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn-expand"
                                        onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                                    >
                                        {expandedTicket === ticket.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                            </div>

                            {expandedTicket === ticket.id && (
                                <div className="card-expanded">
                                    <div className="expanded-grid">
                                        <div className="grid-item">
                                            <span className="label">Container:</span>
                                            <span className="value">{ticket.containerNumber || '---'} ({ticket.containerType})</span>
                                        </div>
                                        <div className="grid-item">
                                            <span className="label">Lưu đêm:</span>
                                            <span className="value">{ticket.overnight ? `${ticket.overnightNights} đêm (${ticket.overnightLocation})` : 'Không'}</span>
                                        </div>
                                        <div className="grid-item">
                                            <span className="label">Phụ phí (LX báo):</span>
                                            <span className="value">{ticket.surcharge?.toLocaleString('vi-VN') || 0} đ</span>
                                        </div>
                                        <div className="grid-item">
                                            <span className="label">Tổng tiền (Dự kiến):</span>
                                            <span className="value highlight">{(Number(ticket.price) + (Number(ticket.surcharge) || 0)).toLocaleString('vi-VN')} đ</span>
                                        </div>

                                        {/* CS Fields Info */}
                                        <div className="grid-item">
                                            <span className="label" style={{ color: '#0284c7' }}>Định mức DT:</span>
                                            <span className="value fw-700">{ticket.revenueNorm ? ticket.revenueNorm.toLocaleString('vi-VN') : (ticket.price ? Number(ticket.price).toLocaleString('vi-VN') : 0)} đ</span>
                                        </div>
                                        <div className="grid-item">
                                            <span className="label" style={{ color: '#0284c7' }}>Định mức NL:</span>
                                            <span className="value fw-700">{ticket.fuelNorm || 'Chưa nhập'}</span>
                                        </div>

                                        {ticket.note && (
                                            <div className="grid-item full-width">
                                                <span className="label">Ghi chú LX:</span>
                                                <span className="value">{ticket.note}</span>
                                            </div>
                                        )}
                                        {ticket.rejectionReason && (
                                            <div className="grid-item full-width rejection-reason">
                                                <span className="label">Lý do từ chối:</span>
                                                <span className="value">{ticket.rejectionReason}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Edit/Review Modal */}
            {editingTicket && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Duyệt / Điều chỉnh Phiếu</h3>
                            <button onClick={() => setEditingTicket(null)} className="close-btn"><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {/* Driver Information Section (Read-Only) */}
                            <div className="section-title">Thông tin Tài Xế báo cáo</div>
                            <div className="info-grid">
                                <div className="info-group">
                                    <label>Tài xế</label>
                                    <div className="value-display">{editingTicket.createdBy}</div>
                                </div>
                                <div className="info-group">
                                    <label>Biển số</label>
                                    <div className="value-display">{editingTicket.licensePlate}</div>
                                </div>
                                <div className="info-group">
                                    <label>Ngày đi</label>
                                    <div className="value-display">{formatDate(editingTicket.startDate || editingTicket.date)}</div>
                                </div>
                                <div className="info-group">
                                    <label>Ngày về</label>
                                    <div className="value-display">{editingTicket.endDate ? formatDate(editingTicket.endDate) : '---'}</div>
                                </div>
                                <div className="info-group full-width">
                                    <label>Khách hàng</label>
                                    <div className="value-display">{editingTicket.customerName}</div>
                                </div>
                                <div className="info-group full-width">
                                    <label>Tuyến đường</label>
                                    <div className="value-display">{editingTicket.route}</div>
                                </div>

                                <div className="info-group">
                                    <label>Số Container</label>
                                    <div className="value-display">{editingTicket.containerNumber || '---'}</div>
                                </div>
                                <div className="info-group">
                                    <label>Loại/Kích thước</label>
                                    <div className="value-display">{editingTicket.containerSize}' / {editingTicket.containerType === 'E' ? 'Rỗng' : 'Đầy'}</div>
                                </div>
                            </div>

                            <div className="info-grid" style={{ marginTop: '12px' }}>
                                <div className="info-group">
                                    <label>Lưu đêm</label>
                                    <div className="value-display">{editingTicket.overnight ? `${editingTicket.overnightNights} đêm (${editingTicket.overnightLocation === 'in_city' ? 'Trong TP' : 'Ngoài TP'})` : 'Không'}</div>
                                </div>
                                <div className="info-group full-width">
                                    <label>Ghi chú của Tài xế</label>
                                    <div className="value-display note-box">{editingTicket.note || 'Không có'}</div>
                                </div>
                                {editingTicket.containerImage && (
                                    <div className="info-group full-width">
                                        <label>Ảnh đính kèm</label>
                                        <div className="image-preview">
                                            {/* Placeholder for actual image logic */}
                                            <span>[Ảnh Container: {editingTicket.containerImage}]</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CS Approval Section */}
                            <div className="section-title" style={{ marginTop: '24px', color: '#0284c7', borderLeftColor: '#0284c7' }}>Duyệt & Định Mức (CS)</div>

                            <div className="form-group">
                                <label>Định mức Doanh Thu (VNĐ)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={editForm.revenueNorm}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, revenueNorm: e.target.value }))}
                                />
                                <small className="hint">Giá chuyến mặc định: {Number(editingTicket.price).toLocaleString()} đ</small>
                            </div>

                            <div className="form-group">
                                <label>Định mức Nhiên Liệu</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ví dụ: 20L hoặc 500,000đ"
                                    value={editForm.fuelNorm}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, fuelNorm: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label>Ghi chú Admin (Nội bộ)</label>
                                <textarea
                                    className="input"
                                    value={editForm.adminNote}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, adminNote: e.target.value }))}
                                    placeholder="Ghi chú thêm..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => handleEditSave(false)}>
                                <Save size={18} /> Lưu (Không duyệt)
                            </button>
                            <button className="btn btn-primary" onClick={() => handleEditSave(true)}>
                                <Check size={18} /> Lưu & Duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .cs-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                
                /* Keep previous styles... adding new ones */
                
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }

                .page-header h1 {
                    font-size: 1.8rem;
                    color: #0f172a;
                    margin: 0 0 8px 0;
                }

                .page-header p {
                    color: #64748b;
                    margin: 0;
                }

                .stats-cards {
                    display: flex;
                    gap: 16px;
                }

                .stat-card {
                    background: white;
                    padding: 16px 24px;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    min-width: 140px;
                }

                .stat-card.pending .value { color: #f59e0b; }
                .stat-card.approved .value { color: #10b981; }

                .stat-card .label {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 4px;
                }

                .stat-card .value {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .controls-bar {
                    display: flex;
                    justify-content: space-between;
                    background: white;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .search-box {
                    position: relative;
                    width: 300px;
                }

                .search-box .icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }

                .search-box input {
                    width: 100%;
                    padding: 10px 10px 10px 40px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.95rem;
                }

                .filters {
                    display: flex;
                    gap: 8px;
                }

                .filter-btn {
                    padding: 8px 16px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 8px;
                    color: #64748b;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-btn:hover {
                    background: #f8fafc;
                }

                .filter-btn.active {
                    background: #0f172a;
                    color: white;
                    border-color: #0f172a;
                }
                
                .filter-btn.active.pending {
                    background: #f59e0b;
                    border-color: #f59e0b;
                }
                
                .filter-btn.active.approved {
                    background: #10b981;
                    border-color: #10b981;
                }

                .tickets-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .ticket-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                
                .ticket-card:hover {
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .ticket-card.sent { border-left: 4px solid #f59e0b; }
                .ticket-card.approved { border-left: 4px solid #10b981; }
                .ticket-card.rejected { border-left: 4px solid #ef4444; }

                .card-main {
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .info-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .ticket-id {
                    font-family: monospace;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }

                .status-badge {
                    font-size: 0.75rem;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.sent { background: #fef3c7; color: #d97706; }
                .status-badge.approved { background: #dcfce7; color: #16a34a; }
                .status-badge.rejected { background: #fee2e2; color: #dc2626; }

                .date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #64748b;
                    font-size: 0.85rem;
                }

                .route-name {
                    margin: 0 0 8px 0;
                    font-size: 1.1rem;
                    color: #0f172a;
                }

                .details-row {
                    display: flex;
                    gap: 24px;
                    font-size: 0.95rem;
                    color: #475569;
                }

                .actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-approve, .btn-reject, .btn-expand, .btn-edit {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-approve {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .btn-approve:hover { background: #bbf7d0; }

                .btn-reject {
                    background: #fee2e2;
                    color: #dc2626;
                }
                .btn-reject:hover { background: #fecaca; }
                
                .btn-edit {
                    background: #e0f2fe;
                    color: #0284c7;
                }
                .btn-edit:hover { background: #bae6fd; }

                .btn-expand {
                    background: #f1f5f9;
                    color: #64748b;
                }
                .btn-expand:hover { background: #e2e8f0; }

                .card-expanded {
                    padding: 0 20px 20px 20px;
                    border-top: 1px solid #f1f5f9;
                    background: #fafafa;
                }
                
                .expanded-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    padding-top: 16px;
                }
                
                .grid-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .grid-item.full-width {
                    grid-column: 1 / -1;
                }
                
                .rejection-reason .value {
                    color: #dc2626;
                    font-weight: 500;
                }
                
                .grid-item .label {
                    font-size: 0.8rem;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                
                .grid-item .value {
                    font-size: 0.95rem;
                    color: #334155;
                }
                
                .grid-item .value.highlight {
                    font-weight: 700;
                    color: #0284c7;
                }

                /* Modal Styles */
                
                .section-title {
                    font-size: 0.9rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #64748b;
                    margin-bottom: 12px;
                    padding-left: 8px;
                    border-left: 3px solid #64748b;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                
                .info-group.full-width {
                    grid-column: 1 / -1;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .modal-content {
                    background: white;
                    width: 95%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    animation: slideUp 0.3s ease-out;
                    display: flex;
                    flex-direction: column;
                }

                .modal-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    background: white;
                    z-index: 10;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #64748b;
                }

                .modal-body {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .info-group label {
                    display: block;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                }

                .value-display {
                    font-weight: 500;
                    color: #0f172a;
                    font-size: 0.95rem;
                    word-break: break-word;
                }
                
                .note-box {
                    background: #f8fafc;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-style: italic;
                    color: #475569;
                }
                
                .image-preview {
                    background: #f1f5f9;
                    padding: 12px;
                    border-radius: 6px;
                    text-align: center;
                    color: #64748b;
                    font-size: 0.85rem;
                    border: 1px dashed #cbd5e1;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #334155;
                    font-size: 0.9rem;
                }

                .hint {
                    display: block;
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 0.8rem;
                }

                .modal-footer {
                    padding: 16px 24px;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    border-radius: 0 0 12px 12px;
                    position: sticky;
                    bottom: 0;
                }
            `}</style>
        </div>
    );
}
