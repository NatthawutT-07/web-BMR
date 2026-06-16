import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../utils/axios";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  Filter,
  Layers,
  LayoutGrid,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Store,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    ring: "ring-amber-200",
    indicator: "bg-amber-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    ring: "ring-rose-200",
    indicator: "bg-rose-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    ring: "ring-emerald-200",
    indicator: "bg-emerald-500",
  },
};

const ACTION_STYLES = {
  add: { label: "Add", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  move: { label: "Move", badge: "bg-blue-100 text-blue-800 border-blue-200" },
  delete: { label: "Delete", badge: "bg-rose-100 text-rose-800 border-rose-200" },
};

const availableRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusPill = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text} ${style.border}`}>
      <Icon size={13} />
      {style.label}
    </span>
  );
};

const StatCard = ({ count, type, active, onClick }) => {
  const style = STATUS_STYLES[type];
  const Icon = style.icon;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-xl border bg-white p-4 text-left transition-all ${active ? `shadow-sm ring-2 ring-offset-1 ${style.ring} ${style.border}` : "border-slate-200 hover:border-slate-300"
        } ${onClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
    >
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${style.indicator}`} />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-medium ${style.text}`}>{style.label}</span>
        <span className={`rounded-lg p-2 ${style.bg} ${style.text}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{Number(count || 0).toLocaleString()}</div>
    </Tag>
  );
};

