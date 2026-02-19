import React from 'react';
import { X, UserCircle2, BookOpen, CheckCircle2, Mail, Phone, GraduationCap } from 'lucide-react';

const StudentDossierModal = ({ student, onClose }) => {
    if (!student) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-blue-600 p-8 flex justify-between items-start text-white relative">
                    <div className="z-10">
                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Student Dossier</p>
                        <h3 className="text-2xl font-bold uppercase tracking-tight">{student.first_name} {student.last_name}</h3>
                        <p className="text-xs font-mono mt-1 opacity-80">{student.student_id}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition z-10">
                        <X size={20}/>
                    </button>
                    <UserCircle2 className="absolute -bottom-6 -right-6 text-white/10 w-40 h-40" />
                </div>

                {/* Modal Content */}
                <div className="p-8 space-y-4">
                    <DetailRow label="Primary Email" value={student.email} icon={<Mail size={14}/>} />
                    <DetailRow label="Phone Number" value={student.phone_number || 'N/A'} icon={<Phone size={14}/>} />
                    <DetailRow label="Degree Program" value={student.degree_choice} icon={<GraduationCap size={14}/>} />
                    <DetailRow label="Enrollment Status" value={student.status} />

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={14} className="text-blue-500"/> Curriculum Progress
                            </h4>
                        </div>
                        <div className="max-h-52 overflow-y-auto rounded-2xl border border-gray-100 shadow-inner bg-slate-50/30">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-white border-b sticky top-0 font-bold text-gray-400 uppercase tracking-tighter">
                                    <tr>
                                        <th className="p-3">Course</th>
                                        <th className="p-3">Session</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {student.course_progress?.length > 0 ? student.course_progress.map((course, idx) => (
                                        <tr key={idx} className="hover:bg-white transition-colors">
                                            <td className="p-3 font-bold text-slate-700">
                                                {course.code}
                                                <div className="text-[9px] font-normal text-gray-400 truncate w-32">{course.name}</div>
                                            </td>
                                            <td className={`p-3 italic font-medium ${course.semester !== '-' ? 'text-blue-600' : 'text-gray-300'}`}>
                                                {course.semester} {course.year !== '-' && course.year}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex justify-center">
                                                    {course.status === "Completed" ? (
                                                        <CheckCircle2 size={18} className="text-green-500" strokeWidth={3} />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="p-4 text-center text-gray-400 italic">No courses found for program.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-center border-t border-gray-100">
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-[10px] font-black tracking-widest uppercase transition-colors">Close Profile</button>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, icon }) => (
    <div className="flex justify-between items-center border-b pb-2 border-gray-50 group">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            {icon} {label}
        </span>
        <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
);

export default StudentDossierModal;