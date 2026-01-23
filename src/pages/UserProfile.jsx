import React, { useEffect, useState, useRef } from 'react';
import {
    User, Mail, Shield, Smartphone, Bot, MessageSquare,
    Edit2, Check, X, Camera, Calendar, Sparkles, Zap,
    CreditCard, Settings2, Loader2
} from 'lucide-react';
import axios from 'axios';
import { apis, AppRoute } from '../types';
import { getUserData, userData, setUserData } from '../userStore/userData';
import { chatStorageService } from '../services/chatStorageService';
import { useNavigate } from 'react-router';
import { useRecoilState } from 'recoil';

const UserProfile = () => {
    const [currentUserData, setCurrentUserData] = useRecoilState(userData);
    const user = currentUserData.user;
    const [agents, setAgents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const avatarInputRef = useRef(null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getUserData()?.token;
                if (!token) return;

                // Fetch User Data
                const userRes = await axios.get(apis.user, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCurrentUserData({ user: userRes.data });
                setUserData(userRes.data); // Update localStorage via helper
                setNewName(userRes.data.name);

                // Fetch Agents
                const agentsRes = await axios.get(apis.getMyAgents, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAgents(agentsRes.data || []);

                // Fetch Chat Sessions
                const sessionsData = await chatStorageService.getSessions();
                setSessions(sessionsData || []);

            } catch (error) {
                console.error("Error fetching profile data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleUpdateName = async () => {
        if (!newName.trim() || newName === user.name) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            const token = getUserData()?.token;
            const res = await axios.put(apis.user, { name: newName }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setCurrentUserData({ user: res.data });
            setUserData(res.data); // Update localStorage via helper

            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update name", error);
            alert("Failed to update name");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Avatar = reader.result;
            try {
                const token = getUserData()?.token;
                // Update local state immediately for preview
                const updatedUser = { ...user, avatar: base64Avatar };
                setCurrentUserData({ user: updatedUser });
                setUserData(updatedUser);

                // Send to backend
                await axios.put(apis.user, { avatar: base64Avatar }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Avatar upload failed", error);
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-full w-full overflow-y-auto bg-secondary font-sans scrollbar-thin scrollbar-thumb-border">
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />

            {/* Banner Area */}
            <div className="relative h-60 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-primary to-blue-600 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-12 -mt-24 relative z-10">

                {/* Profile Header Card */}
                <div className="bg-surface/80 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start md:items-end">

                    {/* Avatar */}
                    <div className="relative group shrink-0" onClick={() => avatarInputRef.current.click()}>
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-surface border-4 border-surface shadow-xl overflow-hidden flex items-center justify-center text-primary text-5xl font-bold uppercase relative z-10 cursor-pointer">
                            {user.avatar && user.avatar !== '/User.jpeg' ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                    {user.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        {/* Edit Avatar Overlay */}
                        <div className="absolute inset-0 z-20 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-4 border-transparent">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0 pb-2 space-y-3 w-full">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/10">
                                {user.role || "Member"}
                            </span>
                            {user.isVerified && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-600 text-[10px] font-bold border border-yellow-400/20">
                                    <Sparkles className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>

                        {/* Editable Name */}
                        <div className="flex items-center gap-3 h-12">
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-full max-w-md animate-in fade-in slide-in-from-left-2 duration-200">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 bg-secondary border-2 border-primary/30 rounded-xl px-4 py-2 text-xl md:text-2xl font-bold text-maintext focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={isSaving}
                                        className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setNewName(user.name);
                                        }}
                                        className="p-2.5 bg-secondary border border-border text-subtext rounded-xl hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <h1
                                        onClick={() => setIsEditing(true)}
                                        className="text-3xl md:text-4xl font-bold text-maintext tracking-tight truncate cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {user.name}
                                    </h1>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        aria-label="Edit Name"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-subtext">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-subtext/70" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-subtext/70" />
                                Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <button className="px-6 py-3 bg-secondary hover:bg-surface text-maintext border border-border rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 whitespace-nowrap">
                            <Settings2 className="w-4 h-4" /> Account Settings
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    <StatsCard
                        icon={<Bot className="w-6 h-6 text-blue-600" />}
                        label="Active Agents"
                        value={agents.length}
                        subLabel="Assistants deployed"
                        color="bg-blue-500/10"
                        borderColor="group-hover:border-blue-500/30"
                    />
                    <StatsCard
                        icon={<MessageSquare className="w-6 h-6 text-violet-600" />}
                        label="Total Sessions"
                        value={sessions.length}
                        subLabel="Conversations stored"
                        color="bg-violet-500/10"
                        borderColor="group-hover:border-violet-500/30"
                    />
                    <StatsCard
                        icon={<Zap className="w-6 h-6 text-yellow-600" />}
                        label="Pro Features"
                        value={user.plan === 'pro' ? 'Active' : 'Inactive'}
                        subLabel="Subscription status"
                        color="bg-yellow-500/10"
                        borderColor="group-hover:border-yellow-500/30"
                    />
                    <StatsCard
                        icon={<CreditCard className="w-6 h-6 text-green-600" />}
                        label="Credits"
                        value="∞"
                        subLabel="Usage limit"
                        color="bg-green-500/10"
                        borderColor="group-hover:border-green-500/30"
                    />
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                    {/* My Agents */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-maintext">My Agents</h3>
                            <button
                                onClick={() => navigate(AppRoute.MY_AGENTS)}
                                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                View All
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {agents.slice(0, 4).map((agent) => (
                                <div
                                    key={agent._id || agent.id}
                                    onClick={() => navigate(AppRoute.MY_AGENTS)}
                                    className="bg-surface p-4 rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group flex items-start gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border group-hover:border-primary/20 transition-colors">
                                        {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" /> : <Bot className="w-6 h-6 text-subtext" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-maintext truncate group-hover:text-primary transition-colors">{agent.name}</h4>
                                        <p className="text-xs text-subtext line-clamp-2 mt-1">{agent.description || "No description available."}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${agent.category === 'productivity' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-secondary text-subtext'
                                                }`}>
                                                {agent.category || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {agents.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl bg-surface/30">
                                    <Bot className="w-10 h-10 text-subtext mx-auto mb-3 opacity-50" />
                                    <p className="text-subtext font-medium">No agents found yet</p>
                                    <button onClick={() => navigate(AppRoute.MY_AGENTS)} className="mt-2 text-primary font-bold text-sm hover:underline">Create your first agent</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Chats */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-maintext">Recent Chats</h3>
                        </div>

                        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                            {sessions.slice(0, 5).map((session, i) => (
                                <div
                                    key={session.sessionId || i}
                                    onClick={() => navigate(`/dashboard/chat/${session.sessionId}`)}
                                    className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-maintext text-sm truncate group-hover:text-indigo-600 transition-colors">
                                            {session.title || "New Chat"}
                                        </h4>
                                        <p className="text-xs text-subtext truncate mt-0.5">
                                            {new Date(session.lastModified).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="p-8 text-center text-subtext text-sm">
                                    No chat history available.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

const StatsCard = ({ icon, label, value, subLabel, color, borderColor }) => (
    <div className={`bg-surface p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group ${borderColor} border-l-4`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                {icon}
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold text-maintext mb-1">{value}</p>
            <p className="text-sm font-semibold text-maintext">{label}</p>
            <p className="text-xs text-subtext mt-1">{subLabel}</p>
        </div>
    </div>
);

export default UserProfile;
