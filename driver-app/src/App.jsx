import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CSLayout from './components/CSLayout';
import CreateTicket from './pages/CreateTicket';
import TicketList from './pages/TicketList';
import SalarySlip from './pages/SalarySlip';
import CSDashboard from './pages/CS/CSDashboard';
import RevenueReport from './pages/CS/RevenueReport';
import SalaryManager from './pages/CS/SalaryManager';
import Login from './pages/Login';
import { AppProvider, useAppContext } from './context/AppContext';

// Simple Route Protection
const ProtectedRoute = ({ children, role = 'driver' }) => {
    const { user } = useAppContext();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role === 'cs' && user.role !== 'cs') {
        return <Navigate to="/" replace />; // Redirect drivers trying to access CS to their home
    }

    if (role === 'driver' && user.role === 'cs') {
        return <Navigate to="/cs/dashboard" replace />; // Redirect CS trying to access driver pages
    }

    return children;
};

function App() {
    return (
        <AppProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* CS Routes */}
                    <Route path="/cs" element={
                        <ProtectedRoute role="cs">
                            <CSLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<CSDashboard />} />
                        <Route path="revenue" element={<RevenueReport />} />
                        <Route path="salary" element={<SalaryManager />} />
                    </Route>

                    {/* Driver Routes */}
                    <Route path="/" element={
                        <ProtectedRoute role="driver">
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/create" replace />} />
                        <Route path="create" element={<CreateTicket />} />
                        <Route path="tickets" element={<TicketList />} />
                        <Route path="salary" element={<SalarySlip />} />
                    </Route>
                </Routes>
            </Router>
        </AppProvider>
    );
}

export default App;
