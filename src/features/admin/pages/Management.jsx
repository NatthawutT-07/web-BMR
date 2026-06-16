import React, { useState, useEffect } from "react";
import api from "../../../utils/axios";
import { Users, Store, Pencil, Trash2, Shield, ShieldCheck, Check, X, Plus } from "lucide-react";

const Management = () => {
  const [activeTab, setActiveTab] = useState("users");

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
    fetchUsers();
    fetchBranches();
  }, []);

  //  Users Management 
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
      alert(err.message || "ไม่สามารถสร้างผู้ใช้ได้");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.message || "ไม่สามารถลบผู้ใช้ได้");
    }
  };

  //  Branches Management 
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
      console.error("Error saving branchMain:", err);
      alert(err.message || "ไม่สามารถบันทึกข้อมูลสาขาได้");
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบสาขานี้? ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ")) return;

    try {
      await api.delete(`/branches/${id}`);
      fetchBranches();
    } catch (err) {
      console.error("Error deleting branchMain:", err);
      alert(err.message || "ไม่สามารถลบสาขาได้ เนื่องจากอาจมีข้อมูลอื่นอ้างอิงอยู่");
    }
  };

  const cancelEditBranch = () => {
    setBranchForm({ branch_code: "", branch_name: "" });
    setIsEditingBranch(null);
    setIsAddingBranch(false);
  };

  return (
    <div className="w-full p-3 md:p-5 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Users and branch master data</p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:min-w-[360px]">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Users</span>
              <Users size={15} className="text-slate-400" />
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-800">{users.length}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">Branches</span>
              <Store size={15} className="text-slate-400" />
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-800">{branches.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hidden">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === "users" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
        >
          <Users size={16} />
          Users
        </button>
        <button
          onClick={() => setActiveTab("branches")}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === "branches" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
        >
          <Store size={16} />
          BranchMain
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-w-0">
          <div className="p-3 md:p-4">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Users</h2>
              {!isAddingUser && (
                <button
                  onClick={() => setIsAddingUser(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={14} /> New User
                </button>
              )}
            </div>

            {isAddingUser && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[1fr_1fr_130px_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Username</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveUser}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Check size={16} /> Save
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingUser(false);
                      setUserForm({ name: "", password: "", role: "user" });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 flex items-center gap-1"
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-2.5 w-16">ID</th>
                    <th className="px-4 py-2.5">Username</th>
                    <th className="px-4 py-2.5 text-center">Role</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">Loading data...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No user data found</td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-slate-500">{index + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{user.name}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${user.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                            }`}>
                            {user.role === 'admin' ? <ShieldCheck size={13} /> : <Shield size={13} />}
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${user.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                            }`}>
                            {user.enabled ? '🟢 Active' : '🔴 Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* <button
                              onClick={() => handleChangeRole(user.id, user.role)}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                              Change Role
                            </button> */}
                            <button
                              onClick={() => handleChangeStatus(user.id, user.enabled)}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${user.enabled
                                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                }`}
                            >
                              {user.enabled ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-w-0">
          <div className="p-3 md:p-4">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Branch List</h2>
              {!isAddingBranch && !isEditingBranch && (
                <button
                  onClick={() => setIsAddingBranch(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={14} /> Add New Branch
                </button>
              )}
            </div>

            {isAddingBranch && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[160px_1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={branchForm.branch_code}
                    onChange={(e) => setBranchForm({ ...branchForm, branch_code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branchForm.branch_name}
                    onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder=""
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBranch}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Check size={16} /> Save
                  </button>
                  <button
                    onClick={cancelEditBranch}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 flex items-center gap-1"
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-2.5 w-16">ID</th>
                    <th className="px-4 py-2.5">Branch Code</th>
                    <th className="px-4 py-2.5">Branch Name</th>
                    <th className="px-4 py-2.5 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingBranches ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-500">Loading data...</td>
                    </tr>
                  ) : branches.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-500">No branch data found</td>
                    </tr>
                  ) : (
                    branches.map((branchMain, index) => (
                      <React.Fragment key={branchMain.id}>
                        <tr className={isEditingBranch === branchMain.id ? "bg-blue-50/40" : "hover:bg-slate-50/50"}>
                          <td className="px-4 py-2.5 text-slate-500">{index + 1}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{branchMain.branch_code}</td>
                          <td className="px-4 py-2.5 text-slate-700">{branchMain.branch_name}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setBranchForm({ branch_code: branchMain.branch_code, branch_name: branchMain.branch_name });
                                  setIsEditingBranch(branchMain.id);
                                  setIsAddingBranch(false);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteBranch(branchMain.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isEditingBranch === branchMain.id && (
                          <tr className="bg-blue-50/30">
                            <td colSpan="4" className="px-4 pb-3">
                              <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[160px_1fr_auto] gap-3 items-end">
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Branch Code</label>
                                  <input
                                    type="text"
                                    value={branchForm.branch_code}
                                    onChange={(e) => setBranchForm({ ...branchForm, branch_code: e.target.value })}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder=""
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Branch Name</label>
                                  <input
                                    type="text"
                                    value={branchForm.branch_name}
                                    onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder=""
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveBranch}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                                  >
                                    <Check size={16} /> Save
                                  </button>
                                  <button
                                    onClick={cancelEditBranch}
                                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 flex items-center gap-1"
                                  >
                                    <X size={16} /> Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Management;
