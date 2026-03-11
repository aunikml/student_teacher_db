import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
    ChevronLeft, Edit, Save, X, Loader2, UserCircle2, 
    Briefcase, MapPin, School, Heart, Calendar, PlusCircle, Trash2
} from 'lucide-react';

const AlumniDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const[alumniRecord, setAlumniRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Edit States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const[formData, setFormData] = useState({});
    
    // Further Education Modal States
    const[isEduModalOpen, setIsEduModalOpen] = useState(false);
    const [eduFormData, setEduFormData] = useState({});

    // Dropdown Choices
    const PROFESSIONAL_SECTOR_CHOICES =[
        { value: 'Private', label: 'Private' }, { value: 'Corporate', label: 'Corporate' },
        { value: 'Government', label: 'Government' }, { value: 'NGO', label: 'NGO' },
        { value: 'INGO', label: 'INGO' }, { value: 'Entrepreneur', label: 'Entrepreneur' },
        { value: 'Performance_Art', label: 'Performance Art' }, { value: 'Other', label: 'Other' },
    ];
    const MARITAL_STATUS_CHOICES =[
        { value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' },
        { value: 'Divorced', label: 'Divorced' }, { value: 'Widowed', label: 'Widowed' }, { value: 'Other', label: 'Other' },
    ];
    
    // Dynamic Sub-field Options
    const GOVT_SUB_OPTIONS =[
        { value: 'Primary Education', label: 'Primary Education' }, { value: 'Secondary Education', label: 'Secondary Education' },
        { value: 'Higher Secondary Education', label: 'Higher Secondary Education' }, { value: 'Tertiary Education', label: 'Tertiary Education' }
    ];
    const PRIVATE_SUB_OPTIONS =[
        { value: 'Corporate', label: 'Corporate' }, { value: 'Primary Education', label: 'Primary Education' }, 
        { value: 'Secondary Education', label: 'Secondary Education' }, { value: 'Higher Secondary Education', label: 'Higher Secondary Education' }, 
        { value: 'Tertiary Education', label: 'Tertiary Education' }
    ];

    useEffect(() => {
        fetchAlumniRecord();
    }, [id]);

    const fetchAlumniRecord = async () => {
        setLoading(true);
        try {
            const res = await api.get(`alumni/alumni/${id}/`);
            setAlumniRecord(res.data);
            setFormData(res.data); 
        } catch (err) {
            console.error("Failed to fetch alumni record:", err);
            alert("Could not load alumni record.");
            navigate('/alumni');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            // If sector changes, ensure sub-category is cleared if it doesn't apply anymore
            let payload = { ...formData };
            if (!['Government', 'Private'].includes(payload.professional_sector)) {
                payload.professional_sector_sub_category = '';
            }

            await api.put(`alumni/alumni/${id}/`, payload);
            alert("Alumni record updated successfully!");
            setIsEditingProfile(false);
            fetchAlumniRecord();
        } catch (err) {
            alert("Failed to update record. Check data for errors.");
        }
    };

    // --- FURTHER EDUCATION LOGIC ---
    const openEduModal = (edu = null) => {
        if (edu) {
            setEduFormData(edu);
        } else {
            setEduFormData({
                alumni: id, degree_type: 'Undergraduate', degree_name: '',
                program_name: '', institution_name: '', institution_type: 'Private',
                start_year: '', graduation_year: ''
            });
        }
        setIsEduModalOpen(true);
    };

    const handleSaveEdu = async (e) => {
        e.preventDefault();
        try {
            if (eduFormData.id) {
                await api.put(`alumni/further-education/${eduFormData.id}/`, eduFormData);
            } else {
                await api.post(`alumni/further-education/`, eduFormData);
            }
            setIsEduModalOpen(false);
            fetchAlumniRecord(); // Refresh to get updated list
        } catch (err) {
            alert("Failed to save education record.");
        }
    };

    const handleDeleteEdu = async (eduId) => {
        if (window.confirm("Delete this education record?")) {
            try {
                await api.delete(`alumni/further-education/${eduId}/`);
                fetchAlumniRecord();
            } catch (err) {
                alert("Failed to delete record.");
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    if (!alumniRecord) return <div className="p-10 text-center text-gray-500">Record not found.</div>;

    // Helper Component for Fields
    const FieldDisplay = ({ label, fieldKey, icon, type = "text", options =[] }) => (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {icon} {label}
            </label>
            {isEditingProfile ? (
                type === "select" ? (
                    <select 
                        className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                        value={formData[fieldKey] || ''}
                        onChange={e => setFormData({...formData, [fieldKey]: e.target.value})}
                    >
                        <option value="">Select...</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                ) : (
                    <input 
                        type={type}
                        className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        value={formData[fieldKey] || ''}
                        onChange={e => setFormData({...formData, [fieldKey]: e.target.value})}
                    />
                )
            ) : (
                <p className="text-sm font-bold text-slate-700">{formData[fieldKey] || 'N/A'}</p>
            )}
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/alumni')} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-blue-600 transition">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {alumniRecord.first_name} {alumniRecord.last_name}
                        </h1>
                        <span className="font-mono text-blue-600 font-bold tracking-widest text-sm mt-1 block">ID: {alumniRecord.student_id}</span>
                    </div>
                </div>
                {(isEditingProfile ? 
                    <button onClick={() => setIsEditingProfile(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition"><X size={18}/> Cancel</button>
                    :
                    <button onClick={() => setIsEditingProfile(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 transition shadow-md shadow-amber-100"><Edit size={18}/> Edit Profile</button>
                )}
            </header>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
                
                {/* 1. Personal & Location */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2 border-b pb-2"><UserCircle2 size={18}/> Personal & Location</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Email</label>
                            <p className="text-sm font-bold text-slate-700">{alumniRecord.original_student_email || 'N/A'}</p>
                        </div>
                        <FieldDisplay label="Marital Status" fieldKey="marital_status" icon={<Heart size={16}/>} type="select" options={MARITAL_STATUS_CHOICES} />
                        <FieldDisplay label="Current Country" fieldKey="current_country_of_residence" icon={<MapPin size={16}/>} />
                        <FieldDisplay label="City" fieldKey="city" icon={<MapPin size={16}/>} />
                        <div className="md:col-span-2">
                            <FieldDisplay label="Address" fieldKey="address" icon={<MapPin size={16}/>} />
                        </div>
                    </div>
                </div>

                {/* 2. Professional Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2 border-b pb-2"><Briefcase size={18}/> Professional Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        <FieldDisplay label="Current Occupation" fieldKey="current_occupation" icon={<Briefcase size={16}/>} />
                        <FieldDisplay label="Professional Affiliation" fieldKey="current_professional_affiliation" icon={<Briefcase size={16}/>} />
                        
                        <FieldDisplay label="Professional Sector" fieldKey="professional_sector" icon={<Briefcase size={16}/>} type="select" options={PROFESSIONAL_SECTOR_CHOICES} />
                        
                        {/* DYNAMIC SUB-FIELD */}
                        {formData.professional_sector === 'Government' && (
                            <FieldDisplay label="Government Sub-Sector" fieldKey="professional_sector_sub_category" icon={<Briefcase size={16}/>} type="select" options={GOVT_SUB_OPTIONS} />
                        )}
                        {formData.professional_sector === 'Private' && (
                            <FieldDisplay label="Private Sub-Sector" fieldKey="professional_sector_sub_category" icon={<Briefcase size={16}/>} type="select" options={PRIVATE_SUB_OPTIONS} />
                        )}
                    </div>
                </div>

                {/* Submit Button for Profile */}
                {isEditingProfile && (
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                            <Save size={18}/> Save Profile Changes
                        </button>
                    </div>
                )}
            </form>

            {/* 3. Academic Information (BRAC IED) */}
            <div className="bg-slate-50 rounded-2xl border border-gray-200 p-8">
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 border-b pb-2 border-gray-200"><School size={18}/> BRAC IED Academic Record</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Program Name</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{alumniRecord.brac_program_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Semester</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{alumniRecord.starting_semester || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Graduation Session</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{alumniRecord.concluding_semester || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* 4. Further Education Detail */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><School size={18}/> Further Education Detail</h2>
                    <button onClick={() => openEduModal()} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition">
                        <PlusCircle size={14}/> Add Education
                    </button>
                </div>
                
                {alumniRecord.further_educations?.length > 0 ? (
                    <div className="grid gap-4">
                        {alumniRecord.further_educations.map(edu => (
                            <div key={edu.id} className="p-5 border rounded-xl bg-gray-50 flex justify-between items-center group">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{edu.degree_name} <span className="text-sm font-normal text-gray-500">({edu.degree_type})</span></h3>
                                    <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">{edu.institution_name}</span> - {edu.program_name}</p>
                                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                                        {edu.institution_type} • {edu.start_year} - {edu.graduation_year}
                                    </p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEduModal(edu)} className="p-2 text-amber-600 bg-amber-100 rounded-lg hover:bg-amber-200"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteEdu(edu.id)} className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No further education records added.</p>
                )}
            </div>

            {/* MODAL: ADD/EDIT FURTHER EDUCATION */}
            {isEduModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 bg-blue-600 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic"><School size={20}/> {eduFormData.id ? 'Edit' : 'Add'} Education Record</h2>
                            <button onClick={() => setIsEduModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveEdu} className="p-8 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                <select className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={eduFormData.degree_type} onChange={e => setEduFormData({...eduFormData, degree_type: e.target.value})} required>
                                    <option value="Undergraduate">Undergraduate</option>
                                    <option value="Post-graduate">Post-graduate</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name of the Degree</label>
                                <input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. BSc in Comp Sci" value={eduFormData.degree_name} onChange={e => setEduFormData({...eduFormData, degree_name: e.target.value})} required/>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name of the Program</label>
                                <input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={eduFormData.program_name} onChange={e => setEduFormData({...eduFormData, program_name: e.target.value})} required/>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institution/University</label>
                                <input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={eduFormData.institution_name} onChange={e => setEduFormData({...eduFormData, institution_name: e.target.value})} required/>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institution Type</label>
                                <select className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={eduFormData.institution_type} onChange={e => setEduFormData({...eduFormData, institution_type: e.target.value})} required>
                                    <option value="Government">Government</option>
                                    <option value="Private">Private</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Year</label>
                                <input type="number" className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={eduFormData.start_year} onChange={e => setEduFormData({...eduFormData, start_year: e.target.value})} required/>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Graduation Year</label>
                                <input type="number" className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={eduFormData.graduation_year} onChange={e => setEduFormData({...eduFormData, graduation_year: e.target.value})} required/>
                            </div>
                            <div className="col-span-2 pt-4 flex gap-3 border-t mt-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition">Save Record</button>
                                <button type="button" onClick={() => setIsEduModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 p-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlumniDetail;