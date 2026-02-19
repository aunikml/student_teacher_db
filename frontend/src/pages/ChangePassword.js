import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert } from 'lucide-react';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            await api.post('users/change-password/', {
                old_password: oldPassword, // Matches Serializer
                new_password: newPassword  // Matches Serializer
            });
            
            alert("Password updated successfully! Please login again with your new password.");
            
            // Clear local storage and send to login to re-authenticate properly
            localStorage.removeItem('access_token');
            window.location.href = "/login";
        } catch (err) {
            console.error(err.response?.data);
            const serverError = err.response?.data;
            if (serverError?.old_password) {
                setError(serverError.old_password[0]);
            } else if (serverError?.new_password) {
                setError("New password: " + serverError.new_password[0]);
            } else {
                setError("Failed to update password. Please check your credentials.");
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-slate-100">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <KeyRound size={32} />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-slate-800">Security Update</h2>
                <p className="text-sm text-gray-500 text-center mt-2 mb-8">
                    This is your first login. Please update your temporary password to continue.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2">
                        <ShieldAlert size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Temporary Password</label>
                        <input 
                            type="password" 
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                            placeholder="Enter the password provided by Admin"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">New Secure Password</label>
                        <input 
                            type="password" 
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                            placeholder="Enter at least 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;