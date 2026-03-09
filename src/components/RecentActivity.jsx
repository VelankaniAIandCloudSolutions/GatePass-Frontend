import React, { useState, useEffect } from 'react';
import { 
    FileText, CheckCircle2, XCircle, Clock, 
    Truck, PackageCheck, Download, Eye, Loader2, ChevronRight, Calculator,
    Navigation2
} from 'lucide-react';
import axios from '../api/axios';

const StatusBadge = ({ status }) => {
    const colors = {
        PENDING_SECURITY_1: 'bg-indigo-50 text-indigo-600 border-indigo-100', // Backward compatibility just in case
        PENDING_SECURITY_ORIGIN: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        PENDING_SECURITY_2: 'bg-blue-50 text-blue-600 border-blue-100', // Backward compatibility
        PENDING_SECURITY_DESTINATION: 'bg-blue-50 text-blue-600 border-blue-100',
        COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        REJECTED: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {(status || 'PENDING').replace(/_/g, ' ')}
        </span>
    );
};

const RecentActivity = ({ role, selectedStatus = 'active', onTrack, onActionSuccess }) => {
    const [passes, setPasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [vehicleInputs, setVehicleInputs] = useState({});
    
    // Parse user from localStorage for permission checks
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
                payload.passId = passId; // Kept for security routes specifically if they haven't been updated yet
                payload.vehicle_number = vehicleInputs[passId] || '';
            } else if (action === 'receive') {
                endpoint = '/material/security/receive';
                payload.passId = passId;
            } else if (action === 'security_reject') {
                endpoint = '/material/security/reject';
                payload.passId = passId;
                payload.rejected_reason = prompt('Reason for rejection:') || 'Rejected by Security';
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

    const renderActionButtons = (pass) => {
        const isPassLoading = actionLoading === pass.id;

        return (
            <div className="flex items-center justify-end gap-2">
                <button 
                    onClick={() => onTrack && onTrack(pass.dc_number)} 
                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" 
                    title="Track Movement"
                >
                    <Navigation2 size={16} />
                </button>
                <button onClick={() => handleView(pass.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Quick View"><Eye size={16} /></button>
                <button onClick={() => handleDownload(pass.id, pass.dc_number)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Download PDF"><Download size={16} /></button>

                {role === 'manager' && pass.status === 'PENDING_MANAGER' && parseInt(pass.manager_id) === parseInt(user.id) && (
                    <>
                        <button onClick={() => handleAction(pass.id, 'reject')} disabled={isPassLoading} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject"><XCircle size={18} /></button>
                        <button onClick={() => handleAction(pass.id, 'approve')} disabled={isPassLoading} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Approve"><CheckCircle2 size={18} /></button>
                    </>
                )}

                {role === 'security' && (
                    <>
                        {/* Dispatch Button: Only visible to Security at the ORIGIN site */}
                        {pass.status === 'PENDING_SECURITY_ORIGIN' && parseInt(userLocationId) === parseInt(pass.from_location_id) && (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Vehicle #" 
                                    className="px-2 py-1 text-[10px] font-bold border rounded-lg w-24 outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={vehicleInputs[pass.id] || ''}
                                    onChange={(e) => setVehicleInputs({...vehicleInputs, [pass.id]: e.target.value})}
                                />
                                <button onClick={() => handleAction(pass.id, 'security_reject')} disabled={isPassLoading} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject Dispatch">
                                    <XCircle size={18} />
                                </button>
                                <button onClick={() => handleAction(pass.id, 'dispatch')} disabled={isPassLoading} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Mark Dispatched">
                                    {isPassLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck size={18} />}
                                </button>
                            </div>
                        )}

                        {/* Receive Button: Only visible to Security at the DESTINATION site */}
                        {pass.status === 'PENDING_SECURITY_DESTINATION' && parseInt(userLocationId) === parseInt(pass.to_location_id) && (
                             <div className="flex items-center gap-1">
                                <button onClick={() => handleAction(pass.id, 'security_reject')} disabled={isPassLoading} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject Receipt">
                                    <XCircle size={18} />
                                </button>
                                <button onClick={() => handleAction(pass.id, 'receive')} disabled={isPassLoading} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Mark Received">
                                    {isPassLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck size={18} />}
                                </button>
                             </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Movements
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time Document Lifecycle</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">DC Number</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">From &rarr; To</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Current Stage</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Submitted By</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Created Date</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {passes.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-8 py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest opacity-50 italic">
                                    No {selectedStatus} movements found
                                </td>
                            </tr>
                        ) : passes.map(pass => (
                            <tr key={pass.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-900 tracking-tight">{pass.dc_number}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{pass.from_name}</span>
                                        <div className="w-4 h-[1px] bg-slate-300 my-0.5" />
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{pass.to_name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <StatusBadge status={pass.status} />
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">{pass.current_stage}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{pass.created_by}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {new Date(pass.created_at).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    {renderActionButtons(pass)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentActivity;
