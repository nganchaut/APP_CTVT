import React, { createContext, useContext, useState, useEffect } from 'react';

import seedTickets from '../data/seedTickets.json';

const AppContext = createContext();

export function AppProvider({ children }) {
    // Load initial state from localStorage or use defaults (seed data)
    const [tickets, setTickets] = useState(() => {
        const saved = localStorage.getItem('tickets');
        let currentTickets = saved ? JSON.parse(saved) : [];

        // DEV: Merge seed tickets if they are not present?
        // Or simply: if currentTickets has very few items (e.g. 0), load seed.
        if (currentTickets.length === 0 && seedTickets && seedTickets.length > 0) {
            return seedTickets;
        }

        // Also check if seedTickets contains new imported ones not in current?
        // Let's filter seedTickets to find ones not in currentTickets by ID
        const existingIds = new Set(currentTickets.map(t => t.id));
        const newSeeds = seedTickets.filter(t => !existingIds.has(t.id));

        if (newSeeds.length > 0) {
            return [...newSeeds, ...currentTickets];
        }

        return currentTickets;
    });

    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [lastLicensePlate, setLastLicensePlate] = useState(() => {
        return localStorage.getItem('lastLicensePlate') || '';
    });

    // key: "username_MM-YYYY", value: true/timestamp
    const [publishedSalaries, setPublishedSalaries] = useState(() => {
        const saved = localStorage.getItem('publishedSalaries');
        return saved ? JSON.parse(saved) : {};
    });

    const publishSalary = (username, monthStr) => {
        const key = `${username}_${monthStr}`;
        setPublishedSalaries(prev => {
            const newState = { ...prev, [key]: new Date().toISOString() };
            localStorage.setItem('publishedSalaries', JSON.stringify(newState));
            return newState;
        });
    };

    const isSalaryPublished = (username, monthStr) => {
        const key = `${username}_${monthStr}`;
        return !!publishedSalaries[key];
    };

    const login = (username, password) => {
        // Simple role assignment: 'admin' is CS, everyone else is driver
        const role = username === 'admin' ? 'cs' : 'driver';
        const newUser = { username, role, name: username === 'admin' ? 'CS Manager' : `Tài xế ${username}` };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateTicketStatus = async (id, status, note = '') => {
        const updates = {
            status: status,
            rejectionReason: note,
            approvedDate: status === 'approved' ? new Date().toISOString() : undefined // we can't easily get old date here without lookup, but API handles merge
        };

        // Optimistic
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates, approvedDate: status === 'approved' ? updates.approvedDate : t.approvedDate } : t
        ));

        // API Call
        try {
            await fetch(`http://localhost:3001/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.error("Failed to update ticket status:", err);
        }
    };

    // Helper to calculate salary for a driver in a specific month
    const calculateDriverSalary = (driverUsername, monthStr) => { // monthStr format "MM-YYYY"
        if (!driverUsername) return null;

        const [month, year] = monthStr.split('-').map(Number);

        const relevantTickets = tickets.filter(t => {
            if (t.status !== 'approved') return false;
            // Assuming we pay based on the ticket creation date or approved date? 
            // Let's use ticket date (dep date) for simplicity as stored in 'date' field (YYYY-MM-DD)
            const ticketDate = new Date(t.date); // or t.startDate
            // Check if ticket owner is the driver
            // NOTE: CreateTicket currently doesn't save username. We need to fix that or assume current context.
            // For now, let's assume we will add 'createdBy' to ticket.
            return t.createdBy === driverUsername &&
                ticketDate.getMonth() + 1 === month &&
                ticketDate.getFullYear() === year;
        });

        const baseSalary = 8000000;
        const tripAllowance = relevantTickets.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
        // Deduct insurance? Fixed for now
        const deductions = 500000;

        return {
            month: monthStr,
            base: baseSalary,
            tripAllowance,
            deductions,
            total: baseSalary + tripAllowance - deductions,
            details: [
                { name: 'Lương cơ bản', amount: baseSalary },
                { name: 'Phụ cấp chuyến', amount: tripAllowance },
                { name: 'Trừ bảo hiểm', amount: -deductions }
            ],
            tripCount: relevantTickets.length,
            ticketIds: relevantTickets.map(t => t.id)
        };
    };

    // LocalStorage sync removed for tickets (handled by API)

    useEffect(() => {
        if (lastLicensePlate) {
            localStorage.setItem('lastLicensePlate', lastLicensePlate);
        }
    }, [lastLicensePlate]);

    const addTicket = async (ticket) => {
        // Optimistic update
        const newTicket = {
            ...ticket,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: ticket.status || 'sent',
            createdBy: user ? user.username : 'unknown'
        };
        setTickets(prev => [newTicket, ...prev]);

        if (ticket.licensePlate) {
            setLastLicensePlate(ticket.licensePlate);
        }

        // API Call
        try {
            await fetch('http://localhost:3001/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTicket)
            });
        } catch (err) {
            console.error("Failed to save ticket:", err);
        }
    };

    const updateTicket = async (id, updates) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        // API Call
        try {
            await fetch(`http://localhost:3001/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.error("Failed to update ticket:", err);
        }
    };

    const getTicketById = (id) => tickets.find(t => t.id === id);

    // Mock Metadata
    const mockMetadata = {
        customers: [
            {
                id: 'cust_qzy',
                name: 'QZY',
                routes: [
                    { id: 'r_qzy_1', name: 'Cảng Tiên Sa - Lao Bảo - Sunpaper Savannakhet (2 chiều)', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } },
                    { id: 'r_qzy_2', name: 'Cảng Tiên Sa - Lao Bảo - Sunpaper Savannakhet (1 chiều)', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_steinweg',
                name: 'STEINWEG',
                routes: [
                    { id: 'r_steinweg_1', name: 'Cảng Tiên Sa, Danang - Vientiane, Lào', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_vantuong',
                name: 'VẠN TƯỢNG',
                routes: [
                    { id: 'r_vantuong_1', name: 'Salavan, Lào - CK Lalay - Cảng Tiên Sa', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_ast',
                name: 'AST',
                routes: [
                    { id: 'r_ast_1', name: 'Cảng Tiên Sa, Đà Nẵng - Champasak, Lào', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_phunggiaphat',
                name: 'PHÙNG GIA PHÁT',
                routes: [
                    { id: 'r_pgp_1', name: 'NM Tinh bột sắn, Sepon Lào - Cảng Tiên Sa', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_gemadept',
                name: 'GEMADEPT-BỘT',
                routes: [
                    { id: 'r_gema_1', name: 'NM Tinh bột sắn, Sepon Lào - Cảng Tiên Sa', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_hyosung',
                name: 'HYOSUNG',
                routes: [
                    { id: 'r_hyosung_1', name: 'Cảng Tiên Sa - HS Hyosung Quảng Nam', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } },
                    { id: 'r_hyosung_2', name: 'Cảng Tiên Sa - HS Hyosung Quảng Nam (2 chuyến/ngày)', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_xidadong',
                name: 'XIDADONG',
                routes: [
                    { id: 'r_xidadong_1', name: 'Cảng Tiên Sa - KCN Vsip Quảng Ngãi', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_general',
                name: 'Nhiều khách hàng',
                routes: [
                    { id: 'r_tho_quang', name: 'Cảng Tiên Sa - KCN Thọ Quang', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } },
                    { id: 'r_other', name: 'Khác', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_dnl',
                name: 'Kho hàng DNL',
                routes: [
                    { id: 'r_dnl_20', name: 'Hàng hóa kho CFS cont 20\'', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } },
                    { id: 'r_dnl_40', name: 'Hàng hóa kho CFS cont 40\'', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_depot',
                name: 'Depot',
                routes: [
                    { id: 'r_depot_fix', name: 'Cont sửa chữa Danalog - Tiên Sa (và ngược lại)', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: true } }
                ]
            },
            {
                id: 'cust_trungchuyen',
                name: 'TRUNG CHUYỂN',
                routes: [
                    { id: 'r_tc_1', name: 'Nội bộ kho bãi Danalog 1', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: false, value: 'Trung chuyển' } },
                    { id: 'r_tc_2', name: 'Tàu - Bãi Cảng Tiên Sa', price: 0, fuelNorm: '0L', containerConfig: { mode: 'manual', requireImage: false, value: 'Trung chuyển' } }
                ]
            }
        ],
        overnightRates: {
            in_city: 150000,
            out_city: 200000
        }
    };

    // Get unique drivers list for filtering
    const getDriversList = () => {
        const drivers = new Set(tickets.map(t => t.createdBy).filter(Boolean));
        return Array.from(drivers);
    };

    return (
        <AppContext.Provider value={{
            tickets,
            addTicket,
            updateTicket,
            getTicketById,
            lastLicensePlate,
            mockMetadata,
            user,
            login,
            logout,
            updateTicketStatus,
            calculateDriverSalary,
            getDriversList,
            publishedSalaries,
            publishSalary,
            isSalaryPublished
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
