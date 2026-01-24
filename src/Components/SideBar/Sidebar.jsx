import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  User,
  LayoutGrid,
  MessageSquare,
  Bot,
  Settings2,
  LogOut,
  Zap,
  X,
  Video,
  FileText,
  Bell,

  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Shield,
  Sparkles,
  ChevronRight,
  Search
} from 'lucide-react';
import { apis, AppRoute } from '../../types';
import { faqs } from '../../constants'; // Import shared FAQs
import NotificationBar from '../NotificationBar/NotificationBar.jsx';
import { useRecoilState } from 'recoil';
import { clearUser, getUserData, setUserData, toggleState, userData, sessionsData } from '../../userStore/userData';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { chatStorageService } from '../../services/chatStorageService';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import ProfileSettingsDropdown from '../ProfileSettingsDropdown/ProfileSettingsDropdown.jsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { t, language, region, regionFlags } = useLanguage();
  const { theme, setTheme } = useTheme();


  const getFlagUrl = (code) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

  const navigate = useNavigate();
  const [notifiyTgl, setNotifyTgl] = useRecoilState(toggleState)
  const [currentUserData, setUserRecoil] = useRecoilState(userData);
  const user = currentUserData.user || getUserData() || { name: "Loading...", email: "...", role: "user" };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // null, 'success', 'error'
  const [issueText, setIssueText] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [issueType, setIssueType] = useState("General Inquiry");
  const [sessions, setSessions] = useRecoilState(sessionsData);
  const { sessionId } = useParams();
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || 'new');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      setIssueText(""); // Clear text
      setTimeout(() => setSendStatus(null), 3000); // Reset status after 3s
    } catch (error) {
      console.error("Support submission failed", error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate(AppRoute.LANDING);
  };
  const token = getUserData()?.token

  useEffect(() => {
    // User data
    if (token) {
      axios.get(apis.user, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((res) => {
        if (res.data) {
          const mergedData = setUserData(res.data);
          setUserRecoil({ user: mergedData });
        }
      }).catch((err) => {
        console.error(err);
        if (err.status == 401) {
          clearUser()
        }
      })
    }

    // Notifications
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(apis.notifications, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Notifications fetch failed", err);
      }
    };

    if (token) {
      fetchNotifications();
      // Refresh every 5 mins
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token])

  // Fetch chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await chatStorageService.getSessions();
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    if (token) {
      fetchSessions();
    }
  }, [token, sessionId, setSessions]);

  // Update currentSessionId when sessionId changes
  useEffect(() => {
    setCurrentSessionId(sessionId || 'new');
  }, [sessionId]);

  const handleNewChat = () => {
    navigate('/dashboard/chat/new');
    onClose();
  };

  const handleDeleteSession = async (e, sessionIdToDelete) => {
    e.stopPropagation();
    try {
      await chatStorageService.deleteSession(sessionIdToDelete);
      const updatedSessions = await chatStorageService.getSessions();
      setSessions(updatedSessions);
      if (currentSessionId === sessionIdToDelete) {
        navigate('/dashboard/chat/new');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  if (notifiyTgl.notify) {
    setTimeout(() => {
      setNotifyTgl({ notify: false })
    }, 2000)
  }
  // Dynamic class for active nav items
  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium border border-transparent ${isActive
      ? 'bg-primary/10 text-primary border-primary/10'
      : 'text-subtext hover:bg-surface hover:text-maintext'
    }`;



  return (
    <>
      <AnimatePresence>
        {notifiyTgl.notify && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className='fixed w-full z-10 flex justify-center items-center mt-5 ml-6'
          >
            <NotificationBar msg={"Successfully Owned"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for Mobile/Tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[100] w-full sm:w-72 lg:w-64 bg-secondary border-r border-border 
          flex flex-col transition-transform duration-300 ease-in-out 
          lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="p-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="text-xl font-bold text-primary">AISA <sup className="text-xs">TM</sup></h1>
          </Link>


          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-subtext hover:text-maintext rounded-lg hover:bg-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="px-3 pt-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtext group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/50 border border-border focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/5 rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-subtext/50"
              />
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="w-full bg-primary hover:opacity-90 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20 text-sm"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <h3 className="px-4 py-2 text-xs font-semibold text-subtext uppercase tracking-wider">
              HISTORY
            </h3>

            {sessions
              .filter(session => session.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((session) => (
                <div key={session.sessionId} className="group relative px-2">
                  <button
                    onClick={() => {
                      navigate(`/dashboard/chat/${session.sessionId}`);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors truncate
                    ${currentSessionId === session.sessionId
                        ? 'bg-card text-primary shadow-sm border border-border'
                        : 'text-subtext hover:bg-card hover:text-maintext'
                      }
                  `}
                  >
                    <div className="font-medium truncate pr-6">{session.title}</div>
                    <div className="text-[10px] text-subtext/70">
                      {new Date(session.lastModified).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.sessionId)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-subtext hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Chat"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ))}

            {sessions.length === 0 && (
              <div className="px-4 text-xs text-subtext italic">No recent chats</div>
            )}
          </div>
        </div>


        {/* User Profile Footer */}
        <div className="p-3 border-t border-border bg-secondary/30 relative">
          {token ? (
            <div className="relative profile-menu-container">
              {/* Profile Card - Clickable */}
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full rounded-xl border border-transparent hover:bg-secondary transition-all flex items-center gap-2 p-2 group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0 overflow-hidden border border-primary/10 group-hover:bg-primary/30 transition-colors">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.classList.add("flex", "items-center", "justify-center");
                          parent.innerText = user.name ? user.name.charAt(0).toUpperCase() : "U";
                        }
                      }}
                    />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <p className="text-sm font-bold text-maintext truncate group-hover:text-primary transition-colors">{user.name}</p>
                    {user.plan && user.plan !== 'Basic' && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shrink-0 ${user.plan === 'King'
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm'
                        : 'bg-primary text-white shadow-sm'
                        }`}>
                        {user.plan}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-subtext truncate">{user.email}</p>
                </div>

                <div className="text-subtext group-hover:text-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
              </button>

              {/* Dropdown Menu - Replaced with Personalization System */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <ProfileSettingsDropdown
                    onClose={() => setIsProfileMenuOpen(false)}
                    onLogout={() => {
                      handleLogout();
                      setIsProfileMenuOpen(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Guest / Login State */
            <div
              onClick={() => navigate(AppRoute.LOGIN)}
              className="rounded-xl border border-transparent hover:bg-secondary transition-all cursor-pointer flex items-center gap-3 px-3 py-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0 border border-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="font-bold text-maintext text-xs group-hover:text-primary transition-colors">
                Log In
              </div>
            </div>
          )}

          <div className="mt-1 flex flex-col gap-1">
            {/* Region/Language Indicator - Only show if logged in */}
            {token && (
              <button
                onClick={() => {
                  navigate(AppRoute.PROFILE, { state: { openLanguage: true, timestamp: Date.now() } });
                  onClose();
                }}
                className="group flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-subtext hover:bg-secondary hover:text-maintext transition-all text-[10px] font-bold uppercase tracking-wider border border-transparent hover:border-border"
              >
                <img
                  src={getFlagUrl(regionFlags[region] || 'in')}
                  alt={region}
                  className="w-3.5 h-2.5 object-cover rounded-sm shadow-sm"
                />
                <span>{regionFlags[region] || 'IN'} - {language.substring(0, 2).toUpperCase()}</span>
              </button>
            )}

            {/* FAQ Button */}
            <button
              onClick={() => setIsFaqOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-subtext hover:bg-secondary hover:text-maintext transition-all text-xs border border-transparent hover:border-border"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('helpFaq')}</span>
            </button>
          </div>
        </div>
      </div >

      {/* FAQ Modal */}
      {
        isFaqOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

              <div className="p-6 border-b border-border flex justify-between items-center bg-secondary">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('faq')}
                    className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'faq' ? 'bg-primary/10 text-primary' : 'text-subtext hover:text-maintext'}`}
                  >
                    FAQ
                  </button>
                  <button
                    onClick={() => setActiveTab('help')}
                    className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'help' ? 'bg-primary/10 text-primary' : 'text-subtext hover:text-maintext'}`}
                  >
                    Help
                  </button>
                </div>
                <button
                  onClick={() => setIsFaqOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full text-subtext transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeTab === 'faq' ? (
                  <>
                    <p className="text-sm text-subtext font-medium">Get quick answers to common questions about our platform</p>
                    {faqs.map((faq, index) => (
                      <div key={index} className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-secondary transition-colors focus:outline-none"
                        >
                          <span className="font-semibold text-maintext text-[15px]">{faq.question}</span>
                          {openFaqIndex === index ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-subtext" />
                          )}
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100 bg-secondary/50' : 'max-h-0 opacity-0'
                            }`}
                        >
                          <div className="p-4 pt-0 text-subtext text-sm leading-relaxed border-t border-border/50 mt-2 pt-3">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col gap-6">

                    {/* Issue Type Dropdown */}
                    <div>
                      <label className="block text-sm font-bold text-maintext mb-2">Select Issue Category</label>
                      <div className="relative">
                        <select
                          value={issueType}
                          onChange={(e) => setIssueType(e.target.value)}
                          className="w-full p-4 pr-10 rounded-xl bg-secondary border border-border focus:border-primary outline-none appearance-none text-maintext font-medium cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {issueOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext pointer-events-none" />
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div>
                      <label className="block text-sm font-bold text-maintext mb-2">Describe your issue</label>
                      <textarea
                        className="w-full p-4 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none text-maintext min-h-[150px]"
                        placeholder="Please provide details about the problem you are facing..."
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleSupportSubmit}
                      disabled={isSending || !issueText.trim()}
                      className={`flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 ${isSending || !issueText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                    >
                      {isSending ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <MessageSquare className="w-5 h-5" />
                          Send to Support
                        </>
                      )}
                    </button>

                    {sendStatus === 'success' && (
                      <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm text-center font-medium border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                        Tciket Submitted Successfully! Our team will contact you soon.
                      </div>
                    )}

                    {sendStatus === 'error' && (
                      <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                        Failed to submit ticket. Please try again or email us directly.
                      </div>
                    )}

                    <p className="text-xs text-center text-subtext">
                      Or email us directly at <a href="mailto:support@a-series.in" className="text-primary font-medium hover:underline">support@a-series.in</a>
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-surface text-center">
                <button
                  onClick={() => setIsFaqOpen(false)}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      }
    </>
  );
};

export default Sidebar;
