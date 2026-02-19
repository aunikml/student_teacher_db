import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagement';
import AcademicConfig from './pages/AcademicConfig';
import BatchList from './pages/BatchList';
import BatchDetail from './pages/BatchDetail';
import CourseAssignment from './pages/CourseAssignment';
import Dashboard from './pages/Dashboard'; // NEW: Import the Dashboard

// Icons
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  UserCircle, 
  FileBarChart, 
  Settings, 
  ShieldCheck, 
  Database, 
  BookOpen, 
  GraduationCap
} from 'lucide-react';

/**
 * ProtectedRoute Component
 * Handles authentication checks, forced password changes, and role-based access.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-400 text-sm font-bold uppercase tracking-tighter">Initializing Session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.must_change_password && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

/**
 * Sidebar Component
 * Renders navigation menu based on user roles.
 */
const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'FACULTY', 'PIM', 'PS'] },
        { name: 'User Management', path: '/users', icon: <Users size={20} />, roles: ['ADMIN'] },
        { name: 'Academic Setup', path: '/config', icon: <Settings size={20} />, roles: ['ADMIN'] },
        { name: 'Student Batches', path: '/batches', icon: <Database size={20} />, roles: ['ADMIN', 'PIM'] },
        { name: 'Course Assignment', path: '/courses', icon: <BookOpen size={20} />, roles: ['ADMIN', 'PIM', 'FACULTY'] },
        { name: 'Evaluations', path: '/evaluations', icon: <FileBarChart size={20} />, roles: ['ADMIN', 'FACULTY', 'PS'] },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen sticky top-0 shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex flex-col items-center">
                <div className="bg-blue-600 p-2 rounded-lg mb-3 shadow-lg shadow-blue-500/20">
                    <GraduationCap size={28} className="text-white" />
                </div>
                <h1 className="text-lg font-black tracking-tighter text-white">ACADEMIC<span className="text-blue-500">PORTAL</span></h1>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 mt-4">
                {menuItems.map((item) => (
                    item.roles.includes(user?.role) && (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                (location.pathname.startsWith(item.path) && item.path !== '/') || location.pathname === item.path
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' 
                                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            <span className={`${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                        </Link>
                    )
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="bg-gradient-to-tr from-slate-700 to-slate-600 h-10 w-10 rounded-full flex items-center justify-center text-blue-400 font-black border border-slate-500 text-xs shadow-inner">
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate text-slate-200">{user?.first_name} {user?.last_name}</p>
                        <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold text-xs"
                >
                    <LogOut size={18} />
                    Logout Session
                </button>
            </div>
        </aside>
    );
};

const MainLayout = ({ children }) => (
    <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
            {children}
        </main>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Access */}
                    <Route path="/login" element={<Login />} />

                    {/* Security Required */}
                    <Route path="/change-password" element={
                        <ProtectedRoute>
                            <ChangePassword />
                        </ProtectedRoute>
                    } />

                    {/* --- Admin Modules --- */}
                    <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <MainLayout>
                                <UserManagement />
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/config" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <MainLayout>
                                <AcademicConfig />
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* --- Student Management Modules --- */}
                    <Route path="/batches" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'PIM']}>
                            <MainLayout>
                                <BatchList />
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/batches/:id" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'PIM']}>
                            <MainLayout>
                                <BatchDetail />
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* --- Course Assignment Module --- */}
                    <Route path="/courses" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'PIM', 'FACULTY']}>
                            <MainLayout>
                                <CourseAssignment />
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* --- Executive Dashboard (Main Landing) --- */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Dashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* --- Evaluation Reports (Placeholder) --- */}
                    <Route path="/evaluations" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY', 'PS']}>
                            <MainLayout>
                                <div className="p-10 text-gray-400 italic font-medium">Evaluation Reports Engine - Coming Soon</div>
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* Global Redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;