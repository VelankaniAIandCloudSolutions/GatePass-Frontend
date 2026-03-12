import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { Search, FileText, ExternalLink, Calendar, MapPin, Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

import DataGrid from './common/DataGrid';

const CompletedMovements = ({ userRole, onTrack }) => {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCompleted = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('/material/status/completed');
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
        fetchCompleted();
    }, [fetchCompleted]);

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

    const columnDefs = [
        {
            headerName: 'DC Number',
            field: 'dc_number',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight py-1">
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{params.value}</span>
                    <div className="mt-1">
                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                            Completed
                        </span>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Movement Route',
            field: 'origin',
            flex: 2,
            minWidth: 260,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <span className="truncate">{params.value}</span>
                    <span className="text-slate-300 font-bold">→</span>
                    <span className="truncate text-indigo-600">{params.data.destination}</span>
                </div>
            )
        },
        {
            headerName: 'Submitted By',
            field: 'submitted_by',
            flex: 1,
            minWidth: 140,
            cellStyle: { fontWeight: '600', color: '#475569', fontSize: '13.5px' }
        },
        {
            headerName: 'Completed Date',
            field: 'completed_at',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight py-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-0.5">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(params.value).toLocaleDateString()}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium ml-4 tracking-tighter">
                        {new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            minWidth: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleViewPDF(params.data.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                        title="View PDF"
                    >
                        <FileText size={18} />
                    </button>
                    {onTrack && (
                        <button 
                            onClick={() => onTrack(params.data.dc_number)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                            title="Track Pass"
                        >
                            <ExternalLink size={18} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Completed Movements</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 whitespace-nowrap">Historical archive of fully executed gate passes</p>
                </div>
            </div>

            <DataGrid 
                rowData={passes}
                columnDefs={columnDefs}
                height="600px"
            />
        </div>
    );
};

export default CompletedMovements;
