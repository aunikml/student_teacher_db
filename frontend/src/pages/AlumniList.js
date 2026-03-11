import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Eye, Edit, Trash2, Loader2, GraduationCap } from 'lucide-react';

const AlumniList = () => {
    const navigate = useNavigate();
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAlumni();
    }, []);

    const fetchAlumni = async () => {
        setLoading(true);
        try {
            const res = await api.get('alumni/alumni/');
            setAlumni(res.data);
        } catch (err) {
            console.error("Failed to fetch alumni:", err);
            alert("Could not load alumni records.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this alumni record? This cannot be undone.")) {
            try {
                await api.delete(`alumni/alumni/${id}/`);
                fetchAlumni();
            } catch (err) {
                alert("Failed to delete alumni record.");
            }
        }
    };

    const filteredAlumni = alumni.filter(a =>
        a.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.current_occupation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <GraduationCap className="text-blue-600" /> Alumni Management
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Oversee graduated student records and professional details.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by ID, Name, Occupation..." 
                        className="pl-12 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80 transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student ID</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupation</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sector</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="p-10 text-center"><Loader2 className="animate-spin inline text-blue-600" /></td></tr>
                        ) : filteredAlumni.length === 0 ? (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No alumni records found.</td></tr>
                        ) : (
                            filteredAlumni.map(alumni => (
                                <tr key={alumni.id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="p-5 font-bold text-blue-600 font-mono tracking-tighter">{alumni.student_id}</td>
                                    <td className="p-5 font-bold text-slate-700 uppercase tracking-tight">{alumni.first_name} {alumni.last_name}</td>
                                    <td className="p-5 text-gray-600">{alumni.current_occupation || 'N/A'}</td>
                                    <td className="p-5 text-gray-600">{alumni.professional_sector?.replace('_', ' ') || 'N/A'}</td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => navigate(`/alumni/${alumni.id}`)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="View Details"><Eye size={18} /></button>
                                            <button onClick={() => navigate(`/alumni/${alumni.id}/edit`)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg" title="Edit Record"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(alumni.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Delete Record"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlumniList;