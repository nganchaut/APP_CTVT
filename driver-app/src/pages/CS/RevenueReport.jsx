import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Calendar, Filter, Download } from 'lucide-react';

export default function RevenueReport() {
    const { tickets, mockMetadata } = useAppContext();
    const [viewMode, setViewMode] = useState('customer'); // customer, driver
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const approvedTickets = tickets.filter(t => {
        if (t.status !== 'approved') return false;
        return t.date.startsWith(month);
    });

    // Grouping Logic
    const groupedData = approvedTickets.reduce((acc, ticket) => {
        const key = viewMode === 'customer' ? ticket.customerName : ticket.createdBy;
        if (!acc[key]) {
            acc[key] = {
                name: key,
                tripCount: 0,
                revenue: 0,
                surcharges: 0
            };
        }
        acc[key].tripCount += 1;
        acc[key].revenue += Number(ticket.revenueNorm || ticket.price || 0);
        acc[key].surcharges += (Number(ticket.surcharge) || 0);
        return acc;
    }, {});

    const reportData = Object.values(groupedData);
    const totalRevenue = reportData.reduce((sum, item) => sum + item.revenue + item.surcharges, 0);

    return (
        <div className="revenue-report">
            <header className="page-header">
                <div>
                    <h1>Báo Cáo Doanh Thu</h1>
                    <p>Thống kê doanh thu theo khách hàng và lái xe</p>
                </div>
                <button className="export-btn" onClick={() => {
                    const headers = ['Tên', 'Số chuyến', 'Doanh thu', 'Phụ phí', 'Tổng'];
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + headers.join(",") + "\n"
                        + reportData.map(e => [
                            e.name,
                            e.tripCount,
                            e.revenue,
                            e.surcharges,
                            e.revenue + e.surcharges
                        ].join(",")).join("\n");

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `BaoCaoDoanhThu_${month}_${viewMode}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}>
                    <Download size={18} />
                    Xuất Excel (CSV)
                </button>
            </header>

            <div className="controls-bar">
                <div className="view-toggles">
                    <button
                        className={`toggle-btn ${viewMode === 'customer' ? 'active' : ''}`}
                        onClick={() => setViewMode('customer')}
                    >Theo Khách Hàng</button>
                    <button
                        className={`toggle-btn ${viewMode === 'driver' ? 'active' : ''}`}
                        onClick={() => setViewMode('driver')}
                    >Theo Lái Xe</button>
                </div>

                <div className="date-filter">
                    <Calendar size={18} />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="report-card">
                <div className="card-header">
                    <h3>Chi Tiết Doanh Thu Tháng {month.split('-').reverse().join('/')}</h3>
                    <span className="total-badge">Tổng: {totalRevenue.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{viewMode === 'customer' ? 'Khách Hàng' : 'Tài Xế'}</th>
                                <th className="text-right">Số Chuyến</th>
                                <th className="text-right">Cước Vận Chuyển</th>
                                <th className="text-right">Phụ Phí</th>
                                <th className="text-right">Tổng Cộng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-cell">Chưa có dữ liệu cho tháng này</td>
                                </tr>
                            ) : (
                                reportData.map((item, index) => (
                                    <tr key={index}>
                                        <td className="fw-600">{item.name}</td>
                                        <td className="text-right">{item.tripCount}</td>
                                        <td className="text-right">{item.revenue.toLocaleString('vi-VN')}</td>
                                        <td className="text-right">{item.surcharges.toLocaleString('vi-VN')}</td>
                                        <td className="text-right fw-700">{(item.revenue + item.surcharges).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td className="fw-700">TỔNG CỘNG</td>
                                    <td className="text-right fw-700">{reportData.reduce((s, i) => s + i.tripCount, 0)}</td>
                                    <td className="text-right fw-700">{reportData.reduce((s, i) => s + i.revenue, 0).toLocaleString('vi-VN')}</td>
                                    <td className="text-right fw-700">{reportData.reduce((s, i) => s + i.surcharges, 0).toLocaleString('vi-VN')}</td>
                                    <td className="text-right fw-700 highlight-cell">{totalRevenue.toLocaleString('vi-VN')}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <style>{`
                .revenue-report {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

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

                .export-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: #f1f5f9;
                    color: #475569;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .export-btn:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                .controls-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .view-toggles {
                    display: flex;
                    background: #f1f5f9;
                    padding: 4px;
                    border-radius: 8px;
                }

                .toggle-btn {
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .toggle-btn.active {
                    background: white;
                    color: #0284c7;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    font-weight: 600;
                }

                .date-filter {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f8fafc;
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                }

                .date-filter input {
                    border: none;
                    background: transparent;
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: #0f172a;
                    outline: none;
                }

                .report-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .card-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .card-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #0f172a;
                }

                .total-badge {
                    background: #e0f2fe;
                    color: #0284c7;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .table-container {
                    padding: 0;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th {
                    text-align: left;
                    padding: 16px 24px;
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    border-bottom: 1px solid #e2e8f0;
                }

                .data-table td {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                    font-size: 0.95rem;
                }

                .data-table tfoot td {
                    background: #f8fafc;
                    border-top: 2px solid #e2e8f0;
                    border-bottom: none;
                }

                .text-right { text-align: right; }
                .fw-600 { font-weight: 600; }
                .fw-700 { font-weight: 700; }
                .highlight-cell { color: #0284c7; }
                .empty-cell { text-align: center; color: #94a3b8; font-style: italic; padding: 40px; }
            `}</style>
        </div>
    );
}
