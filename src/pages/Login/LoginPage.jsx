import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Lock, User, Shield, ChevronRight, 
    CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ArrowLeft
} from 'lucide-react';
import axios from '../../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import loginBanner from '../../assets/login-banner.png';
import logo from '../../assets/logo.png';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot'
    const [signupStep, setSignupStep] = useState(1); // 1: Details, 2: OTP, 3: Password
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Reset
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Forms State
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ name: '', email: '', otp: '', password: '', role: 'user' });
    const [forgotData, setForgotData] = useState({ email: '', otp: '', newPassword: '' });

    // Check for flow query param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const flow = params.get('flow');
        if (flow === 'forgot') {
            setActiveTab('forgot');
        }
    }, [location]);

    // Tab Change Reset
    useEffect(() => {
        setMessage({ type: '', text: '' });
        setSignupStep(1);
        setForgotStep(1);
    }, [activeTab]);

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (token && user) {
            if (user.role === 'admin') navigate('/admin-dashboard', { replace: true });
            else if (user.role === 'user') navigate('/user-dashboard', { replace: true });
            else if (user.role === 'manager') navigate('/manager-dashboard', { replace: true });
            else if (user.role === 'security') navigate('/security-dashboard', { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await axios.post('/auth/login', loginData);
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            
            const role = res.data.data.user.role;
            if (role === 'admin') navigate('/admin-dashboard', { replace: true });
            else if (role === 'user') navigate('/user-dashboard', { replace: true });
            else if (role === 'manager') navigate('/manager-dashboard', { replace: true });
            else if (role === 'security') navigate('/security-dashboard', { replace: true });
            else navigate('/login', { replace: true });

        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Login failed' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupInitiate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('/auth/signup/initiate', { name: signupData.name, email: signupData.email });
            setSignupStep(2);
            setMessage({ type: 'success', text: 'OTP sent to your email' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send OTP' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('/auth/signup/verify', { email: signupData.email, otp: signupData.otp });
            setSignupStep(3);
            setMessage({ type: 'success', text: 'Email verified! Set your password.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid OTP' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupFinal = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('/auth/signup/set-password', { 
                email: signupData.email, 
                password: signupData.password,
                role: signupData.role 
            });
            setMessage({ type: 'success', text: 'Account activated! Redirecting to login...' });
            setTimeout(() => {
                setActiveTab('login');
                setLoginData(prev => ({ ...prev, email: signupData.email }));
            }, 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to set password' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotInitiate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('/auth/forgot/initiate', { email: forgotData.email });
            setForgotStep(2);
            setMessage({ type: 'success', text: 'Reset OTP sent to your email' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send OTP' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotConfirm = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('/auth/forgot/confirm', { 
                email: forgotData.email, 
                otp: forgotData.otp, 
                newPassword: forgotData.newPassword 
            });
            setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
            setTimeout(() => setActiveTab('login'), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Reset failed' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden">
            {/* Left Panel - Forms (50% Width) */}
            <div className="w-full lg:w-[50%] h-full flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 overflow-y-auto custom-scrollbar bg-white">
                <div className="w-full max-w-md py-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 overflow-hidden">
                            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GatePass</h1>
                    </div>

                    {/* Navigation Tabs */}
                    {activeTab !== 'forgot' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                            <button 
                                onClick={() => setActiveTab('login')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    activeTab === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => setActiveTab('signup')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    activeTab === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    {/* Form Container */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'login' && (
                            <motion.div 
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
                                <p className="text-slate-500 mb-8 font-medium">Please enter your details to sign in.</p>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <FormInput 
                                        icon={<Mail className="w-5 h-5" />}
                                        type="email"
                                        placeholder="Email Address"
                                        value={loginData.email}
                                        onChange={(v) => setLoginData({...loginData, email: v})}
                                    />
                                    <div className="space-y-1">
                                        <FormInput 
                                            icon={<Lock className="w-5 h-5" />}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Password"
                                            value={loginData.password}
                                            onChange={(v) => setLoginData({...loginData, password: v})}
                                            rightElement={
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            }
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setActiveTab('forgot')}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 ml-1"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <ActionButton loading={isLoading} text="Sign In" />
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'signup' && (
                            <motion.div 
                                key="signup"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Join GatePass</h2>
                                <p className="text-slate-500 mb-6 font-medium">Complete 3 easy steps to start.</p>

                                {/* Progress Indicator */}
                                <div className="flex items-center gap-2 mb-8">
                                    {[1, 2, 3].map(s => (
                                        <div 
                                            key={s}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                                s <= signupStep ? 'bg-indigo-600' : 'bg-slate-200'
                                            }`}
                                        />
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {signupStep === 1 && (
                                        <motion.form key="s1" onSubmit={handleSignupInitiate} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <FormInput icon={<User className="w-5 h-5" />} placeholder="Full Name" value={signupData.name} onChange={(v) => setSignupData({...signupData, name: v})} required />
                                            <FormInput icon={<Mail className="w-5 h-5" />} type="email" placeholder="Work Email" value={signupData.email} onChange={(v) => setSignupData({...signupData, email: v})} required />
                                            <ActionButton loading={isLoading} text="Request OTP" />
                                        </motion.form>
                                    )}

                                    {signupStep === 2 && (
                                        <motion.form key="s2" onSubmit={handleSignupVerify} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Enter 6-digit code sent to {signupData.email}</p>
                                            <FormInput icon={<Shield className="w-5 h-5" />} placeholder="000000" value={signupData.otp} onChange={(v) => setSignupData({...signupData, otp: v})} required maxLength={6} className="text-center text-2xl tracking-[0.5em] font-mono" />
                                            <ActionButton loading={isLoading} text="Verify OTP" />
                                            <button type="button" onClick={() => setSignupStep(1)} className="w-full text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Change email address?</button>
                                        </motion.form>
                                    )}

                                    {signupStep === 3 && (
                                        <motion.form key="s3" onSubmit={handleSignupFinal} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Your Role</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <select 
                                                        value={signupData.role}
                                                        onChange={(e) => setSignupData({...signupData, role: e.target.value})}
                                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold text-sm appearance-none"
                                                        required
                                                    >
                                                        <option value="user">Gate Pass User (Requester)</option>
                                                        <option value="manager">Manager (Approver)</option>
                                                        <option value="security">Security (Gate Officer)</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </div>
                                                </div>
                                            </div>
                                            <FormInput icon={<Lock className="w-5 h-5" />} type="password" placeholder="Create Secure Password" value={signupData.password} onChange={(v) => setSignupData({...signupData, password: v})} required minLength={8} />
                                            <p className="text-[10px] text-slate-400 px-2 font-medium">Minimum 8 characters. Role can only be selected once.</p>
                                            <ActionButton loading={isLoading} text="Activate Account" />
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {activeTab === 'forgot' && (
                            <motion.div 
                                key="forgot"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <button 
                                    onClick={() => setActiveTab('login')}
                                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </button>
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Reset Password</h2>
                                <p className="text-slate-500 mb-8 font-medium">We'll help you get back in.</p>

                                <AnimatePresence mode="wait">
                                    {forgotStep === 1 && (
                                        <motion.form key="f1" onSubmit={handleForgotInitiate} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <FormInput icon={<Mail className="w-5 h-5" />} type="email" placeholder="Registered Email" value={forgotData.email} onChange={(v) => setForgotData({...forgotData, email: v})} required />
                                            <ActionButton loading={isLoading} text="Send OTP" />
                                        </motion.form>
                                    )}

                                    {forgotStep === 2 && (
                                        <motion.form key="f2" onSubmit={handleForgotConfirm} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <FormInput icon={<Shield className="w-5 h-5" />} placeholder="Enter OTP" value={forgotData.otp} onChange={(v) => setForgotData({...forgotData, otp: v})} required maxLength={6} />
                                            <FormInput icon={<Lock className="w-5 h-5" />} type="password" placeholder="New Secure Password" value={forgotData.newPassword} onChange={(v) => setForgotData({...forgotData, newPassword: v})} required minLength={8} />
                                            <ActionButton loading={isLoading} text="Reset & Login" />
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feedback Messages */}
                    <AnimatePresence>
                        {message.text && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mt-8 p-4 rounded-xl border flex items-center gap-3 ${
                                    message.type === 'success' 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                        : 'bg-red-50 border-red-100 text-red-700'
                                }`}
                            >
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-bold tracking-tight">{message.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Panel - Illustration (Static 50% Width) */}
            <div className="hidden lg:flex w-[50%] bg-white items-center justify-center overflow-hidden border-l border-slate-50 relative">
                <div className="relative w-full h-full flex items-center justify-center p-8">
                    <img 
                        src={loginBanner} 
                        alt="Security Banner" 
                        className="max-h-[80%] max-w-full object-contain drop-shadow-2xl"
                    />
                </div>

            </div>
        </div>
    );
};

// Helper Components
const FormInput = ({ icon, className = '', rightElement, onChange, ...props }) => (
    <div className="group space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">
            {props.placeholder}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                {icon}
            </div>
            <input 
                {...props}
                onChange={(e) => onChange && onChange(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-11 py-3.5 rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold text-sm ${className}`}
            />
            {rightElement && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors">
                    {rightElement}
                </div>
            )}
        </div>
    </div>
);

const ActionButton = ({ loading, text }) => (
    <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
    >
        {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
            <>
                <span>{text}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
        )}
    </button>
);

export default LoginPage;
