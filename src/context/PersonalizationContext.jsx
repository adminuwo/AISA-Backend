import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apis } from '../types';
import { getUserData } from '../userStore/userData';
import toast from 'react-hot-toast';

const PersonalizationContext = createContext();

const DEFAULT_PREFERENCES = {
    general: {
        language: 'English',
        theme: 'System',
        responseSpeed: 'Balanced',
        screenReader: false,
        highContrast: false
    },
    notifications: {
        responses: 'Push',
        groupChats: 'Push',
        tasks: 'Push, Email',
        projects: 'Email',
        recommendations: 'Push, Email'
    },
    personalization: {
        fontSize: 'Medium',
        fontStyle: 'Default',
        enthusiasm: 'Medium',
        formality: 'Medium',
        creativity: 'Medium',
        structuredResponses: false,
        bulletPoints: false,
        customInstructions: '',
        emojiUsage: 'Moderate'
    },
    apps: {},
    dataControls: {
        chatHistory: 'On',
        trainingDataUsage: true
    },
    security: {
        twoFactor: false
    },
    parentalControls: {
        enabled: false,
        ageCategory: 'Adult',
        contentFilter: false,
        timeLimits: false
    },
    account: {
        nickname: ''
    }
};

export const PersonalizationProvider = ({ children }) => {
    const [personalizations, setPersonalizationsState] = useState(() => {
        const saved = localStorage.getItem('personalizations');
        return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    });
    const [notifications, setNotifications] = useState([]);
    const [chatSessions, setChatSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const user = getUserData();

    const fetchChatSessions = async () => {
        if (!user?.token) return;
        try {
            const res = await axios.get(apis.chatAgent, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setChatSessions(res.data || []);
        } catch (error) {
            console.error('Failed to fetch chat sessions', error);
        }
    };

    const fetchNotifications = async () => {
        if (!user?.token) return;
        try {
            const res = await axios.get(apis.user + '/notifications', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error.response?.data || error.message);
        }
    };

    const deleteNotification = async (notifId) => {
        setNotifications(prev => prev.filter(n => n.id !== notifId));
        try {
            if (user?.token) {
                await axios.delete(`${apis.user}/notifications/${notifId}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
            }
        } catch (error) {
            console.error('Failed to delete notification', error);
            fetchNotifications();
        }
    };

    const clearAllNotifications = async () => {
        setNotifications([]);
        try {
            if (user?.token) {
                await axios.delete(`${apis.user}/notifications`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
            }
        } catch (error) {
            console.error('Failed to clear notifications', error);
            fetchNotifications();
        }
    };

    const fetchPersonalizations = async () => {
        if (!user?.token) return;
        setIsLoading(true);
        try {
            const res = await axios.get(apis.user, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.data.personalizations) {
                const merged = { ...DEFAULT_PREFERENCES, ...res.data.personalizations };
                setPersonalizationsState(merged);
                localStorage.setItem('personalizations', JSON.stringify(merged));
                applyDynamicStyles(merged);
            } else {
                setPersonalizationsState(prev => prev || DEFAULT_PREFERENCES);
            }
        } catch (error) {
            console.error('Failed to fetch personalizations', error);
            setPersonalizationsState(prev => prev || DEFAULT_PREFERENCES);
        } finally {
            setIsLoading(false);
        }
    };

    const applyDynamicStyles = (prefs = personalizations) => {
        const fontSize = prefs?.personalization?.fontSize || 'Medium';
        const fontSizeMap = {
            'Small': '14px',
            'Medium': '16px',
            'Large': '20px',
            'Extra Large': '24px'
        };
        document.documentElement.style.setProperty('--aisa-font-size', fontSizeMap[fontSize]);
        const scaleMap = { 'Small': '0.9', 'Medium': '1', 'Large': '1.2', 'Extra Large': '1.4' };
        document.documentElement.style.setProperty('--aisa-scale', scaleMap[fontSize]);
    };

    useEffect(() => {
        if (user?.token) {
            fetchPersonalizations();
            fetchNotifications();
            fetchChatSessions();
        }
        applyDynamicStyles();
    }, [user?.token]);

    const updatePersonalization = async (section, data) => {
        setPersonalizationsState(prev => {
            const next = {
                ...prev,
                [section]: { ...(prev?.[section] || {}), ...data }
            };
            localStorage.setItem('personalizations', JSON.stringify(next));
            applyDynamicStyles(next);
            syncWithBackend(section, { ...(prev?.[section] || {}), ...data });
            return next;
        });
    };

    const syncWithBackend = async (section, fullSectionData) => {
        try {
            if (user?.token) {
                await axios.put(apis.user + '/personalizations',
                    { personalizations: { [section]: fullSectionData } },
                    { headers: { 'Authorization': `Bearer ${user.token}` } }
                );
            }
        } catch (error) {
            console.error('Failed to sync personalization', error);
            toast.error('Failed to sync settings');
        }
    };

    const resetPersonalizations = async () => {
        try {
            if (user?.token) {
                await axios.post(apis.user + '/personalizations/reset', {}, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                setPersonalizationsState(DEFAULT_PREFERENCES);
                localStorage.setItem('personalizations', JSON.stringify(DEFAULT_PREFERENCES));
                applyDynamicStyles(DEFAULT_PREFERENCES);
                toast.success('Settings reset to defaults');
            }
        } catch (error) {
            console.error('Failed to reset personalizations', error);
            toast.error('Failed to reset settings');
        }
    };

    return (
        <PersonalizationContext.Provider value={{
            personalizations,
            updatePersonalization,
            resetPersonalizations,
            isLoading,
            notifications,
            deleteNotification,
            clearAllNotifications,
            chatSessions,
            refreshChatSessions: fetchChatSessions
        }}>
            {children}
        </PersonalizationContext.Provider>
    );
};

export const usePersonalization = () => {
    const context = useContext(PersonalizationContext);
    if (!context) {
        throw new Error('usePersonalization must be used within a PersonalizationProvider');
    }
    return context;
};
