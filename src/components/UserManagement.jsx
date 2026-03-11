import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Shield, User, Loader2, Edit2, 
    CheckCircle2, XCircle, MoreVertical, Phone, Mail, Clock
} from 'lucide-react';
import axios from '../api/axios';

import DataGrid from './common/DataGrid';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [tempMobile, setTempMobile] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/user/admin/users');
            if (res.data?.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            setMessage({ type: 'error', text: 'Failed to load users' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateMobile = async (userId) => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await axios.put(`/user/admin/user/${userId}/mobile`, { mobile_number: tempMobile });
            if (res.data?.success) {
                setMessage({ type: 'success', text: 'User mobile updated successfully' });
                setEditingUserId(null);
                fetchUsers();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (user) => {
        setEditingUserId(user.id);
        setTempMobile(user.mobile_number || '');
    };

    // Column Definitions for AG Grid
    const columnDefs = [
        {
            headerName: 'User Details',
            field: 'name',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params) => (
                <div className="flex flex-col leading-tight py-2">
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{params.value}</span>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5">{params.data.email}</span>
                </div>
            )
        },
        {
            headerName: 'Role & Site',
            field: 'role',
            flex: 1,
            minWidth: 150,
            cellRenderer: (params) => (
                <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        params.value === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        params.value === 'manager' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        params.value === 'security' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                        {params.value}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold tracking-tight">{params.data.location_name}</span>
                </div>
            )
        },
        {
            headerName: 'Contact Information',
            field: 'mobile_number',
            flex: 1,
            minWidth: 180,
            cellRenderer: (params) => {
                const user = params.data;
                if (editingUserId === user.id) {
                    return (
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={tempMobile}
                                onChange={(e) => setTempMobile(e.target.value)}
                                className="w-28 px-2 py-1 bg-white border border-indigo-200 rounded text-[11px] font-bold outline-none focus:border-indigo-500"
                                autoFocus
                            />
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleUpdateMobile(user.id)} disabled={isSaving} className="p-1 text-emerald-500 hover:text-emerald-600">
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                </button>
                                <button onClick={() => setEditingUserId(null)} className="p-1 text-slate-400 hover:text-slate-600">
                                    <XCircle size={14} />
                                </button>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                        <Phone size={12} className="text-slate-300" />
                        {user.mobile_number || 'N/A'}
                    </div>
                );
            }
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
                    {!editingUserId && (
                        <button 
                            onClick={() => startEditing(params.data)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                            title="Edit User"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Users</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Manage access & contact info</p>
                    </div>
                </div>
                {/* Search is now inside DataGrid */}
            </div>

            {/* Message Center */}
            {message.text && (
                <div className={`p-4 mx-2 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-sm font-bold tracking-tight">{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                    </button>
                </div>
            )}

            {/* Users Grid */}
            <DataGrid 
                rowData={users}
                columnDefs={columnDefs}
                height="600px"
            />
        </div>
    );
};

export default UserManagement;
