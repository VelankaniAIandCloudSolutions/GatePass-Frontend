import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Shield, User, Loader2, Edit2, 
    CheckCircle2, XCircle, MoreVertical, Phone, Mail, Clock
} from 'lucide-react';
import axios from '../api/axios';

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

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Users</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Manage access & contact info</p>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search by name, email or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl w-full md:w-80 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Message Center */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-sm font-bold tracking-tight">{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Site</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contact Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50 shrink-0">
                                                <User className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 tracking-tight">{user.name}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-1">
                                                    <Mail size={12} /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                user.role === 'manager' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                user.role === 'security' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                                {user.role}
                                            </div>
                                            {user.role === 'security' && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                                    <Clock size={10} /> {user.status}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {editingUserId === user.id ? (
                                            <div className="flex flex-col items-center gap-2 max-w-[180px] mx-auto">
                                                <input 
                                                    type="text"
                                                    value={tempMobile}
                                                    onChange={(e) => setTempMobile(e.target.value)}
                                                    placeholder="+91..."
                                                    className="w-full text-center py-2 bg-slate-50 border-2 border-indigo-500 rounded-xl text-xs font-black tracking-tight focus:outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 w-full">
                                                    <button 
                                                        onClick={() => handleUpdateMobile(user.id)}
                                                        disabled={isSaving}
                                                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all disabled:opacity-50"
                                                    >
                                                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Save'}
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingUserId(null)}
                                                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5">
                                                {user.mobile_number ? (
                                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700 tracking-tight">
                                                        <Phone size={14} className="text-indigo-600" />
                                                        {user.mobile_number}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] italic text-slate-400 font-bold">No mobile direct</span>
                                                )}
                                                {user.role === 'security' && (
                                                    <div className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">
                                                        Direct site contact
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!editingUserId && (
                                                <button 
                                                    onClick={() => startEditing(user)}
                                                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group/btn"
                                                    title="Edit User Mobile"
                                                >
                                                    <Edit2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="py-20 text-center">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">No users found matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
