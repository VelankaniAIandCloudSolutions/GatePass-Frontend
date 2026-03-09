import React, { useState, useEffect } from 'react';
import { 
    Plus, MapPin, Edit2, Trash2, Power, 
    Save, X, Loader2, Building2, Phone, User as UserIcon
} from 'lucide-react';
import axios from '../api/axios';

const LocationManagement = () => {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        location_name: '',
        address_text: '',
        contact_person: '',
        phone: '',
        security_email: '',
        security_name: ''
    });

    const fetchLocations = async () => {
        try {
            const res = await axios.get('/locations');
            if (res.data?.success) {
                // For admin, we might want to also see inactive ones, 
                // but the current API only returns active. 
                // We'll assume the admin API is the same for now or update it later.
                setLocations(res.data.data);
            }
        } catch (err) {
            console.error('Fetch locations error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                await axios.put(`/locations/${editingId}`, formData);
            } else {
                await axios.post('/locations', formData);
            }
            fetchLocations();
            resetForm();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save location');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (location) => {
        try {
            await axios.put(`/locations/${location.id}`, {
                ...location,
                is_active: !location.is_active
            });
            fetchLocations();
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    const handleEdit = (location) => {
        setEditingId(location.id);
        setFormData({
            location_name: location.location_name,
            address_text: location.address_text,
            contact_person: location.contact_person,
            phone: location.phone,
            security_email: location.security_email || '',
            security_name: location.security_name || ''
        });
        setIsAdding(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ location_name: '', address_text: '', contact_person: '', phone: '', security_email: '', security_name: '' });
        setIsAdding(false);
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
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Location Management</h3>
                        <p className="text-xs text-slate-500 font-medium">Configure authorized origin and destination sites</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Location
                </button>
            </div>

            {isAdding && (
                <div className="p-8 bg-slate-50 border-b border-slate-100">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:border-indigo-600 outline-none transition-all"
                                    placeholder="Site Name (e.g. Bangalore Hub)"
                                    value={formData.location_name}
                                    onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:border-indigo-600 outline-none transition-all"
                                    placeholder="Name"
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                            <textarea 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-indigo-600 outline-none transition-all min-h-[80px]"
                                placeholder="Complete postal address..."
                                value={formData.address_text}
                                onChange={(e) => setFormData({...formData, address_text: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Email (Notification Routing)</label>
                            <div className="relative">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:border-indigo-600 outline-none transition-all"
                                    placeholder="security@site.com"
                                    value={formData.security_email}
                                    onChange={(e) => setFormData({...formData, security_email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Contact Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:border-indigo-600 outline-none transition-all"
                                    placeholder="Security In-Charge Name"
                                    value={formData.security_name}
                                    onChange={(e) => setFormData({...formData, security_name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex items-end justify-end gap-3 pt-4">
                            <button 
                                type="button"
                                onClick={resetForm}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white transition-all border border-transparent hover:border-slate-200"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Update Site' : 'Create Site'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-1/4">Location Name</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-1/4">Address</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Security Email</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {locations.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                        <MapPin size={48} className="text-slate-300" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">No locations configured yet</p>
                                    </div>
                                </td>
                            </tr>
                        ) : locations.map(loc => (
                            <tr key={loc.id} className={`hover:bg-slate-50/30 transition-colors group ${!loc.is_active ? 'opacity-50' : ''}`}>
                                <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-900 tracking-tight">{loc.location_name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physical Site</p>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2 max-w-xs">{loc.address_text}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-bold text-slate-700">{loc.contact_person || 'N/A'}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{loc.phone || '-'}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-black text-indigo-600">{loc.security_email || 'Not Configured'}</p>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleToggleStatus(loc)}
                                            className={`p-2 rounded-lg transition-all ${loc.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                            title={loc.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            <Power size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(loc)}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LocationManagement;
