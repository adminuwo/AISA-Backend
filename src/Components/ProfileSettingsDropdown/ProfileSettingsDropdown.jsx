import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2, Bell, User, Shield, AppWindow,
    Database, Lock, ChevronRight,
    ChevronDown, X, Globe, Sun, Moon, Type,
    Zap, Sparkles, MessageSquare, List, Hash,
    Smile, Send, Trash2, LogOut, Check
} from 'lucide-react';
import { usePersonalization } from '../../context/PersonalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const ProfileSettingsDropdown = ({ onClose, onLogout }) => {
    const { personalizations, updatePersonalization, resetPersonalizations, isLoading } = usePersonalization();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [activeSection, setActiveSection] = useState(null);

    const sections = [
        { id: 'general', label: 'General', icon: Settings2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'personalization', label: 'Personalization', icon: Sparkles, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'apps', label: 'Apps', icon: AppWindow, color: 'text-green-500', bg: 'bg-green-500/10' },
        { id: 'data', label: 'Data Controls', icon: Database, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { id: 'security', label: 'Security', icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' },
        { id: 'parental', label: 'Parental Controls', icon: Lock, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { id: 'account', label: 'Account', icon: User, color: 'text-blue-600', bg: 'bg-blue-600/10' }
    ];

    const toggleSection = (id) => {
        setActiveSection(activeSection === id ? null : id);
    };

    const renderSettingToggle = (section, key, label, description) => {
        const val = personalizations?.[section]?.[key] ?? false;
        return (
            <div className="flex items-center justify-between py-2 group">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-maintext">{label}</span>
                    {description && <span className="text-[10px] text-subtext leading-tight">{description}</span>}
                </div>
                <button
                    onClick={() => updatePersonalization(section, { [key]: !val })}
                    className={`w-9 h-5 rounded-full p-1 transition-all duration-300 ${val ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${val ? 'translate-x-4' : ''}`} />
                </button>
            </div>
        );
    };

    const renderSectionContent = () => {
        if (!personalizations) return <div className="p-4 text-center text-subtext animate-pulse">Loading settings...</div>;

        switch (activeSection) {
            case 'general':
                return (
                    <div className="p-3 space-y-4 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Language</label>
                            <select
                                value={personalizations.general?.language || 'English'}
                                onChange={(e) => updatePersonalization('general', { language: e.target.value })}
                                className="w-full bg-secondary text-sm p-2 rounded-lg border border-border outline-none focus:border-primary"
                            >
                                <option>English</option>
                                <option>Hindi</option>
                                <option>Hinglish</option>
                                <option>Auto-Detect</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Theme</label>
                            <div className="flex gap-1">
                                {['Light', 'Dark', 'System'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            updatePersonalization('general', { theme: m });
                                            if (m !== 'System') setTheme(m.toLowerCase());
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.general?.theme === m ? 'bg-primary text-white border-primary' : 'bg-secondary text-subtext border-border hover:border-primary/50'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Response Speed</label>
                            <div className="flex gap-1">
                                {['Fast', 'Balanced', 'Detailed'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updatePersonalization('general', { responseSpeed: s })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.general?.responseSpeed === s ? 'bg-primary text-white border-primary' : 'bg-secondary text-subtext border-border hover:border-primary/50'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="p-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                        {renderSettingToggle('notifications', 'newMessage', 'New messages', 'Alert me for new AI responses')}
                        {renderSettingToggle('notifications', 'aiTips', 'AI tips & suggestions', 'Show context-aware help')}
                        {renderSettingToggle('notifications', 'productUpdates', 'Product updates', 'News about AISA features')}
                        {renderSettingToggle('notifications', 'soundAlerts', 'Sound alerts', 'Play sound on new messages')}
                    </div>
                );
            case 'personalization':
                return (
                    <div className="p-3 space-y-4 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Base Style</label>
                            <div className="grid grid-cols-2 gap-1">
                                {['Default', 'Professional', 'Friendly', 'Casual', 'Technical', 'Mentor-like'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => updatePersonalization('personalization', { baseStyle: style })}
                                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.personalization?.baseStyle === style ? 'bg-orange-500 text-white border-orange-500' : 'bg-secondary text-subtext border-border hover:border-orange-500/50'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Emoji Usage</label>
                            <div className="flex gap-1">
                                {['None', 'Minimal', 'Moderate', 'Expressive'].map(e => (
                                    <button
                                        key={e}
                                        onClick={() => updatePersonalization('personalization', { emojiUsage: e })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.personalization?.emojiUsage === e ? 'bg-primary text-white border-primary' : 'bg-secondary text-subtext border-border hover:border-primary/50'}`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Custom Instructions</label>
                            <textarea
                                value={personalizations.personalization?.customInstructions || ''}
                                onChange={(e) => updatePersonalization('personalization', { customInstructions: e.target.value })}
                                placeholder="How should the AI behave, think, or respond?"
                                className="w-full h-24 bg-secondary text-sm p-3 rounded-xl border border-border outline-none focus:border-orange-500 resize-none"
                            />
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="p-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-surface transition-colors border border-border group">
                            <div className="flex items-center gap-3">
                                <Lock className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-semibold text-maintext">Change Password</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-subtext group-hover:text-primary" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-surface transition-colors border border-border group">
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-semibold text-maintext">Active Sessions</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-subtext group-hover:text-primary" />
                        </button>
                        <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-bold">Logout from all devices</span>
                        </button>
                    </div>
                );
            case 'account':
                return (
                    <div className="p-3 space-y-4 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Nickname</label>
                            <input
                                type="text"
                                value={personalizations.account?.nickname || ''}
                                onChange={(e) => updatePersonalization('account', { nickname: e.target.value })}
                                placeholder="AI uses this name..."
                                className="w-full bg-secondary text-sm p-2 rounded-lg border border-border outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Current Plan</p>
                                <p className="text-sm font-black text-maintext">AISA Pro Unlimited</p>
                            </div>
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                    </div>
                );
            case 'parental':
                return (
                    <div className="p-3 space-y-4 animate-in fade-in slide-in-from-top-1">
                        {renderSettingToggle('parentalControls', 'enabled', 'Enable Content Filter', 'Restrict mature or sensitive topics')}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Age Category</label>
                            <div className="flex gap-1">
                                {['Child', 'Teen', 'Adult'].map(a => (
                                    <button
                                        key={a}
                                        onClick={() => updatePersonalization('parentalControls', { ageCategory: a })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.parentalControls?.ageCategory === a ? 'bg-pink-500 text-white border-pink-500' : 'bg-secondary text-subtext border-border hover:border-pink-500/50'}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="p-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2 mb-3">
                            <label className="text-[10px] font-bold text-subtext uppercase tracking-wider">Chat History</label>
                            <div className="flex gap-1">
                                {['On', 'Auto-delete', 'Off'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updatePersonalization('dataControls', { chatHistory: c })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.dataControls?.chatHistory === c ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-secondary text-subtext border-border hover:border-cyan-500/50'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {renderSettingToggle('dataControls', 'trainingDataUsage', 'Training data usage', 'Allow AI to learn from chats')}
                        <button className="w-full flex items-center gap-3 p-3 mt-2 rounded-xl bg-secondary hover:bg-surface transition-colors border border-border text-sm font-semibold">
                            <Hash className="w-4 h-4 text-subtext" /> Export all data
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500/10 transition-colors text-sm font-bold">
                            <Trash2 className="w-4 h-4" /> Delete all chat data
                        </button>
                    </div>
                );
            case 'apps':
                return (
                    <div className="p-3 space-y-3 animate-in fade-in slide-in-from-top-1 text-center py-8">
                        <AppWindow className="w-12 h-12 text-subtext/30 mx-auto mb-2" />
                        <p className="text-xs text-subtext font-medium">No external apps connected.</p>
                        <button className="text-xs font-bold text-primary hover:underline">Explore Marketplace</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-3 mx-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[500px]"
        >
            {/* Header */}
            <div className="p-4 border-b border-border bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-maintext leading-tight">AI Personalization</h2>
                        <p className="text-[10px] text-subtext font-bold uppercase tracking-tighter">Profile Settings</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                    <X className="w-4 h-4 text-subtext" />
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-1">
                    {sections.map(section => (
                        <div key={section.id} className="space-y-1">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${activeSection === section.id ? 'bg-secondary shadow-sm' : 'hover:bg-secondary/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${section.bg} ${section.color} group-hover:scale-110 transition-transform`}>
                                        <section.icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-bold ${activeSection === section.id ? 'text-primary' : 'text-maintext'}`}>
                                        {section.label}
                                    </span>
                                </div>
                                {activeSection === section.id ? (
                                    <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                                )}
                            </button>

                            <AnimatePresence>
                                {activeSection === section.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-secondary/30 rounded-xl"
                                    >
                                        <div className="border-t border-border/5">
                                            {renderSectionContent()}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-border bg-secondary/20 flex gap-2">
                <button
                    onClick={resetPersonalizations}
                    className="flex-1 py-2 text-[10px] font-bold text-subtext hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-3 h-3" /> Reset Defaults
                </button>
                <div className="w-[1px] h-4 bg-border self-center" />
                <button
                    onClick={onLogout}
                    className="flex-1 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <LogOut className="w-3 h-3" /> Log Out
                </button>
            </div>
        </motion.div>
    );
};

export default ProfileSettingsDropdown;
