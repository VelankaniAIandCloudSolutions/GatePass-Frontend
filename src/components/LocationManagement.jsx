import React, { useState, useEffect } from 'react';
import { 
    Plus, MapPin, Edit2, Trash2, Power, 
    Save, X, Loader2, Building2, Phone, User as UserIcon
} from 'lucide-react';
import axios from '../api/axios';

import DataGrid from './common/DataGrid';

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

    const columnDefs = [
        {
            headerName: 'Location Identity',
            field: 'location_name',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params) => (
                <div className={`flex flex-col leading-tight py-1 ${!params.data.is_active ? 'opacity-60' : ''}`}>
                    <span className="font-bold text-slate-800 text-sm tracking-tight">{params.value}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${params.data.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {params.data.is_active ? 'Active Facility' : 'Operational Offline'}
                    </span>
                </div>
            )
        },
        {
            headerName: 'Site Address',
            field: 'address_text',
            flex: 2,
            minWidth: 250,
            cellRenderer: (params) => (
                <div className={`flex items-center text-sm font-medium text-slate-500 italic ${!params.data.is_active ? 'opacity-50' : ''}`}>
                    {params.value}
                </div>
            )
        },
        {
            headerName: 'Point of Contact',
            field: 'contact_person',
            flex: 1,
            minWidth: 180,
            cellRenderer: (params) => (
                <div className={`flex flex-col gap-1 ${!params.data.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                        <UserIcon size={12} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{params.value || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                        <Phone size={10} className="text-slate-300" />
                        {params.data.phone || 'No direct line'}
                    </div>
                </div>
            )
        },
        {
            headerName: 'Security Ops Email',
            field: 'security_email',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params) => (
                <div className={`flex items-center ${!params.data.is_active ? 'opacity-50' : ''}`}>
                    <span className="text-sm font-semibold text-indigo-600 underline decoration-indigo-100 underline-offset-4">{params.value || 'auth-pending@site.com'}</span>
                </div>
            )
        },
        {
            headerName: 'Management',
            field: 'actions',
            width: 120,
            minWidth: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleToggleStatus(params.data)}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 ${params.data.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={params.data.is_active ? 'Deactivate Site' : 'Activate Site'}
                    >
                        <Power size={18} />
                    </button>
                    <button 
                        onClick={() => handleEdit(params.data)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                        title="Edit Metadata"
                    >
                        <Edit2 size={18} />
                    </button>
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
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Location Management</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 whitespace-nowrap">Configure authorized origin and destination sites</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 whitespace-nowrap self-start md:self-auto"
                >
                    <Plus className="w-4 h-4" /> Add Location
                </button>
            </div>

            {isAdding && (
                <div className="mx-2 p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">
                            {editingId ? '02' : '01'}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                            {editingId ? 'Update Existing Site' : 'Register New Site'}
                        </h4>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
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
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                    placeholder="Name"
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all min-h-[100px]"
                                placeholder="Complete postal address..."
                                value={formData.address_text}
                                onChange={(e) => setFormData({...formData, address_text: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Email</label>
                            <div className="relative">
                                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                    placeholder="security@site.com"
                                    value={formData.security_email}
                                    onChange={(e) => setFormData({...formData, security_email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Manager Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                    placeholder="Security In-Charge Name"
                                    value={formData.security_name}
                                    onChange={(e) => setFormData({...formData, security_name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 md:col-span-2">
                            <button 
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg shadow-indigo-100 active:scale-95"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Update Metadata' : 'Confirm Registration'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <DataGrid 
                rowData={locations}
                columnDefs={columnDefs}
                height="600px"
            />
        </div>
    );
};

export default LocationManagement;
