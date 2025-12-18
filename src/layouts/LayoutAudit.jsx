// src/pages/LayoutAudit.jsx
import React, { useState, useEffect, useMemo, Suspense } from "react";
import useBmrStore from "../store/bmr_store";
import useShelfStore from "../store/shelf_store";
import { getTemplateAndProduct } from "../api/users/home";
import { addTemplate, deleteTemplate, updateProducts } from "../api/admin/template"; // ✅ เพิ่ม updateProducts
import ShelfCardAudit from "../components/audit/ShelfCardAudit";
import ShelfFilterAudit from "../components/audit/ShelfFilterAudit";

/* ================================
 * Helpers: delete key + sameRow
 * ================================ */
const getDeleteKey = (p) => {
    if (p?.id != null) return `id:${p.id}`;
    return `cmp:${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}`;
};

const sameRow = (a, b) =>
    (a.branchCode || "") === (b.branchCode || "") &&
    a.shelfCode === b.shelfCode &&
    Number(a.rowNo) === Number(b.rowNo);

/* ================================
 * Branch selector สำหรับ AUDIT
 * ================================ */
const BranchSelector = React.memo(
    ({
        branches,
        selectedBranchCode,
        onChange,
        onSubmit,
        okLocked,
        onRefreshProduct,
        onDownload,
        downloadLoading,
    }) => {
        const handleSubmit = (e) => {
            e.preventDefault();
            if (onSubmit) onSubmit(e);
        };

        const handleRefresh = () => {
            if (!selectedBranchCode || !onRefreshProduct) return;
            onRefreshProduct(selectedBranchCode);
        };

        const handleDownload = () => {
            if (!selectedBranchCode || !onDownload) return;
            onDownload(selectedBranchCode);
        };

        return (
            <form
                onSubmit={handleSubmit}
                className="mb-4 bg-white p-6 rounded-xl shadow-md w-full max-w-2xl mx-auto space-y-4 border border-gray-200"
            >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Select branch (audit)
                    </h2>
                    {selectedBranchCode && (
                        <p className="text-xs text-gray-500 mt-1 sm:mt-0">
                            Current: <span className="font-medium">{selectedBranchCode}</span>
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                    <select
                        id="branches"
                        value={selectedBranchCode}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:flex-1 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="">-- Select branch --</option>
                        {(branches || []).map((branch, idx) => (
                            <option key={branch.branch_code ?? idx} value={branch.branch_code}>
                                {idx + 1}. {branch.branch_code} - {branch.branch_name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        disabled={okLocked || !selectedBranchCode}
                        className={[
                            "px-4 py-2 rounded-lg font-semibold text-sm w-full sm:w-auto transition-all duration-200",
                            okLocked || !selectedBranchCode
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md",
                        ].join(" ")}
                    >
                        {okLocked ? "✅ Loaded" : "✔️ OK"}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {onRefreshProduct && (
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={!selectedBranchCode}
                            className={[
                                "px-3 py-1.5 rounded-md border text-xs",
                                !selectedBranchCode
                                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            Refresh shelf data
                        </button>
                    )}

                    {onDownload && (
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={!selectedBranchCode || downloadLoading}
                            className={[
                                "px-3 py-1.5 rounded-md border text-xs",
                                !selectedBranchCode || downloadLoading
                                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "border-slate-200 text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            {downloadLoading ? "Downloading..." : "Export XLSX"}
                        </button>
                    )}
                </div>
            </form>
        );
    }
);

/* ================================
 * Helper: ช่วงเดือนตามเวลาไทย
 * ================================ */
const getBangkokMonthWindows = () => {
    const now = new Date();
    const bangkokNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    );

    const currentStart = new Date(bangkokNow);
    currentStart.setDate(1);
    currentStart.setHours(0, 0, 0, 0);

    const prev3Start = new Date(currentStart);
    prev3Start.setMonth(prev3Start.getMonth() - 3);

    return { currentStart, prev3Start };
};

const formatMMYYYY = (d) => {
    if (!d) return "";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${year}`;
};

const LayoutAudit = () => {
    const defaultStorecode = useBmrStore((s) => s.user?.storecode);
    const user = useBmrStore((s) => s.user);
    const logout = useBmrStore((s) => s.logout);

    const branches = useShelfStore((s) => s.branches);
    const fetchBranches = useShelfStore((s) => s.fetchBranches);

    const [selectedBranchCode, setSelectedBranchCode] = useState(
        defaultStorecode || ""
    );

    const [data, setData] = useState([]);
    const [selectedShelves, setSelectedShelves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [okLocked, setOkLocked] = useState(false);

    const [profileOpen, setProfileOpen] = useState(false);

    const { currentStart, prev3Start } = useMemo(() => getBangkokMonthWindows(), []);
    const prev3EndMonth = useMemo(() => {
        const d = new Date(currentStart);
        d.setMonth(d.getMonth() - 1);
        return d;
    }, [currentStart]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    useEffect(() => {
        setOkLocked(false);
        setData([]);
        setSelectedShelves([]);
        setSearchText("");
    }, [selectedBranchCode]);

    const handleLoadBranchData = async (e) => {
        e.preventDefault();
        if (!selectedBranchCode) return;

        setLoading(true);
        setOkLocked(true);
        setData([]);
        setSelectedShelves([]);
        setSearchText("");

        try {
            const res = await getTemplateAndProduct(selectedBranchCode);
            setData(res || []);
        } catch (error) {
            console.error("Template Load Error:", error);
            setOkLocked(false);
        } finally {
            setLoading(false);
        }
    };

    /* =========================
     * Add / Delete (เดิม)
     * ========================= */
    const handleAddProduct = async (item) => {
        if (!selectedBranchCode) return;

        try {
            const payload = {
                ...item,
                branchCode: item.branchCode || selectedBranchCode,
            };

            const res = await addTemplate({ items: [payload] });

            const updatedItem = {
                ...payload,
                ...(typeof res === "object" ? res : {}),
                salesQuantity: payload.salesQuantity ?? null,
                salesTotalPrice: payload.salesTotalPrice ?? null,
                stockQuantity: payload.stockQuantity ?? null,
                withdrawQuantity: payload.withdrawQuantity ?? 0,
                withdrawValue: payload.withdrawValue ?? 0,
            };

            setData((state) => {
                if (updatedItem.id != null && state.some((p) => p.id === updatedItem.id)) {
                    return state;
                }

                const key = `${updatedItem.branchCode}-${updatedItem.shelfCode}-${updatedItem.rowNo}-${updatedItem.codeProduct}-${updatedItem.index}`;
                const exists = state.some(
                    (p) =>
                        `${p.branchCode}-${p.shelfCode}-${p.rowNo}-${p.codeProduct}-${p.index}` === key
                );
                if (exists) return state;

                const next = [...state, updatedItem];

                const rowItems = next
                    .filter((p) => sameRow(p, updatedItem))
                    .sort((a, b) => Number(a.index) - Number(b.index))
                    .map((p, i) => ({ ...p, index: i + 1 }));

                const other = next.filter((p) => !sameRow(p, updatedItem));
                return [...other, ...rowItems];
            });
        } catch (error) {
            console.error("Audit add product failed", error);
            alert("Error adding product");
        }
    };

    const handleDeleteProduct = async (productToDelete) => {
        if (!productToDelete) return;

        const branchCode = productToDelete.branchCode || selectedBranchCode || "";
        const payload = { ...productToDelete, branchCode };

        try {
            await deleteTemplate(payload);

            setData((state) => {
                const delKey = getDeleteKey(payload);

                const kept = state.filter((p) => getDeleteKey(p) !== delKey);

                const rowItems = kept
                    .filter((p) => sameRow(p, payload))
                    .sort((a, b) => Number(a.index) - Number(b.index))
                    .map((p, i) => ({ ...p, index: i + 1 }));

                const other = kept.filter((p) => !sameRow(p, payload));
                return [...other, ...rowItems];
            });
        } catch (error) {
            console.error("Audit delete product failed", error);
            alert("Error deleting product");
        }
    };

    /* =========================
     * ✅ NEW: Update shelf order (ลากเมาส์ แล้ว Save)
     * - ยิง /shelf-update ด้วย “ทั้งรายการของ shelf”
     * - แล้วอัปเดต state ทันที ไม่ต้องโหลดใหม่
     * ========================= */
    const handleUpdateShelfProducts = async (serverItems, uiDraft) => {
        // serverItems = [{branchCode,shelfCode,rowNo,index,codeProduct}, ...]
        // uiDraft = [{codeProduct,rowNo,index,prevRowNo,prevIndex,...}, ...]
        await updateProducts(serverItems);

        setData((state) => {
            // อัปเดตเฉพาะ shelf นี้
            const branch = serverItems?.[0]?.branchCode;
            const shelf = serverItems?.[0]?.shelfCode;
            if (!branch || !shelf) return state;

            // ทำ map ด้วย key เดิม (prevRowNo/prevIndex) กัน codeProduct ซ้ำหลายแถว
            const patch = new Map(
                (uiDraft || []).map((x) => [
                    `${branch}|${shelf}|${Number(x.codeProduct)}|${Number(x.prevRowNo)}|${Number(
                        x.prevIndex
                    )}`,
                    { rowNo: Number(x.rowNo), index: Number(x.index) },
                ])
            );

            const next = state.map((p) => {
                if (p.branchCode !== branch || p.shelfCode !== shelf) return p;

                const k = `${branch}|${shelf}|${Number(p.codeProduct)}|${Number(p.rowNo)}|${Number(
                    p.index
                )}`;

                const hit = patch.get(k);
                if (!hit) return p;

                return { ...p, rowNo: hit.rowNo, index: hit.index };
            });

            // re-sort ให้ตารางเรียงถูก
            return next.sort(
                (a, b) =>
                    (a.shelfCode || "").localeCompare(b.shelfCode || "") ||
                    Number(a.rowNo || 0) - Number(b.rowNo || 0) ||
                    Number(a.index || 0) - Number(b.index || 0)
            );
        });
    };

    // Group ตาม shelfCode
    const groupedShelves = useMemo(() => {
        if (!data.length) return [];

        const groups = data.reduce((acc, item) => {
            if (!acc[item.shelfCode]) acc[item.shelfCode] = [];
            acc[item.shelfCode].push(item);
            return acc;
        }, {});

        return Object.keys(groups).map((shelfCode) => {
            const items = groups[shelfCode];

            const rowNumbers = items
                .map((i) => i.rowNo || 1)
                .filter((n) => typeof n === "number");

            const rowQty = rowNumbers.length ? Math.max(...rowNumbers) : 1;

            return {
                shelfCode,
                fullName: items[0]?.fullName || "N/A",
                rowQty,
                shelfProducts: items.sort(
                    (a, b) =>
                        (a.rowNo || 0) - (b.rowNo || 0) || (a.index || 0) - (b.index || 0)
                ),
            };
        });
    }, [data]);

    const displayedShelves = useMemo(() => {
        const lower = searchText.toLowerCase();

        return groupedShelves
            .filter(
                (shelf) =>
                    selectedShelves.length === 0 || selectedShelves.includes(shelf.shelfCode)
            )
            .map((shelf) => {
                const matched = shelf.shelfProducts.filter((item) => {
                    return (
                        item.codeProduct?.toString().includes(lower) ||
                        item.nameBrand?.toLowerCase().includes(lower)
                    );
                });

                return { ...shelf, matchedProducts: matched };
            })
            .filter((shelf) => searchText === "" || shelf.matchedProducts.length > 0);
    }, [groupedShelves, selectedShelves, searchText]);

    const selectedBranch = branches.find((b) => b.branch_code === selectedBranchCode);
    const hasLoadedBranch = !!selectedBranchCode && okLocked;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
                <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8 py-1">
                    <div className="relative flex items-center justify-between gap-3">
                        {/* LEFT */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center justify-center h-9 w-9 rounded-lg shadow-sm">
                                <img src="/icon.png" alt="Logo" className="h-7 w-7 object-contain" />
                            </div>

                            <div className="flex flex-col leading-tight">
                                <span className="text-sm sm:text-base font-semibold text-slate-800">
                                    Shelf audit tools
                                </span>
                                <span className="text-[10px] sm:text-xs text-slate-500">
                                    ตรวจสอบและปรับปรุง POG
                                </span>

                                {/* ✅ มือถือให้ไปอยู่ใต้ title (อ่านง่าย ไม่ชน) */}
                                {selectedBranch && (
                                    <div className="md:hidden mt-0.5 text-[11px] text-slate-500">
                                        {selectedBranch.branch_code} — {selectedBranch.branch_name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ CENTER (กลางจริง ๆ) */}
                        {selectedBranch && (
                            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-[11px] text-slate-500 whitespace-nowrap">
                                {selectedBranch.branch_code} — {selectedBranch.branch_name}
                            </div>
                        )}

                        {/* RIGHT */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((o) => !o)}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium"
                            >
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                                    {user?.name?.[0]?.toUpperCase?.() || "U"}
                                </span>
                                <span className="flex flex-col text-left leading-tight">
                                    <span className="text-xs sm:text-sm">{user?.name || "User"}</span>
                                    <span className="text-[10px] text-slate-500">{user?.role || "-"}</span>
                                </span>
                                <span className="text-[10px] text-slate-500">▼</span>
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-md py-1 text-sm z-40">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            logout();
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-red-600 text-xs sm:text-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    <BranchSelector
                        branches={branches}
                        selectedBranchCode={selectedBranchCode}
                        onChange={(code) => setSelectedBranchCode(code)}
                        onSubmit={handleLoadBranchData}
                        okLocked={okLocked}
                    />

                    {!hasLoadedBranch && (
                        <div className="text-center text-sm text-slate-500 mt-6">
                            กรุณาเลือกสาขา แล้วกด <span className="font-semibold">OK</span> เพื่อดูข้อมูล Shelf
                        </div>
                    )}

                    {hasLoadedBranch && (
                        <>
                            {/* SUMMARY + IMAGE */}
                            {!loading && groupedShelves.length > 0 && selectedBranchCode && (
                                <section className="w-full flex justify-center print:hidden">
                                    <div
                                        className="bg-white p-4 rounded-lg shadow-sm border justify-center
                    flex flex-col md:flex-row gap-4 mx-auto w-full max-w-4xl"
                                    >
                                        <div className="flex justify-center md:w-[260px]">
                                            <img
                                                src={`/images/branch/${selectedBranchCode?.toUpperCase()}.png`}
                                                alt={`Branch ${selectedBranchCode}`}
                                                className="w-full max-w-[260px] object-contain rounded"
                                                loading="lazy"
                                            />
                                        </div>

                                        <div
                                            className="bg-gray-50 border rounded p-3 shadow-inner 
                      max-h-[420px] md:max-h-[480px] w-full md:w-[260px] overflow-y-auto"
                                        >
                                            <h3 className="font-semibold text-gray-700 mb-1 text-sm text-center">
                                                โครงสร้าง Shelf
                                            </h3>

                                            <p className="text-[11px] text-center text-slate-500 mb-1">
                                                Target ใช้ยอดขาย 3 เดือนก่อนหน้า: {formatMMYYYY(prev3Start)} -{" "}
                                                {formatMMYYYY(prev3EndMonth)}
                                            </p>
                                            <p className="text-[11px] text-center text-slate-500 mb-2">
                                                ยอดขายปัจจุบัน (เดือนนี้): {formatMMYYYY(currentStart)}
                                            </p>

                                            {groupedShelves.map((shelf) => (
                                                <div
                                                    key={shelf.shelfCode}
                                                    className="mb-2 pb-2 border-b last:border-b-0"
                                                >
                                                    <div className="font-semibold text-blue-700 text-sm leading-tight">
                                                        Shelf {shelf.shelfCode}
                                                    </div>

                                                    <div className="ml-2 mt-1 text-xs leading-tight">
                                                        <div className="font-semibold text-gray-600">
                                                            จำนวน : {shelf.rowQty} เเถว
                                                        </div>

                                                        {Array.from({ length: shelf.rowQty }).map((_, idx) => {
                                                            const rowNo = idx + 1;
                                                            const rowProducts = shelf.shelfProducts.filter(
                                                                (p) => (p.rowNo || 0) === rowNo
                                                            );

                                                            return (
                                                                <div
                                                                    key={rowNo}
                                                                    className="ml-1 flex text-gray-700 leading-tight py-[1px]"
                                                                >
                                                                    <span className="pr-4">• Row {rowNo}</span>
                                                                    <span>{rowProducts.length} รายการ</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* FILTER + SEARCH */}
                            <section className="space-y-3 print:hidden">
                                {!loading && groupedShelves.length > 0 && (
                                    <Suspense fallback={<div className="text-sm text-gray-500">Loading filter...</div>}>
                                        <ShelfFilterAudit
                                            shelves={groupedShelves.map((s) => s.shelfCode)}
                                            selectedShelves={selectedShelves}
                                            onToggle={(code) =>
                                                setSelectedShelves((prev) =>
                                                    prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
                                                )
                                            }
                                            onClear={() => setSelectedShelves([])}
                                        />
                                    </Suspense>
                                )}

                                <div className="w-full max-w-xl mx-auto">
                                    <input
                                        type="text"
                                        placeholder="ค้นหาแบรนด์ / รหัสสินค้า..."
                                        className="w-full px-4 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        disabled={!selectedBranchCode}
                                    />
                                </div>
                            </section>

                            {/* SHELF LIST */}
                            <section className="space-y-4">
                                {loading && (
                                    <div className="text-center text-sm text-gray-500">
                                        กำลังโหลดข้อมูลชั้นวาง...
                                    </div>
                                )}

                                {!loading && selectedBranchCode && displayedShelves.length === 0 && (
                                    <div className="text-center text-sm text-gray-500">ไม่พบข้อมูล</div>
                                )}

                                <Suspense fallback={<div className="text-sm text-gray-500">Loading shelves...</div>}>
                                    {displayedShelves.map((shelf) => (
                                        <ShelfCardAudit
                                            key={shelf.shelfCode}
                                            template={{
                                                ...shelf,
                                                shelfProducts: shelf.matchedProducts,
                                            }}
                                            branchCode={selectedBranchCode}
                                            onAddProduct={handleAddProduct}
                                            onDeleteProduct={handleDeleteProduct}
                                            onUpdateProducts={handleUpdateShelfProducts} // ✅ NEW
                                            autoOpen={searchText.length > 0}
                                        />
                                    ))}
                                </Suspense>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LayoutAudit;
