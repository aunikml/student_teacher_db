import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
    Settings, 
    Layers, 
    Calendar, 
    Book, 
    GraduationCap, 
    Plus, 
    Trash2, 
    Loader2,
    Clock
} from 'lucide-react';

const AcademicConfig = () => {
    const [activeTab, setActiveTab] = useState('programs'); // programs, courses, cohorts, years, semesters
    const [items, setItems] = useState([]);
    const [programs, setPrograms] = useState([]); // Specifically for Course assignment dropdown
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({});

    // Fetch data whenever tab changes
    useEffect(() => {
        fetchItems();
        if (activeTab === 'courses') {
            fetchPrograms();
        }
    }, [activeTab]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get(`config/${activeTab}/`);
            setItems(res.data);
        } catch (err) {
            console.error(`Failed to fetch ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrograms = async () => {
        try {
            const res = await api.get('config/programs/');
            setPrograms(res.data);
        } catch (err) {
            console.error("Failed to fetch programs for dropdown");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`config/${activeTab}/`, formData);
            setFormData({}); // Reset form
            fetchItems(); // Refresh list
        } catch (err) {
            alert(`Error creating ${activeTab.slice(0, -1)}. Please check your data.`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await api.delete(`config/${activeTab}/${id}/`);
                fetchItems();
            } catch (err) {
                alert("Could not delete item. It may be linked to other data.");
            }
        }
    };

    // Helper for Tab Buttons
    const TabButton = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => { setActiveTab(id); setFormData({}); }}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-200 font-medium text-sm ${
                activeTab === id 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Settings className="text-blue-600" /> Academic Components
                </h1>
                <p className="text-gray-500 mt-1">Configure the core building blocks of the academic portal.</p>
            </header>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-xl overflow-hidden shadow-sm">
                <TabButton id="programs" label="Programs" icon={GraduationCap} />
                <TabButton id="courses" label="Courses" icon={Book} />
                <TabButton id="cohorts" label="Cohorts" icon={Layers} />
                <TabButton id="years" label="Academic Years" icon={Calendar} />
                <TabButton id="semesters" label="Semesters" icon={Clock} />
            </div>

            {/* Dynamic Form Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Plus size={16} /> Add New {activeTab.slice(0, -1)}
                </h2>
                
                <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
                    {activeTab === 'programs' && (
                        <input 
                            type="text" placeholder="Program Name (e.g. Computer Science)" 
                            className="flex-1 min-w-[300px] p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name || ''} 
                            onChange={e => setFormData({name: e.target.value})} required 
                        />
                    )}

                    {activeTab === 'years' && (
                        <input 
                            type="number" placeholder="Year (YYYY)" 
                            className="flex-1 min-w-[200px] p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.year || ''} 
                            onChange={e => setFormData({year: e.target.value})} required 
                        />
                    )}

                    {activeTab === 'semesters' && (
                        <select 
                            className="flex-1 min-w-[200px] p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name || ''} 
                            onChange={e => setFormData({name: e.target.value})} required
                        >
                            <option value="">Select Semester Name</option>
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                            <option value="Fall">Fall</option>
                        </select>
                    )}

                    {activeTab === 'cohorts' && (
                        <input 
                            type="text" placeholder="Cohort Name (e.g. Class of 2026)" 
                            className="flex-1 min-w-[300px] p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name || ''} 
                            onChange={e => setFormData({name: e.target.value})} required 
                        />
                    )}

                    {activeTab === 'courses' && (
                        <>
                            <input 
                                type="text" placeholder="Code (e.g. CS101)" 
                                className="w-32 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.code || ''} 
                                onChange={e => setFormData({...formData, code: e.target.value})} required 
                            />
                            <input 
                                type="text" placeholder="Course Full Name" 
                                className="flex-1 min-w-[200px] p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name || ''} 
                                onChange={e => setFormData({...formData, name: e.target.value})} required 
                            />
                            <select 
                                className="flex-1 min-w-[200px] p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.program || ''}
                                onChange={e => setFormData({...formData, program: e.target.value})} required
                            >
                                <option value="">Select Program</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </>
                    )}

                    <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 flex items-center gap-2">
                        <Plus size={20} /> Add
                    </button>
                </form>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                            <tr>
                                <th className="p-4 border-b italic">Details</th>
                                {activeTab === 'courses' && <th className="p-4 border-b italic">Program</th>}
                                <th className="p-4 border-b text-right italic">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-10 text-center text-gray-400">No {activeTab} found. Add one above.</td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-700">
                                                {activeTab === 'years' ? item.year : 
                                                 activeTab === 'courses' ? `${item.code} - ${item.name}` : 
                                                 item.name}
                                            </div>
                                        </td>
                                        {activeTab === 'courses' && (
                                            <td className="p-4">
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                    {item.program_name}
                                                </span>
                                            </td>
                                        )}
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="text-gray-300 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AcademicConfig;