const EmptyState = ({ icon = CheckCircle2, title, desc }) => (
  <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
    <div className="rounded-full bg-slate-100 p-3 text-slate-400">
      {React.createElement(icon, { size: 28 })}
    </div>
    <p className="mt-3 font-medium text-slate-700">{title}</p>
    {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
  </div>
);

const RejectReasonModal = ({ isOpen, onClose, onConfirm, count = 1 }) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Confirm Rejection</h3>
            <p className="text-sm text-slate-500">{count > 1 ? `Rejecting ${count} items` : "Rejecting this item"}</p>
          </div>
        </div>
        <div className="p-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">Reason (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ระบุเหตุผล..."
            className="h-32 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
            {submitting ? "Confirming..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditPositionModal = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    toShelf: "",
    toRow: "",
    toIndex: "",
    fromShelf: "",
    fromRow: "",
    fromIndex: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        toShelf: item.toShelf || "",
        toRow: item.toRow || "",
        toIndex: item.toIndex || "",
        fromShelf: item.fromShelf || "",
        fromRow: item.fromRow || "",
        fromIndex: item.fromIndex || "",
      });
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const showFrom = ["move", "delete"].includes(item.action);
  const showTo = ["add", "move"].includes(item.action);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, formData);
      onClose();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const PositionFields = ({ title, prefix }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MapPin size={16} className="text-slate-400" />
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Shelf</label>
          <input value={formData[`${prefix}Shelf`]} onChange={(e) => handleChange(`${prefix}Shelf`, e.target.value.toUpperCase())} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="A1" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Row</label>
          <select value={formData[`${prefix}Row`]} onChange={(e) => handleChange(`${prefix}Row`, e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="">-</option>
            {availableRows.map((row) => <option key={row} value={row}>{row}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Index</label>
          <select value={formData[`${prefix}Index`]} onChange={(e) => handleChange(`${prefix}Index`, e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="">-</option>
            {Array.from({ length: 20 }, (_, idx) => idx + 1).map((index) => <option key={index} value={index}>{index}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Edit2 size={18} className="text-blue-500" />
              Edit Position
          </h3>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <Package size={18} className="mt-0.5 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{item.item_name || item.barcode}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{item.barcode}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-medium ${ACTION_STYLES[item.action]?.badge || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {ACTION_STYLES[item.action]?.label || item.action}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {showFrom && <PositionFields title="Original Position (From)" prefix="from" />}
          {showTo && <PositionFields title="New Position (To)" prefix="to" />}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PogRequests() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterAction, setFilterAction] = useState("");
  const [filterShelf, setFilterShelf] = useState("");
  const [filterRow, setFilterRow] = useState("");
  const [updating, setUpdating] = useState(null);
  const [stats, setStats] = useState({ pending: 0, rejected: 0, completed: 0 });
  const [branchStats, setBranchStats] = useState({});
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [viewMode, setViewMode] = useState("summary");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, ids: [], count: 0 });
  const [editModal, setEditModal] = useState({ open: false, item: null });

  const loadBranches = useCallback(async () => {
    try {
      const res = await api.get("/branches");
      setBranches(res.data || []);
    } catch (err) {
      console.error("Load branches error:", err);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pog-requests", { params: { limit: 1, _t: Date.now() } });
      if (res.meta?.stats) setStats(res.meta.stats);
      if (res.meta?.branchStats) setBranchStats(res.meta.branchStats);
    } catch (e) {
      console.error("Load summary error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (viewMode === "summary" || !selectedBranch) return;

    setLoading(true);
    try {
      const params = { limit: 50, page, branch_code: selectedBranch, _t: Date.now() };
      if (filterStatus) params.status = filterStatus;
      if (filterAction) params.action = filterAction;
      if (filterShelf) params.shelf = filterShelf;
      if (filterRow) params.row = filterRow;

      const res = await api.get("/pog-requests", { params });
      setData(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalItems(res.meta?.total || 0);
      if (res.meta?.stats) setStats(res.meta.stats);
      if (res.meta?.branchStats) setBranchStats(res.meta.branchStats);
      setSelectedIds(new Set());
    } catch (e) {
      console.error("Load POG requests error:", e);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterRow, filterShelf, filterStatus, page, selectedBranch, viewMode]);

  useEffect(() => { loadBranches(); }, [loadBranches]);
  useEffect(() => { viewMode === "summary" ? loadSummary() : loadData(); }, [loadData, loadSummary, viewMode]);
  useEffect(() => { setPage(1); }, [filterStatus, filterAction, filterShelf, filterRow]);

  const getBranchName = useCallback((code) => {
    const branch = branches.find((item) => item.branch_code === code);
    return branch ? branch.branch_name : code;
  }, [branches]);

  const branchCards = useMemo(() => {
    const keyword = branchSearch.trim().toLowerCase();
    return Object.entries(branchStats)
      .map(([branch_code, bStats]) => ({ branch_code, name: getBranchName(branch_code), ...bStats }))
      .filter((branch) => {
        if (!keyword) return true;
        return branch.branch_code.toLowerCase().includes(keyword) || String(branch.name || "").toLowerCase().includes(keyword);
      })
      .sort((a, b) => (b.total || 0) - (a.total || 0));
  }, [branchSearch, branchStats, getBranchName]);

  const visibleData = data;
  const pendingVisibleData = visibleData.filter((item) => item.status === "pending");
  const allPendingSelected = pendingVisibleData.length > 0 && pendingVisibleData.every((item) => selectedIds.has(item.id));

  const enterBranchDetail = (branch_code) => {
    setSelectedBranch(branch_code);
    setViewMode("detail");
    setPage(1);
    setSelectedIds(new Set());
  };

  const backToSummary = () => {
    setViewMode("summary");
    setSelectedBranch(null);
    setData([]);
    setSelectedIds(new Set());
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPendingSelected) pendingVisibleData.forEach((item) => next.delete(item.id));
      else pendingVisibleData.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const updateStatus = async (id, newStatus, reason = null) => {
    setUpdating(id);
    try {
      const payload = { status: newStatus, ...(reason && { rejectReason: reason }) };
      const res = await api.patch(`/pog-requests/${id}`, payload);

      if (res.ok) {
        setData((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus, note: reason || item.note } : item));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setStats((prev) => {
          const next = { ...prev };
          const item = data.find((d) => d.id === id);
          if (item && item.status !== newStatus) {
            if (next[item.status] > 0) next[item.status] -= 1;
            next[newStatus] = (next[newStatus] || 0) + 1;
          }
          return next;
        });
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || "Failed" };
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkApprove = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`Approve ${ids.length} items?`)) return;

    setBulkUpdating(true);
    try {
      const res = await api.post("/pog-requests/bulk-approve", { ids });
      if (res.ok) {
        const successCount = res.data.successCount || ids.length;
        setData((prev) => prev.map((item) => ids.includes(item.id) ? { ...item, status: "completed" } : item));
        setStats((prev) => ({ ...prev, pending: Math.max(0, prev.pending - successCount), completed: prev.completed + successCount }));
        setSelectedIds(new Set());
        alert(`Successfully approved ${successCount} items`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleApproveAllPending = async () => {
    const pending = visibleData.filter((item) => item.status === "pending");
    if (pending.length === 0) return alert("No pending items on this page");
    if (!confirm(`Approve all ${pending.length} items on this page?`)) return;

    setBulkUpdating(true);
    try {
      const res = await api.post("/pog-requests/bulk-approve", { ids: pending.map((item) => item.id) });
      if (res.ok) {
        const successCount = res.data.successCount || pending.length;
        setData((prev) => prev.map((item) => item.status === "pending" ? { ...item, status: "completed" } : item));
        setStats((prev) => ({ ...prev, pending: Math.max(0, prev.pending - successCount), completed: prev.completed + successCount }));
        alert(`Successfully approved ${successCount} items`);
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert(`Error: ${msg}`);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkReject = () => {
    const ids = [...selectedIds];
    if (ids.length > 0) setRejectModal({ open: true, ids, count: ids.length });
  };

  const confirmBulkReject = async (reason) => {
    setBulkUpdating(true);
    for (const id of rejectModal.ids) await updateStatus(id, "rejected", reason);
    setBulkUpdating(false);
    setSelectedIds(new Set());
  };

  const deleteRequest = async (id) => {
    if (!confirm("Delete ?")) return;
    try {
      await api.delete(`/pog-requests/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  const PositionCell = ({ item }) => {
    const renderPos = (s, r, i) => s ? `${s}-${r || "-"}-${i || "-"}` : "-";

    return (
      <div className="flex flex-col gap-0.5 text-[11px]">
        {item.fromShelf && (
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-8 shrink-0">From</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{renderPos(item.fromShelf, item.fromRow, item.fromIndex)}</span>
          </div>
        )}
        {item.toShelf && (
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-8 shrink-0">To</span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono font-medium text-blue-700">{renderPos(item.toShelf, item.toRow, item.toIndex)}</span>
          </div>
        )}
        {!item.fromShelf && !item.toShelf && <span className="text-slate-400">-</span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {viewMode === "summary" && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    <Store size={26} />
                    POG Requests
                  </div>
                </div>
                <button onClick={loadSummary} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60">
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {["pending", "rejected", "completed"].map((type) => (
                <StatCard key={type} type={type} count={stats[type] || 0} />
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Store size={18} className="text-blue-600" />
                    Requests by Branch
                  </h2> 
                  <p className="mt-1 text-sm text-slate-500">คลิกการ์ดสาขาเพื่อดูรายการและดำเนินการ</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)} placeholder="Search branches..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              {loading ? (
                <EmptyState icon={RefreshCw} title="Loading..." />
              ) : branchCards.length === 0 ? (
                <EmptyState title="No pending requests" desc={branchSearch ? "Try changing the search query" : "There are no requests from branches at the moment"} />
              ) : (
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                  {branchCards.map((branch) => (
                    <button key={branch.branch_code} onClick={() => enterBranchDetail(branch.branch_code)} className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">{branch.name}</p>
                          <p className="mt-1 font-mono text-xs text-slate-500">{branch.branch_code}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="text-3xl font-bold tabular-nums text-amber-600">{branch.total || 0}</span>
                          <ChevronRight size={20} className="text-slate-400 transition-colors group-hover:text-blue-500" />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                        <div className="rounded-lg bg-emerald-50 px-2 py-2 text-center">
                          <div className="text-sm font-bold tabular-nums text-emerald-700">{branch.add || 0}</div>
                          <div className="text-[11px] text-emerald-700">Add</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 px-2 py-2 text-center">
                          <div className="text-sm font-bold tabular-nums text-blue-700">{branch.move || 0}</div>
                          <div className="text-[11px] text-blue-700">Move</div>
                        </div>
                        <div className="rounded-lg bg-rose-50 px-2 py-2 text-center">
                          <div className="text-sm font-bold tabular-nums text-rose-700">{branch.delete || 0}</div>
                          <div className="text-[11px] text-rose-700">Delete</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === "detail" && selectedBranch && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex items-start gap-3">
                  <button onClick={backToSummary} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="กลับหน้าสรุป">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{getBranchName(selectedBranch)}</h1>
                    <p className="mt-1 text-sm text-slate-500">Branch: {selectedBranch} · Total Requests: {branchStats[selectedBranch]?.total || totalItems || 0} items</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {["pending", "rejected", "completed"].map((type) => {
                      const style = STATUS_STYLES[type];
                      const Icon = style.icon;
                      return (
                        <button key={type} onClick={() => setFilterStatus(type)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${filterStatus === type ? `bg-white shadow-sm ${style.text}` : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>
                          <Icon size={15} />
                          {style.label}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60">
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <Filter size={16} className="text-slate-400" />
                    <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none">
                      <option value="">All Actions</option>
                      <option value="add">Add</option>
                      <option value="move">Move</option>
                      <option value="delete">Delete</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <Layers size={16} className="text-slate-400" />
                    <input value={filterShelf} onChange={(e) => setFilterShelf(e.target.value.trim().toUpperCase())} placeholder="Shelf" className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <LayoutGrid size={16} className="text-slate-400" />
                    <select value={filterRow} onChange={(e) => setFilterRow(e.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none">
                      <option value="">All Rows</option>
                      {availableRows.map((row) => <option key={row} value={row}>Row {row}</option>)}
                    </select>
                  </label>
                </div>

                {filterStatus === "pending" && visibleData.length > 0 && selectedIds.size === 0 && (
                  <button onClick={handleApproveAllPending} disabled={bulkUpdating} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">
                    <CheckCircle2 size={16} />
                    Approve All on This Page
                  </button>
                )}
              </div>

              {filterStatus === "pending" && selectedIds.size > 0 && (
                <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center">
                  <span className="text-sm font-medium text-blue-800">Selected {selectedIds.size} items</span>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleBulkReject} disabled={bulkUpdating} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                      <X size={16} />
                      Reject Selected
                    </button>
                    <button onClick={handleBulkApprove} disabled={bulkUpdating} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                      <Check size={16} />
                      Approve Selected
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      <th className="w-12 px-4 py-2.5 text-center">
                        {filterStatus === "pending" && pendingVisibleData.length > 0 ? (
                          <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        ) : "#"}
                      </th>
                      <th className="px-4 py-2.5">Action</th>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5">Position</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="w-24 px-4 py-2.5 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan="6"><EmptyState icon={RefreshCw} title="Loading data..." /></td></tr>
                    ) : visibleData.length === 0 ? (
                      <tr><td colSpan="6"><EmptyState icon={Package} title="No data found" desc="Try changing the filter or refresh the data" /></td></tr>
                    ) : visibleData.map((item, idx) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <tr key={item.id} className={`transition-colors hover:bg-slate-50 ${isSelected ? "bg-blue-50/60" : ""}`}>
                          <td className="px-4 py-2 text-center">
                            {item.status === "pending" ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const next = new Set(selectedIds);
                                  next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                  setSelectedIds(next);
                                }}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="text-[11px] text-slate-400">{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ACTION_STYLES[item.action]?.badge || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              {ACTION_STYLES[item.action]?.label || item.action}
                            </span>
                            <div className="mt-0.5 text-[11px] text-slate-400">{formatDate(item.createdAt)}</div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="max-w-[260px]">
                              <p className="truncate text-xs font-semibold text-slate-900" title={item.item_name}>{item.item_name || item.barcode}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                <Package size={11} />
                                <span className="font-mono">{item.barcode}</span>
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-2"><PositionCell item={item} /></td>
                          <td className="px-4 py-2">
                            <StatusPill status={item.status} />
                            {item.status === "rejected" && item.note && <div className="mt-0.5 max-w-[160px] truncate text-[11px] text-rose-500" title={item.note}>{item.note}</div>}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-1">
                              {item.status === "pending" ? (
                                <>
                                  <button onClick={() => updateStatus(item.id, "completed")} disabled={updating === item.id} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50" title="Approve"><Check size={16} /></button>
                                  <button onClick={() => setEditModal({ open: true, item })} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50" title="Edit"><Edit2 size={16} /></button>
                                  <button onClick={() => setRejectModal({ open: true, ids: [item.id], count: 1 })} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50" title="Reject"><X size={16} /></button>
                                </>
                              ) : (
                                <button onClick={() => deleteRequest(item.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">Previous</button>
                  <span className="px-2 font-medium">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <RejectReasonModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, ids: [], count: 0 })}
        onConfirm={rejectModal.count > 1 ? confirmBulkReject : (reason) => updateStatus(rejectModal.ids[0], "rejected", reason)}
        count={rejectModal.count}
      />

      <EditPositionModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, item: null })}
        item={editModal.item}
        onSave={async (id, form) => {
          const res = await api.put(`/pog-requests/${id}/position`, form);
          if (res.ok) {
            setData((prev) => prev.map((item) => item.id === id ? { ...item, ...form } : item));
            alert("Edit successful");
          }
        }}
      />
    </div>
  );
}
