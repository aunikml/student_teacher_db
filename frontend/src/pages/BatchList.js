import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { 
    FolderPlus, 
    Users, 
    Edit, 
    Trash2, 
    Eye, 
    X, 
    Loader2, 
    Search,
    Database,
    Save,
    GraduationCap // Icon for the new feature
} from 'lucide-react';

const BatchList = () => {
    const navigate = useNavigate();
    
    // Data State
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ programs: [], semesters: [], years: [], cohorts: [] });
    
    // UI State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingGraduation, setProcessingGraduation] = useState(false); // Loading state for graduation action

    // Form State (for creating a new batch)
    const [formData, setFormData] = useState({
        program: '', semester: '', year: '', cohort: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [batchRes, p, s, y, c] = await Promise.all([
                api.get('batches/'),
                api.get('config/programs/'),
                api.get('config/semesters/'),
                api.get('config/years/'),
                api.get('config/cohorts/')
            ]);
            setBatches(batchRes.data);
            setConfig({ programs: p.data, semesters: s.data, years: y.data, cohorts: c.data });
        } catch (err) {
            console.error("Error fetching initial data", err);
            alert("Could not load necessary configuration data. Please check the server connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('batches/', formData);
            setFormData({ program: '', semester: '', year: '', cohort: '' });
            fetchInitialData();
            alert("Batch created successfully!");
        } catch (err) {
            const errors = err.response?.data;
            let errorMessage = "An unknown error occurred.";

            if (errors) {
                if (errors.non_field_errors) {
                    errorMessage = errors.non_field_errors[0];
                } else {
                    const fieldErrorKeys = Object.keys(errors);
                    const firstErrorField = fieldErrorKeys[0];
                    errorMessage = `${firstErrorField}: ${errors[firstErrorField][0]}`;
                }
            }
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this batch? All associated student records will also be removed permanently.")) {
            try {
                await api.delete(`batches/${id}/`);
                fetchInitialData();
            } catch (err) {
                alert("Failed to delete batch. It may have dependent assignments.");
            }
        }
    };

    // --- MARK AS GRADUATED LOGIC ---
    const handleMarkGraduated = async (batch) => {
        const confirmMsg = `Are you sure you want to graduate ${batch.program_name} (${batch.cohort_name})?\n\nThis will:\n1. Change all student statuses to 'Graduated'\n2. Mark all assigned courses as 'Completed'`;
        
        if (window.confirm(confirmMsg)) {
            setProcessingGraduation(true);
            try {
                const res = await api.post(`batches/${batch.id}/mark-graduated/`);
                alert(res.data.message);
                fetchInitialData(); // Refresh to reflect changes
            } catch (err) {
                console.error(err);
                alert("Failed to mark batch as graduated.");
            } finally {
                setProcessingGraduation(false);
            }
        }
    };

    const openEditModal = (batch) => {
        setEditingBatch({
            id: batch.id,
            program: batch.program,
            semester: batch.semester,
            year: batch.year,
            cohort: batch.cohort
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                program: editingBatch.program,
                semester: editingBatch.semester,
                year: editingBatch.year,
                cohort: editingBatch.cohort
            };
            await api.put(`batches/${editingBatch.id}/`, payload);
            setIsEditModalOpen(false);
            fetchInitialData();
            alert("Batch updated successfully!");
        } catch (err) {
            console.error("Update Error:", err.response?.data);
            alert("Error updating batch. This combination might already exist.");
        }
    };

    // Derived state to check if the create form is valid
    const isFormValid = formData.program && formData.semester && formData.year && formData.cohort;

    // Filter logic for the search bar
    const filteredBatches = batches.filter(b => 
        b.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cohort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(b.year_val).includes(searchTerm)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Database className="text-blue-600" /> Student Batches
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Manage program batches and student enrollment lists.</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by program, cohort, or year..." 
                        className="pl-12 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80 transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {/* CREATE BATCH FORM */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FolderPlus size={16} className="text-blue-600" /> Create New Batch
                </h2>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    {['Program', 'Semester', 'Year', 'Cohort'].map(label => (
                        <div key={label} className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">{label}</label>
                            <select 
                                className="w-full p-3 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData[label.toLowerCase()]} 
                                required 
                                onChange={e => setFormData({...formData, [label.toLowerCase()]: e.target.value})}
                            >
                                <option value="">Select {label}</option>
                                {config[label.toLowerCase()+'s']?.map(item => <option key={item.id} value={item.id}>{item.name || item.year}</option>)}
                            </select>
                        </div>
                    ))}
                    <button 
                        type="submit" 
                        disabled={!isFormValid}
                        className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg text-white uppercase text-xs tracking-widest
                            ${isFormValid ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-gray-300 cursor-not-allowed'}
                        `}
                    >
                        <FolderPlus size={18} /> Add Batch
                    </button>
                </form>
            </div>

            {/* BATCHES TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Program & Cohort</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Session</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrollment</th>
                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {loading || processingGraduation ? (
                            <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin inline text-blue-600" /></td></tr>
                        ) : filteredBatches.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No batches found matching your search.</td></tr>
                        ) : (
                            filteredBatches.map(batch => (
                                <tr key={batch.id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-bold text-slate-700">{batch.program_name}</div>
                                        <div className="text-xs text-gray-400 font-medium">{batch.cohort_name}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-tight">
                                            {batch.semester_name} {batch.year_val}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <Users size={16} className="text-gray-300" />
                                            {batch.student_count} Students
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                            {/* Mark as Graduated Button */}
                                            <button 
                                                onClick={() => handleMarkGraduated(batch)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                                title="Mark Batch as Graduated"
                                            >
                                                <GraduationCap size={18} />
                                            </button>

                                            <button onClick={() => navigate(`/batches/${batch.id}`)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="View Students"><Eye size={18} /></button>
                                            <button onClick={() => openEditModal(batch)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition" title="Edit Batch"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(batch.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition" title="Delete Batch"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* EDIT BATCH MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 bg-blue-600 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic"><Edit size={22}/> Update Batch Configuration</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Program</label>
                                    <select className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={editingBatch.program} onChange={e => setEditingBatch({...editingBatch, program: e.target.value})}>
                                        {config.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Semester</label>
                                    <select className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={editingBatch.semester} onChange={e => setEditingBatch({...editingBatch, semester: e.target.value})}>
                                        {config.semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
                                    <select className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={editingBatch.year} onChange={e => setEditingBatch({...editingBatch, year: e.target.value})}>
                                        {config.years.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cohort</label>
                                    <select className="w-full p-3 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={editingBatch.cohort} onChange={e => setEditingBatch({...editingBatch, cohort: e.target.value})}>
                                        {config.cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6 mt-4 border-t flex gap-3">
                                <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition flex items-center justify-center gap-2">
                                    <Save size={18}/> Save Changes
                                </button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 p-3 rounded-xl font-bold hover:bg-gray-200 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchList;