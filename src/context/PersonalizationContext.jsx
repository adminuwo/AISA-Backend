import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apis } from '../types';
import { getUserData } from '../userStore/userData';
import toast from 'react-hot-toast';

const PersonalizationContext = createContext();

export const usePersonalization = () => {
    const context = useContext(PersonalizationContext);
    if (!context) {
        throw new Error('usePersonalization must be used within a PersonalizationProvider');
    }
    return context;
};

export const PersonalizationProvider = ({ children }) => {
    const [personalizations, setPersonalizationsState] = useState(() => {
        const saved = localStorage.getItem('personalizations');
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    const user = getUserData();

    useEffect(() => {
        if (user?.token && !personalizations) {
            fetchPersonalizations();
        }
    }, [user?.token]);

    const fetchPersonalizations = async () => {
        if (!user?.token) return;
        setIsLoading(true);
        try {
            const res = await axios.get(apis.user, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.data.personalizations) {
                setPersonalizationsState(res.data.personalizations);
                localStorage.setItem('personalizations', JSON.stringify(res.data.personalizations));
            }
        } catch (error) {
            console.error('Failed to fetch personalizations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updatePersonalization = async (section, data) => {
        const fallback = { ...personalizations };
        const updated = {
            ...personalizations,
            [section]: { ...(personalizations?.[section] || {}), ...data }
        };

        // Optimistic update
        setPersonalizationsState(updated);
        localStorage.setItem('personalizations', JSON.stringify(updated));

        try {
            if (user?.token) {
                await axios.put(apis.user + '/personalizations',
                    { personalizations: { [section]: updated[section] } },
                    { headers: { 'Authorization': `Bearer ${user.token}` } }
                );
                // toast.success('Preference updated');
            }
        } catch (error) {
            console.error('Failed to save personalization', error);
            toast.error('Failed to save settings');
            setPersonalizationsState(fallback);
            localStorage.setItem('personalizations', JSON.stringify(fallback));
        }
    };

    const resetPersonalizations = async () => {
        try {
            if (user?.token) {
                await axios.post(apis.user + '/personalizations/reset', {}, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                setPersonalizationsState(null); // Will be re-fetched or use defaults
                localStorage.removeItem('personalizations');
                toast.success('Settings reset to defaults');
                fetchPersonalizations();
            }
        } catch (error) {
            console.error('Failed to reset personalizations', error);
            toast.error('Failed to reset settings');
        }
    };

    return (
        <PersonalizationContext.Provider value={{ personalizations, updatePersonalization, resetPersonalizations, isLoading }}>
            {children}
        </PersonalizationContext.Provider>
    );
};
