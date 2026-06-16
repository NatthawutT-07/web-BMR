import React, { useEffect, useMemo, useState } from "react";
import api from "../../../utils/axios";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";

const STAT_STYLES = {
  blue: {
    active: "border-blue-200 ring-blue-200",
    icon: "bg-blue-50 text-blue-700",
    indicator: "bg-blue-500",
    text: "text-blue-700",
  },
  amber: {
    active: "border-amber-200 ring-amber-200",
    icon: "bg-amber-50 text-amber-700",
    indicator: "bg-amber-500",
    text: "text-amber-700",
  },
  rose: {
    active: "border-rose-200 ring-rose-200",
    icon: "bg-rose-50 text-rose-700",
    indicator: "bg-rose-500",
    text: "text-rose-700",
  },
  emerald: {
    active: "border-emerald-200 ring-emerald-200",
    icon: "bg-emerald-50 text-emerald-700",
    indicator: "bg-emerald-500",
    text: "text-emerald-700",
  },
};

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

const StatCard = ({ title, count, icon, color = "blue", active, onClick, clickable = true, helper }) => {
  const style = STAT_STYLES[color] || STAT_STYLES.blue;
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      onClick={clickable ? onClick : undefined}
      className={`relative w-full overflow-hidden rounded-xl border bg-white p-4 text-left transition-all ${
        active && clickable ? `${style.active} shadow-sm ring-2 ring-offset-1` : "border-slate-200"
      } ${clickable ? "hover:border-slate-300 hover:bg-slate-50" : ""}`}
    >
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${style.indicator}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${active && clickable ? style.text : "text-slate-600"}`}>{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{Number(count || 0).toLocaleString()}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <span className={`rounded-lg p-2 ${style.icon}`}>
          {React.createElement(icon, { size: 18 })}
        </span>
      </div>
    </Tag>
  );
};

const EmptyState = ({ title, desc, icon = Store }) => (
  <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
    <div className="rounded-full bg-slate-100 p-3 text-slate-400">
      {React.createElement(icon, { size: 28 })}
    </div>
    <p className="mt-3 font-medium text-slate-700">{title}</p>
    {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
  </div>
);

const StatusBadge = ({ completed }) => (
  completed ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 size={13} />
      Acknowledged
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      <Clock size={13} />
      Pending
    </span>
  )
);

export default function BranchAckStatus() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ branches: [], summary: {} });
  const [branchMap, setBranchMap] = useState({});
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [ackRes, branchesRes] = await Promise.all([
        api.get("/branch-ack-status"),
        api.get("/branches"),
      ]);

      if (branchesRes.data) {
        const map = {};
        branchesRes.data.forEach((branch) => {
          map[branch.branch_code] = branch.branch_name;
        });
        setBranchMap(map);
      }

      if (ackRes.ok) setData(ackRes.data);
      else setError(ackRes.message || "โหลดข้อมูลไม่สำเร็จ");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { branches = [], summary = {} } = data;
  const completedBranches = Math.max(0, (summary.totalBranches || 0) - (summary.branchesWithPending || 0));

  const filteredBranches = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return branches
      .filter((branch) => {
        const branchName = branchMap[branch.branch_code] || "";
        const matchSearch = !keyword ||
          branch.branch_code.toLowerCase().includes(keyword) ||
          branchName.toLowerCase().includes(keyword);

        const matchStatus =
          statusFilter === "all" ? true :
            statusFilter === "pending" ? branch.pending > 0 :
              branch.status === "completed";

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if ((b.pending || 0) !== (a.pending || 0)) return (b.pending || 0) - (a.pending || 0);
        return String(a.branch_code).localeCompare(String(b.branch_code));
      });
  }, [branchMap, branches, search, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 size={26} />
                Branch Acknowledgement
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard title="Branches" count={summary.totalBranches || 0} icon={Store} color="blue" active={statusFilter === "all"} onClick={() => setStatusFilter("all")}/>
          <StatCard title="Pending" count={summary.branchesWithPending || 0} icon={Clock} color="amber" active={statusFilter === "pending"} onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")} />
          <StatCard title="Completed" count={completedBranches} icon={CheckCircle2} color="emerald" active={statusFilter === "completed"} onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}  />
          <StatCard title="Pending Items" count={summary.totalPending || 0} icon={AlertTriangle} color="rose" clickable={false} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branches..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "completed", label: "Completed" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setStatusFilter(option.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    statusFilter === option.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={fetchData} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-100">ลองใหม่</button>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Branch List</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-2.5">Branch</th>
                  <th className="px-4 py-2.5 text-center">Pending</th>
                  <th className="px-4 py-2.5 text-center">Acknow</th>
                  <th className="px-4 py-2.5">Progress</th>
                  <th className="px-4 py-2.5">Last Updated</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6"><EmptyState icon={RefreshCw} title="Loading data..." /></td></tr>
                ) : filteredBranches.length === 0 ? (
                  <tr><td colSpan="6"><EmptyState title="No data found" desc="Try changing the search query or filters" /></td></tr>
                ) : filteredBranches.map((branch) => {
                  const pending = branch.pending || 0;
                  const acknowledged = branch.acknowledged || 0;
                  const total = pending + acknowledged;
                  const percent = total ? Math.round((acknowledged / total) * 100) : 100;
                  const completed = branch.status === "completed";

                  return (
                    <tr key={branch.branch_code} className={`transition-colors hover:bg-slate-50 ${pending > 0 ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-md p-1.5 ${pending > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-900">{branchMap[branch.branch_code] || branch.branch_code}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{branch.branch_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {pending > 0 ? (
                          <span className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-sm shadow-rose-200">{pending}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="font-semibold tabular-nums text-slate-700">{acknowledged}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-9 text-[11px] font-semibold tabular-nums text-slate-600">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          {formatDate(branch.lastChange)}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge completed={completed} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
