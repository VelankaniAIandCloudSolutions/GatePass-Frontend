import React, { useState, useEffect } from 'react';
import { 
    User, Mail, Shield, Upload, Search, Plus,
    CheckCircle2, XCircle, Loader2, Camera, Info, Save
} from 'lucide-react';
import axios from '../api/axios';
import { compressImage } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';

const ProfileSettings = ({ onProfileUpdate }) => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMobile, setNewMobile] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [availableManagers, setAvailableManagers] = useState([]);
    const [selectedManagerIds, setSelectedManagerIds] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [securityEmail, setSecurityEmail] = useState('');
    const [isUpdatingSecEmail, setIsUpdatingSecEmail] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
        fetchAvailableManagers();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/user/profile');
            if (res.data?.success) {
                setProfile(res.data.data);
                setNewName(res.data.data.name);
                setNewMobile(res.data.data.mobile_number || '');
                setNewAddress(res.data.data.address || '');
                setSecurityEmail(res.data.data.email);
                setSelectedManagerIds((res.data.data.managers || []).map(m => m.id));
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableManagers = async () => {
        try {
            const res = await axios.get('/user/available-managers');
            if (res.data?.success) setAvailableManagers(res.data.data);
        } catch (err) {
            console.error('Fetch managers error:', err);
        }
    };

    const handleToggleManager = async (managerId) => {
        const isSelected = selectedManagerIds.includes(managerId);
        const newSelection = isSelected 
            ? selectedManagerIds.filter(id => id !== managerId)
            : [...selectedManagerIds, managerId];
        
        setSelectedManagerIds(newSelection);
        
        try {
            await axios.put('/user/managers', { managerIds: newSelection });
            setMessage({ type: 'success', text: 'Managers updated' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update managers' });
            // Rollback on failure
            setSelectedManagerIds(selectedManagerIds);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setMessage({ type: '', text: '' });

        try {
            // Compress image to max 300px @ 0.7 quality
            const compressedBase64 = await compressImage(file, 300, 0.7);

            const res = await axios.post('/user/upload-avatar', { image: compressedBase64 });
            if (res.data?.success) {
                setMessage({ type: 'success', text: 'Profile photo updated!' });
                
                // Update local storage and context
                const updatedProfile = { ...profile, avatar_path: res.data.data.avatar_path };
                setProfile(updatedProfile);
                
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                userObj.avatar_path = res.data.data.avatar_path;
                localStorage.setItem('user', JSON.stringify(userObj));

                if (onProfileUpdate) onProfileUpdate(updatedProfile);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Avatar update failed' });
        } finally {
            setIsUploading(false);
        }
    };

    const removeAvatar = async () => {
        try {
            const res = await axios.delete('/user/avatar');
            if (res.data?.success) {
                const updatedProfile = { ...profile, avatar_path: null };
                setProfile(updatedProfile);
                
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                userObj.avatar_path = null;
                localStorage.setItem('user', JSON.stringify(userObj));
                setMessage({ type: 'success', text: 'Profile photo removed' });

                if (onProfileUpdate) onProfileUpdate(updatedProfile);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to remove photo' });
        }
    };

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            const res = await axios.put('/user/profile', { name: newName, mobile_number: newMobile, address: newAddress });
            if (res.data?.success) {
                const updatedProfile = { ...profile, name: newName, mobile_number: newMobile, address: newAddress };
                setProfile(updatedProfile);
                setIsEditingName(false);
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                
                // Update local storage
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                userObj.name = newName;
                userObj.mobile_number = newMobile;
                userObj.address = newAddress;
                localStorage.setItem('user', JSON.stringify(userObj));
                
                if (onProfileUpdate) onProfileUpdate(updatedProfile);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateSecurityEmail = async () => {
        setIsUpdatingSecEmail(true);
        try {
            await axios.put('/user/security-email', { 
                email: securityEmail, 
                location_id: profile.location_id 
            });
            setMessage({ type: 'success', text: 'Official Security Email synced successfully' });
            fetchProfile();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setIsUpdatingSecEmail(false);
        }
    };

    const handleChangePassword = () => {
        // Leverages OTP Recovery Flow as per strategy
        // Logout first for security, then redirect to forgot password flow
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login?flow=forgot'); 
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('signature', file);

        setIsUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await axios.post('/user/upload-signature', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success) {
                setMessage({ type: 'success', text: 'Digital signature uploaded successfully!' });
                fetchProfile();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header info */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-400 p-8 relative">
                    <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-3xl shadow-xl">
                        <div className="w-24 h-24 bg-slate-100 rounded-[22px] flex items-center justify-center border border-slate-100 overflow-hidden relative group">
                            {profile?.avatar_path ? (
                                <img src={`${axios.defaults.baseURL.split('/api')[0]}/${profile.avatar_path}`} className="w-full h-full object-cover" alt="" />
                            ) : profile?.name ? (
                                <span className="text-3xl font-black text-indigo-600">{profile.name[0].toUpperCase()}</span>
                            ) : <User size={40} className="text-slate-300" />}
                        </div>
                    </div>
                </div>
                <div className="pt-16 pb-8 px-10 flex items-center justify-between">
                    <div className="flex-1">
                        {isEditingName ? (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="text-2xl font-black text-slate-900 tracking-tight border-b-2 border-indigo-500 focus:outline-none bg-transparent w-full"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. +91 99000 00000"
                                        value={newMobile} 
                                        onChange={(e) => setNewMobile(e.target.value)}
                                        className="text-lg font-bold text-slate-600 tracking-tight border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-transparent w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal/Office Address (Optional)</label>
                                    <textarea 
                                        placeholder="Enter your address for PDF records..."
                                        value={newAddress} 
                                        onChange={(e) => setNewAddress(e.target.value)}
                                        className="text-sm font-bold text-slate-600 tracking-tight border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-transparent w-full min-h-[60px] py-2"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button onClick={handleUpdateProfile} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-100">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                                        Save Changes
                                    </button>
                                    <button onClick={() => setIsEditingName(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile?.name}</h2>
                                    <button 
                                        onClick={() => setIsEditingName(true)} 
                                        className="flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs border border-indigo-100 uppercase tracking-widest shadow-sm shadow-indigo-100"
                                    >
                                        <Camera size={14} />
                                        Update Profile Info
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-x-8 gap-y-2 pt-2 border-t border-slate-50 mt-4">
                                    {profile?.mobile_number && (
                                        <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-300">Mobile</span> {profile.mobile_number}
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{profile?.role} Account</p>
                                </div>

                                {profile?.address && (
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-2 max-w-xl">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-2">
                                            <Shield size={10} className="text-slate-300" /> Personal / Office Address
                                        </p>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                            "{profile.address}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Manager Selection (Visible for Users only) */}
            {profile?.role === 'user' && (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 space-y-6">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5 mb-2">
                            <Search size={16} className="text-indigo-600" /> My Direct Managers
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Search and select managers to receive notifications for your Material Passes.
                        </p>
                    </div>

                    {/* Selected Managers Chips */}
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded-2xl border border-slate-100">
                        {selectedManagerIds.length > 0 ? (
                            availableManagers.filter(m => selectedManagerIds.includes(m.id)).map(manager => (
                                <div key={manager.id} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-xl animate-in zoom-in-95 duration-200">
                                    <span className="text-[10px] font-black uppercase tracking-tight">{manager.name}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleToggleManager(manager.id); }}
                                        className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 px-2">
                                <Info size={14} /> No managers selected
                            </p>
                        )}
                    </div>

                    {/* Search Input and Dropdown */}
                    <div className="relative">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                className={`w-full bg-white border-2 rounded-2xl px-12 py-4 text-xs font-bold text-slate-700 outline-none transition-all ${
                                    isSearchFocused ? 'border-indigo-600 shadow-xl shadow-indigo-100' : 'border-slate-100'
                                }`}
                            />
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-indigo-600' : 'text-slate-300'}`} size={18} />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1">
                                    <XCircle size={16} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {isSearchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                {availableManagers
                                    .filter(m => !selectedManagerIds.includes(m.id))
                                    .filter(m => 
                                        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        m.email.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).length > 0 ? (
                                        availableManagers
                                            .filter(m => !selectedManagerIds.includes(m.id))
                                            .filter(m => 
                                                m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                m.email.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map(manager => (
                                                <div 
                                                    key={manager.id}
                                                    onClick={() => {
                                                        handleToggleManager(manager.id);
                                                        setSearchTerm('');
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                                            {manager.name[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900">{manager.name}</p>
                                                            <p className="text-[10px] text-slate-500">{manager.email}</p>
                                                        </div>
                                                    </div>
                                                    <Plus size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                                                </div>
                                            ))
                                    ) : (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {searchTerm ? 'No matching managers found' : 'Type to search managers...'}
                                            </p>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                    {isSearchFocused && <div className="fixed inset-0 z-40" onClick={() => setIsSearchFocused(false)} />}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Details */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5 mb-2">
                        <Shield size={16} className="text-indigo-600" /> Account Security
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</p>
                            <p className="text-sm font-bold text-slate-700">{profile?.email}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Role</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700 capitalize">{profile?.role}</span>
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            </div>
                        </div>
                        <button 
                            onClick={handleChangePassword}
                            className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group"
                        >
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">System Password</span>
                            <Shield size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Official Security Email Sync (Visible for Security role ONLY) */}
                {profile?.role === 'security' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5 mb-2">
                            <Mail size={16} className="text-indigo-600" /> Site Security Governance
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Sync your personal account email with the official location security contact. 
                            <span className="text-amber-600 font-bold block mt-2 italic">⚠️ Only one active security user is allowed per site for synchronization.</span>
                        </p>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Site Email</label>
                                <input 
                                    type="email"
                                    value={securityEmail}
                                    onChange={(e) => setSecurityEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                                    placeholder="Click to set official email..."
                                />
                            </div>
                            <button 
                                onClick={handleUpdateSecurityEmail}
                                disabled={isUpdatingSecEmail || securityEmail === profile?.email}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                                    securityEmail !== profile?.email 
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:scale-[1.02]' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isUpdatingSecEmail ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Sync & Authorize Email
                            </button>
                        </div>
                    </div>
                )}

                {/* Profile Photo Settings */}
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5 mb-2">
                        <Camera size={16} className="text-indigo-600" /> Profile Photo
                    </h3>
                    
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Upload a profile picture to personalize your account. 
                    </p>

                    <div className="relative group">
                        <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300">
                            {profile?.avatar_path ? (
                                <div className="relative w-full h-full flex items-center justify-center group">
                                    <img 
                                        src={`${axios.defaults.baseURL.split('/api')[0]}/${profile.avatar_path}`} 
                                        alt="Avatar" 
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Change Photo</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center group-hover:scale-105 transition-transform">
                                    <Upload className={`w-6 h-6 mx-auto mb-2 ${isUploading ? 'animate-bounce text-indigo-600' : 'text-slate-300'}`} />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                                    </p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                                accept="image/*"
                            />
                        </div>
                        {profile?.avatar_path && (
                            <button 
                                onClick={removeAvatar}
                                className="mt-3 w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle size={14} />
                                Remove Current Photo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Signature Settings (Visible for Managers and Admin/Managers and Security) */}
            {(profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'security') && (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5 mb-2">
                        <Upload size={16} className="text-indigo-600" /> Digital Signature
                    </h3>
                    
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Upload your official signature image (PNG/JPG). This will be automatically embedded in Delivery Challans once you approve them.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="relative group h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300">
                            {profile?.signature_path ? (
                                <img 
                                    src={`${axios.defaults.baseURL.split('/api')[0]}/uploads/signatures/${profile.signature_path}`} 
                                    alt="Signature" 
                                    className="max-h-24 object-contain mix-blend-multiply"
                                />
                            ) : (
                                <div className="text-center">
                                    <Upload className={`w-6 h-6 mx-auto mb-2 ${isUploading ? 'animate-bounce text-indigo-600' : 'text-slate-300'}`} />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to Upload Signature</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                                <CheckCircle2 size={16} className="text-indigo-600 mt-0.5" />
                                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest leading-normal">
                                    Signature correctly configured and ready for Delivery Challan authorization.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {message.text && (
                <div className={`fixed bottom-8 right-8 flex items-center gap-2.5 p-4 rounded-2xl shadow-2xl border text-[11px] font-black uppercase tracking-widest transition-all animate-in slide-in-from-right-8 duration-500 ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
