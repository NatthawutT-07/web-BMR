import React, { useCallback, useState, useMemo, useEffect } from "react";
import api from "../../../utils/axios";

const cx = (...a) => a.filter(Boolean).join(" ");

const ACTION_OPTIONS = [
    { value: "add", label: "เพิ่มสินค้า", desc: "" },
    { value: "move", label: "ย้ายตำแหน่ง", desc: "" },
    { value: "delete", label: "ลบสินค้า", desc: "" },
];

export default function PogRequestModal({
    open,
    onClose,
    branch_code,
    branchName: initialBranchName = "",
    barcode,
    item_name,
    currentShelf,
    currentRow,
    currentIndex,
    initialAction = "",
    availableShelves: initialShelves = [],
}) {
    const [action, setAction] = useState(initialAction);
    const [toShelf, setToShelf] = useState("");
    const [toRow, setToRow] = useState("");
    const [toIndex, setToIndex] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const LAST_ADD_POSITION_KEY = `pog_last_add_position_${branch_code}`;
    const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);

    const [shelves, setShelves] = useState([]);
    const [shelvesLoading, setShelvesLoading] = useState(false);
    const [branchNameFromApi, setBranchNameFromApi] = useState("");

    const availableShelves = shelves;
    const branchName = initialBranchName || branchNameFromApi;

    const fetchShelves = useCallback(async () => {
        setShelvesLoading(true);
        try {
            const res = await api.get("/branch-shelves", { params: { branch_code } });
            const apiShelves = res.data?.shelves || [];

            const merged = apiShelves.map(apiShelf => {
                const propsShelf = initialShelves.find(s => s.shelf_code === apiShelf.shelf_code);
                return {
                    ...apiShelf,
                    items: propsShelf?.items?.length > 0 ? propsShelf.items : apiShelf.items || []
                };
            });

            setShelves(merged);
            setBranchNameFromApi(res.data?.branchName || "");
        } catch (e) {
            console.error("Failed to load shelves:", e);
            setShelves(initialShelves);
        } finally {
            setShelvesLoading(false);
        }
    }, [branch_code, initialShelves]);

    useEffect(() => {
        if (!open || !branch_code) return;
        fetchShelves();
    }, [open, branch_code, initialShelves, fetchShelves]);

    const lastActivityRef = React.useRef(Date.now());
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        if (!open) return;

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            if (isIdle) setIsIdle(false);
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        const checkIdleInterval = setInterval(() => {
            const now = Date.now();
            const inactiveDuration = now - lastActivityRef.current;

            if (inactiveDuration >= 5 * 60 * 1000) {
                fetchShelves();
                lastActivityRef.current = now;
                setIsIdle(true);
            }
        }, 60 * 1000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            clearInterval(checkIdleInterval);
        };
    }, [open, branch_code, fetchShelves, isIdle]);

    const selectedShelfData = useMemo(() => {
        if (!toShelf) return null;
        return availableShelves.find(s => s.shelf_code === toShelf);
    }, [toShelf, availableShelves]);

    const availableRows = useMemo(() => {
        if (!selectedShelfData) return [];
        const shelf_total_row = Number(selectedShelfData.shelf_total_row || 0);
        return Array.from({ length: shelf_total_row }, (_, i) => i + 1);
    }, [selectedShelfData]);

    const availableIndices = useMemo(() => {
        if (!selectedShelfData || !toRow) return [];

        const items = selectedShelfData.items || [];
        const rowNum = Number(toRow);
        const itemsInRow = items.filter(item => Number(item.shelf_row_number) === rowNum);
        const maxIndex = itemsInRow.length;

        return Array.from({ length: maxIndex + 1 }, (_, i) => ({
            value: i + 1,
            label: i + 1 === maxIndex + 1 ? `${i + 1} (ตำแหน่งใหม่)` : String(i + 1)
        }));
    }, [selectedShelfData, toRow]);

    const existingLocationForBarcode = useMemo(() => {
        if (!barcode) return null;
        const bc = String(barcode).trim();
        for (const shelf of availableShelves) {
            const items = shelf.items || [];
            for (const item of items) {
                if (String(item.barcode || "").trim() === bc) {
                    return {
                        shelf_code: shelf.shelf_code,
                        shelfName: shelf.shelf_name || shelf.shelf_code,
                        shelf_row_number: item.shelf_row_number,
                        shelf_index_number: item.shelf_index_number,
                    };
                }
            }
        }
        return null;
    }, [barcode, availableShelves]);

    const isDuplicateAdd = action === "add" && existingLocationForBarcode !== null;
    const hasCurrentPosition = Boolean(currentShelf && currentRow && currentIndex);
    const isSamePosition = useMemo(() => {
        if (action !== "move" || !toShelf || !toRow || !toIndex) return false;
        return (
            toShelf === currentShelf &&
            Number(toRow) === Number(currentRow) &&
            Number(toIndex) === Number(currentIndex)
        );
    }, [action, toShelf, toRow, toIndex, currentShelf, currentRow, currentIndex]);

    const resetForm = () => {
        setAction(initialAction || "");
        setToShelf("");
        setToRow("");
        setToIndex("");
        setNote("");
        setError("");
        setSuccess(false);
        setSubmitted(false);
    };

    useEffect(() => {
        if (initialAction) setAction(initialAction);
    }, [initialAction]);

    useEffect(() => {
        if (!open) return;

        if (action === "add") {
            try {
                const saved = localStorage.getItem(LAST_ADD_POSITION_KEY);
                if (saved) {
                    const { shelf, row, shelf_index_number } = JSON.parse(saved);

                    if (shelf) setToShelf(shelf);
                    if (row) setToRow(String(row));
                    if (shelf_index_number) setToIndex(String(shelf_index_number));
                }
            } catch (e) {
                console.error("Failed to load last position:", e);
            }
        } else if (action === "move") {
            setToShelf("");
            setToRow("");
            setToIndex("");
        }
    }, [action, open, LAST_ADD_POSITION_KEY]);

    const handleClose = () => {
        resetForm();
        onClose?.();
    };

    const handleSubmit = async () => {
        if (loading || submitted) return;

        if (!action) {
            setError("กรุณาเลือกประเภทการเปลี่ยนแปลง");
            return;
        }
        if ((action === "add" || action === "move") && (!toShelf || !toRow || !toIndex)) {
            setError("กรุณาระบุตำแหน่งปลายทางให้ครบถ้วน");
            return;
        }
        if (isDuplicateAdd) {
            setError(`สินค้านี้มีอยู่ในสาขาแล้ว (${existingLocationForBarcode?.shelf_code} / ชั้น ${existingLocationForBarcode?.shelf_row_number} / ลำดับ ${existingLocationForBarcode?.shelf_index_number}) ไม่สามารถเพิ่มซ้ำได้`);
            return;
        }
        if (isSamePosition) {
            setError("ตำแหน่งปลายทางเหมือนกับตำแหน่งปัจจุบัน กรุณาเลือกตำแหน่งอื่น");
            return;
        }

        setSubmitted(true);
        setLoading(true);
        setError("");

        try {
            await api.post("/pog-request", {
                branch_code,
                action,
                barcode,
                item_name,
                fromShelf: currentShelf,
                fromRow: currentRow,
                fromIndex: currentIndex,
                toShelf: action !== "delete" ? toShelf : null,
                toRow: action !== "delete" ? Number(toRow) : null,
                toIndex: action !== "delete" ? Number(toIndex) : null,
                swap_barcode: null,
                note,
            });

            setSuccess(true);

            if (action === "add" && toShelf && toRow && toIndex) {
                try {
                    localStorage.setItem(LAST_ADD_POSITION_KEY, JSON.stringify({
                        shelf: toShelf,
                        row: Number(toRow),
                        shelf_index_number: Number(toIndex)
                    }));
                } catch (e) {
                    console.error("Failed to save last position:", e);
                }
            }
        } catch (e) {
            console.error("POG request error:", e);
            setError(e.message || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={handleClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[85vh] pointer-events-auto overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-100 bg-emerald-50/70 flex-shrink-0">
                    <div>
                        <div className="text-base font-bold text-emerald-900">แจ้งขอเปลี่ยนแปลง</div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                            สาขา: {branch_code}{branchName ? ` - ${branchName}` : ""}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="text-emerald-700 hover:text-emerald-900 rounded-lg p-1 hover:bg-emerald-100/50 transition-colors"
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-grow">
                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-8">
                            <div className="text-lg font-bold text-emerald-700">ส่งคำขอสำเร็จ!</div>
                            <div className="text-sm text-slate-500 mt-1">คำขอของคุณได้รับการบันทึกและรอดำเนินการ</div>
                            <button
                                onClick={handleClose}
                                className="mt-5 px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-sm"
                            >
                                ปิด
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Product Info */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-start gap-4 shadow-sm">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สินค้าที่เลือก</div>
                                    <div className="text-sm font-bold text-slate-900 leading-snug break-words">{item_name || "-"}</div>
                                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-2 text-[11px] text-slate-500">
                                        <span>บาร์โค้ด: {barcode}</span>
                                        {currentShelf && (
                                            <>
                                                <span>•</span>
                                                <span>ตำแหน่งปัจจุบัน: {currentShelf} / ชั้น {currentRow} / ลำดับ {currentIndex}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Selection */}
                            <div>
                                <div className="text-sm font-bold text-slate-800 mb-2">เลือกประเภท</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {ACTION_OPTIONS.map((opt) => {
                                        // Disable conditions
                                        const isAddDisabled = opt.value === "add" && existingLocationForBarcode;
                                        const isMoveDisabled = (opt.value === "move" && !existingLocationForBarcode) || !hasCurrentPosition;
                                        const isDeleteDisabled = (opt.value === "delete" && !existingLocationForBarcode) || !hasCurrentPosition;
                                        const isDisabled = isAddDisabled || isMoveDisabled || isDeleteDisabled;
                                        
                                        const isActive = action === opt.value;

                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => !isDisabled && setAction(opt.value)}
                                                disabled={isDisabled && !isActive}
                                                className={cx(
                                                    "w-full text-left p-3 rounded-xl border-2 transition",
                                                    isActive
                                                        ? (opt.value === 'add' ? "border-emerald-500 bg-emerald-50/50" :
                                                           opt.value === 'move' ? "border-blue-500 bg-blue-50/50" :
                                                           "border-rose-500 bg-rose-50/50")
                                                        : isDisabled
                                                            ? "border-slate-200 bg-slate-100/50 opacity-50 cursor-not-allowed"
                                                            : "border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                <div className={cx("font-bold text-sm", (isDisabled && !isActive) && "text-slate-400", isActive && (opt.value === 'add' ? "text-emerald-700" : opt.value === 'move' ? "text-blue-700" : "text-rose-700"))}>{opt.label}</div>
                                                <div className={cx("text-xs mt-0.5", (isDisabled && !isActive) ? "text-slate-400" : "text-slate-500")}>{opt.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Target Position (for add/move) */}
                            {(action === "add" || action === "move") && (
                                <div className={cx(
                                    "p-4 rounded-xl border space-y-3",
                                    action === "add" ? "bg-emerald-50/30 border-emerald-200" : "bg-blue-50/30 border-blue-200"
                                )}>
                                    <div className={cx(
                                        "text-sm font-bold",
                                        action === "add" ? "text-emerald-800" : "text-blue-800"
                                    )}>
                                        {action === "add" ? "ตำแหน่งที่ต้องการเพิ่ม" : "ตำแหน่งปลายทาง (ย้ายไป)"}
                                    </div>

                                    {/* Shelf Selector */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ชั้นวาง</label>
                                        {shelvesLoading ? (
                                            <div className="w-full px-3 py-2.5 border rounded-xl text-sm bg-slate-100 text-slate-500">
                                                กำลังโหลดข้อมูลชั้นวาง...
                                            </div>
                                        ) : availableShelves.length === 0 ? (
                                            <div className="w-full px-3 py-2.5 border rounded-xl text-sm bg-slate-50 text-slate-700">
                                                ไม่พบข้อมูลชั้นวางในสาขานี้
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsShelfDropdownOpen(!isShelfDropdownOpen)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 flex items-center justify-between transition-all"
                                                >
                                                    <span className={!toShelf ? "text-slate-400" : "font-semibold text-slate-800"}>
                                                        {toShelf
                                                            ? (() => {
                                                                const s = availableShelves.find(sh => sh.shelf_code === toShelf);
                                                                return s ? `${s.shelf_code} - ${s.shelf_name || s.shelf_code}` : toShelf;
                                                            })()
                                                            : `-- เลือกชั้นวาง (${availableShelves.length} ชั้นวาง) --`}
                                                    </span>
                                                    <span className="text-slate-400 text-xs ml-2">▼</span>
                                                </button>

                                                {/* Custom Dropdown */}
                                                {isShelfDropdownOpen && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setIsShelfDropdownOpen(false)}
                                                        />
                                                        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {availableShelves.map((shelf) => (
                                                                <li
                                                                    key={shelf.shelf_code}
                                                                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-emerald-50 ${toShelf === shelf.shelf_code ? 'text-emerald-900 bg-emerald-50 font-medium' : 'text-slate-700'
                                                                        }`}
                                                                    onClick={() => {
                                                                        setToShelf(shelf.shelf_code);
                                                                        setToRow("");
                                                                        setToIndex("");
                                                                        setIsShelfDropdownOpen(false);
                                                                    }}
                                                                >
                                                                    <span className={`block truncate ${toShelf === shelf.shelf_code ? 'font-semibold' : 'font-normal'}`}>
                                                                        {shelf.shelf_code} - {shelf.shelf_name || shelf.shelf_code}
                                                                    </span>
                                                                    {toShelf === shelf.shelf_code && (
                                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600">
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Row Selector */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ชั้นที่</label>
                                            <select
                                                value={toRow}
                                                onChange={(e) => {
                                                    setToRow(e.target.value);
                                                    setToIndex("");
                                                }}
                                                disabled={!toShelf || availableRows.length === 0}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-semibold text-slate-800"
                                            >
                                                <option value="">-- เลือกชั้น --</option>
                                                {availableRows.map((row) => (
                                                    <option key={row} value={row}>
                                                        ชั้น {row}
                                                    </option>
                                                ))}
                                            </select>
                                            {toShelf && availableRows.length === 0 && (
                                                <div className="text-xs text-rose-500 mt-1">ไม่พบข้อมูลชั้นใน shelf นี้</div>
                                            )}
                                        </div>

                                        {/* Index Selector */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ลำดับ</label>
                                            <select
                                                value={toIndex}
                                                onChange={(e) => setToIndex(e.target.value)}
                                                disabled={!toRow || availableIndices.length === 0}
                                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-semibold text-slate-800"
                                            >
                                                <option value="">-- เลือกลำดับ --</option>
                                                {availableIndices.map((idx) => (
                                                    <option key={idx.value} value={idx.value}>
                                                        {idx.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Info about selected position */}
                                    {toShelf && toRow && toIndex && (
                                        <div className={cx(
                                            "text-xs px-3 py-2.5 rounded-xl border shadow-sm font-semibold",
                                            isSamePosition
                                                ? "text-rose-700 bg-rose-100 border-rose-200"
                                                : action === "add" ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-blue-700 bg-blue-100 border-blue-200"
                                        )}>
                                            {isSamePosition ? (
                                                <>
                                                    <strong>ตำแหน่งเดิม!</strong> กรุณาเลือกตำแหน่งอื่น
                                                </>
                                            ) : (
                                                <>
                                                    📍 ตำแหน่งที่เลือก: <strong>{toShelf} / ชั้น {toRow} / ลำดับ {toIndex}</strong>
                                                    {Number(toIndex) === availableIndices.length && (
                                                        <span className="ml-2 text-emerald-600 font-bold">(ตำแหน่งใหม่)</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Note */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-800">หมายเหตุ (ถ้ามี)</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="ระบุเหตุผล..."
                                    rows={2}
                                    maxLength={50}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm border bg-white hover:bg-slate-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || !action || isDuplicateAdd || isSamePosition}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {loading ? "กำลังส่ง..." : "ส่งคำขอ"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
