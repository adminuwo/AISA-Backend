import React from 'react';
import { X, Cookie, Settings2, BarChart3, Shield, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { name } from '../../constants';

const CookiePolicyModal = ({ isOpen, onClose }) => {
    const sections = [
        {
            icon: Cookie,
            title: "What Are Cookies?",
            items: [
                "Definition: Small text files placed on your device when you visit AISA™",
                "Purpose: Recognize you and remember your preferences",
                "Duration: Some expire when you close browser, others persist longer"
            ]
        },
        {
            icon: Settings2,
            title: "Types of Cookies We Use",
            items: [
                "Essential (Required): Authentication, session management, security",
                "Preference: Language, theme (light/dark), notification settings",
                "Analytics (Optional): Usage tracking with your consent to improve services",
                "Functional: Chat history sync, AI agent selection, feature preferences"
            ]
        },
        {
            icon: Smartphone,
            title: "Local Storage & Session Storage",
            items: [
                "Chat Sessions: Stored locally for quick access and offline capability",
                "User Preferences: Settings like AI agent and interface customizations",
                "Session Management: Active chat state, expires when browser closes",
                "Data Control: Delete individual chats or clear all data anytime"
            ]
        },
        {
            icon: BarChart3,
            title: "Third-Party Cookies",
            items: [
                "Analytics: Anonymized usage data to understand engagement",
                "AI Providers: Secure query processing with encryption",
                "Payment: Fraud prevention during transactions",
                "Control: Review partner privacy policies for their practices"
            ]
        },
        {
            icon: Shield,
            title: "Your Cookie Choices",
            items: [
                "Browser Controls: Block, delete, or get warnings about cookies",
                "Opt-Out: Disable analytics from profile settings under Privacy & Data",
                "Do Not Track: We respect DNT signals from your browser",
                "Impact: Blocking may limit features like auto-login and preferences"
            ]
        }
    ];



    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-border"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border bg-purple-500/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Cookie className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-maintext">Cookie Policy</h2>
                                <p className="text-xs text-subtext mt-0.5">Last Updated: January 22, 2026</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-surface rounded-lg transition-colors text-subtext hover:text-maintext"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Introduction */}
                        <div className="bg-surface rounded-xl p-4 border border-border">
                            <p className="text-sm text-maintext leading-relaxed">
                                This Cookie Policy explains how {name}™ uses cookies and similar technologies
                                to enhance your experience. You can control cookie preferences anytime.
                            </p>
                        </div>

                        {/* Sections */}
                        {sections.map((section, index) => (
                            <div key={index} className="bg-surface rounded-xl p-5 border border-border hover:border-purple-500/30 transition-all">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <section.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-maintext pt-1">{section.title}</h3>
                                </div>
                                <ul className="ml-13 space-y-2">
                                    {section.items.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-subtext">
                                            <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                                            <span className="flex-1">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}



                        {/* Contact */}
                        <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl p-5 border border-purple-500/20">
                            <h3 className="text-lg font-bold text-maintext mb-3">Questions About Cookies?</h3>
                            <div className="space-y-1.5 text-sm text-subtext">
                                <p><strong className="text-maintext">Email:</strong> <a href="mailto:admin@uwo24.com" className="text-primary hover:underline">admin@uwo24.com</a></p>
                                <p><strong className="text-maintext">Phone:</strong> <a href="tel:+918359890909" className="text-primary hover:underline">+91 83589 90909</a></p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-surface flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-600/20"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CookiePolicyModal;
