import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import { PlusCircle, List, DollarSign, LogOut, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Layout() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="top-header">
        <div className="user-info">
          <User size={20} />
          <span>{user?.username}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/create" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlusCircle size={24} />
          <span>Tạo Phiếu</span>
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <List size={24} />
          <span>DS Phiếu</span>
        </NavLink>
        <NavLink to="/salary" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <DollarSign size={24} />
          <span>Lương</span>
        </NavLink>
      </nav>

      <style>{`
        .app-container {
          min-height: 100vh;
          padding-bottom: 80px; /* Space for bottom nav */
          padding-top: 60px; /* Space for top header */
          background: var(--bg);
        }

        .top-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            z-index: 50;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            color: #334155;
        }

        .logout-btn {
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .logout-btn:hover {
            background: #f1f5f9;
            color: #ef4444;
        }
        
        .content {
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem;
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
          box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #64748b;
          font-size: 0.75rem;
          gap: 4px;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-item.active {
          color: var(--primary);
          background: #f1f5f9;
        }
        
        .nav-item svg {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
}
