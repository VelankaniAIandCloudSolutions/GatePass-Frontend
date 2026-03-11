import React, { useState, useEffect } from 'react';
import { 
    FileText, CheckCircle2, XCircle, Clock, 
    Truck, PackageCheck, Download, Eye, Loader2, ChevronRight, Calculator,
    Navigation2
} from 'lucide-react';
import axios from '../api/axios';

import DataGrid from './common/DataGrid';

const StatusBadge = ({ status }) => {
    const colors = {
        PENDING_SECURITY_1: 'bg-amber-50 text-amber-600 border-amber-100',
        PENDING_SECURITY_ORIGIN: 'bg-amber-50 text-amber-600 border-amber-100',
        PENDING_SECURITY_2: 'bg-amber-50 text-amber-600 border-amber-100',
        PENDING_SECURITY_DESTINATION: 'bg-amber-50 text-amber-600 border-amber-100',
        PENDING_RECEIVER_CONFIRMATION: 'bg-amber-50 text-amber-600 border-amber-100',
        PENDING_MANAGER: 'bg-amber-50 text-amber-600 border-amber-100',
        COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        REJECTED: 'bg-red-50 text-red-600 border-red-100',
        REJECTED_BY_RECEIVER: 'bg-red-50 text-red-600 border-red-100',
        approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rejected: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {(status || 'PENDING').replace(/_/g, ' ')}
        </span>
    );
};

const RecentActivity = ({ role, selectedStatus = 'active', onTrack, onActionSuccess }) => {
    const [passes, setPasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [vehicleInputs, setVehicleInputs] = useState({});
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userLocationId = user.location_id;

    useEffect(() => {
        fetchPasses();
    }, [role, selectedStatus]);

    const fetchPasses = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/material/status/${selectedStatus}`);
            setPasses(res.data?.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (passId, action) => {
        setActionLoading(passId);
        try {
            let payload = { id: passId };
            let endpoint = '';
            
            if (role === 'manager') {
                endpoint = '/material/manager/update';
                payload.status = action === 'approve' ? 'approved' : 'rejected';
            } else if (action === 'dispatch') {
                endpoint = '/material/security/dispatch';
                payload.passId = passId;
                payload.vehicle_number = vehicleInputs[passId] || '';
            } else if (action === 'receive') {
                endpoint = '/material/security/receive';
                payload.passId = passId;
            } else if (action === 'security_reject') {
                payload.rejected_reason = prompt('Reason for rejection:') || 'Rejected by Security';
                if (!payload.rejected_reason) return; 
            } else if (action === 'receiver_confirm') {
                endpoint = '/material/confirm-receiver-portal';
                payload.passId = passId;
            } else if (action === 'receiver_reject') {
                endpoint = '/material/reject-receiver-portal';
                payload.passId = passId;
                payload.rejected_reason = prompt('Reason for rejection:') || 'Rejected by Receiver';
                if (!payload.rejected_reason) return;
            }

            await axios.post(endpoint, payload);
            fetchPasses(); 
            if (onActionSuccess) onActionSuccess();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownload = async (passId, dcNumber) => {
        try {
            const res = await axios.get(`/material/pdf/${passId}`, { responseType: 'blob' });
            const file = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${dcNumber || 'Challan'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) { console.error('Download error:', err); }
    };

    const handleView = async (passId) => {
        try {
            const res = await axios.get(`/material/pdf/${passId}`, { responseType: 'blob' });
            const file = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(file);
            const pdfWindow = window.open();
            if (pdfWindow) {
                pdfWindow.location.href = url;
            } else {
                window.open(url, '_blank');
            }
        } catch (err) { console.error('View error:', err); }
    };

    const columnDefs = [
        {
            headerName: 'DC Number',
            field: 'dc_number',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight">
                    <span className="font-bold text-slate-800 text-sm">{params.value}</span>
                    <div className="mt-1">
                        <StatusBadge status={params.data.status} />
                    </div>
                </div>
            )
        },
        {
            headerName: 'Movement Route',
            field: 'from_name',
            flex: 2,
            minWidth: 260,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <span className="truncate">{params.data.from_name}</span>
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                    <span className="truncate text-indigo-600">{params.data.to_name}</span>
                </div>
            )
        },
        {
            headerName: 'Current Stage',
            field: 'current_stage',
            flex: 1,
            minWidth: 150,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock size={12} className="text-slate-300" />
                    {params.value}
                </div>
            )
        },
        {
            headerName: 'Submitted By',
            field: 'created_by',
            flex: 1,
            minWidth: 140,
            cellStyle: { fontWeight: '600', color: '#475569', fontSize: '13px' }
        },
        {
            headerName: 'Created Date',
            field: 'created_at',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold text-slate-600">
                        {new Date(params.value).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
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
            cellRenderer: (params) => {
                const pass = params.data;
                const isPassLoading = actionLoading === pass.id;
                
                return (
                    <div className="flex items-center gap-3">
                        <button onClick={() => onTrack && onTrack(pass.dc_number)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all" title="Track"><Navigation2 size={18} /></button>
                        <button onClick={() => handleView(pass.id)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all" title="View"><Eye size={18} /></button>
                        <button onClick={() => handleDownload(pass.id, pass.dc_number)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all" title="Download"><Download size={18} /></button>
                        
                        {role === 'manager' && pass.status === 'PENDING_MANAGER' && parseInt(pass.manager_id) === parseInt(user.id) && (
                            <div className="flex items-center gap-2 ml-1">
                                <button onClick={() => handleAction(pass.id, 'reject')} disabled={isPassLoading} className="p-1 text-red-400 hover:text-red-600 transition-all"><XCircle size={18} /></button>
                                <button onClick={() => handleAction(pass.id, 'approve')} disabled={isPassLoading} className="p-1 text-emerald-400 hover:text-emerald-600 transition-all"><CheckCircle2 size={18} /></button>
                            </div>
                        )}

                        {role === 'security' && (
                            <div className="flex items-center gap-2 ml-1">
                                {pass.status === 'PENDING_SECURITY_ORIGIN' && parseInt(userLocationId) === parseInt(pass.from_location_id) && (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Veh #" 
                                            className="px-2 py-1 text-[10px] border rounded w-16 outline-none focus:border-indigo-300"
                                            value={vehicleInputs[pass.id] || ''}
                                            onChange={(e) => setVehicleInputs({...vehicleInputs, [pass.id]: e.target.value})}
                                        />
                                        <button onClick={() => handleAction(pass.id, 'dispatch')} disabled={isPassLoading} className="p-1 text-emerald-500 hover:text-emerald-600 transition-all">
                                            {isPassLoading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={18} />}
                                        </button>
                                    </div>
                                )}
                                {pass.status === 'PENDING_SECURITY_DESTINATION' && parseInt(userLocationId) === parseInt(pass.to_location_id) && (
                                    <button onClick={() => handleAction(pass.id, 'receive')} disabled={isPassLoading} className="p-1 text-blue-500 hover:text-blue-600 transition-all">
                                        {isPassLoading ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={18} />}
                                    </button>
                                )}
                            </div>
                        )}

                        {pass.status === 'PENDING_RECEIVER_CONFIRMATION' && parseInt(pass.receiver_id) === parseInt(user.id) && (
                            <button onClick={() => handleAction(pass.id, 'receiver_confirm')} disabled={isPassLoading} className="p-1 text-emerald-500 hover:text-emerald-600 transition-all">
                                {isPassLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        {selectedStatus} Movements
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Real-time Document Lifecycle</p>
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

export default RecentActivity;
