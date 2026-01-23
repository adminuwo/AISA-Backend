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
                    <div className="p-3 space-y-5 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">App Language</label>
                            <select
                                value={personalizations.general?.language || 'English'}
                                onChange={(e) => updatePersonalization('general', { language: e.target.value })}
                                className="w-full bg-secondary text-sm p-2.5 rounded-lg border border-border outline-none focus:border-primary transition-colors"
                            >
                                <option>English</option>
                                <option>Hindi</option>
                                <option>Hinglish</option>
                                <option>Auto-Detect</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Theme Preference</label>
                            <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                                {['Light', 'System', 'Dark'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            updatePersonalization('general', { theme: m });
                                            if (m !== 'System') setTheme(m.toLowerCase());
                                        }}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${personalizations.general?.theme === m ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-subtext hover:text-maintext'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Text Size</label>
                            <div className="flex gap-2">
                                {['Small', 'Medium', 'Large'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updatePersonalization('general', { fontSize: s })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${personalizations.general?.fontSize === s ? 'bg-primary text-white border-primary' : 'bg-transparent text-subtext border-border'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Accessibility</label>
                            {renderSettingToggle('general', 'screenReader', 'Screen Reader Support', '')}
                            {renderSettingToggle('general', 'highContrast', 'High Contrast Mode', '')}
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="p-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                        {renderSettingToggle('notifications', 'newMessage', 'New Message Alerts', 'Get notified for every AI response')}
                        {renderSettingToggle('notifications', 'aiTips', 'AI Tips & Suggestions', 'Receive helpful context-aware hints')}
                        {renderSettingToggle('notifications', 'productUpdates', 'Product Announcements', 'Stay updated with new features')}
                        {renderSettingToggle('notifications', 'emailAlerts', 'Email Notifications', 'Receive weekly summaries via email')}
                        {renderSettingToggle('notifications', 'soundAlerts', 'Sound Effects', 'Play subtle sounds for actions')}
                    </div>
                );
            case 'personalization':
                return (
                    <div className="p-3 space-y-6 animate-in fade-in slide-in-from-top-1">
                        {/* Base Style */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Base Persona</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Default', 'Professional', 'Friendly', 'Casual', 'Technical', 'Mentor'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => updatePersonalization('personalization', { baseStyle: style })}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium text-left transition-all border ${personalizations.personalization?.baseStyle === style ? 'bg-primary/5 border-primary text-primary' : 'bg-transparent border-border text-subtext hover:border-border/80'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Characteristics Sliders */}
                        <div className="space-y-4 pt-2 border-t border-border/50">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Personality Traits</label>
                            {['Warmth', 'Enthusiasm', 'Formality', 'Creativity'].map(trait => (
                                <div key={trait} className="space-y-1">
                                    <div className="flex justify-between text-xs text-maintext">
                                        <span>{trait}</span>
                                        <span className="text-primary font-medium">{personalizations.personalization?.[trait.toLowerCase()] || 'Medium'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="3" step="1"
                                        value={['Low', 'Medium', 'High'].indexOf(personalizations.personalization?.[trait.toLowerCase()] || 'Medium') + 1}
                                        onChange={(e) => updatePersonalization('personalization', { [trait.toLowerCase()]: ['Low', 'Medium', 'High'][parseInt(e.target.value) - 1] })}
                                        className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Output Preferences */}
                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Output Format</label>
                            {renderSettingToggle('personalization', 'structuredResponses', 'Structured Responses', 'Prefer headers and organized sections')}
                            {renderSettingToggle('personalization', 'bulletPoints', 'Use Bullet Points', 'Break down information into lists')}
                        </div>

                        {/* Custom Instructions */}
                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">System Instructions</label>
                            <textarea
                                value={personalizations.personalization?.customInstructions || ''}
                                onChange={(e) => updatePersonalization('personalization', { customInstructions: e.target.value })}
                                placeholder="e.g. 'Always answer in 3 sentences', 'Be strictly Socratic'..."
                                className="w-full h-28 bg-secondary/50 text-sm p-3 rounded-xl border border-border outline-none focus:border-primary resize-none transition-all placeholder:text-subtext/50"
                            />
                        </div>
                    </div>
                );
            case 'apps':
                return (
                    <div className="p-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <div className="p-4 bg-secondary/30 rounded-xl text-center border border-dashed border-border mb-2">
                            <p className="text-sm font-medium text-maintext">No Active Integrations</p>
                            <p className="text-xs text-subtext mt-1">Connect tools like Notion, Gmail, or Drive to give AI more capabilities.</p>
                        </div>
                        <button className="w-full py-2.5 rounded-xl border border-primary text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                            Browse App Marketplace
                        </button>
                    </div>
                );
            case 'data':
                return (
                    <div className="p-3 space-y-5 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Chat Retention</label>
                            <div className="flex gap-2">
                                {['Indefinite', 'Auto-Delete (30 Days)', 'Off'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updatePersonalization('dataControls', { chatHistory: c })}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${personalizations.dataControls?.chatHistory === c ? 'bg-primary text-white border-primary' : 'bg-transparent text-subtext border-border'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {renderSettingToggle('dataControls', 'trainingDataUsage', 'Improve Model', 'Allow anonymized chats to train future models')}

                        <div className="pt-2 border-t border-border/50 space-y-2">
                            <button className="w-full py-2.5 rounded-lg text-xs font-bold text-maintext hover:bg-secondary transition-colors text-left px-3">
                                Download My Data
                            </button>
                            <button className="w-full py-2.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/5 transition-colors text-left px-3">
                                Delete All Conversations
                            </button>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="p-3 space-y-4 animate-in fade-in slide-in-from-top-1">
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary transition-colors border border-border group">
                            <span className="text-sm font-medium text-maintext">Change Password</span>
                        </button>
                        <div className="space-y-2 pt-2 border-t border-border/50">
                            {renderSettingToggle('security', 'twoFactor', 'Two-Factor Authentication', 'Require code on new login')}
                        </div>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary transition-colors border border-border mt-2">
                            <span className="text-sm font-medium text-maintext">Active Sessions</span>
                            <span className="text-xs text-subtext">3 Devices</span>
                        </button>
                        <button onClick={onLogout} className="w-full py-2.5 rounded-lg text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-colors mt-2">
                            Sign Out Everywhere
                        </button>
                    </div>
                );
            case 'parental':
                return (
                    <div className="p-3 space-y-5 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">User Maturity Profile</label>
                            <div className="flex gap-2">
                                {['Child', 'Teen', 'Adult'].map(a => (
                                    <button
                                        key={a}
                                        onClick={() => updatePersonalization('parentalControls', { ageCategory: a })}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${personalizations.parentalControls?.ageCategory === a ? 'bg-primary text-white border-primary' : 'bg-transparent text-subtext border-border'}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {renderSettingToggle('parentalControls', 'contentFilter', 'Strict Content Filtering', 'Blocks all sensitive and mature topics')}
                        {renderSettingToggle('parentalControls', 'timeLimits', 'Daily Time Limits', 'Notify when usage exceeds 2 hours')}
                    </div>
                );
            case 'account':
                return (
                    <div className="p-3 space-y-5 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-maintext uppercase tracking-wider opacity-70">Preferred Name</label>
                            <input
                                type="text"
                                value={personalizations.account?.nickname || ''}
                                onChange={(e) => updatePersonalization('account', { nickname: e.target.value })}
                                placeholder="What should AI call you?"
                                className="w-full bg-secondary/50 text-sm p-2.5 rounded-lg border border-border outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Current Plan</span>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Active</span>
                            </div>
                            <p className="text-lg font-bold text-maintext">AISA Pro Unlimited</p>
                        </div>
                        <button className="w-full py-2 text-xs font-medium text-red-500 hover:underline text-left px-1">
                            Delete Account
                        </button>
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
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-maintext">Settings</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
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
                                <div className="flex items-center">
                                    <span className={`text-sm font-medium ${activeSection === section.id ? 'text-primary' : 'text-maintext'}`}>
                                        {section.label}
                                    </span>
                                </div>
                                {activeSection === section.id ? (
                                    <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-subtext/50 group-hover:text-primary transition-colors" />
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
            <div className="p-2 border-t border-border bg-secondary/10 flex gap-2">
                <button
                    onClick={resetPersonalizations}
                    className="flex-1 py-2 text-[10px] font-bold text-subtext hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all uppercase tracking-widest"
                >
                    Reset Defaults
                </button>
                <div className="w-[1px] h-4 bg-border self-center" />
                <button
                    onClick={onLogout}
                    className="flex-1 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all uppercase tracking-widest"
                >
                    Log Out
                </button>
            </div>
        </motion.div>
    );
};

export default ProfileSettingsDropdown;
