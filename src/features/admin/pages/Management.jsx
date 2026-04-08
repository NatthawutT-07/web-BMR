import React, { useState, useEffect } from "react";
import api from "../../../utils/axios";
import { Users, Store, Pencil, Trash2, Shield, ShieldCheck, Check, X } from "lucide-react";

const Management = () => {
  const [activeTab, setActiveTab] = useState("users"); // "users" or "branches"
  
  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", password: "", role: "user" });

  // Branches state
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isEditingBranch, setIsEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ branch_code: "", branch_name: "" });
  const [isAddingBranch, setIsAddingBranch] = useState(false);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchBranches();
    }
  }, [activeTab]);

  // --- Users Management ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`ต้องการเปลี่ยน Role เป็น ${newRole} ใช่หรือไม่?`)) return;
    
    try {
      await api.post("/change-role", { id, role: newRole });
      fetchUsers();
    } catch (err) {
      console.error("Error changing role:", err);
      alert("ไม่สามารถเปลี่ยน Role ได้");
    }
  };

  const handleChangeStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const statusText = newStatus ? "เปิดใช้งาน" : "ปิดใช้งาน";
    if (!window.confirm(`ต้องการ${statusText}ผู้ใช้นี้ใช่หรือไม่?`)) return;
    
    try {
      await api.post("/change-status", { id, enabled: newStatus });
      fetchUsers();
    } catch (err) {
      console.error("Error changing status:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.password) {
      alert("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      await api.post("/users", userForm);
      setUserForm({ name: "", password: "", role: "user" });
      setIsAddingUser(false);
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      alert(err.response?.data?.message || "ไม่สามารถสร้างผู้ใช้ได้");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;
    
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "ไม่สามารถลบผู้ใช้ได้");
    }
  };

  // --- Branches Management ---
  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await api.get("/branches");
      setBranches(res.data);
    } catch (err) {
      console.error("Error fetching branches:", err);
      alert("ไม่สามารถดึงข้อมูลสาขาได้");
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSaveBranch = async () => {
    if (!branchForm.branch_code || !branchForm.branch_name) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      if (isEditingBranch) {
        await api.put(`/branches/${isEditingBranch}`, branchForm);
      } else {
        await api.post("/branches", branchForm);
      }
      setBranchForm({ branch_code: "", branch_name: "" });
      setIsEditingBranch(null);
      setIsAddingBranch(false);
      fetchBranches();
    } catch (err) {
      console.error("Error saving branch:", err);
      alert(err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลสาขาได้");
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสาขานี้? ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ")) return;
    
    try {
      await api.delete(`/branches/${id}`);
      fetchBranches();
    } catch (err) {
      console.error("Error deleting branch:", err);
      alert(err.response?.data?.message || "ไม่สามารถลบสาขาได้ เนื่องจากอาจมีข้อมูลอื่นอ้างอิงอยู่");
    }
  };

  const cancelEditBranch = () => {
    setBranchForm({ branch_code: "", branch_name: "" });
    setIsEditingBranch(null);
    setIsAddingBranch(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "users" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Users size={16} />
          จัดการผู้ใช้ (Users)
        </button>
        <button
          onClick={() => setActiveTab("branches")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "branches" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Store size={16} />
          จัดการสาขา (Branch)
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === "users" ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">รายชื่อผู้ใช้งาน</h2>
              {!isAddingUser && (
                <button
                  onClick={() => setIsAddingUser(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  + เพิ่มผู้ใช้ใหม่
                </button>
              )}
            </div>

            {isAddingUser && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อผู้ใช้ (Username)</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">รหัสผ่าน (Password)</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div className="w-[150px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">บทบาท (Role)</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveUser}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Check size={16} /> บันทึก
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingUser(false);
                      setUserForm({ name: "", password: "", role: "user" });
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1"
                  >
                    <X size={16} /> ยกเลิก
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">ชื่อผู้ใช้ (Name)</th>
                  <th className="px-6 py-4 text-center">บทบาท (Role)</th>
                  <th className="px-6 py-4 text-center">สถานะ (Status)</th>
                  <th className="px-6 py-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">ไม่พบข้อมูลผู้ใช้</td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                        }`}>
                          {user.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}>
                          {user.enabled ? '🟢 ใช้งาน' : '🔴 ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleChangeRole(user.id, user.role)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            เปลี่ยน Role
                          </button>
                          <button
                            onClick={() => handleChangeStatus(user.id, user.enabled)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              user.enabled 
                                ? "border-rose-200 text-rose-600 hover:bg-rose-50" 
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {user.enabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">รายชื่อสาขา</h2>
              {!isAddingBranch && !isEditingBranch && (
                <button
                  onClick={() => setIsAddingBranch(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  + เพิ่มสาขาใหม่
                </button>
              )}
            </div>

            {(isAddingBranch || isEditingBranch) && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">รหัสสาขา (Branch Code)</label>
                  <input
                    type="text"
                    value={branchForm.branch_code}
                    onChange={(e) => setBranchForm({ ...branchForm, branch_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div className="flex-[2] min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อสาขา (Branch Name)</label>
                  <input
                    type="text"
                    value={branchForm.branch_name}
                    onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBranch}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Check size={16} /> บันทึก
                  </button>
                  <button
                    onClick={cancelEditBranch}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1"
                  >
                    <X size={16} /> ยกเลิก
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">รหัสสาขา</th>
                    <th className="px-6 py-4">ชื่อสาขา</th>
                    <th className="px-6 py-4 text-center w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingBranches ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">กำลังโหลดข้อมูล...</td>
                    </tr>
                  ) : branches.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">ไม่พบข้อมูลสาขา</td>
                    </tr>
                  ) : (
                    branches.map((branch, index) => (
                      <tr key={branch.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{branch.branch_code}</td>
                        <td className="px-6 py-4 text-slate-700">{branch.branch_name}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setBranchForm({ branch_code: branch.branch_code, branch_name: branch.branch_name });
                                setIsEditingBranch(branch.id);
                                setIsAddingBranch(false);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="แก้ไข"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="ลบ"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Management;
