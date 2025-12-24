import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Calendar, Search, Download, Printer, Send } from 'lucide-react';

export default function SalaryManager() {
    const { getDriversList, calculateDriverSalary, publishSalary, isSalaryPublished } = useAppContext();
    const [selectedMonth, setSelectedMonth] = useState('12-2023'); // Default to MM-YYYY
    const [selectedDriver, setSelectedDriver] = useState('');

    const drivers = getDriversList();
    const salaryData = selectedDriver ? calculateDriverSalary(selectedDriver, selectedMonth) : null;
    const isPublished = selectedDriver ? isSalaryPublished(selectedDriver, selectedMonth) : false;

    const handlePublish = () => {
        if (!selectedDriver || !selectedMonth) return;
        if (window.confirm(`Xác nhận GỬI phiếu lương tháng ${selectedMonth} cho tài xế ${selectedDriver}?`)) {
            publishSalary(selectedDriver, selectedMonth);
            alert('Đã gửi phiếu lương thành công!');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="salary-manager">
            <header className="page-header">
                <div>
                    <h1>Quản Lý Lương Tài Xế</h1>
                    <p>Tính toán và kết xuất bảng lương theo tháng</p>
                </div>
            </header>

            <div className="content-grid">
                <div className="controls-panel">
                    <h3>Bộ Lọc</h3>
                    <div className="control-group">
                        <label>Tháng Lương</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="styled-select"
                        >
                            <option value="12-2023">Tháng 12/2023</option>
                            <option value="11-2023">Tháng 11/2023</option>
                            <option value="10-2023">Tháng 10/2023</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Chọn Tài Xế</label>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="styled-select"
                        >
                            <option value="">-- Chọn tài xế --</option>
                            {drivers.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="salary-preview">
                    {!selectedDriver ? (
                        <div className="empty-state">
                            <p>Vui lòng chọn tài xế để xem bảng lương</p>
                        </div>
                    ) : !salaryData ? (
                        <div className="empty-state">
                            <p>Không có dữ liệu lương cho khoảng thời gian này</p>
                        </div>
                    ) : (
                        <div className="salary-sheet">
                            <div className="sheet-header">
                                <div className="company-info">
                                    <h4>CÔNG TY DANALOG</h4>
                                    <p>PHIẾU LƯƠNG NHÂN VIÊN</p>
                                </div>
                                <div className="period-info">
                                    <span>Kỳ lương: {salaryData.month}</span>
                                    <span>NV: {selectedDriver}</span>
                                </div>
                            </div>

                            <div className="sheet-body">
                                <div className="salary-item">
                                    <span>Tổng số chuyến đã duyệt</span>
                                    <span className="amount">{salaryData.tripCount} chuyến</span>
                                </div>
                                <div className="divider"></div>
                                {salaryData.details.map((item, idx) => (
                                    <div key={idx} className={`salary-item ${item.amount < 0 ? 'deduction' : ''}`}>
                                        <span>{item.name}</span>
                                        <span className="amount">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                                <div className="divider double"></div>
                                <div className="salary-total">
                                    <span>THỰC LĨNH</span>
                                    <span className="total-amount">{formatCurrency(salaryData.total)}</span>
                                </div>
                            </div>

                            <div className="sheet-actions">
                                <span style={{ marginRight: 'auto', fontWeight: 'bold', color: isPublished ? 'green' : '#f59e0b' }}>
                                    {isPublished ? '✓ Đã gửi cho tài xế' : '⚠ Chưa gửi'}
                                </span>
                                {!isPublished && (
                                    <button className="action-btn export" onClick={handlePublish} style={{ background: '#10b981' }}>
                                        <Send size={18} /> Gửi Phiếu Lương
                                    </button>
                                )}
                                <button className="action-btn print" onClick={() => window.print()}>
                                    <Printer size={18} /> In Phiếu
                                </button>
                                <button className="action-btn export" onClick={() => window.print()}>
                                    <Download size={18} /> Xuất PDF (Print)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .salary-manager {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    height: calc(100vh - 100px);
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

                .content-grid {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 24px;
                    flex: 1;
                    min-height: 0;
                }

                .controls-panel {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    height: fit-content;
                }

                .controls-panel h3 {
                    margin-top: 0;
                    margin-bottom: 20px;
                    color: #0f172a;
                    font-size: 1.1rem;
                }

                .control-group {
                    margin-bottom: 20px;
                }

                .control-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #475569;
                    font-size: 0.9rem;
                }

                .styled-select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 1rem;
                    color: #0f172a;
                    background-color: #fff;
                }

                .salary-preview {
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 2px dashed #cbd5e1;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding: 40px;
                    overflow-y: auto;
                }

                .empty-state {
                    text-align: center;
                    color: #94a3b8;
                    margin-top: 40px;
                }

                .salary-sheet {
                    background: white;
                    width: 100%;
                    max-width: 600px;
                    padding: 40px;
                    border-radius: 4px; /* A4 feel */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .sheet-header {
                    text-align: center;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }

                .company-info h4 {
                    font-size: 1.2rem;
                    margin: 0 0 4px 0;
                    color: #0f172a;
                }

                .company-info p {
                    margin: 0;
                    color: #64748b;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .period-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                    font-size: 0.9rem;
                    color: #475569;
                    font-weight: 500;
                }

                .sheet-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .salary-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1rem;
                    color: #334155;
                }

                .salary-item.deduction {
                    color: #ef4444;
                }

                .salary-item .amount {
                    font-family: monospace;
                    font-weight: 600;
                }

                .divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 8px 0;
                }

                .divider.double {
                    height: 3px;
                    border-top: 1px solid #0f172a;
                    border-bottom: 1px solid #0f172a;
                    background: transparent;
                }

                .salary-total {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 8px;
                }

                .sheet-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 40px;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 20px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .action-btn.print {
                    background: #f1f5f9;
                    color: #475569;
                }

                .action-btn.print:hover { background: #e2e8f0; }

                .action-btn.export {
                    background: #0284c7;
                    color: white;
                }

                .action-btn.export:hover { background: #0369a1; }
            `}</style>
        </div>
    );
}
