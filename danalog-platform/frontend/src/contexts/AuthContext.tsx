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
    login: (username: string, password: string, remember: boolean) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
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
    const [isLoading, setIsLoading] = useState(true);

    // Check for persisted session on load
    useEffect(() => {
        const savedUser = localStorage.getItem('danalog_user') || sessionStorage.getItem('danalog_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from storage");
                localStorage.removeItem('danalog_user');
                sessionStorage.removeItem('danalog_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string, remember: boolean): Promise<boolean> => {
        // MOCK AUTHENTICATION
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        let authenticatedUser: User | null = null;

        if (username === 'admin' && password === 'admin123') {
            authenticatedUser = { username: 'admin', role: 'ADMIN', name: 'Administrator' };
        } else if (username === 'cs_user' && password === 'password123') {
            authenticatedUser = { username: 'cs_user', role: 'CS', name: 'CS Staff' };
        } else {
            // SUPPORT DRIVER PATTERN: e.g. tiennd
            const driverPatterns = ['tiennd', 'anhnv', 'thanhnv', 'driver_user'];
            if (driverPatterns.includes(username) && password === 'driver123') {
                const nameMap: Record<string, string> = {
                    'tiennd': 'Nguyễn Đức Tiên',
                    'anhnv': 'Nguyễn Văn Anh',
                    'thanhnv': 'Nguyễn Văn Thành',
                    'driver_user': 'Người lái xe'
                };
                authenticatedUser = {
                    username: username,
                    role: 'DRIVER',
                    name: nameMap[username] || 'Nguyễn Văn A'
                };
            }
        }

        if (authenticatedUser) {
            setUser(authenticatedUser);
            if (remember) {
                localStorage.setItem('danalog_user', JSON.stringify(authenticatedUser));
            } else {
                sessionStorage.setItem('danalog_user', JSON.stringify(authenticatedUser));
            }
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('danalog_user');
        sessionStorage.removeItem('danalog_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
