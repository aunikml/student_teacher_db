import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
    Users, 
    GraduationCap, 
    Activity, 
    LayoutDashboard, 
    BookOpen, 
    Loader2,
    PieChart,
    Search,
    X,
    ChevronRight
} from 'lucide-react';
import StudentDossierModal from '../components/StudentDossierModal'; // Import reusable component

const Dashboard = () => {
    const { user } = useContext(AuthContext); // Get user role
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState(0); 
    const [loading, setLoading] = useState(true);

    // --- Student Search States ---
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null); // For the Dossier modal

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('dashboard/stats/');
                setStats(res.data);
                if (res.data.programs.length > 0) {
                    setActiveTab(res.data.programs[0].id);
                }
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // --- Search Logic with Debouncing ---
    useEffect(() => {
        // Debouncing prevents sending an API request on every keystroke
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 1) { // Only search if more than 1 character is typed
                setIsSearching(true);
                try {
                    // Use the 'search' query parameter enabled in the backend view
                    const res = await api.get(`students/?search=${searchQuery}`);
                    setSearchResults(res.data);
                } catch (error) {
                    console.error("Search failed", error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    );

    if (!stats) return <div className="p-10 text-center text-gray-500">Dashboard data is currently unavailable.</div>;

    const activeProgramData = stats.programs.find(p => p.id === activeTab);
    const canSearch = ['ADMIN', 'PIM'].includes(user?.role); // Check if user has permission to search

    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
                        <LayoutDashboard className="text-blue-600" size={36}/> Student Information Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Real-time academic enrollment and status overview.</p>
                </div>

                {/* SEARCH BUTTON (only for Admin/PIM) */}
                {canSearch && (
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="bg-white border border-gray-200 text-slate-600 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3 group"
                    >
                        <Search size={20} className="text-blue-600 group-hover:scale-110 transition-transform"/>
                        <span className="font-bold text-sm">Find Student</span>
                        <div className="bg-gray-100 text-gray-400 text-[10px] font-black px-2 py-0.5 rounded border border-gray-200">ID / NAME</div>
                    </button>
                )}
            </header>

            {/* --- GLOBAL SCORECARDS --- */}
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Institution Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <ScoreCard label="Total Enrollment" value={stats.global.total} icon={<Users size={32} className="text-blue-600"/>} color="bg-blue-50 border-blue-200" textColor="text-blue-900"/>
                <ScoreCard label="Total Active" value={stats.global.active} icon={<Activity size={32} className="text-green-600"/>} color="bg-green-50 border-green-200" textColor="text-green-900"/>
                <ScoreCard label="Total Graduates" value={stats.global.graduated} icon={<GraduationCap size={32} className="text-purple-600"/>} color="bg-purple-50 border-purple-200" textColor="text-purple-900"/>
            </div>

            {/* --- PROGRAM-WISE TABS --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {/* Tab Header */}
                <div className="flex overflow-x-auto border-b border-gray-100 p-2 gap-2 bg-slate-50/50 no-scrollbar">
                    {stats.programs.map(prog => (
                        <button key={prog.id} onClick={() => setActiveTab(prog.id)} className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === prog.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:bg-white/60 hover:text-slate-700'}`}>{prog.name}</button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeProgramData ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="text-gray-400" size={24}/> {activeProgramData.name} Statistics</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MiniCard label="Total Students" value={activeProgramData.total} color="text-slate-700" borderColor="border-gray-200"/>
                                <MiniCard label="Active" value={activeProgramData.active} color="text-green-600" borderColor="border-green-200 bg-green-50/30"/>
                                <MiniCard label="Graduates" value={activeProgramData.graduated} color="text-purple-600" borderColor="border-purple-200 bg-purple-50/30"/>
                                <MiniCard label="Inactive" value={activeProgramData.inactive} color="text-red-500" borderColor="border-red-200 bg-red-50/30"/>
                            </div>
                            <div className="mt-10">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status Distribution</div>
                                {activeProgramData.total > 0 ? (
                                    <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                                        <div style={{ width: `${(activeProgramData.active / activeProgramData.total) * 100}%` }} className="bg-green-500 h-full transition-all duration-1000" title={`Active: ${activeProgramData.active}`}/>
                                        <div style={{ width: `${(activeProgramData.graduated / activeProgramData.total) * 100}%` }} className="bg-purple-500 h-full transition-all duration-1000" title={`Graduated: ${activeProgramData.graduated}`}/>
                                        <div style={{ width: `${(activeProgramData.inactive / activeProgramData.total) * 100}%` }} className="bg-red-400 h-full transition-all duration-1000" title={`Inactive: ${activeProgramData.inactive}`}/>
                                    </div>
                                ) : <div className="h-6 w-full bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-400 font-bold">No Data</div>}
                                <div className="flex flex-wrap gap-6 mt-3 text-[10px] font-bold uppercase text-gray-500">
                                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"/> Active</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"/> Graduated</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/> Inactive</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400"><PieChart size={48} className="mb-4 opacity-20"/><p>Select a program tab to view detailed statistics.</p></div>
                    )}
                </div>
            </div>

            {/* --- GLOBAL SEARCH MODAL --- */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                            <Search className="text-gray-400" size={24}/>
                            <input 
                                autoFocus
                                className="flex-1 text-lg outline-none text-slate-700 placeholder:text-gray-300 font-medium"
                                placeholder="Search by Student ID, Name, or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && <Loader2 className="animate-spin text-blue-500" size={20}/>}
                            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition"><X size={20} className="text-gray-500"/></button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto bg-gray-50/50">
                            {searchResults.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 text-sm">
                                    {isSearching ? "Searching..." : (searchQuery ? "No students found." : "Start typing to search...")}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {searchResults.map(student => (
                                        <button 
                                            key={student.id}
                                            onClick={() => {
                                                api.get(`students/${student.id}/`).then(res => setSelectedStudent(res.data));
                                            }}
                                            className="w-full text-left p-4 hover:bg-blue-50 transition-colors flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-700">{student.first_name} {student.last_name}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="font-mono bg-white border px-1.5 rounded">{student.student_id}</span>
                                                    <span>{student.email}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={20}/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-2 bg-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">Global Student Search</div>
                    </div>
                </div>
            )}

            {/* --- REUSABLE STUDENT DETAILS MODAL --- */}
            {selectedStudent && (
                <StudentDossierModal 
                    student={selectedStudent} 
                    onClose={() => setSelectedStudent(null)} 
                />
            )}
        </div>
    );
};

// UI Components
const ScoreCard = ({ label, value, icon, color, textColor }) => (
    <div className={`p-6 rounded-3xl border flex items-center justify-between ${color}`}>
        <div><p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1 text-slate-600">{label}</p><p className={`text-4xl font-extrabold ${textColor}`}>{value}</p></div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-white/50">{icon}</div>
    </div>
);

const MiniCard = ({ label, value, color, borderColor }) => (
    <div className={`p-5 rounded-2xl border ${borderColor} flex flex-col justify-center`}>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
);

export default Dashboard;