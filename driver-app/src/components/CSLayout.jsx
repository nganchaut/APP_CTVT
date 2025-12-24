import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function CSLayout() {
    const { logout, user } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="cs-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>DANALOG</h2>
                    <span className="badge">CS ADMIN</span>
                </div>

                <div className="user-info">
                    <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
                    <div className="details">
                        <span className="name">{user?.name || 'Admin'}</span>
                        <span className="role">Quản lý vận tải</span>
                    </div>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/cs/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Duyệt Phiếu</span>
                    </NavLink>
                    <NavLink to="/cs/revenue" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Wallet size={20} />
                        <span>Doanh Thu</span>
                    </NavLink>
                    <NavLink to="/cs/salary" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Receipt size={20} />
                        <span>Lương Tài Xế</span>
                    </NavLink>
                </nav>

                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={20} />
                    <span>Đăng Xuất</span>
                </button>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>

            <style>{`
                .cs-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #f8fafc;
                }

                .sidebar {
                    width: 260px;
                    background: white;
                    border-right: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    position: fixed;
                    height: 100vh;
                    left: 0;
                    top: 0;
                }

                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 32px;
                }

                .sidebar-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }

                .badge {
                    background: #e0f2fe;
                    color: #0284c7;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    margin-bottom: 24px;
                }

                .avatar {
                    width: 40px;
                    height: 40px;
                    background: #0284c7;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }

                .details {
                    display: flex;
                    flex-direction: column;
                }

                .details .name {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.9rem;
                }

                .details .role {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .nav-menu {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #64748b;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .nav-item:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .nav-item.active {
                    background: #e0f2fe;
                    color: #0284c7;
                }

                .logout-button {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: none;
                    background: none;
                    color: #ef4444;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 12px;
                    transition: all 0.2s;
                    margin-top: auto;
                }

                .logout-button:hover {
                    background: #fef2f2;
                }

                .main-content {
                    margin-left: 260px;
                    flex: 1;
                    padding: 32px;
                    max-width: 1400px; /* Limit width for large screens */
                }
            `}</style>
        </div>
    );
}
