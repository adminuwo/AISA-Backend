import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import TaskModal from './TaskModal';
import { Plus, CheckCircle, Clock, Calendar as CalendarIcon, AlertTriangle, Trash2, Mic, Settings2, Menu as MenuIcon } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { toggleState } from '../../userStore/userData';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, today, pending, completed
    const [tglState, setTglState] = useRecoilState(toggleState);
    const toggleSidebar = () => setTglState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));

    const notifiedRef = useRef(new Set());

    useEffect(() => {
        fetchTasks();
    }, []);

    // Auto-mark missed helper
    const markAsMissed = async (task) => {
        try {
            setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: 'missed' } : t));
            await apiService.updatePersonalTask(task._id, { status: 'missed' });
        } catch (err) {
            console.error("Failed to mark missed", err);
        }
    };

    // Notification Engine
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.status === 'completed' || task.status === 'missed') return;

                const taskTime = new Date(task.datetime);
                const timeDiff = now - taskTime;

                // Trigger if within 1 minute of scheduled time (0 to 60s passed)
                const isTime = timeDiff >= 0 && timeDiff < 60000;

                if (isTime && !notifiedRef.current.has(task._id)) {
                    triggerNotification(task);
                    notifiedRef.current.add(task._id);
                }

                // If > 3 mins late (180000 ms), mark as missed
                if (timeDiff > 180000) {
                    markAsMissed(task);
                }
            });
        };

        const interval = setInterval(checkReminders, 5000); // Check every 5s
        return () => clearInterval(interval);
    }, [tasks]);

    const triggerNotification = (task) => {
        // 1. Play Notification Sound (Music)
        const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3");
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Audio play failed", e));

        // 2. Visual Toast
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#1E1E1E] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-primary/20`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <Clock className="h-10 w-10 text-primary animate-pulse" />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Reminder: {task.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {task.description || "It's time for your scheduled task."}
                            </p>
                            {task.isUrgent && <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">URGENT</span>}
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 10000 });

        // 3. Audio Speech (Delayed slightly to follow the chime)
        setTimeout(() => {
            const text = `Time for your task: ${task.title}. I repeat: ${task.title}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }, 1000);
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await apiService.getPersonalTasks({});
            setTasks(data);
        } catch (err) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (taskData) => {
        try {
            if (editingTask) {
                await apiService.updatePersonalTask(editingTask._id, taskData);
                toast.success("Task updated");
            } else {
                await apiService.createPersonalTask(taskData);
                toast.success("Task created");
            }
            setIsModalOpen(false);
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            toast.error("Failed to save task");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await apiService.deletePersonalTask(id);
            setTasks(prev => prev.filter(t => t._id !== id));
            toast.success("Task deleted");
        } catch (err) {
            toast.error("Error deleting task");
        }
    };

    const toggleComplete = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await apiService.updatePersonalTask(task._id, { status: newStatus });
            setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
        } catch (err) {
            toast.error("Update failed");
        }
    };

    // Filter Logic
    const filteredTasks = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'completed') return t.status === 'completed';
        if (filter === 'pending') return t.status === 'pending' || t.status === 'missed';
        if (filter === 'today') {
            const tDate = new Date(t.datetime).toDateString();
            const today = new Date().toDateString();
            return tDate === today;
        }
        return true;
    });

    const getStatusColor = (status) => {
        if (status === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (status === 'missed') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-3 md:p-6 lg:p-8 font-sans transition-all">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden p-1.5 rounded-lg hover:bg-surface text-subtext transition-colors border border-border/50"
                                title="Toggle Sidebar"
                            >
                                <MenuIcon className="w-5 h-5 text-primary" />
                            </button>
                            AI Personal Assistant
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Manage your daily routine & smart reminders</p>
                    </div>
                    <button
                        onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Task
                    </button>
                </div>

                {/* Stats / Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-white/80 dark:bg-[#1A1A1A]/90 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 border-t-4 border-t-blue-500 relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CalendarIcon className="w-14 h-14 md:w-16 md:h-16 text-blue-500" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Today's Tasks</p>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            {tasks.filter(t => new Date(t.datetime).toDateString() === new Date().toDateString()).length}
                        </h3>
                    </div>

                    <div className="bg-white/80 dark:bg-[#1A1A1A]/90 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 border-t-4 border-t-orange-500 relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-12 h-12 md:w-14 md:h-14 text-orange-500" />
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm font-medium">Pending</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-orange-500 mt-1">
                            {tasks.filter(t => t.status === 'pending' || t.status === 'missed').length}
                        </h3>
                    </div>

                    <div className="bg-white/80 dark:bg-[#1A1A1A]/90 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 border-t-4 border-t-green-500 relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle className="w-12 h-12 md:w-14 md:h-14 text-green-500" />
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm font-medium">Completed</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-green-500 mt-1">
                            {tasks.filter(t => t.status === 'completed').length}
                        </h3>
                    </div>

                    <div className="bg-white/80 dark:bg-[#1A1A1A]/90 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 border-t-4 border-t-primary relative overflow-hidden group hover:shadow-lg transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Settings2 className="w-12 h-12 md:w-14 md:h-14 text-primary" />
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm font-medium">Total Routines</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-primary mt-1">
                            {tasks.length}
                        </h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {['all', 'today', 'pending', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading your assistant...</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                            <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No tasks found</h3>
                            <p className="text-gray-500 text-sm">Add a new task to get started.</p>
                        </div>
                    ) : (
                        Object.entries(filteredTasks.reduce((acc, task) => {
                            const cat = task.category || 'General';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(task);
                            return acc;
                        }, {})).map(([category, items]) => (
                            <div key={category} className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-2 pl-1">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center text-xl border border-gray-100 dark:border-gray-800">
                                        {{
                                            'Personal': '👤',
                                            'Work': '💼',
                                            'Office': '🏢',
                                            'Meeting': '🤝',
                                            'Health': '❤️',
                                            'Education': '🎓',
                                            'Finance': '💰',
                                            'Shopping': '🛒',
                                            'Traveling': '✈️'
                                        }[category] || '📌'}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                        {category}
                                        <span className="ml-3 text-xs font-normal text-gray-400 bg-gray-100 dark:bg-[#1E1E1E] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800">
                                            {items.length} Tasks
                                        </span>
                                    </h3>
                                </div>
                                <div className="grid gap-4">
                                    {items.map(task => (
                                        <div key={task._id} className={`group bg-white/80 dark:bg-[#1A1A1A]/90 backdrop-blur-sm p-3 md:p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 transition-all hover:shadow-md hover:scale-[1.002] hover:border-primary/30 ${task.isUrgent ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}`}>

                                            <button
                                                onClick={() => toggleComplete(task)}
                                                className={`mt-1 md:mt-0 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                                                    }`}
                                            >
                                                {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`text-lg font-semibold truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                                                        {task.title}
                                                    </h3>
                                                    {task.isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                                                    {task.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 max-w-full overflow-hidden">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        {new Date(task.datetime).toLocaleDateString()}
                                                    </div>
                                                    {task.recurring !== 'none' && (
                                                        <div className="flex items-center gap-1 text-primary">
                                                            <span>🔄</span>
                                                            {task.recurring}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center">
                                                <button
                                                    onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                task={editingTask}
            />
        </div>
    );
};

export default Dashboard;
