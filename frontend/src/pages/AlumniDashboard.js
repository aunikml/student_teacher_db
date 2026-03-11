import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
    Users, Briefcase, School, Loader2, PieChart, 
    ActivitySquare, CheckCircle, Search, ChevronRight, Filter
} from 'lucide-react';

// --- Choices for Filter Dropdowns ---
const PROFESSIONAL_SECTOR_CHOICES =[
    { value: 'Private', label: 'Private' }, { value: 'Corporate', label: 'Corporate' },
    { value: 'Government', label: 'Government' }, { value: 'NGO', label: 'NGO' },
    { value: 'INGO', label: 'INGO' }, { value: 'Entrepreneur', label: 'Entrepreneur' },
    { value: 'Performance_Art', label: 'Performance Art' }, { value: 'Other', label: 'Other' },
];

const SUB_SECTOR_CHOICES = {
    Government:['Primary Education', 'Secondary Education', 'Higher Secondary Education', 'Tertiary Education'],
    Private:['Corporate', 'Primary Education', 'Secondary Education', 'Higher Secondary Education', 'Tertiary Education']
};

const AlumniDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // --- Search Directory States ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSector, setSearchSector] = useState('');
    const[searchSubsector, setSearchSubsector] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const[isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('alumni/dashboard-stats/');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load alumni stats", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    },[]);

    // --- Search Execution Logic ---
    useEffect(() => {
        const executeSearch = async () => {
            if (!searchQuery && !searchSector && !searchSubsector) {
                setSearchResults([]);
                setHasSearched(false);
                return;
            }

            setIsSearching(true);
            setHasSearched(true);
            try {
                let url = `alumni/alumni/?`;
                if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
                if (searchSector) url += `sector=${encodeURIComponent(searchSector)}&`;
                if (searchSubsector) url += `subsector=${encodeURIComponent(searchSubsector)}&`;

                const res = await api.get(url);
                setSearchResults(res.data);
            } catch (error) {
                console.error("Search failed");
            } finally {
                setIsSearching(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            executeSearch();
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchSector, searchSubsector]);

    const handleSectorChange = (e) => {
        setSearchSector(e.target.value);
        setSearchSubsector('');
    };

    // --- Loading & Null Checks ---
    if (loadingStats) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    if (!stats) return <div className="p-10 text-center text-gray-500">Dashboard data is currently unavailable.</div>;

    // Calculate total working alumni dynamically from the sectors array
    const totalWorkingInSectors = stats.sector_distribution.reduce((acc, sector) => acc + sector.count, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            
            {/* --- DASHBOARD HEADER --- */}
            <header>
                <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
                    <PieChart className="text-blue-600" size={36}/> Alumni Hub
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Intelligence dashboard and searchable directory for graduated students.</p>
            </header>

            {/* --- 1. SCORECARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreCard label="Total Alumni" value={stats.total_alumni} icon={<Users size={28} className="text-blue-600"/>} />
                <ScoreCard label="Working Professionals" value={totalWorkingInSectors} icon={<Briefcase size={28} className="text-emerald-600"/>} />
                <ScoreCard label="Data Health" value={`${stats.data_health.completeness_percentage}%`} icon={<CheckCircle size={28} className="text-amber-600"/>} />
            </div>

            {/* --- 2. INSIGHTS GRIDS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sector Distribution (Left Column) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ActivitySquare className="text-blue-500" size={20}/> Sector Distribution
                    </h2>
                    <div className="space-y-6">
                        {stats.sector_distribution.length > 0 ? stats.sector_distribution.map((sector, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                    <span>{sector.professional_sector.replace('_', ' ')}</span>
                                    <span>{sector.count} Alumni ({((sector.count / stats.total_alumni) * 100).toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-4 shadow-inner">
                                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full" style={{ width: `${(sector.count / stats.total_alumni) * 100}%` }}></div>
                                </div>
                                
                                {/* Sub-sector details for Government and Private */}
                                {sector.professional_sector === 'Government' && stats.sub_sector_distribution.government.length > 0 && (
                                    <div className="mt-3 pl-4 border-l-4 border-blue-200 space-y-2">
                                        {stats.sub_sector_distribution.government.map((sub, sIdx) => <SubSectorRow key={sIdx} item={sub} />)}
                                    </div>
                                )}
                                {sector.professional_sector === 'Private' && stats.sub_sector_distribution.private.length > 0 && (
                                    <div className="mt-3 pl-4 border-l-4 border-blue-200 space-y-2">
                                        {stats.sub_sector_distribution.private.map((sub, sIdx) => <SubSectorRow key={sIdx} item={sub} />)}
                                    </div>
                                )}
                            </div>
                        )) : <p className="text-gray-400 italic text-sm">No professional sector data recorded.</p>}
                    </div>
                </div>

                {/* Program Distribution (Right Column) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <School className="text-amber-500" size={18}/> Alumni by Program
                    </h2>
                    <ul className="space-y-4">
                        {stats.program_distribution.length > 0 ? stats.program_distribution.map((prog, idx) => (
                            <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm font-bold text-slate-700 truncate mr-4">{prog.name}</span>
                                <span className="bg-white px-3 py-1 rounded-lg text-xs font-black text-blue-600 shadow-sm border border-blue-50">{prog.alumni_count}</span>
                            </li>
                        )) : <p className="text-gray-400 italic text-sm">No program data available.</p>}
                    </ul>

                    {/* Data Health Context */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium">
                            <strong className="text-slate-800">{stats.data_health.complete_profiles}</strong> out of <strong className="text-slate-800">{stats.total_alumni}</strong> alumni profiles have complete career and location records.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- 3. ALUMNI DIRECTORY SEARCH --- */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden mt-12">
                <div className="bg-slate-50 p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Search className="text-blue-600" /> Alumni Directory
                    </h2>
                    
                    {/* Search Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input type="text" placeholder="Search ID, Name..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                            <select className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={searchSector} onChange={handleSectorChange}>
                                <option value="">All Sectors</option>
                                {PROFESSIONAL_SECTOR_CHOICES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                            <select className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100" value={searchSubsector} onChange={e => setSearchSubsector(e.target.value)} disabled={!SUB_SECTOR_CHOICES[searchSector]}>
                                <option value="">All Sub-Sectors</option>
                                {SUB_SECTOR_CHOICES[searchSector]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Search Results */}
                <div className="p-4 min-h-[300px] bg-slate-50/30">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-20 text-blue-500"><Loader2 className="animate-spin mb-2" size={32} /><span className="text-sm font-bold animate-pulse">Searching...</span></div>
                    ) : !hasSearched ? (
                        <div className="text-center py-20 text-gray-400 font-medium"><Users size={48} className="mx-auto mb-4 opacity-20" />Use the filters to find alumni records.</div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 font-medium">No alumni found matching those criteria.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {searchResults.map(alumni => (
                                <div key={alumni.id} onClick={() => navigate(`/alumni/${alumni.id}`)} className="bg-white border p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex justify-between items-center">
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{alumni.first_name} {alumni.last_name}</h3>
                                        <div className="flex items-center gap-3 mt-1 mb-2">
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border">{alumni.student_id}</span>
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{alumni.concluding_semester || 'Unknown Cohort'}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-center gap-2"><Briefcase size={14} className="text-gray-400" />{alumni.current_occupation || 'N/A'}</div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={24}/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- UI Helper Components ---
const ScoreCard = ({ label, value, icon }) => (
    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">{icon}</div>
    </div>
);

const SubSectorRow = ({ item }) => (
    <div className="text-xs flex justify-between">
        <span className="text-gray-500 font-medium">{item.professional_sector_sub_category}</span>
        <span className="font-bold text-slate-600">{item.count}</span>
    </div>
);

export default AlumniDashboard;