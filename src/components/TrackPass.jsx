import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, User, Shield, CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';

const StageStep = ({ label, status, isLast = false, actor, time }) => {
    const isCompleted = status === 'COMPLETED';
    const isPending = status === 'PENDING';
    const isRejected = status === 'REJECTED';
    
    return (
        <div className={`relative flex flex-col items-center flex-1 ${!isLast ? 'w-full' : ''}`}>
            {/* Connection Line */}
            {!isLast && (
                <div className="absolute top-5 left-1/2 w-full h-[2px] bg-slate-100">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        className="h-full bg-emerald-500"
                    />
                </div>
            )}
            
            {/* Node */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                    initial={false}
                    animate={{ 
                        scale: isPending ? [1, 1.2, 1] : 1,
                        backgroundColor: isCompleted ? '#10b981' : isRejected ? '#ef4444' : isPending ? '#3b82f6' : '#e2e8f0'
                    }}
                    transition={isPending ? { repeat: Infinity, duration: 2 } : {}}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white border-4 border-white shadow-sm`}
                >
                    {isCompleted ? <CheckCircle2 size={20} /> : isRejected ? <AlertCircle size={20} /> : <Circle size={16} fill="white" />}
                </motion.div>
                
                <div className="mt-4 text-center">
                    <p className={`text-[12px] font-bold tracking-tight uppercase ${isCompleted ? 'text-emerald-600' : isRejected ? 'text-red-600' : isPending ? 'text-blue-600' : 'text-slate-400'}`}>
                        {label}
                    </p>
                    {actor && (
                        <p className="text-[10px] text-slate-500 font-medium mt-1">{actor}</p>
                    )}
                    {time && (
                        <p className="text-[9px] text-slate-400 mt-0.5">{new Date(time).toLocaleDateString()}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TrackPass = ({ role, initialDC = '' }) => {
    const [searchQuery, setSearchQuery] = useState(initialDC);
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialDC) {
            setSearchQuery(initialDC);
            handleSearch(null, initialDC);
        }
    }, [initialDC]);

    const handleSearch = async (e, overrideDC = null) => {
        if (e) e.preventDefault();
        const dcToSearch = overrideDC || searchQuery;
        if (!dcToSearch) return;

        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/material/track?dc=${dcToSearch}`);
            setTrackingData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'No DC Found');
            setTrackingData(null);
        } finally {
            setLoading(false);
        }
    };

    const getStageStatus = (stageName) => {
        if (!trackingData) return 'INACTIVE';
        const log = trackingData.tracking_history.find(l => l.stage === stageName);
        if (log) return log.status;
        
        // Logical inference for pending stages
        const stages = ['SUBMISSION', 'MANAGER_APPROVAL', 'ORIGIN_SECURITY', 'DESTINATION_SECURITY'];
        const currentIndex = stages.indexOf(trackingData.tracking_history[trackingData.tracking_history.length - 1]?.stage);
        const stageIndex = stages.indexOf(stageName);

        if (stageIndex <= currentIndex) return 'COMPLETED';
        if (stageIndex === currentIndex + 1) {
            if (trackingData.current_status === 'REJECTED') return 'INACTIVE';
            return 'PENDING';
        }
        return 'INACTIVE';
    };

    const getStageActor = (stageName) => {
        const log = trackingData?.tracking_history.find(l => l.stage === stageName);
        return log ? log.acted_by_name : null;
    };

    const getStageTime = (stageName) => {
        const log = trackingData?.tracking_history.find(l => l.stage === stageName);
        return log ? log.acted_at : null;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Search className="text-indigo-600" size={20} />
                    Track Your Gate Pass
                </h2>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Enter DC Number (e.g., DC20240001)" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
                {error && (
                    <p className="text-red-500 text-xs font-bold mt-4 flex items-center gap-1.5 px-2">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
            </div>

            <AnimatePresence mode="wait">
                {trackingData ? (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8"
                    >
                        {/* Summary Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DC Number</p>
                                <h3 className="text-lg font-bold text-slate-900">{trackingData.dc_number}</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    trackingData.current_status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    trackingData.current_status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                    {trackingData.current_status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Route</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    {trackingData.origin} <ArrowRight size={14} className="text-slate-300" /> {trackingData.destination}
                                </div>
                            </div>
                        </div>

                        {/* Animated Timeline */}
                        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
                            <div className="flex justify-between items-start min-w-[700px] px-8">
                                <StageStep 
                                    label="Submission" 
                                    status={getStageStatus('SUBMISSION')} 
                                    actor={getStageActor('SUBMISSION')}
                                    time={getStageTime('SUBMISSION')}
                                />
                                <StageStep 
                                    label="Manager" 
                                    status={getStageStatus('MANAGER_APPROVAL')} 
                                    actor={getStageActor('MANAGER_APPROVAL')}
                                    time={getStageTime('MANAGER_APPROVAL')}
                                />
                                <StageStep 
                                    label="Dispatch Gate" 
                                    status={getStageStatus('ORIGIN_SECURITY')} 
                                    actor={getStageActor('ORIGIN_SECURITY')}
                                    time={getStageTime('ORIGIN_SECURITY')}
                                />
                                <StageStep 
                                    label="Receiving Gate" 
                                    status={getStageStatus('DESTINATION_SECURITY')} 
                                    isLast={true} 
                                    actor={getStageActor('DESTINATION_SECURITY')}
                                    time={getStageTime('DESTINATION_SECURITY')}
                                />
                            </div>
                        </div>

                        {/* Detailed Logs */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Audit Trail</h3>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} />
                                    Real-time Updates
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="space-y-8">
                                    {trackingData.tracking_history.map((log, i) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${log.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                {i !== trackingData.tracking_history.length - 1 && <div className="flex-1 w-px bg-slate-100 my-2" />}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                    <h4 className="text-sm font-bold text-slate-900">{log.stage.replace(/_/g, ' ')}</h4>
                                                    <span className="text-[10px] font-medium text-slate-400 tracking-tighter bg-slate-50 px-2 py-0.5 rounded">
                                                        {new Date(log.acted_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[13px] text-slate-600 font-medium">
                                                    Action {log.status === 'REJECTED' ? 'rejected' : 'completed'} by <span className="text-indigo-600 font-bold">{log.acted_by_name}</span> 
                                                    <span className="ml-2 text-[10px] text-slate-400 italic">({log.role})</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : !loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-slate-900 font-bold">No Records Displayed</h3>
                        <p className="text-slate-400 text-sm mt-1">Enter a DC number above to track material movement</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrackPass;
