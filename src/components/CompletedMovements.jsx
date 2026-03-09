import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { Search, FileText, ExternalLink, Calendar, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const CompletedMovements = ({ userRole, onTrack }) => {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompleted = useCallback(async (search = '') => {
        setLoading(true);
        setError(null);
        try {
            const url = search 
                ? `/material/status/completed?dc=${encodeURIComponent(search)}` 
                : '/material/status/completed';
            const res = await axios.get(url);
            setPasses(res.data.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load completed movements.';
            setError(msg);
            console.error('Completed Movements Error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;
        const timer = setTimeout(() => {
            if (!isCancelled) {
                fetchCompleted(searchTerm);
            }
        }, searchTerm ? 400 : 0); // Immediate fetch if no search term, otherwise debounce
        
        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [searchTerm, fetchCompleted]);

    const handleViewPDF = async (id) => {
        try {
            const res = await axios.get(`/material/pdf/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (error) {
            alert('Failed to generate PDF');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Completed Movements
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Latest 20 fully completed gate passes.</p>
                </div>
                
                <div className="relative max-w-sm w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by DC Number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                            <th className="px-6 py-4">DC Number</th>
                            <th className="px-6 py-4">Route</th>
                            <th className="px-6 py-4">Submitted By</th>
                            <th className="px-6 py-4">Completed Date</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                                    Loading completed records...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-red-500">
                                    <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    {error}
                                </td>
                            </tr>
                        ) : passes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                    No completed records found. {searchTerm && "Try an exact DC number match."}
                                </td>
                            </tr>
                        ) : (
                            passes.map((pass) => (
                                <tr key={pass.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-sm tracking-tight">{pass.dc_number}</div>
                                        <div className="mt-1 flex items-center">
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wide">
                                                Completed
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="font-medium text-slate-700 truncate max-w-[120px]" title={pass.origin}>
                                                    {pass.origin}
                                                </span>
                                                <span className="text-slate-300">→</span>
                                                <span className="font-medium text-slate-700 truncate max-w-[120px]" title={pass.destination}>
                                                    {pass.destination}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-slate-700">{pass.submitted_by}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {formatDate(pass.completed_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleViewPDF(pass.id)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                                                title="View PDF"
                                            >
                                                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </button>
                                            {onTrack && (
                                                <button 
                                                    onClick={() => onTrack(pass.dc_number)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                                                    title="Track Pass"
                                                >
                                                    <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompletedMovements;
