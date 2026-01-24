import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    ArrowRight, Bot, Zap, Shield, CircleUser,
    Github,
    Linkedin, Mail, MapPin, Phone, Facebook, Instagram, Youtube, MessageSquare, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logo, name, faqs } from '../constants';
import { getUserData } from '../userStore/userData';
import { AppRoute } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, X, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { apis } from '../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import PrivacyPolicyModal from '../Components/PolicyModals/PrivacyPolicyModal';
import TermsOfServiceModal from '../Components/PolicyModals/TermsOfServiceModal';
import CookiePolicyModal from '../Components/PolicyModals/CookiePolicyModal';
import AboutAISA from '../Components/AboutAISA';

const Landing = () => {
    const navigate = useNavigate();
    const user = getUserData();
    const [isBrandHovered, setIsBrandHovered] = useState(false);
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('faq');
    const [issueType, setIssueType] = useState('General Inquiry');
    const [issueText, setIssueText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState(null);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    const issueOptions = [
        "General Inquiry",
        "Payment Issue",
        "Refund Request",
        "Technical Support",
        "Account Access",
        "Other"
    ];

    const handleSupportSubmit = async () => {
        if (!issueText.trim()) return;
        setIsSending(true);
        setSendStatus(null);
        try {
            await axios.post(apis.support, {
                email: user?.email || "guest@ai-mall.in",
                issueType,
                message: issueText,
                userId: user?.id || null
            });
            setSendStatus('success');
            setIssueText('');
            setTimeout(() => setSendStatus(null), 3000);
        } catch (error) {
            console.error("Support submission failed", error);
            setSendStatus('error');
        } finally {
            setIsSending(false);
        }
    };
    const { theme, setTheme } = useTheme();
    const btnClass = "px-8 py-4 bg-surface border border-border rounded-2xl font-bold text-lg text-maintext hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-2";

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">

            {/* Background Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-4 py-4 md:px-6 md:py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <motion.div
                    className="relative flex items-center gap-2 md:gap-3 cursor-pointer group"
                    onHoverStart={() => setIsBrandHovered(true)}
                    onHoverEnd={() => setIsBrandHovered(false)}
                >
                    <img src="/logo/Logo.svg" alt="Logo" className="w-14 h-14 md:w-20 md:h-20 object-contain group-hover:rotate-12 transition-transform duration-300" />
                    {/* Brand text removed as per user request */}

                    {/* Popup Animation */}
                    <AnimatePresence>
                        {isBrandHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 mt-2 w-64 p-4 rounded-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold text-maintext mb-1 flex items-center gap-2">
                                        <Bot className="w-4 h-4 text-primary" />
                                        {name} <sup className="text-xs">TM</sup>
                                    </h3>
                                    <p className="text-xs text-subtext mb-3">
                                        Meet AISA <sup className="text-xs">TM</sup> – Your Intelligent Super Assistant.
                                    </p>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>



                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => setIsAboutModalOpen(true)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-subtext hover:bg-secondary hover:text-primary transition-all"
                    >
                        <Bot className="w-4 h-4" />
                        About AISA
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-1.5 md:p-2 rounded-full bg-white/50 dark:bg-black/50 border border-border text-subtext hover:text-primary hover:border-primary/50 transition-all shadow-sm backdrop-blur-sm"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-orange-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>

                    {user ? <Link to={AppRoute.PROFILE}><CircleUser className='h-6 w-6 md:h-7 md:w-7 text-maintext' /></Link> : <div className="flex gap-2 md:gap-4 items-center">
                        <motion.button
                            whileHover={{ scale: 1.05, color: "#2563eb" }} // blue-600
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/login")}
                            className="text-sm md:text-base text-subtext font-medium transition-colors whitespace-nowrap px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            Sign In
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/signup")}
                            className="bg-primary text-white px-4 py-2 md:px-5 md:py-2 text-sm md:text-base rounded-full font-semibold transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
                        >
                            Get Started
                        </motion.button>
                    </div>}
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 py-20">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-black/40 border border-blue-200 dark:border-blue-900 text-sm text-subtext mb-8 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Powered by UWO
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-maintext"
                >
                    The Future of <br />
                    <motion.span
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-[length:200%_auto] bg-clip-text text-transparent inline-block"
                    >
                        Conversational AI
                    </motion.span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-subtext max-w-2xl mb-10 leading-relaxed"
                >
                    Experience the next generation of intelligent assistance.
                    {name} <sup className="text-xs">TM</sup> learns, adapts, and creates with you in real-time through a stunning interface.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-2xl"
                >

                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/dashboard/chat/new")}
                        className="px-8 py-4 bg-primary rounded-2xl font-bold text-lg text-white shadow-xl shadow-primary/30 hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Start Now <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    {!user && (
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/login")}
                            className="px-8 py-4 bg-white/60 dark:bg-black/40 border border-border rounded-2xl font-bold text-lg text-maintext hover:bg-white/80 dark:hover:bg-black/60 transition-all duration-300 backdrop-blur-sm"
                        >
                            Existing User
                        </motion.button>
                    )}
                </motion.div>

                {/* Features Preview */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
                    {[
                        {
                            title: "Contextual Intelligence",
                            desc: "AISA understands context, remembers interactions, and handles complex reasoning with ease.",
                            img: "/feature-icons/brain.png",
                            delay: 0
                        },
                        {
                            title: "Multimodal Interaction",
                            desc: "Seamlessly interact via text, voice, and vision for a truly natural and fluid experience.",
                            img: "/feature-icons/sound.png",
                            delay: 0.2
                        },
                        {
                            title: "Private & Secure",
                            desc: "Your data is yours. End-to-end encryption ensures complete privacy and control.",
                            img: "/feature-icons/shield.png",
                            delay: 0.4
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: feature.delay, duration: 0.5 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="p-6 rounded-3xl bg-white/50 dark:bg-black/30 border border-white/50 dark:border-white/10 shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all group backdrop-blur-sm cursor-default"
                        >
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: feature.delay }}
                                className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform"
                            >
                                <img src={feature.img} alt={feature.title} className="w-full h-full object-contain drop-shadow-md" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2 text-maintext">{feature.title}</h3>
                            <p className="text-subtext leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Footer Section */}
            <footer className="w-full bg-white/40 dark:bg-black/40 border-t border-white/20 dark:border-white/10 mt-20 relative z-10 backdrop-blur-xl rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
                <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-start gap-20 mb-16">
                        {/* Brand Column */}
                        <div className="space-y-6 max-w-sm">
                            <div className="flex items-center gap-3">
                                <img src="/logo/Logo.svg" alt="Logo" className="w-12 h-12 object-contain" />
                                <span className="text-2xl font-black tracking-tighter text-maintext">{name} <sup className="text-xs">TM</sup></span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {[
                                    {
                                        img: "/icons-new/linkedin.avif",
                                        href: "https://www.linkedin.com/in/aimall-global/",
                                        alt: "LinkedIn"
                                    },
                                    {
                                        img: "/icons-new/instagram.jpg",
                                        href: "https://www.instagram.com/aimall.global/",
                                        alt: "Instagram"
                                    },
                                    {
                                        img: "/icons-new/facebook.png",
                                        href: "https://www.facebook.com/aimallglobal/",
                                        alt: "Facebook"
                                    },
                                    {
                                        img: "/icons-new/twitter.jpg",
                                        href: "https://x.com/aimallglobal",
                                        alt: "X"
                                    },
                                    {
                                        img: "/icons-new/youtube.png",
                                        href: "https://www.youtube.com/@aimallglobal",
                                        alt: "YouTube"
                                    },
                                    {
                                        img: "/icons-new/whatsapp.avif",
                                        href: "https://api.whatsapp.com/send?phone=918359890909",
                                        alt: "WhatsApp"
                                    }
                                ].map((social, i) => (
                                    <a
                                        key={i}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 transition-transform duration-300 flex items-center justify-center shrink-0 hover:scale-110"
                                    >
                                        <img src={social.img} alt={social.alt} className="w-full h-full object-cover rounded-xl" />
                                    </a>
                                ))}
                            </div>
                        </div>



                        {/* Support Column */}
                        <div>
                            <h4 className="text-sm font-bold text-maintext uppercase tracking-widest mb-6">Support</h4>
                            <ul className="space-y-4">
                                {[
                                    { label: "Help Center", onClick: () => setIsFaqOpen(true) },
                                    { label: "About AISA", onClick: () => setIsAboutModalOpen(true) },
                                ].map((link, i) => (
                                    <li key={i}>
                                        {link.onClick ? (
                                            <button
                                                onClick={link.onClick}
                                                className="text-sm text-subtext hover:text-primary transition-colors font-medium"
                                            >
                                                {link.label}
                                            </button>
                                        ) : (
                                            <a
                                                href={link.path}
                                                className="text-sm text-subtext hover:text-primary transition-colors font-medium"
                                            >
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Column */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-maintext uppercase tracking-widest mb-6">Contact</h4>
                            <div className="space-y-4">
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Jabalpur+Madhya+Pradesh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-3 group"
                                >
                                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-subtext leading-relaxed group-hover:text-primary transition-colors">
                                        Jabalpur, Madhya Pradesh
                                    </p>
                                </a>
                                <a
                                    href="mailto:admin@uwo24.com"
                                    className="flex items-center gap-3 group"
                                >
                                    <Mail className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm text-subtext group-hover:text-primary transition-colors font-medium">
                                        admin@uwo24.com
                                    </span>
                                </a>
                                <a
                                    href="tel:+918358990909"
                                    className="flex items-center gap-3 group"
                                >
                                    <Phone className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm text-subtext group-hover:text-primary transition-colors font-medium">
                                        +91 83589 90909
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-xs text-subtext font-medium">
                            © {new Date().getFullYear()} {name} <sup className="text-xs">TM</sup>. All rights reserved.
                        </p>
                        <div className="flex items-center gap-8">
                            <button onClick={() => setIsPrivacyModalOpen(true)} className="text-xs text-subtext hover:text-maintext transition-colors font-medium">Privacy Policy</button>
                            <button onClick={() => setIsTermsModalOpen(true)} className="text-xs text-subtext hover:text-maintext transition-colors font-medium">Terms of Service</button>
                            <button onClick={() => setIsCookieModalOpen(true)} className="text-xs text-subtext hover:text-maintext transition-colors font-medium">Cookie Policy</button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* FAQ Modal */}
            {
                isFaqOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-blue-50 dark:bg-gray-800">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('faq')}
                                        className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'faq' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        FAQ
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('help')}
                                        className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'help' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        Help
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsFaqOpen(false)}
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeTab === 'faq' ? (
                                    <>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Get quick answers to common questions about our platform</p>
                                        {faqs.map((faq, index) => (
                                            <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                                                <button
                                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                                    className="w-full flex justify-between items-center p-4 text-left hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                                                >
                                                    <span className="font-semibold text-gray-900 dark:text-white text-[15px]">{faq.question}</span>
                                                    {openFaqIndex === index ? (
                                                        <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    )}
                                                </button>
                                                <div
                                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100 bg-blue-50/50 dark:bg-gray-800/50' : 'max-h-0 opacity-0'}`}
                                                >
                                                    <div className="p-4 pt-0 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-200 dark:border-gray-700 mt-2 pt-3">
                                                        {faq.answer}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Select Issue Category</label>
                                            <div className="relative">
                                                <select
                                                    value={issueType}
                                                    onChange={(e) => setIssueType(e.target.value)}
                                                    className="w-full p-4 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-600 dark:focus:border-blue-400 outline-none appearance-none text-gray-900 dark:text-white font-medium cursor-pointer hover:border-blue-400 transition-colors"
                                                >
                                                    {issueOptions.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Describe your issue</label>
                                            <textarea
                                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-600 dark:focus:border-blue-400 outline-none resize-none text-gray-900 dark:text-white min-h-[150px]"
                                                placeholder="Please provide details about the problem you are facing..."
                                                value={issueText}
                                                onChange={(e) => setIssueText(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSupportSubmit}
                                            disabled={isSending || !issueText.trim()}
                                            className={`flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 ${isSending || !issueText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                                        >
                                            {isSending ? (
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <HelpCircle className="w-5 h-5" />
                                                    Send to Support
                                                </>
                                            )}
                                        </button>
                                        {sendStatus === 'success' && (
                                            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm text-center font-medium border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                                                Ticket Submitted Successfully! Our team will contact you soon.
                                            </div>
                                        )}
                                        {sendStatus === 'error' && (
                                            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                                Failed to submit ticket. Please try again or email us directly.
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                                            Or email us directly at <a href="mailto:support@ai-mall.in" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">support@ai-mall.in</a>
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-center">
                                <button
                                    onClick={() => setIsFaqOpen(false)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
            <TermsOfServiceModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
            <CookiePolicyModal isOpen={isCookieModalOpen} onClose={() => setIsCookieModalOpen(false)} />
            <AboutAISA isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

        </div >
    );
};

export default Landing;
