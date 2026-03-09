import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Clock } from 'lucide-react';

const FinanceDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-slate-50 p-6">
            <div className="w-full">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Finance Dashboard</h1>
                    <p className="text-slate-500 mt-2">
                        Manage Material Gate Pass requests and track activity.
                    </p>
                </div>

                {/* Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Create Material Pass */}
                    <div 
                        onClick={() => navigate('/create-material-pass')}
                        className="cursor-pointer bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-4 rounded-xl">
                                <PlusCircle className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Create Material Pass
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Generate a new Material Gate Pass request.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div 
                        onClick={() => navigate('/finance-activity')}
                        className="cursor-pointer bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-4 rounded-xl">
                                <Clock className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Recent Activity
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Track status of recently created passes.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default FinanceDashboard;