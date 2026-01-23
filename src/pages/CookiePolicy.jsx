import React from 'react';
import { useNavigate } from 'react-router';
import { Cookie, Settings2, BarChart3, Shield, Smartphone, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { name } from '../constants';

const CookiePolicy = () => {
    const navigate = useNavigate();

    const sections = [
        {
            icon: Cookie,
            title: "What Are Cookies?",
            content: [
                {
                    subtitle: "Definition",
                    text: "Cookies are small text files that are placed on your device when you visit our website. They help us recognize you, remember your preferences, and provide a personalized experience on AISA™."
                },
                {
                    subtitle: "How We Use Them",
                    text: "We use cookies and similar technologies to maintain your login session, remember your language and theme preferences, and analyze how you interact with our platform to improve our services."
                },
                {
                    subtitle: "Cookie Duration",
                    text: "Some cookies are temporary (session cookies) and expire when you close your browser. Others are persistent and remain on your device for a set period or until you delete them."
                }
            ]
        },
        {
            icon: Settings2,
            title: "Types of Cookies We Use",
            content: [
                {
                    subtitle: "Essential Cookies (Required)",
                    text: "These cookies are necessary for AISA™ to function properly. They enable core features like user authentication, session management, and security. You cannot opt out of essential cookies."
                },
                {
                    subtitle: "Preference Cookies",
                    text: "These cookies remember your choices such as language preference (EN, ES, FR, etc.), region settings, theme (light/dark mode), and notification preferences to provide a customized experience."
                },
                {
                    subtitle: "Analytics Cookies (Optional)",
                    text: "With your consent, we use analytics cookies to understand user behavior, measure platform performance, and identify areas for improvement. These help us enhance your experience."
                },
                {
                    subtitle: "Functional Cookies",
                    text: "These cookies enable enhanced functionality like chat history synchronization, multimodal feature preferences, and AI agent selection to provide seamless interactions."
                }
            ]
        },
        {
            icon: Smartphone,
            title: "Local Storage & Session Storage",
            content: [
                {
                    subtitle: "Chat Session Storage",
                    text: "Your chat conversations with AISA™ are stored in your browser's local storage for quick access and offline capability. This allows you to resume conversations and view chat history without delays."
                },
                {
                    subtitle: "User Preferences",
                    text: "Settings like your selected AI agent, personalization options, and interface customizations are stored locally to provide instant access across sessions."
                },
                {
                    subtitle: "Session Management",
                    text: "We use session storage to maintain your active chat session, authentication state, and temporary data that expires when you close your browser."
                },
                {
                    subtitle: "Data Control",
                    text: "You have full control over locally stored data. You can delete individual chat sessions or clear all local data from your browser settings or profile dashboard."
                }
            ]
        },
        {
            icon: BarChart3,
            title: "Third-Party Cookies & Analytics",
            content: [
                {
                    subtitle: "Analytics Services",
                    text: "We may use third-party analytics services to better understand user engagement and platform performance. These services use cookies to collect anonymized usage data."
                },
                {
                    subtitle: "AI Model Providers",
                    text: "Our AI models are powered by advanced providers. While we process your queries securely, these providers may use cookies for service optimization and security purposes."
                },
                {
                    subtitle: "Payment Processors",
                    text: "When you subscribe to AISA™, our payment partners may use cookies to process transactions securely and prevent fraud."
                },
                {
                    subtitle: "Third-Party Control",
                    text: "We do not control third-party cookies. Please review the privacy policies of our partners to understand their cookie practices."
                }
            ]
        },
        {
            icon: Shield,
            title: "Your Cookie Choices",
            content: [
                {
                    subtitle: "Browser Controls",
                    text: "Most browsers allow you to control cookies through settings. You can block, delete, or receive warnings about cookies. Note that blocking essential cookies may prevent AISA™ from functioning properly."
                },
                {
                    subtitle: "Opt-Out Options",
                    text: "You can opt out of analytics cookies through your profile settings under 'Privacy & Data'. This will disable non-essential tracking while maintaining platform functionality."
                },
                {
                    subtitle: "Do Not Track",
                    text: "We respect Do Not Track (DNT) signals. If your browser has DNT enabled, we will not use analytics cookies or track your behavior beyond what's necessary for service delivery."
                },
                {
                    subtitle: "Mobile Devices",
                    text: "On mobile devices, you can control cookies and tracking through your device settings and browser preferences. Refer to your device manufacturer's instructions for details."
                }
            ]
        },
        {
            icon: Cookie,
            title: "Cookie Management Guide",
            content: [
                {
                    subtitle: "How to Disable Cookies",
                    text: "To disable cookies in Chrome: Settings > Privacy and Security > Cookies and other site data. For Firefox: Settings > Privacy & Security > Cookies and Site Data. For Safari: Preferences > Privacy > Cookies and website data."
                },
                {
                    subtitle: "Clear Existing Cookies",
                    text: "You can clear cookies at any time through your browser settings. In most browsers, go to Settings > Privacy > Clear browsing data and select 'Cookies and other site data'."
                },
                {
                    subtitle: "Platform Cookie Settings",
                    text: "Access your AISA™ cookie preferences from Profile > Settings > Privacy & Data > Cookie Preferences. Here you can enable/disable optional cookies and view which cookies are active."
                },
                {
                    subtitle: "Impact of Disabling Cookies",
                    text: "Disabling cookies may limit your experience on AISA™. You may not be able to stay logged in, your preferences won't be saved, and some features may not work as intended."
                }
            ]
        }
    ];



    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-subtext hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back</span>
                    </button>
                    <h1 className="text-xl font-bold text-primary">{name} <sup className="text-xs">TM</sup></h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 mb-6">
                        <Cookie className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-maintext mb-4">
                        Cookie Policy
                    </h1>
                    <p className="text-lg text-subtext max-w-2xl mx-auto">
                        Learn how we use cookies and similar technologies to enhance your experience.
                    </p>
                    <p className="text-sm text-subtext mt-4">
                        <strong>Last Updated:</strong> January 22, 2026
                    </p>
                </motion.div>

                {/* Introduction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-8 mb-8 border border-border shadow-sm"
                >
                    <p className="text-maintext leading-relaxed mb-4">
                        This Cookie Policy explains how {name}™ uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are, why we use them, and your rights to control their use.
                    </p>
                    <p className="text-maintext leading-relaxed">
                        By continuing to use {name}™, you consent to our use of cookies in accordance with this policy. You can change your cookie preferences at any time through your browser or account settings.
                    </p>
                </motion.div>

                {/* Cookie Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (index + 2) }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-border shadow-sm hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <section.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-maintext mb-4">{section.title}</h2>
                                </div>
                            </div>

                            <div className="space-y-6 ml-16">
                                {section.content.map((item, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-lg font-semibold text-maintext mb-2">{item.subtitle}</h3>
                                        <p className="text-subtext leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Cookie Table */}


                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-12 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl p-8 border border-purple-500/20"
                >
                    <h2 className="text-2xl font-bold text-maintext mb-4">Questions About Cookies?</h2>
                    <p className="text-subtext leading-relaxed mb-4">
                        If you have questions about our use of cookies or this policy, please contact us:
                    </p>
                    <div className="space-y-2 text-subtext">
                        <p><strong className="text-maintext">Email:</strong> <a href="mailto:admin@uwo24.com" className="text-primary hover:underline">admin@uwo24.com</a></p>
                        <p><strong className="text-maintext">Phone:</strong> <a href="tel:+918359890909" className="text-primary hover:underline">+91 83589 90909</a></p>
                        <p><strong className="text-maintext">Address:</strong> Jabalpur, Madhya Pradesh, India</p>
                    </div>
                </motion.div>

                {/* Policy Updates */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl"
                >
                    <h3 className="text-lg font-semibold text-maintext mb-2">Policy Updates</h3>
                    <p className="text-sm text-subtext leading-relaxed">
                        We may update this Cookie Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes by posting a notice on our platform or via email.
                    </p>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="mt-20 py-8 border-t border-border bg-white/50 dark:bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <p className="text-sm text-subtext">
                        © {new Date().getFullYear()} {name}™. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default CookiePolicy;
