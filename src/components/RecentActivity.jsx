import React, { useState, useEffect } from 'react';
import { 
    FileText, CheckCircle2, XCircle, Clock, 
    Truck, PackageCheck, Download, Eye, Loader2, ChevronRight, Calculator,
    Navigation2
} from 'lucide-react';
import axios from '../api/axios';

import DataGrid from './common/DataGrid';

// --- Stable Cell Renderer for Actions Column ---
// We define this outside the parent component so its reference never changes.
// This prevents AG Grid from unmounting the input field and breaking focus while typing.
const ActionsCellRenderer = (params) => {
    const [vehicleNo, setVehicleNo] = useState("");
    
    if (!params || !params.data || !params.context) return null;
    
    const pass = params.data;
    const { 
        actionLoading, role, user, userLocationId, 
        handleAction, handleView, handleDownload, onTrack 
    } = params.context;

    const isPassLoading = actionLoading === pass.id;

    return (
        <div className="flex items-center gap-3 whitespace-nowrap overflow-x-auto">
            <button onClick={() => onTrack && onTrack(pass.dc_number)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all active:scale-90" title="Track"><Navigation2 size={18} /></button>
            <button onClick={() => handleView(pass.id)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all active:scale-90" title="View"><Eye size={18} /></button>
            <button onClick={() => handleDownload(pass.id, pass.dc_number)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all active:scale-90" title="Download"><Download size={18} /></button>
            
            {role === 'manager' && pass.status === 'PENDING_MANAGER' && user && user.id && parseInt(pass.manager_id) === parseInt(user.id) && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
                    <button onClick={() => handleAction(pass.id, 'reject')} disabled={isPassLoading} className="p-1 text-red-400 hover:text-red-600 transition-all active:scale-90"><XCircle size={18} /></button>

                    <button onClick={() => handleAction(pass.id, 'approve')} disabled={isPassLoading} className="p-1 text-emerald-400 hover:text-emerald-600 transition-all active:scale-90"><CheckCircle2 size={18} /></button>
                </div>
            )}

            {role === 'security' && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-2 flex-nowrap">
                    {pass.status === 'PENDING_SECURITY_ORIGIN' && parseInt(userLocationId) === parseInt(pass.from_location_id) && (
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            <input 
                                type="text" 
                                placeholder="Vehicle No" 
                                className="px-2 py-1 text-sm border border-slate-200 rounded-md w-28 outline-none focus:border-indigo-400 font-semibold"
                                value={vehicleNo}
                                onChange={(e) => setVehicleNo(e.target.value)}
                            />
                            <button 
                                onClick={() => {
                                    if (!vehicleNo.trim()) {
                                        alert('Please enter a vehicle number before dispatching.');
                                        return;
                                    }
                                    handleAction(pass.id, 'dispatch', vehicleNo.trim());
                                }} 
                                disabled={isPassLoading} 
                                className="p-1 text-emerald-500 hover:text-emerald-600 transition-all active:scale-90" 
                                title="Approve / Dispatch"
                            >
                                {isPassLoading ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                            </button>
                            <button onClick={() => handleAction(pass.id, 'security_reject')} disabled={isPassLoading} className="p-1 text-red-400 hover:text-red-600 transition-all active:scale-90" title="Reject">
                                <XCircle size={18} />
                            </button>
                        </div>
                    )}
                    {pass.status === 'PENDING_SECURITY_DESTINATION' && parseInt(userLocationId) === parseInt(pass.to_location_id) && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleAction(pass.id, 'receive')} disabled={isPassLoading} className="p-1 text-blue-500 hover:text-blue-600 transition-all active:scale-90" title="Confirm Receipt">
                                {isPassLoading ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={18} />}
                            </button>
                            <button onClick={() => handleAction(pass.id, 'security_reject')} disabled={isPassLoading} className="p-1 text-red-400 hover:text-red-600 transition-all active:scale-90" title="Reject">
                                <XCircle size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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

    const handleAction = async (passId, action, vehicleNo = null) => {
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
                payload.vehicle_number = vehicleNo || vehicleInputs[passId] || '';
            } else if (action === 'receive') {
                endpoint = '/material/security/receive';
                payload.passId = passId;
            } else if (action === 'security_reject') {
                payload.rejected_reason = prompt('Reason for rejection:') || 'Rejected by Security';
                if (!payload.rejected_reason) return;
                endpoint = '/material/security/reject';
                payload.passId = passId;
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

    const columnDefs = React.useMemo(() => [
        {
            headerName: 'DC Number',
            field: 'dc_number',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight py-1">
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{params.value}</span>
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
                    <span className="text-slate-300 font-bold">→</span>
                    <span className="truncate text-indigo-600">{params.data.to_name}</span>
                </div>
            )
        },
        {
            headerName: 'Current Stage',
            field: 'current_stage',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium w-full overflow-hidden">
                    <Clock size={12} className="text-slate-400 shrink-0" />
                    <span title={params.value} className="truncate">{params.value}</span>
                </div>
            )
        },
        {
            headerName: 'Submitted By',
            field: 'created_by',
            flex: 1,
            minWidth: 140,
            cellStyle: { fontWeight: '600', color: '#475569', fontSize: '13.5px' }
        },
        {
            headerName: 'Created Date',
            field: 'created_at',
            flex: 1,
            minWidth: 160,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight py-1">
                    <span className="text-xs font-semibold text-slate-600">
                        {new Date(params.value).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-tighter">
                        {new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            headerName: 'Actions',
            field: 'actions',
            minWidth: 320,
            maxWidth: 380,
            resizable: true,
            sortable: false,
            filter: false,
            cellRenderer: ActionsCellRenderer
        }
    ], []);

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
                gridOptions={{
                    context: { 
                        actionLoading, role, user, userLocationId, 
                        handleAction, handleView, handleDownload, onTrack 
                    }
                }}
            />
        </div>
    );
};

export default RecentActivity;
