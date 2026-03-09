import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RecentActivity from '../../components/RecentActivity';
import LocationManagement from '../../components/LocationManagement';
import ProfileSettings from '../../components/ProfileSettings';
import TrackPass from '../../components/TrackPass';
import UserManagement from '../../components/UserManagement';
import CompletedMovements from '../../components/CompletedMovements';
import { 
    Plus, LayoutDashboard, Settings, Bell, 
    Search, ChevronRight, User as UserIcon, Shield, Menu, X,
    MapPin, Users2, Key
} from 'lucide-react';
import axios from '../../api/axios';

const SidebarLink = ({ icon, label, active = false, expanded = true, onClick, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = React.Children.count(children) > 0;

    const handleContainerClick = () => {
        if (hasChildren) {
            setIsOpen(!isOpen);
        } else if (onClick) {
            onClick();
        }
    };

    return (
        <div className="w-full">
            <div 
                onClick={handleContainerClick}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${
                    active 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'
                }`}
            >
                <div className={`shrink-0 transition-transform duration-300 ${!expanded && 'scale-110'}`}>
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div 
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                        >
                            <span className="text-[13px] font-semibold tracking-tight">{label}</span>
                            {hasChildren && (
                                <ChevronRight 
                                    size={12} 
                                    className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <AnimatePresence>
                {hasChildren && isOpen && expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 mt-0.5 border-l border-slate-200"
                    >
                        <div className="pl-6 py-1 space-y-0.5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SubLink = ({ label, active = false, onClick }) => (
    <div 
        onClick={onClick}
        className={`py-2 px-4 rounded-lg text-[12px] font-medium cursor-pointer transition-all ${
            active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }`}
    >
        {label}
    </div>
);

const StatCard = ({ label, value, growth, color = 'slate', active = false, onClick }) => {
    const colorClasses = {
        slate: 'text-slate-900',
        amber: 'text-amber-600',
        indigo: 'text-indigo-600',
        emerald: 'text-emerald-600'
    };

    return (
        <div 
            onClick={onClick}
            className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                active 
                    ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200' 
                    : 'bg-white border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:shadow-slate-200/50'
            }`}
        >
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                {label}
            </p>
            <div className="flex items-end justify-between">
                <h3 className={`text-3xl font-bold ${active ? 'text-indigo-700' : (colorClasses[color] || 'text-slate-900')} tracking-tight`}>
                    {value || '00'}
                </h3>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    active 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-slate-50 text-slate-500 border-slate-100/50'
                }`}>
                    {growth || 'LIVE'}
                </div>
            </div>
        </div>
    );
};

const DashboardSkeleton = ({ role, initialTab = 'overview' }) => {
    const [user, setUser] = useState({ name: 'User', role: 'user' });
    const [counts, setCounts] = useState({ active: 0, pending: 0, approved: 0, rejected: 0 });
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedStatus, setSelectedStatus] = useState('active');
    const [trackDC, setTrackDC] = useState('');

    const handleTrack = (dc) => {
        setTrackDC(dc);
        setActiveTab('track');
    };

    const isExpanded = isPinned || isHovered;

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr && userStr !== 'undefined') {
                setUser(JSON.parse(userStr));
            }
        } catch (err) {
            console.error('User parse error:', err);
        }
    }, []);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await axios.get('/material/dashboard-stats');
                if (res.data.success) {
                    // Normalize keys and ensure values are numbers
                    const data = res.data.data;
                    setCounts({
                        active: data.active || 0,
                        pending: data.pending || 0,
                        approved: data.approved || 0,
                        rejected: data.rejected || 0
                    });
                }
            } catch (err) {
                console.error('Count fetch error:', err);
            }
        };

        window.refreshDashboardCounts = fetchCounts;
        
        if (activeTab === 'overview') {
            fetchCounts();
        }
    }, [role, activeTab]);

    const formatCount = (val) => (val || 0).toString().padStart(2, '0');

    const userName = user?.name || 'User';
    const userRole = user?.role || role || 'user';

    return (
        <div className="h-screen bg-[#f8fafc] flex overflow-hidden font-sans">
            <AnimatePresence>
                {!isPinned && isHovered && (
                    <div className="fixed inset-0 bg-transparent z-40" onClick={() => setIsHovered(false)} />
                )}
            </AnimatePresence>

            <motion.aside 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                animate={{ 
                    width: isExpanded ? '260px' : '80px',
                    borderColor: isExpanded ? '#e2e8f0' : '#ffffff'
                }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed left-0 top-0 bottom-0 bg-white border-r z-50 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
            >
                <div className="h-20 shrink-0 flex items-center px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-600/20 shrink-0 transform transition-transform duration-500 hover:rotate-6">
                            G
                        </div>
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.h1 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="text-slate-900 text-lg font-bold tracking-tight whitespace-nowrap"
                                >
                                    GatePass
                                </motion.h1>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    <SidebarLink 
                        icon={<LayoutDashboard />} 
                        label="Dashboard" 
                        active={activeTab === 'overview' || activeTab === 'completed'} 
                        expanded={isExpanded}
                        onClick={() => setActiveTab('overview')}
                    >
                        <SubLink label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <SubLink label="Completed Movements" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
                    </SidebarLink>
                    
                    <div className="pt-5 pb-2 px-4">
                        <div className={`h-px bg-slate-100 transition-all duration-300 ${isExpanded ? 'w-full' : 'w-0'}`} />
                        {isExpanded && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-5 mb-1">Operations</p>
                        )}
                    </div>

                    <SidebarLink icon={<Search />} label="Track Pass" expanded={isExpanded} onClick={() => setActiveTab('track')} />
                    
                    {role === 'admin' && (
                        <SidebarLink icon={<Shield />} label="Management" expanded={isExpanded}>
                            <SubLink label="Locations" active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} />
                            <SubLink label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                        </SidebarLink>
                    )}
                    
                    <SidebarLink icon={<Settings />} label="Settings" expanded={isExpanded}>
                        <SubLink label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    </SidebarLink>
                </nav>

                <div className="p-4 border-t border-slate-50">
                    <Link to="/logout" className="group flex items-center gap-4 px-4 h-12 rounded-xl transition-all duration-300 hover:bg-red-50 text-slate-500 hover:text-red-600 overflow-hidden">
                        <X size={18} className="shrink-0 transition-transform duration-300 group-hover:rotate-90" />
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[13px] font-semibold whitespace-nowrap"
                                >
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>
            </motion.aside>

            <motion.div 
                animate={{ 
                    paddingLeft: isExpanded ? '260px' : '80px',
                }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="flex-1 flex flex-col h-screen overflow-hidden"
            >
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex justify-between items-center z-10 sticky top-0 transition-all">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsPinned(!isPinned)}
                            className={`p-2 rounded-lg transition-all duration-200 border ${
                                isPinned 
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight capitalize leading-none mb-1">{activeTab}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Control Center</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center bg-emerald-50 text-emerald-600 rounded-full px-4 py-1.5 gap-2 border border-emerald-100/50">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">System Online</span>
                        </div>
                        
                        <div className="flex items-center gap-4 pl-8 border-l border-slate-100">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-bold text-slate-900 leading-none">{userName}</p>
                                <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest mt-1">{userRole}</p>
                            </div>
                            <div 
                                onClick={() => setActiveTab('profile')}
                                className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hover:border-indigo-200 transition-all cursor-pointer overflow-hidden group"
                            >
                                {user?.avatar_path ? (
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${user.avatar_path}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                ) : (
                                    <UserIcon className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 md:px-12 py-8 md:py-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto h-full">
                        {activeTab === 'overview' && (
                            <>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Main Dashboard</h1>
                                        <p className="text-slate-500 font-medium mt-2 text-base">Efficiency and real-time oversight for your material passes.</p>
                                    </div>
                                    {role === 'user' && (
                                        <Link to="/create-material-pass" className="flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 group">
                                            <Plus className="w-5 h-5" />
                                            <span>New Pass</span>
                                        </Link>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    <StatCard 
                                        label="Active" 
                                        value={formatCount(counts.active)} 
                                        active={selectedStatus === 'active'}
                                        onClick={() => setSelectedStatus('active')}
                                    />
                                    <StatCard 
                                        label="Pending" 
                                        value={formatCount(counts.pending)} 
                                        color="amber" 
                                        active={selectedStatus === 'pending'}
                                        onClick={() => setSelectedStatus('pending')}
                                    />
                                    {userRole !== 'security' && (
                                        <>
                                            <StatCard 
                                                label="In Transit" 
                                                value={formatCount(counts.approved)} 
                                                color="emerald" 
                                                active={selectedStatus === 'approved'}
                                                onClick={() => setSelectedStatus('approved')}
                                            />
                                            <StatCard 
                                                label="Rejected" 
                                                value={formatCount(counts.rejected)} 
                                                color="indigo" 
                                                active={selectedStatus === 'rejected'}
                                                onClick={() => setSelectedStatus('rejected')}
                                            />
                                        </>
                                    )}
                                </div>

                                <div className="mb-20">
                                    <RecentActivity 
                                        role={userRole} 
                                        selectedStatus={selectedStatus} 
                                        onTrack={handleTrack} 
                                        onActionSuccess={() => window.refreshDashboardCounts && window.refreshDashboardCounts()}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'locations' && role === 'admin' && (
                            <div className="mb-20">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Manage Sites</h1>
                                <LocationManagement />
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="mb-20">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Account Settings</h1>
                                <ProfileSettings onProfileUpdate={(updated) => setUser(updated)} />
                            </div>
                        )}

                        {activeTab === 'users' && role === 'admin' && (
                            <div className="mb-20">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">User Management</h1>
                                <UserManagement />
                            </div>
                        )}

                        {activeTab === 'track' && (
                            <div className="mb-20">
                                <div className="mb-10">
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Track Pass</h1>
                                    <p className="text-slate-500 font-medium mt-2 text-base">Real-time logistics monitoring and audit trail.</p>
                                </div>
                                <TrackPass role={userRole} initialDC={trackDC} />
                            </div>
                        )}

                        {activeTab === 'completed' && (
                            <div className="mb-20">
                                <CompletedMovements userRole={userRole} onTrack={handleTrack} />
                            </div>
                        )}

                        {/* Catch-all for removed or under-development tabs */}
                        {!['overview', 'locations', 'profile', 'track', 'completed', 'users'].includes(activeTab) && (
                            <div className="flex items-center justify-center h-64 text-slate-400 italic">
                                Section for {activeTab} is under development
                            </div>
                        )}
                    </div>
                </main>
            </motion.div>
        </div>
    );
};

export default DashboardSkeleton;
