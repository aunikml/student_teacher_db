import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
    Users, Briefcase, School, Globe2, Loader2, PieChart, 
    Building2, ActivitySquare, CheckCircle, Search, ChevronRight, Filter
} from 'lucide-react';

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

    // Search Directory States
    const[searchQuery, setSearchQuery] = useState('');
    const [searchSector, setSearchSector] = useState('');
    const[searchSubsector, setSearchSubsector] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Fetch Dashboard Stats on load
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('alumni/dashboard-stats/');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load alumni stats");
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    },[]);

    // Search Execution Logic (Debounced)
    useEffect(() => {
        const executeSearch = async () => {
            // Don't search if everything is empty
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
        }, 400); // 400ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchSector, searchSubsector]);

    // Handle sector change (reset subsector)
    const handleSectorChange = (e) => {
        setSearchSector(e.target.value);
        setSearchSubsector('');
    };

    if (loadingStats) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    if (!stats) return <div className="p-10 text-center text-gray-500">Dashboard unavailable.</div>;

    const { kpis, insights } = stats;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            
            {/* --- DASHBOARD HEADER --- */}
            <header>
                <h1 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
                    <PieChart className="text-blue-600" size={36}/> Alumni Hub
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Intelligence and directory for graduated students.</p>
            </header>

            {/* --- 1. KPIs (Scorecards) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ScoreCard label="Total Alumni" value={kpis.total_alumni} icon={<Users size={28} className="text-blue-600"/>} color="bg-blue-50 border-blue-200" />
                <ScoreCard label="Employed / Affiliated" value={kpis.employed} icon={<Briefcase size={28} className="text-emerald-600"/>} color="bg-emerald-50 border-emerald-200" />
                <ScoreCard label="Further Education" value={kpis.further_education} icon={<School size={28} className="text-purple-600"/>} color="bg-purple-50 border-purple-200" />
                <ScoreCard label="Global Reach" value={`${kpis.total_countries} Countries`} icon={<Globe2 size={28} className="text-amber-600"/>} color="bg-amber-50 border-amber-200" />
            </div>

            {/* --- 2. INSIGHTS GRIDS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Professional Sector Distribution */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ActivitySquare className="text-blue-500" size={20}/> Sector Distribution
                    </h2>
                    <div className="space-y-5">
                        {insights.sectors.length > 0 ? insights.sectors.map((sector, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                    <span>{sector.professional_sector.replace('_', ' ')}</span>
                                    <span>{sector.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(sector.count / kpis.total_alumni) * 100}%` }}></div>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 italic text-sm">No sector data recorded yet.</p>}
                    </div>
                </div>

                {/* Profile Completeness & Employers */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-xs font-black text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle size={16}/> Data Health</h2>
                            <p className="text-3xl font-extrabold mb-1">{kpis.completeness_percentage}%</p>
                            <p className="text-xs text-slate-400 font-medium">Complete Profiles (Career + Location)</p>
                            <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                                <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${kpis.completeness_percentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Building2 className="text-amber-500" size={18}/> Top Employers
                        </h2>
                        <ul className="space-y-3">
                            {insights.top_employers.length > 0 ? insights.top_employers.map((emp, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm font-bold text-slate-700">
                                    <span className="truncate mr-4" title={emp.current_professional_affiliation}>{emp.current_professional_affiliation}</span>
                                    <span className="text-amber-600">{emp.count}</span>
                                </li>
                            )) : <p className="text-gray-400 italic text-sm">No data available.</p>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- 3. ALUMNI DIRECTORY SEARCH --- */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden mt-12">
                <div className="bg-slate-50 p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Search className="text-blue-600" /> Alumni Directory Search
                    </h2>
                    
                    {/* Search Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="text" placeholder="Search ID, Name, Occupation..." 
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                            <select 
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={searchSector} onChange={handleSectorChange}
                            >
                                <option value="">All Sectors</option>
                                {PROFESSIONAL_SECTOR_CHOICES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                            <select 
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                value={searchSubsector} onChange={e => setSearchSubsector(e.target.value)}
                                disabled={!SUB_SECTOR_CHOICES[searchSector]}
                            >
                                <option value="">All Sub-Sectors</option>
                                {SUB_SECTOR_CHOICES[searchSector]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Search Results */}
                <div className="p-4 min-h-[300px] bg-slate-50/30">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-20 text-blue-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span className="text-sm font-bold animate-pulse">Searching Records...</span>
                        </div>
                    ) : (!hasSearched) ? (
                        <div className="text-center py-20 text-gray-400 font-medium">
                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                            Use the filters above to find specific alumni records.
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 font-medium">
                            No alumni found matching those criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {searchResults.map(alumni => (
                                <div 
                                    key={alumni.id} 
                                    onClick={() => navigate(`/alumni/${alumni.id}`)}
                                    className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                                            {alumni.first_name} {alumni.last_name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 mb-2">
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border">{alumni.student_id}</span>
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{alumni.concluding_semester || 'Unknown Cohort'}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <Briefcase size={14} className="text-gray-400" />
                                            {alumni.current_occupation || 'Occupation not provided'} 
                                            {alumni.professional_sector && <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full ml-2">{alumni.professional_sector.replace('_', ' ')}</span>}
                                        </div>
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

const ScoreCard = ({ label, value, icon, color }) => (
    <div className={`p-6 rounded-3xl border flex items-center justify-between ${color}`}>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1 text-slate-700">{label}</p>
            <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-white/50">{icon}</div>
    </div>
);

export default AlumniDashboard;