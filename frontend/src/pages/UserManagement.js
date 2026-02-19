import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserPlus, ShieldCheck, Edit, Trash2, X } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State for Creating User
    const [formData, setFormData] = useState({
        email: '', first_name: '', last_name: '', designation: '', role: 'FACULTY'
    });
    const [newlyCreated, setNewlyCreated] = useState(null);

    // State for Editing User
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('users/manage/');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    // --- CREATE LOGIC ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('users/manage/', formData);
            setNewlyCreated(res.data);
            setFormData({ email: '', first_name: '', last_name: '', designation: '', role: 'FACULTY' });
            fetchUsers();
        } catch (err) {
            alert("Error creating user. Email might already exist.");
        }
    };

    // --- DELETE LOGIC ---
    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await api.delete(`users/manage/${id}/`);
                fetchUsers(); // Refresh list
            } catch (err) {
                alert("Could not delete user. You cannot delete yourself.");
            }
        }
    };

    // --- EDIT LOGIC ---
    const openEditModal = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`users/manage/${editingUser.id}/`, editingUser);
            setIsEditModalOpen(false);
            fetchUsers();
            alert("User updated successfully!");
        } catch (err) {
            alert("Error updating user.");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" /> User Management
            </h1>

            {/* Create User Form Section */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-10 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserPlus size={20} /> Enroll New User
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="email" placeholder="Email Address" className="p-2 border rounded" 
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    <input type="text" placeholder="First Name" className="p-2 border rounded" 
                        value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
                    <input type="text" placeholder="Last Name" className="p-2 border rounded" 
                        value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
                    <input type="text" placeholder="Designation" className="p-2 border rounded" 
                        value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} />
                    <select className="p-2 border rounded" value={formData.role} 
                        onChange={(e) => setFormData({...formData, role: e.target.value})}>
                        <option value="ADMIN">Admin User</option>
                        <option value="FACULTY">Faculty Member</option>
                        <option value="PIM">Program Information Manager</option>
                        <option value="PS">Program Supervision</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
                        Create User
                    </button>
                </form>

                {newlyCreated && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-start">
                        <div>
                            <p className="text-green-800 font-bold text-sm">User Created Successfully!</p>
                            <p className="text-sm">Email: <strong>{newlyCreated.email}</strong></p>
                            <p className="text-sm">Temp Password: <strong className="text-red-600 font-mono">{newlyCreated.generated_password}</strong></p>
                        </div>
                        <button onClick={() => setNewlyCreated(null)}><X size={18}/></button>
                    </div>
                )}
            </div>

            {/* Users List Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                        <tr>
                            <th className="p-4 border-b">Name</th>
                            <th className="p-4 border-b">Email / Role</th>
                            <th className="p-4 border-b">Status</th>
                            <th className="p-4 border-b text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 border-b font-medium">
                                    {u.first_name} {u.last_name}
                                    <div className="text-xs text-gray-400 font-normal">{u.designation || 'No Designation'}</div>
                                </td>
                                <td className="p-4 border-b">
                                    <div className="text-sm text-gray-600">{u.email}</div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 border-b">
                                    {u.must_change_password ? 
                                        <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs">Pending Setup</span> : 
                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Active</span>}
                                </td>
                                <td className="p-4 border-b">
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => openEditModal(u)} className="text-blue-600 hover:text-blue-800 transition">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(u.id, u.first_name)} className="text-red-500 hover:text-red-700 transition">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold mb-6">Edit User Info</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">First Name</label>
                                <input type="text" className="w-full p-2 border rounded mt-1" 
                                    value={editingUser.first_name} onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">Last Name</label>
                                <input type="text" className="w-full p-2 border rounded mt-1" 
                                    value={editingUser.last_name} onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">Designation</label>
                                <input type="text" className="w-full p-2 border rounded mt-1" 
                                    value={editingUser.designation} onChange={(e) => setEditingUser({...editingUser, designation: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500">Role</label>
                                <select className="w-full p-2 border rounded mt-1" value={editingUser.role} 
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}>
                                    <option value="ADMIN">Admin User</option>
                                    <option value="FACULTY">Faculty Member</option>
                                    <option value="PIM">Program Information Manager</option>
                                    <option value="PS">Program Supervision</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">
                                    Save Changes
                                </button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 p-2 rounded font-bold hover:bg-gray-200">
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

export default UserManagement;