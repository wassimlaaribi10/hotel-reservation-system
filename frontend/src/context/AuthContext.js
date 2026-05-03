import React, { createContext, useState, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await API.post('/auth/login', { email, password });
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            setUser(user);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = { user, login, logout, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};