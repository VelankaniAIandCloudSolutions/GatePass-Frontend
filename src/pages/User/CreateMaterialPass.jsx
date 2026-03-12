import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Send, ArrowLeft, 
    CheckCircle, FileText, Download, Eye, Loader2,
    Globe, Building2, Truck, Box, Scale, Info, User as UserIcon
} from 'lucide-react';
import axios from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';

const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees only';
};

// DataGrid removed for this page as requested

const CreateMaterialPass = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [myManagers, setMyManagers] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [submittedPass, setSubmittedPass] = useState(null); 
    
    const [formData, setFormData] = useState({
        movement_type: 'internal',
        from_location_id: '',
        to_location_id: '',
        external_address: '',
        no_of_boxes: 0,
        net_weight: '',
        gross_weight: '',
        pass_type: 'RGP',
        receiver_id: '',
        receiver_name: '',
        receiver_mobile: '',
        receiver_email: '',
        expected_return_date: ''
    });

    const [receiverSearch, setReceiverSearch] = useState('');
    const [receiverResults, setReceiverResults] = useState([]);
    const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
    const [isMobileAutoPopulated, setIsMobileAutoPopulated] = useState(false);

    const [items, setItems] = useState([
        { id: Date.now(), part_no: '', description: '', qty: 1, unit_cost: 0, remarks: '' }
    ]);

    const fetchLocations = async () => {
        try {
            const res = await axios.get('/locations');
            if (res.data?.success) setLocations(res.data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchLocations();

        const fetchMyManagers = async () => {
            try {
                const res = await axios.get('/user/profile');
                if (res.data?.success) setMyManagers(res.data.data.managers || []);
            } catch (err) { console.error(err); }
        };
        fetchMyManagers();
    }, []);

    const addItem = () => setItems([...items, { id: Date.now() + Math.random(), part_no: '', description: '', qty: 1, unit_cost: 0, remarks: '' }]);
    const removeItem = (id) => items.length > 1 && setItems(items.filter(item => item.id !== id));
    const updateItem = (id, field, value) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));

    const isFormValid = () => {
        if (!formData.movement_type || !formData.from_location_id || !formData.pass_type) return false;
        if (formData.movement_type === 'internal' && (!formData.to_location_id || formData.to_location_id === formData.from_location_id)) return false;
        if (formData.movement_type === 'external' && (!formData.external_address || formData.external_address.trim().length < 5)) return false;
        
        if (!formData.receiver_email || !formData.receiver_email.includes('@')) return false;
        if (!formData.receiver_name) return false;

        return items.every(item => item.description && item.qty > 0);
    };

    const handlePreview = async () => {
        if (!isFormValid()) return;
        setIsPreviewLoading(true);
        try {
            const dataToPreview = {
                ...formData,
                no_of_boxes: parseInt(formData.no_of_boxes) || 0,
                items: items.map(({ id, ...rest }) => rest)
            };
            const res = await axios.post('/material/preview', 
                dataToPreview, 
                { responseType: 'blob' }
            );
            
            const file = new Blob([res.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            
            const pdfWindow = window.open();
            pdfWindow.location.href = fileURL;
            
        } catch (err) {
            console.error('Preview error:', err);
            setMessage({ type: 'error', text: 'Failed to generate preview' });
        } finally { setIsPreviewLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;
        setIsLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                no_of_boxes: parseInt(formData.no_of_boxes) || 0,
                items: items.map(({ id, ...rest }) => rest)
            };
            const res = await axios.post('/material/create', dataToSubmit);
            setSubmittedPass({ id: res.data.data.id, dc_number: res.data.data.dc_number });
            setMessage({ type: 'success', text: 'Material Pass submitted to manager!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create' });
        } finally { setIsLoading(false); }
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get(`/material/pdf/${submittedPass.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${submittedPass.dc_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error(err); }
    };

    const calculateTotalQty = () => items.reduce((acc, item) => acc + (parseInt(item.qty) || 0), 0);
    const calculateTotalValue = () => items.reduce((acc, item) => acc + ((item.qty || 0) * (item.unit_cost || 0)), 0);

    // columnDefs removed as we are using a standard HTML table below

    if (submittedPass) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl w-full bg-white rounded-[32px] border border-slate-200 shadow-2xl p-10 text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Submitted!</h2>
                    <p className="text-slate-500 font-medium mb-8">Material Pass <span className="text-indigo-600 font-black">{submittedPass.dc_number}</span> has been sent for manager approval.</p>
                    
                    <div className="grid grid-cols-1 gap-4 mb-10">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-3 w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-100 transition-all active:scale-95 group">
                            <Download className="w-5 h-5 group-hover:text-indigo-600" /> Download PDF Receipt
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate('/user-dashboard')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95">
                            Return to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-6">
                    <Link to="/user-dashboard" className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 border border-transparent hover:border-slate-200 active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Material Pass</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Official Document Workflow</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handlePreview} disabled={isPreviewLoading || !isFormValid()}
                        className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 border ${isFormValid() ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                    >
                        {isPreviewLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Eye className="w-4 h-4 text-indigo-600" />} 
                        Preview PDF (Draft)
                    </button>
                    
                    <button 
                        onClick={handleSubmit} disabled={isLoading || !isFormValid()}
                        className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all active:scale-95 shadow-lg ${isFormValid() ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
                        Confirm & Submit to Manager
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <SectionTitle icon={<Globe className="text-indigo-600" size={18} />} title="Movement Context" subtitle="Flow direction" />
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button type="button" onClick={() => setFormData({...formData, movement_type: 'internal'})} className={`py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2.5 ${formData.movement_type === 'internal' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-600/5 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-100'}`}>
                                    <Building2 size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Internal Transfer</span>
                                </button>
                                <button type="button" onClick={() => setFormData({...formData, movement_type: 'external'})} className={`py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2.5 ${formData.movement_type === 'external' ? 'bg-amber-50 border-amber-200 text-amber-600 ring-2 ring-amber-600/5 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-100'}`}>
                                    <Globe size={16} /><span className="text-[10px] font-black uppercase tracking-widest">External Shipment</span>
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block ml-0.5">Pass Classification</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, pass_type: 'RGP'})} 
                                        className={`py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2.5 ${formData.pass_type === 'RGP' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 ring-2 ring-indigo-600/5 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-100'}`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">RGP (Returnable basis)</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, pass_type: 'NRGP'})} 
                                        className={`py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2.5 ${formData.pass_type === 'NRGP' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-800'}`}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">NRGP (Non-Returnable basis)</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                                <div className="space-y-2">
                                    <InputLabel label="From (Origin Hub)" />
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all appearance-none" value={formData.from_location_id} onChange={(e) => setFormData({...formData, from_location_id: e.target.value})}>
                                        <option value="">Select Origin</option>
                                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.location_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <InputLabel label="To (Destination)" />
                                    {formData.movement_type === 'internal' ? (
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all appearance-none" value={formData.to_location_id} onChange={(e) => setFormData({...formData, to_location_id: e.target.value})}>
                                            <option value="">Select Destination</option>
                                            {locations.filter(loc => loc.id.toString() !== formData.from_location_id.toString()).map(loc => <option key={loc.id} value={loc.id}>{loc.location_name}</option>)}
                                        </select>
                                    ) : (
                                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-amber-600 transition-all min-h-[44px] h-[44px] resize-none" placeholder="Provide complete delivery address..." value={formData.external_address} onChange={(e) => setFormData({...formData, external_address: e.target.value})} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <SectionTitle icon={<Truck className="text-emerald-600" size={18} />} title="Logistics Specifications" subtitle="Optional metadata" />
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="space-y-2">
                                    <InputLabel label="Customer Reference #" />
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600" placeholder="PO / Invoice ID..." value={formData.customer_reference} onChange={(e) => setFormData({...formData, customer_reference: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <InputLabel label="No. of Boxes" />
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600" 
                                            value={formData.no_of_boxes} 
                                            onChange={(e) => setFormData({...formData, no_of_boxes: e.target.value === '' ? '' : (parseInt(e.target.value) || 0)})} 
                                        />
                                        <Box className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <InputLabel label="Net Weight (Kgs)" />
                                    <div className="relative">
                                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600" placeholder="0.00" value={formData.net_weight} onChange={(e) => setFormData({...formData, net_weight: e.target.value})} />
                                        <Scale className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <InputLabel label="Gross Weight (Kgs)" />
                                    <div className="relative">
                                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600" placeholder="0.00" value={formData.gross_weight} onChange={(e) => setFormData({...formData, gross_weight: e.target.value})} />
                                        <Scale className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 relative">
                            <SectionTitle icon={<UserIcon className="text-blue-600" size={18} />} title="Receiver Identification" subtitle="Search and select recipient" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <div className="space-y-2 relative lg:col-span-2">
                                    <InputLabel label="Search Receiver (Name or Email)" />
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600" 
                                        placeholder="Type name or email to search..." 
                                        value={receiverSearch} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setReceiverSearch(val);
                                            if (val.length >= 2) {
                                                axios.get(`/user/search?query=${val}`)
                                                    .then(res => {
                                                        if (res.data.success) {
                                                            setReceiverResults(res.data.data);
                                                            setShowReceiverDropdown(true);
                                                        }
                                                    })
                                                    .catch(err => console.error(err));
                                            } else {
                                                setShowReceiverDropdown(false);
                                            }
                                        }} 
                                    />
                                    {showReceiverDropdown && receiverResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {receiverResults.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => {
                                                        const hasMobile = !!user.mobile_number;
                                                        setFormData({
                                                            ...formData,
                                                            receiver_id: user.id,
                                                            receiver_name: user.name,
                                                            receiver_email: user.email,
                                                            receiver_mobile: user.mobile_number || ''
                                                        });
                                                        setIsMobileAutoPopulated(hasMobile);
                                                        setReceiverSearch(user.name);
                                                        setShowReceiverDropdown(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-none"
                                                >
                                                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                                                    <p className="text-[10px] text-slate-500">{user.email}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <InputLabel label="Receiver Email" />
                                    <input 
                                        type="email" 
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 outline-none" 
                                        placeholder="Select receiver..." 
                                        value={formData.receiver_email} 
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <InputLabel label="Receiver Mobile" />
                                    <input 
                                        type="text" 
                                        className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all ${
                                            (formData.receiver_id && isMobileAutoPopulated) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-700 focus:border-blue-600'
                                        }`}
                                        placeholder={formData.receiver_id && isMobileAutoPopulated ? "Mobile linked to profile" : "Type mobile number..."}
                                        value={formData.receiver_mobile} 
                                        onChange={(e) => setFormData({...formData, receiver_mobile: e.target.value})}
                                        readOnly={!!(formData.receiver_id && isMobileAutoPopulated)}
                                    />
                                </div>
                                
                                <div className="space-y-2 lg:col-span-2">
                                    <InputLabel label="Expected Return Date" />
                                    <input 
                                        type="date" 
                                        className={`w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all ${
                                            formData.pass_type === 'NRGP' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-700 focus:border-blue-600'
                                        }`}
                                        value={formData.expected_return_date} 
                                        onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})} 
                                        readOnly={formData.pass_type === 'NRGP'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-[#f1f5f9] border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50 w-16">Sl</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50 min-w-[150px]">Part Number</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50 min-w-[250px]">Description</th>
                                        <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50 w-24">Qty</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Remarks</th>
                                        <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 text-center font-bold text-sm text-slate-400 border-r border-slate-100 bg-slate-50/30">
                                                {index + 1}
                                            </td>
                                            <td className="px-0 py-0 border-r border-slate-100">
                                                <input 
                                                    className="w-full px-6 py-4 text-sm font-bold text-slate-700 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-medium focus:bg-white transition-colors animate-none" 
                                                    placeholder="PN-000" 
                                                    value={item.part_no} 
                                                    onChange={(e) => updateItem(item.id, 'part_no', e.target.value)} 
                                                />
                                            </td>
                                            <td className="px-0 py-0 border-r border-slate-100">
                                                <input 
                                                    className="w-full px-6 py-4 text-sm font-bold text-slate-700 bg-transparent outline-none placeholder:text-slate-300 placeholder:font-medium focus:bg-white transition-colors" 
                                                    placeholder="Enter item description..." 
                                                    value={item.description} 
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)} 
                                                />
                                            </td>
                                            <td className="px-0 py-0 border-r border-slate-100">
                                                <input 
                                                    type="number"
                                                    className="w-full px-4 py-4 text-sm font-bold text-slate-700 bg-transparent outline-none text-center placeholder:text-slate-300 focus:bg-white transition-colors" 
                                                    value={item.qty} 
                                                    onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)} 
                                                />
                                            </td>
                                            <td className="px-0 py-0 border-r border-slate-100">
                                                <input 
                                                    className="w-full px-6 py-4 text-sm font-medium text-slate-500 bg-transparent outline-none placeholder:text-slate-300 focus:bg-white transition-colors" 
                                                    placeholder="Add notes..." 
                                                    value={item.remarks} 
                                                    onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} 
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button 
                                                    onClick={() => removeItem(item.id)} 
                                                    className={`p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 ${items.length === 1 ? 'opacity-0 cursor-default' : 'active:scale-90 scale-100'}`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                            <button 
                                onClick={addItem}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 mx-auto"
                            >
                                <Plus size={16} /> ADD ANOTHER ITEM
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-200 flex justify-end items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Inventory Summary</span>
                        </div>
                        <div className="bg-white border border-slate-200 px-6 py-2.5 rounded-xl text-xs font-black text-slate-900 shadow-sm underline decoration-indigo-300 decoration-2 underline-offset-4">
                            Total Qty: {calculateTotalQty()}
                        </div>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {message.text && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-10 right-10 p-5 rounded-2xl shadow-2xl border flex items-center gap-4 z-50 ${message.type === 'success' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                        {message.type === 'success' ? <CheckCircle size={18} className="text-emerald-400" /> : <Info size={18} />}
                        <div>
                            <p className="font-bold text-sm tracking-tight">{message.type === 'success' ? 'Action Successful' : 'Notice'}</p>
                            <p className="text-[10px] font-medium opacity-70 mt-0.5">{message.text}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SectionTitle = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100/50 shadow-sm">{icon}</div>
        <div><h3 className="text-sm font-black text-slate-900 leading-none mb-0.5 tracking-tight">{title}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p></div>
    </div>
);

const InputLabel = ({ label }) => <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-0.5">{label}</label>;

export default CreateMaterialPass;
