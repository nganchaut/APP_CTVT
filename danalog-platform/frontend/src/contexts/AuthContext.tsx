import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define User Types
export type UserRole = 'ADMIN' | 'CS' | 'DRIVER';

export interface User {
    username: string;
    role: UserRole;
    name: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Check for persisted session on load
    useEffect(() => {
        const savedUser = localStorage.getItem('danalog_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage");
                localStorage.removeItem('danalog_user');
            }
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        // MOCK AUTHENTICATION
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        if (username === 'admin' && password === 'admin123') {
            const adminUser: User = { username: 'admin', role: 'ADMIN', name: 'Administrator' };
            setUser(adminUser);
            localStorage.setItem('danalog_user', JSON.stringify(adminUser));
            return true;
        }

        if (username === 'cs_user' && password === 'password123') {
            const csUser: User = { username: 'cs_user', role: 'CS', name: 'CS Staff' };
            setUser(csUser);
            localStorage.setItem('danalog_user', JSON.stringify(csUser));
            return true;
        }

        // SUPPORT DRIVER PATTERN: e.g. tiennd
        // Simple regex check: alphanumeric, 4+ chars? Or just whitelist common ones for demo
        const driverPatterns = ['tiennd', 'anhnv', 'thanhnv', 'driver_user'];
        if (driverPatterns.includes(username) && password === 'driver123') {
            const nameMap: Record<string, string> = {
                'tiennd': 'Nguyễn Đức Tiên',
                'anhnv': 'Nguyễn Văn Anh',
                'thanhnv': 'Nguyễn Văn Thành',
                'driver_user': 'Người lái xe'
            };
            const driverUser: User = {
                username: username,
                role: 'DRIVER',
                name: nameMap[username] || 'Nguyễn Văn A'
            };
            setUser(driverUser);
            localStorage.setItem('danalog_user', JSON.stringify(driverUser));
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('danalog_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
