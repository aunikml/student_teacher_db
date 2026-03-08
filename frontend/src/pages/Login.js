import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Loader2 } from 'lucide-react'; // Import all necessary icons

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // State to display login errors
    const { login, loading } = useContext(AuthContext); // Use loading from context
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            await login(email, password);
            navigate('/'); // Navigate to dashboard on success
        } catch (err) {
            // Display specific error message from server if available
            const serverError = err.response?.data?.detail || "Invalid Credentials. Please try again.";
            setError(serverError);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="p-10 bg-white shadow-xl rounded-2xl w-full max-w-md border border-blue-100 transform hover:scale-[1.01] transition-transform duration-300 ease-out">
                <div className="flex flex-col items-center mb-8">
                    {/* BRAC IED Logo */}
                    <img 
                        src={`${process.env.PUBLIC_URL}/brac-ied-logo.png`} 
                        alt="BRAC IED Logo" 
                        className="h-20 mb-4" // Adjust height as needed
                    />
                    <h1 className="text-2xl font-extrabold text-slate-800 text-center tracking-tight">
                        BRAC IED Student Information Management System
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1" htmlFor="email">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="email" 
                                id="email"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors bg-gray-50" 
                                placeholder="your.email@example.com"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                autoComplete="email"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1" htmlFor="password">Password</label>
                        <div className="relative">
                            <LogIn size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-180" /> {/* Rotated for password icon */}
                            <input 
                                type="password" 
                                id="password"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors bg-gray-50" 
                                placeholder="••••••••"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                autoComplete="current-password"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading} // Disable button while loading (e.g., fetching profile after login)
                        className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase text-sm tracking-wider"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20}/> : <LogIn size={20}/>}
                        {loading ? "Logging in..." : "Login to Portal"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;