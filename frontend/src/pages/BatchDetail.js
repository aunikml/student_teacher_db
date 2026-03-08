import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
    UserPlus, FileUp, Eye, X, ChevronLeft, Loader2, 
    CheckCircle2, AlertCircle, Edit, Save, BookOpen, 
    UserCircle2, CalendarCheck, ToggleLeft, ToggleRight,
    PlusCircle, Search, Mail, Phone, Users as UsersIcon // Alias for clarity
} from 'lucide-react';

const BatchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    // --- DATA STATES ---
    const [batch, setBatch] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- UI/MODAL STATES ---
    const [selectedStudent, setSelectedStudent] = useState(null); // View Transcript Modal
    
    // Edit Student Info Modal
    const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    
    // Course Progress Modal
    const [isEditCourseProgressModalOpen, setIsEditCourseProgressModalOpen] = useState(false);
    const [editingCourseProgress, setEditingCourseProgress] = useState(null);

    // Cross-Batch Enrollment Modal
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [availableAssignments, setAvailableAssignments] = useState([]);
    const [filteredAssignments, setFilteredAssignments] = useState([]);
    const [enrollmentForm, setEnrollmentForm] = useState({
        course_assignment: '', is_completed: false
    });

    // --- NEW: Manual Enrollment Modal State ---
    const [isManualEnrollModalOpen, setIsManualEnrollModalOpen] = useState(false);
    
    // --- FEEDBACK STATES ---
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);

    // --- FORM STATE (Manual Enrollment) ---
    const [manualData, setManualData] = useState({
        student_id: '', first_name: '', last_name: '',
        email: '', phone_number: '', 
        degree_choice: 'M.Sc', status: 'Active'
    });

    // --- INITIAL FETCH ---
    useEffect(() => {
        fetchBatchData();
    }, [id]);

    const fetchBatchData = async () => {
        setLoading(true);
        try {
            const [batchRes, studentRes] = await Promise.all([
                api.get(`batches/${id}/`),
                api.get(`students/?batch=${id}`)
            ]);
            setBatch(batchRes.data);
            setStudents(studentRes.data);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load batch data.' });
        } finally {
            setLoading(false);
        }
    };

    // --- FETCH ASSIGNMENTS (For Cross-Batch Enrollment) ---
    const fetchAssignmentsForEnrollment = async () => {
        try {
            const res = await api.get('course_assign/');
            setAvailableAssignments(res.data);
            setFilteredAssignments(res.data);
        } catch (err) {
            console.error("Failed to load assignments");
        }
    };

    // --- 1. MANUAL STUDENT ENROLLMENT (now through modal) ---
    const openManualEnrollModal = () => {
        setManualData({ // Reset form data
            student_id: '', first_name: '', last_name: '',
            email: '', phone_number: '', degree_choice: 'M.Sc', status: 'Active'
        });
        setIsManualEnrollModalOpen(true);
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('students/', { ...manualData, batch: id });
            setMessage({ type: 'success', text: 'Student enrolled successfully!' });
            setIsManualEnrollModalOpen(false); // Close modal
            fetchBatchData(); // Refresh student list
        } catch (err) {
            const errorMsg = err.response?.data?.email ? "Email already exists." : 
                             err.response?.data?.student_id ? "Student ID already exists." : 
                             "Enrollment failed.";
            setMessage({ type: 'error', text: errorMsg });
        }
    };

    // --- 2. CSV UPLOAD ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            await api.post(`batches/${id}/upload_csv/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessage({ type: 'success', text: 'CSV processed successfully!' });
            fetchBatchData();
        } catch (err) {
            setMessage({ type: 'error', text: 'CSV processing failed.' });
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    // --- 3. EDIT STUDENT INFO ---
    const openEditStudentModal = (student) => {
        setEditingStudent({ ...student });
        setIsEditStudentModalOpen(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            await api.put(`students/${editingStudent.id}/`, editingStudent);
            setIsEditStudentModalOpen(false);
            setMessage({ type: 'success', text: 'Student record updated.' });
            fetchBatchData();
        } catch (err) {
            alert("Error updating student record.");
        }
    };

    // --- 4. EDIT COURSE PROGRESS / STATUS ---
    const openEditCourseProgressModal = async (student, courseProgressItem) => {
        const currentYear = new Date().getFullYear();
        let enrollmentData = {
            student: student.id,
            is_completed: courseProgressItem.status === 'Completed',
            semester: courseProgressItem.semester === '-' ? 'Fall' : courseProgressItem.semester,
            year: courseProgressItem.year === '-' ? currentYear : courseProgressItem.year,
            id: courseProgressItem.enrollment_id, // Existing ID if present
            courseCode: courseProgressItem.code, 
            courseName: courseProgressItem.name
        };

        if (!enrollmentData.id) {
            try {
                const res = await api.get(`course_assign/?course__id=${courseProgressItem.course_id_for_enrollment}`);
                if (res.data.length > 0) {
                    const matchingAssignment = res.data.find(a => a.batch === student.batch) || res.data[0];
                    enrollmentData.course_assignment = matchingAssignment.id;
                } else {
                    alert("No assignment found for this course. Please create one first or use 'Add Course'.");
                    return;
                }
            } catch (err) {
                alert("Error finding assignment.");
                return;
            }
        }
        setEditingCourseProgress(enrollmentData);
        setIsEditCourseProgressModalOpen(true);
    };

    const handleUpdateCourseProgress = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                student: editingCourseProgress.student,
                course_assignment: editingCourseProgress.course_assignment,
                is_completed: editingCourseProgress.is_completed,
                semester: editingCourseProgress.semester,
                year: editingCourseProgress.year,
            };
            
            if (editingCourseProgress.id) {
                await api.put(`student-enrollments/${editingCourseProgress.id}/`, payload);
            } else {
                await api.post('student-enrollments/', payload);
            }
            
            setIsEditCourseProgressModalOpen(false);
            setMessage({ type: 'success', text: 'Course progress updated!' });
            
            const updatedStudentRes = await api.get(`students/${selectedStudent.id}/`);
            setSelectedStudent(updatedStudentRes.data);
            fetchBatchData(); 
        } catch (err) {
            alert("Failed to update course progress.");
        }
    };

    // --- 5. CROSS-BATCH ENROLLMENT (ADD COURSE) ---
    const openEnrollModal = () => {
        fetchAssignmentsForEnrollment();
        setEnrollmentForm({ course_assignment: '', is_completed: false });
        setIsEnrollModalOpen(true);
    };

    const handleEnrollSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedAssignment = availableAssignments.find(a => a.id == enrollmentForm.course_assignment);
            
            const payload = {
                student: selectedStudent.id,
                course_assignment: enrollmentForm.course_assignment,
                is_completed: enrollmentForm.is_completed,
                semester: selectedAssignment.semester,
                year: new Date(selectedAssignment.start_date).getFullYear()
            };
            
            await api.post('student-enrollments/', payload);
            
            setIsEnrollModalOpen(false);
            setMessage({ type: 'success', text: 'Student enrolled in additional course!' });
            
            const updatedStudentRes = await api.get(`students/${selectedStudent.id}/`);
            setSelectedStudent(updatedStudentRes.data);
            fetchBatchData();
        } catch (err) {
            const errorMsg = err.response?.data?.non_field_errors?.[0] || "Enrollment failed. Student might already be enrolled.";
            alert(errorMsg);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate('/batches')} className="flex items-center text-gray-400 hover:text-blue-600 transition mb-2 text-xs font-bold uppercase tracking-widest">
                        <ChevronLeft size={16} /> Back to Batches
                    </button>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight capitalize">
                        {batch?.program_name} <span className="text-blue-600">/</span> {batch?.cohort_name}
                    </h1>
                </div>
                {message.text && (
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- LEFT: BULK ACTIONS --- */}
                <div className="lg:col-span-4 space-y-6">
                    {/* CSV Upload */}
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileUp size={20} className="text-blue-400" /> CSV Bulk Upload</h2>
                        {uploading ? <Loader2 className="animate-spin text-blue-400 mx-auto my-4"/> : 
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white cursor-pointer"/>}
                        <p className="text-[10px] text-slate-500 mt-4 italic text-center">Headers: student_id, first_name, last_name, email, phone_number, degree_choice</p>
                    </div>

                    {/* NEW: Button to open Manual Enrollment Modal */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-center items-center">
                        <button 
                            onClick={openManualEnrollModal} 
                            className="bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase text-xs tracking-widest flex items-center gap-2"
                        >
                            <UserPlus size={20} /> Enroll Single Student
                        </button>
                    </div>
                </div>

                {/* --- RIGHT: STUDENT LIST TABLE --- */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                            <tr>
                                <th className="p-5">Student ID</th>
                                <th className="p-5">Full Name</th>
                                <th className="p-5">Contact Details</th>
                                <th className="p-5">Degree</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {students.map(student => (
                                <tr key={student.id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="p-5 font-bold text-blue-600 font-mono tracking-tighter">{student.student_id}</td>
                                    <td className="p-5 font-bold text-slate-700 uppercase tracking-tight">{student.first_name} {student.last_name}</td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium"><Mail size={12} className="text-gray-400"/> {student.email}</span>
                                            {student.phone_number && <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><Phone size={12}/> {student.phone_number}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 text-gray-500">{student.degree_choice}</td>
                                    <td className="p-5"><span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{student.status}</span></td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setSelectedStudent(student)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Eye size={18}/></button>
                                            <button onClick={() => openEditStudentModal(student)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg"><Edit size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL 1: MANUAL ENROLLMENT --- (New Modal) */}
            {isManualEnrollModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic"><UserPlus size={22}/> Enroll New Student</h2>
                            <button onClick={() => setIsManualEnrollModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleManualSubmit} className="p-8 space-y-4">
                            <input className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Student ID (Unique)" value={manualData.student_id} onChange={e => setManualData({...manualData, student_id: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-3">
                                <input className="p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="First Name" value={manualData.first_name} onChange={e => setManualData({...manualData, first_name: e.target.value})} required />
                                <input className="p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Last Name" value={manualData.last_name} onChange={e => setManualData({...manualData, last_name: e.target.value})} required />
                            </div>
                            <input className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Email Address" type="email" value={manualData.email} onChange={e => setManualData({...manualData, email: e.target.value})} required />
                            <input className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Phone Number (Optional)" value={manualData.phone_number} onChange={e => setManualData({...manualData, phone_number: e.target.value})} />
                            <select className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" value={manualData.degree_choice} onChange={e => setManualData({...manualData, degree_choice: e.target.value})}><option value="M.Sc">M.Sc</option><option value="PgD">PgD</option><option value="M.ED">M.ED</option></select>
                            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase text-xs tracking-widest">Enroll Student</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: EDIT STUDENT PERSONAL INFO --- (Same as before) */}
            {isEditStudentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-amber-500 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic"><Edit size={22}/> Update Information</h2>
                            <button onClick={() => setIsEditStudentModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateStudent} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Student ID</label><input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500 font-mono" value={editingStudent.student_id} onChange={e => setEditingStudent({...editingStudent, student_id: e.target.value})} required /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label><input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500" value={editingStudent.first_name} onChange={e => setEditingStudent({...editingStudent, first_name: e.target.value})} required /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label><input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500" value={editingStudent.last_name} onChange={e => setEditingStudent({...editingStudent, last_name: e.target.value})} required /></div>
                                <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label><input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500" type="email" value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} required /></div>
                                <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label><input className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500" value={editingStudent.phone_number} onChange={e => setEditingStudent({...editingStudent, phone_number: e.target.value})} /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Degree Choice</label><select className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500 bg-white" value={editingStudent.degree_choice} onChange={e => setEditingStudent({...editingStudent, degree_choice: e.target.value})}><option value="M.Sc">M.Sc</option><option value="PgD">PgD</option><option value="M.ED">M.ED</option></select></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label><select className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-amber-500 bg-white" value={editingStudent.status} onChange={e => setEditingStudent({...editingStudent, status: e.target.value})}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Graduated">Graduated</option></select></div>
                            </div>
                            <div className="pt-4 flex gap-3"><button type="submit" className="flex-1 bg-amber-500 text-white p-3 rounded-xl font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-100 flex items-center justify-center gap-2"><Save size={18}/> Save Changes</button><button type="button" onClick={() => setIsEditStudentModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 p-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: VIEW DETAILS / TRANSCRIPT --- (Same as before) */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-blue-600 p-8 flex justify-between items-start text-white relative shrink-0">
                            <div className="z-10">
                                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Student Dossier</p>
                                <h3 className="text-2xl font-bold uppercase tracking-tight">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                                <p className="text-xs font-mono mt-1 opacity-80">{selectedStudent.student_id}</p>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition z-10"><X size={20}/></button>
                            <UsersIcon className="absolute -bottom-6 -right-6 text-white/10 w-40 h-40" /> {/* Changed to UsersIcon */}
                        </div>

                        <div className="p-8 space-y-4 overflow-y-auto">
                            <DetailRow label="Primary Email" value={selectedStudent.email} />
                            <DetailRow label="Phone" value={selectedStudent.phone_number || 'N/A'} />
                            <DetailRow label="Degree Program" value={selectedStudent.degree_choice} />
                            <DetailRow label="Enrollment Status" value={selectedStudent.status} />

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={14} className="text-blue-500"/> Curriculum
                                    </h4>
                                    {(user.role === 'ADMIN' || user.role === 'PIM') && (
                                        <button onClick={openEnrollModal} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"><PlusCircle size={14} /> Add Course</button>
                                    )}
                                </div>
                                <div className="max-h-52 overflow-y-auto rounded-2xl border border-gray-100 shadow-inner bg-slate-50/30">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="bg-white border-b sticky top-0 font-bold text-gray-400 uppercase tracking-tighter">
                                            <tr><th className="p-3">Course</th><th className="p-3">Session</th><th className="p-3 text-center">Status</th>{(user.role === 'ADMIN' || user.role === 'PIM') && <th className="p-3 text-center">Edit</th>}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedStudent.course_progress?.map((course, idx) => (
                                                <tr key={idx} className="hover:bg-white transition-colors">
                                                    <td className="p-3 font-bold text-slate-700">{course.code}<div className="text-[9px] font-normal text-gray-400 truncate w-32">{course.name}</div></td>
                                                    <td className={`p-3 italic font-medium ${course.semester !== '-' ? 'text-blue-600' : 'text-gray-300'}`}>{course.semester} {course.year !== '-' && course.year}</td>
                                                    <td className="p-3"><div className="flex justify-center">{course.status === "Completed" ? <CheckCircle2 size={18} className="text-green-500" strokeWidth={3} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}</div></td>
                                                    {(user.role === 'ADMIN' || user.role === 'PIM') && <td className="p-3 text-center"><button onClick={() => openEditCourseProgressModal(selectedStudent, course)} className="text-gray-400 hover:text-blue-600 transition"><Edit size={16}/></button></td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100 shrink-0"><button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 text-[10px] font-black tracking-widest uppercase transition-colors">Close Profile</button></div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: EDIT COURSE PROGRESS --- (Same as before) */}
            {isEditCourseProgressModalOpen && editingCourseProgress && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic"><CalendarCheck size={22}/> Update Course Status</h2>
                            <button onClick={() => setIsEditCourseProgressModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateCourseProgress} className="p-8 space-y-4">
                            <p className="text-sm text-gray-700">Adjust status for <strong className="font-bold">{editingCourseProgress.courseCode}</strong></p>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                                <label className="text-sm font-medium text-gray-700">Mark as Completed</label>
                                <button type="button" onClick={() => setEditingCourseProgress({ ...editingCourseProgress, is_completed: !editingCourseProgress.is_completed })} className="p-1 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {editingCourseProgress.is_completed ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-400" />}
                                </button>
                            </div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Semester</label><select className="w-full p-2.5 border rounded-xl mt-1 bg-white" value={editingCourseProgress.semester} onChange={e => setEditingCourseProgress({...editingCourseProgress, semester: e.target.value})} required><option value="">Select Semester</option><option value="Fall">Fall</option><option value="Spring">Spring</option><option value="Summer">Summer</option></select></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Year</label><input type="number" className="w-full p-2.5 border rounded-xl mt-1" value={editingCourseProgress.year} onChange={e => setEditingCourseProgress({...editingCourseProgress, year: parseInt(e.target.value) || ''})} placeholder="e.g., 2026" required /></div>
                            <div className="pt-4 flex gap-3"><button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"><Save size={18}/> Save Changes</button><button type="button" onClick={() => setIsEditCourseProgressModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 p-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 5: CROSS-BATCH ENROLLMENT --- (Same as before) */}
            {isEnrollModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-green-600 p-6 flex justify-between items-center text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic"><PlusCircle size={22}/> Add New Course</h2>
                            <button onClick={() => setIsEnrollModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEnrollSubmit} className="p-8 space-y-4">
                            <p className="text-sm text-gray-600 mb-2">Enroll <strong className="text-slate-800">{selectedStudent?.first_name} {selectedStudent?.last_name}</strong> into an additional course.</p>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Course Assignment</label>
                                <div className="relative mt-1">
                                    <select className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-green-500 text-sm" value={enrollmentForm.course_assignment} onChange={e => setEnrollmentForm({...enrollmentForm, course_assignment: e.target.value})} required>
                                        <option value="">-- Choose a Course Offering --</option>
                                        {filteredAssignments.map(a => (<option key={a.id} value={a.id}>{a.course_code} | {a.course_name} ({a.batch_name}, {a.semester})</option>))}
                                    </select>
                                    <Search className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border mt-2">
                                <label className="text-sm font-medium text-gray-700">Mark as Completed Immediately?</label>
                                <button type="button" onClick={() => setEnrollmentForm({ ...enrollmentForm, is_completed: !enrollmentForm.is_completed })} className="p-1 rounded-full transition-all focus:outline-none">{enrollmentForm.is_completed ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-400" />}</button>
                            </div>
                            <div className="pt-6 flex gap-3"><button type="submit" className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 flex items-center justify-center gap-2"><PlusCircle size={18}/> Enroll Now</button><button type="button" onClick={() => setIsEnrollModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 p-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-center border-b pb-2 border-gray-50 group">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
);

export default BatchDetail;