import React, { useState, useEffect } from "react";
import { fetchStationsData } from "../../api/admin/upload";
import { deleteStation, addStation, updateStation } from "../../api/admin/station";
import useBmrStore from "../../store/bmr_store";
import { toast } from "react-toastify";

const ShowPartner = () => {
    const [stations, setStations] = useState([]);
    const [newStation, setNewStation] = useState({
        codeSAP: "",
        codeADA: "",
        codeBMX: "",
        nameTH: "",
        nameEng: "",
        adaStore: "",
        WhCodeSAP: "",
        storeNameTH: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const token = useBmrStore((state) => state.token);

    const fetchStations = async () => {
        try {
            const data = await fetchStationsData();
            if (data && Array.isArray(data.stations)) {
                setStations(data.stations);  // Extract 'stations' if it's inside an object
            } else if (Array.isArray(data)) {
                setStations(data);  // If it's directly an array
            } else {
                setStations([]);  // Fallback to empty array
            }
        } catch (error) {
            console.error("Error fetching stations:", error);
            setStations([]);  // Ensure an empty array is set in case of error
        }
    };


    useEffect(() => {
        fetchStations();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ Confirm delete this station?")) return;
        try {
            await deleteStation(token, id);
            toast.success("✅ Station deleted successfully", { autoClose: 300 });
            fetchStations();
        } catch (error) {
            toast.error("❌ Failed to delete station");
        }
    };

    const handleAdd = async () => {
        if (!newStation.codeSAP || !newStation.codeADA || !newStation.codeBMX || !newStation.adaStore) {
            toast.warn("กรุณากรอกข้อมูลสำคัญ เช่น codeSAP และ nameTH", { autoClose: 300 });
            return;
        }
        setLoading(true);
        try {
            await addStation(token, newStation);
            toast.success("✅ Added new station successfully", { autoClose: 300 });
            setNewStation({
                codeSAP: "",
                codeADA: "",
                codeBMX: "",
                adaStore: "",
            });
            fetchStations();
            setShowAddForm(false);
        } catch (error) {
            toast.error("❌ Failed to add station", { autoClose: 300 });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (station) => {

        try {
            await updateStation(token, station);
            toast.success("✅ Station updated successfully", { autoClose: 300 });
            setEditingId(null);
            fetchStations();
        } catch (error) {
            toast.error("❌ Failed to update station");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mt-2 mb-2">📋 Branch Data</h2>

            <button
                onClick={() => setShowAddForm((prev) => !prev)}
                className="mb-2 bg-blue-300 text-white px-2 py-1 rounded hover:bg-blue-400 text-sm"
            >
                {showAddForm ? "➖ Hide Add Branch" : "➕ Show Add Branch"}
            </button>

            {showAddForm && (
                <div className="border border-gray-300 rounded p-4 bg-gray-50 mb-2 text-sm">
                    <h3 className="font-medium mb-2">➕ Add New Branch</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <input
                            placeholder="codeSAP"
                            value={newStation.codeSAP}
                            onChange={(e) =>
                                setNewStation({ ...newStation, codeSAP: e.target.value })
                            }
                            className="border p-1 rounded"
                        />

                        <input
                            placeholder="codeADA"
                            value={newStation.codeADA}
                            onChange={(e) =>
                                setNewStation({ ...newStation, codeADA: e.target.value })
                            }
                            className="border p-1 rounded"
                        />
                        <input
                            placeholder="codeBMX"
                            value={newStation.codeBMX}
                            onChange={(e) =>
                                setNewStation({ ...newStation, codeBMX: e.target.value })
                            }
                            className="border p-1 rounded"
                        />
                        <input
                            placeholder="adaStore"
                            value={newStation.adaStore}
                            onChange={(e) =>
                                setNewStation({ ...newStation, adaStore: e.target.value })
                            }
                            className="border p-1 rounded col-span-3"
                        />


                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={loading}
                        className="mt-3 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                        {loading ? "Adding..." : "Add Branch"}
                    </button>
                </div>
            )}

            {stations.length === 0 ? (
                <p className="text-gray-600 text-sm">No branch data available.</p>
            ) : (
                <table className="min-w-full border border-gray-300 text-xs">
                    <thead className="bg-gray-200 text-left">
                        <tr>
                            <th className="border border-gray-300 px-2 py-1">#</th>
                            <th className="border border-gray-300 px-2 py-1">codeSAP</th>
                            <th className="border border-gray-300 px-2 py-1">codeADA</th>
                            <th className="border border-gray-300 px-2 py-1">adaStore</th>
                            <th className="border border-gray-300 px-2 py-1">codeBMX</th>
                            <th className="border border-gray-300 px-2 py-1 text-center">action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stations.map((s, i) => (
                            <tr key={s.id} className="even:bg-white odd:bg-gray-50 hover:bg-blue-50">
                                <td className="border px-2 py-1">{i + 1}</td>

                                <td className="border px-2 py-1">
                                    {editingId === s.id ? (
                                        <input
                                            className="border p-1  rounded"
                                            value={s.codeSAP}
                                            onChange={(e) =>
                                                setStations((prev) =>
                                                    prev.map((st) =>
                                                        st.id === s.id
                                                            ? { ...st, codeSAP: e.target.value }
                                                            : st
                                                    )
                                                )
                                            }
                                        />
                                    ) : (
                                        s.codeSAP
                                    )}
                                </td>
                                <td className="border px-2 py-1">
                                    {editingId === s.id ? (
                                        <input
                                            className="border p-1  rounded"
                                            value={s.codeADA}
                                            onChange={(e) =>
                                                setStations((prev) =>
                                                    prev.map((st) =>
                                                        st.id === s.id
                                                            ? { ...st, codeADA: e.target.value }
                                                            : st
                                                    )
                                                )
                                            }
                                        />
                                    ) : (
                                        s.codeADA
                                    )}
                                </td>
                                <td className="border px-2 py-1">
                                    {editingId === s.id ? (
                                        <input
                                            className="border p-1  rounded"
                                            value={s.adaStore}
                                            onChange={(e) =>
                                                setStations((prev) =>
                                                    prev.map((st) =>
                                                        st.id === s.id
                                                            ? { ...st, adaStore: e.target.value }
                                                            : st
                                                    )
                                                )
                                            }
                                        />
                                    ) : (
                                        s.adaStore
                                    )}
                                </td>
                                <td className="border px-2 py-1">
                                    {editingId === s.id ? (
                                        <input
                                            className="border p-1  rounded"
                                            value={s.codeBMX}
                                            onChange={(e) =>
                                                setStations((prev) =>
                                                    prev.map((st) =>
                                                        st.id === s.id
                                                            ? { ...st, codeBMX: e.target.value }
                                                            : st
                                                    )
                                                )
                                            }
                                        />
                                    ) : (
                                        s.codeBMX
                                    )}
                                </td>
                                <td className="border px-2 py-1 flex gap-1 justify-center">
                                    {editingId === s.id ? (
                                        <>
                                            <button
                                                onClick={() => handleUpdate(s)}
                                                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setEditingId(s.id)}
                                                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ShowPartner;
