import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
    BookOpen, 
    UserCheck, 
    FileText, 
    Info, 
    X, 
    Plus, 
    Edit, 
    Save, 
    Loader2,
    Calendar,
    Users
} from 'lucide-react';

const CourseAssignment = () => {
    const { user } = useContext(AuthContext);
    
    // Data States
    const [assignments, setAssignments] = useState([]);
    const [config, setConfig] = useState({ programs: [], batches: [], faculty: [] }); // Configuration for dropdowns
    const [courses, setCourses] = useState([]); // Courses filtered by selected program in the form
    const [loading, setLoading] = useState(true);
    
    // UI/Modal States
    const [isModalOpen, setIsModalOpen] = useState(false); // Controls create/edit modal visibility
    const [editingAssignment, setEditingAssignment] = useState(null); // Holds assignment data if in "Edit" mode
    const [isSubmitting, setIsSubmitting] = useState(false); // Indicates if form is being submitted

    // Form Data State (for both create and edit modal)
    const [formData, setFormData] = useState({
        program: '', // This is a temporary field for filtering courses, not sent to API
        course: '', 
        batch: '', 
        semester: 'Fall', 
        start_date: '', 
        faculty: [] // Array of faculty IDs
    });

    useEffect(() => {
        fetchAssignments();
        // Only Admins need to fetch the full configuration for the form dropdowns
        if (user.role === 'ADMIN') {
            fetchFormConfig();
        }
    }, [user.role]); // Re-run if user role changes

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await api.get('course_assign/');
            setAssignments(res.data);
        } catch (err) {
            console.error("Failed to fetch assignments:", err);
            alert("Could not load course assignments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchFormConfig = async () => {
        try {
            // Fetch programs, batches, and faculty users concurrently
            const [p, b, f] = await Promise.all([
                api.get('config/programs/'),
                api.get('batches/'),
                api.get('users/manage/')
            ]);
            setConfig({ 
                programs: p.data, 
                batches: b.data, 
                faculty: f.data.filter(u => u.role === 'FACULTY') // Filter to only show faculty members
            });
        } catch (err) {
            console.error("Failed to load form configuration data:", err);
            alert("Could not load form options.");
        }
    };

    // Helper to fetch courses specifically for a selected program
    const fetchCoursesForProgram = async (programId) => {
        if (!programId) {
            setCourses([]); // Clear courses if no program is selected
            return;
        }
        try {
            const res = await api.get(`config/courses/?program=${programId}`);
            setCourses(res.data);
        } catch (err) {
            console.error("Error fetching courses for program:", err);
            setCourses([]);
        }
    };

    // Handles change in the Program dropdown to filter courses
    const handleProgramChange = (programId) => {
        setFormData({ ...formData, program: programId, course: '' }); // Reset course when program changes
        fetchCoursesForProgram(programId);
    };

    // --- Modal Control Functions ---
    const openCreateModal = () => {
        setEditingAssignment(null); // Clear any editing data
        setFormData({ // Reset form for new creation
            program: '', course: '', batch: '', semester: 'Fall', start_date: '', faculty: []
        });
        setCourses([]); // Clear courses
        setIsModalOpen(true); // Open the modal
    };

    const openEditModal = async (assignment) => {
        // CRITICAL FIX: Ensure batch_details exists before accessing program
        const programId = assignment.batch_details ? assignment.batch_details.program : ''; 
        
        // Await the course fetch to ensure dropdown is populated before modal opens
        await fetchCoursesForProgram(programId); 
        
        setEditingAssignment(assignment); // Set assignment to be edited
        setFormData({ // Populate form with existing assignment data
            program: programId, // Use the program ID from batch details
            course: assignment.course,
            batch: assignment.batch,
            semester: assignment.semester,
            // Format date to 'YYYY-MM-DD' for input type='date'
            start_date: assignment.start_date, 
            faculty: assignment.faculty // Array of faculty IDs
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { ...formData };
        delete payload.program; // Remove the temporary 'program' field as it's not part of the API model

        try {
            if (editingAssignment) {
                // Perform PUT request for updating
                await api.put(`course_assign/${editingAssignment.id}/`, payload);
                alert("Assignment updated successfully!");
            } else {
                // Perform POST request for creating
                await api.post('course_assign/', payload);
                alert("Course Assigned Successfully!");
            }
            setIsModalOpen(false); // Close modal
            fetchAssignments(); // Refresh assignments list
        } catch (err) {
            console.error("Assignment operation failed:", err.response?.data || err.message);
            alert("Operation Failed. Please check your data and ensure a valid combination is selected.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 italic">
                    <BookOpen className="text-blue-600" /> Course Assignments
                </h1>
                {user.role === 'ADMIN' && ( // Only Admin can see the "New Assignment" button
                    <button 
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 uppercase text-xs tracking-widest"
                    >
                        <Plus size={18} /> New Assignment
                    </button>
                )}
            </header>

            {/* Assignments Table */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Course</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Batch</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Semester & Start</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Faculty</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? <tr><td colSpan="5" className="text-center p-10"><Loader2 className="animate-spin inline-block text-blue-500" size={30} /></td></tr> :
                         assignments.length === 0 ? <tr><td colSpan="5" className="text-center p-10 text-gray-400 italic">No course assignments found.</td></tr> :
                         assignments.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50 transition group">
                                <td className="p-4 font-bold text-slate-700">
                                    {a.course_code} <span className="text-gray-400 font-normal">| {a.course_name}</span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {a.program_name} <span className="text-blue-500 font-bold">({a.batch_name})</span>
                                </td>
                                <td className="p-4 italic text-sm text-blue-600 font-medium">
                                    {a.semester} <span className="text-gray-400">{new Date(a.start_date).getFullYear()}</span>
                                </td>
                                <td className="p-4 text-sm text-slate-700">
                                    <div className="flex flex-wrap gap-1">
                                        {a.faculty_details.map(f => (
                                            <span key={f.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                {f.first_name} {f.last_name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { /* Implement view details modal for assignment */ }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="View Details"><Info size={18}/></button>
                                        
                                        {user.role === 'ADMIN' && ( // Only Admin can edit assignments
                                            <button onClick={() => openEditModal(a)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg" title="Edit Assignment"><Edit size={18}/></button>
                                        )}
                                        
                                        {user.role === 'FACULTY' && (
                                            <>
                                                <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="View Student Evaluation Reports (Pending)"><UserCheck size={18}/></button>
                                                <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg" title="View Course Evaluation Reports (Pending)"><FileText size={18}/></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE/EDIT ASSIGNMENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <header className="p-6 bg-blue-600 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic">
                                {editingAssignment ? <Edit size={20}/> : <Plus size={20}/>}
                                {editingAssignment ? 'Edit Course Assignment' : 'Create New Assignment'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20}/></button>
                        </header>
                        
                        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Program selection to filter courses */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Program</label>
                                <select className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={formData.program} required onChange={e => handleProgramChange(e.target.value)}>
                                    <option value="">Select Program to Filter Courses</option>
                                    {config.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            {/* Course selection (filtered by program) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Course</label>
                                <select className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={formData.course} required onChange={e => setFormData({...formData, course: e.target.value})}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            {/* Batch selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Student Batch</label>
                                <select className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={formData.batch} required onChange={e => setFormData({...formData, batch: e.target.value})}>
                                    <option value="">Select Batch</option>
                                    {config.batches.map(b => <option key={b.id} value={b.id}>{b.program_name} ({b.cohort_name})</option>)}
                                </select>
                            </div>
                            {/* Semester selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Assignment Semester</label>
                                <select className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={formData.semester} required onChange={e => setFormData({...formData, semester: e.target.value})}>
                                    <option value="Fall">Fall</option><option value="Spring">Spring</option><option value="Summer">Summer</option>
                                </select>
                            </div>
                            {/* Start Date */}
                            <div className="col-span-full space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Start Date</label>
                                <input type="date" className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={formData.start_date} required onChange={e => setFormData({...formData, start_date: e.target.value})}/>
                            </div>
                            {/* Faculty selection (multiple) */}
                            <div className="col-span-full space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Assigned Faculty (Hold Ctrl/Cmd to select multiple)</label>
                                <select multiple className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 h-32" 
                                    value={formData.faculty} required onChange={e => setFormData({...formData, faculty: Array.from(e.target.selectedOptions, o => o.value)})}>
                                    {config.faculty.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-full pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-500 p-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                                <button 
                                    disabled={isSubmitting} // Disable button while submitting
                                    type="submit"
                                    className="bg-blue-600 text-white p-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin"/> : (editingAssignment ? <Save size={18}/> : <Plus size={18}/>)}
                                    {editingAssignment ? 'Save Changes' : 'Create Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseAssignment;