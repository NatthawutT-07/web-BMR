import React, { useState, useEffect } from "react";
import useBmrStore from "../../store/bmr_store";
import { changeUserRole, changeUserStatus, getManageUser } from "../../api/admin/manageUser";
import { toast } from "react-toastify";

const TableUsers = () => {
  const token = useBmrStore((state) => state.token);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) handleGetUsers(token);
  }, [token]);

  const handleGetUsers = async (token) => {
    setLoading(true);
    try {
      const res = await getManageUser(token);
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserStatus = (userId, userStatus) => {
    const value = {
      id: userId,
      enabled: !userStatus,
    };
    changeUserStatus(token, value)
      .then(() => {
        handleGetUsers(token);
        toast.success("Update Status Success", { autoClose: 300 });
      })
      .catch((err) => console.log(err));
  };

  const handleChangeUserRole = (userId, userRole) => {
    const value = {
      id: userId,
      role: userRole,
    };
    changeUserRole(token, value)
      .then(() => {
        handleGetUsers(token);
        toast.success("Update Role Success", { autoClose: 300 });
      })
      .catch((err) => console.log(err));
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-gray-700 text-lg font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <table className="w-full table-auto text-left text-gray-800">
        <thead>
          <tr className="bg-indigo-100">
            <th className="px-5 py-3 border border-indigo-200 text-sm font-semibold">No</th>
            <th className="px-5 py-3 border border-indigo-200 text-sm font-semibold">Name</th>
            <th className="px-5 py-3 border border-indigo-200 text-sm font-semibold">Permission</th>
            <th className="px-5 py-3 border border-indigo-200 text-sm font-semibold">Status</th>
            <th className="px-5 py-3 border border-indigo-200 text-sm font-semibold">Manage</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-8 text-gray-500">
                ไม่พบข้อมูลผู้ใช้
              </td>
            </tr>
          ) : (
            users.map((el, i) => (
              <tr
                key={el.id}
                className="border-b border-indigo-100 hover:bg-indigo-50 transition-colors"
              >
                <td className="px-5 py-3 align-middle">{i + 1}</td>
                <td className="px-5 py-3 align-middle">{el.name}</td>
                <td className="px-5 py-3 align-middle">
                  <select
                    onChange={(e) => handleChangeUserRole(el.id, e.target.value)}
                    value={el.role}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-3 align-middle">{el.enabled ? "Active" : "Inactive"}</td>
                <td className="px-5 py-3 align-middle">
                  <button
                    onClick={() => handleChangeUserStatus(el.id, el.enabled)}
                    className={`text-white py-2 px-4 rounded-md transition-colors duration-200 ${
                      el.enabled
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {el.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableUsers;
