// PogRequestModal.jsx - Modal สำหรับสร้าง Request เปลี่ยนแปลง POG
import React, { useState, useMemo, useEffect } from "react";
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
    branchCode,
    branchName: initialBranchName = "",
    barcode,
    productName,
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
    const [submitted, setSubmitted] = useState(false); // ป้องกัน double-click
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // LocalStorage key สำหรับจำค่า ADD position ล่าสุด
    const LAST_ADD_POSITION_KEY = `pog_last_add_position_${branchCode}`;

    // Dropdown state
    const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);

    // State สำหรับ shelves ที่โหลดจาก API
    const [shelves, setShelves] = useState([]);
    const [shelvesLoading, setShelvesLoading] = useState(false);
    const [branchNameFromApi, setBranchNameFromApi] = useState("");

    // ใช้ shelves จาก API (ถูก merge กับ initialShelves แล้ว)
    const availableShelves = shelves;
    const branchName = initialBranchName || branchNameFromApi;

    // โหลด shelves จาก API
    const fetchShelves = async () => {
        setShelvesLoading(true);
        try {
            const res = await api.get("/branch-shelves", { params: { branchCode } });
            const apiShelves = res.data?.shelves || [];

            // Merge API data กับ initialShelves
            const merged = apiShelves.map(apiShelf => {
                const propsShelf = initialShelves.find(s => s.shelfCode === apiShelf.shelfCode);
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
    };

    // โหลดข้อมูลครั้งแรกเมื่อเปิด Modal
    useEffect(() => {
        if (!open || !branchCode) return;
        fetchShelves();
    }, [open, branchCode, initialShelves]);

    // ระบบ Auto-Refresh เมื่อไม่ได้ใช้งาน (Idle Timeout = 5 นาที)
    const lastActivityRef = React.useRef(Date.now());
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        if (!open) return;

        // อัปเดตเวลาใช้งานล่าสุด
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            if (isIdle) setIsIdle(false);
        };

        // จับ Event การขยับเมาส์ พิมพ์ หรือคลิก
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        // เช็ค Idle ทุกๆ 1 นาที
        const checkIdleInterval = setInterval(() => {
            const now = Date.now();
            const inactiveDuration = now - lastActivityRef.current;

            // ถ้าปล่อยทิ้งไว้เกิน 5 นาที (300,000 ms) ให้ดึงข้อมูลใหม่
            if (inactiveDuration >= 5 * 60 * 1000) {
                // console.log("Idle detected, refreshing shelf data...");
                fetchShelves();
                lastActivityRef.current = now; // รีเซ็ตเวลาเพื่อไม่ให้โหลดถี่เกินไป
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
    }, [open, branchCode]);

    // คำนวณ available rows สำหรับ shelf ที่เลือก
    const selectedShelfData = useMemo(() => {
        if (!toShelf) return null;
        return availableShelves.find(s => s.shelfCode === toShelf);
    }, [toShelf, availableShelves]);

    const availableRows = useMemo(() => {
        if (!selectedShelfData) return [];
        const rowQty = Number(selectedShelfData.rowQty || 0);
        return Array.from({ length: rowQty }, (_, i) => i + 1);
    }, [selectedShelfData]);

    // คำนวณ available index สำหรับ row ที่เลือก (current items + 1 for new)
    const availableIndices = useMemo(() => {
        if (!selectedShelfData || !toRow) return [];

        // นับจำนวน items ใน row นี้
        const items = selectedShelfData.items || [];
        const rowNum = Number(toRow);
        const itemsInRow = items.filter(item => Number(item.rowNo) === rowNum);
        const maxIndex = itemsInRow.length;

        // แสดง 1 ถึง maxIndex+1 (new position)
        return Array.from({ length: maxIndex + 1 }, (_, i) => ({
            value: i + 1,
            label: i + 1 === maxIndex + 1 ? `${i + 1} (ตำแหน่งใหม่)` : String(i + 1)
        }));
    }, [selectedShelfData, toRow]);

    // ตรวจสอบว่า barcode นี้มีอยู่ในสาขาแล้วหรือไม่ (1 SKU = 1 สาขา)
    const existingLocationForBarcode = useMemo(() => {
        if (!barcode) return null;
        const bc = String(barcode).trim();
        for (const shelf of availableShelves) {
            const items = shelf.items || [];
            for (const item of items) {
                if (String(item.barcode || "").trim() === bc) {
                    return {
                        shelfCode: shelf.shelfCode,
                        shelfName: shelf.fullName || shelf.shelfCode,
                        rowNo: item.rowNo,
                        index: item.index,
                    };
                }
            }
        }
        return null;
    }, [barcode, availableShelves]);

    // Check if trying to add duplicate
    const isDuplicateAdd = action === "add" && existingLocationForBarcode !== null;

    // Check if product has current position (for delete validation)
    const hasCurrentPosition = Boolean(currentShelf && currentRow && currentIndex);

    // Check if trying to move to same position
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
        setSubmitted(false); // Reset submitted state
    };

    // Reset action when initialAction changes
    useEffect(() => {
        if (initialAction) setAction(initialAction);
    }, [initialAction]);

    // โหลดค่า position ล่าสุดจาก localStorage เมื่อ action = add
    // เซ็ตว่างเมื่อ action = move
    useEffect(() => {
        if (!open) return;

        if (action === "add") {
            // โหลดค่าที่เคยใช้ล่าสุดสำหรับ ADD
            try {
                const saved = localStorage.getItem(LAST_ADD_POSITION_KEY);
                if (saved) {
                    const { shelf, row, index } = JSON.parse(saved);

                    if (shelf) setToShelf(shelf);
                    if (row) setToRow(String(row));
                    if (index) setToIndex(String(index));
                }
            } catch (e) {
                console.error("Failed to load last position:", e);
            }
        } else if (action === "move") {
            // MOVE เซ็ตว่างเสมอ
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
        // ป้องกัน double-click: ถ้ากำลังโหลดหรือส่งไปแล้ว ไม่ทำอะไร
        if (loading || submitted) return;

        if (!action) {
            setError("กรุณาเลือกประเภทการเปลี่ยนแปลง");
            return;
        }

        if ((action === "add" || action === "move") && (!toShelf || !toRow || !toIndex)) {
            setError("กรุณาระบุตำแหน่งปลายทางให้ครบถ้วน");
            return;
        }

        // Block duplicate add
        if (isDuplicateAdd) {
            setError(`สินค้านี้มีอยู่ในสาขาแล้ว (${existingLocationForBarcode?.shelfCode} / ชั้น ${existingLocationForBarcode?.rowNo} / ลำดับ ${existingLocationForBarcode?.index}) ไม่สามารถเพิ่มซ้ำได้`);
            return;
        }

        // Block move to same position
        if (isSamePosition) {
            setError("ตำแหน่งปลายทางเหมือนกับตำแหน่งปัจจุบัน กรุณาเลือกตำแหน่งอื่น");
            return;
        }

        setSubmitted(true); // ป้องกัน double-click
        setLoading(true);
        setError("");

        try {
            await api.post("/pog-request", {
                branchCode,
                action,
                barcode,
                productName,
                fromShelf: currentShelf,
                fromRow: currentRow,
                fromIndex: currentIndex,
                toShelf: action !== "delete" ? toShelf : null,
                toRow: action !== "delete" ? Number(toRow) : null,
                toIndex: action !== "delete" ? Number(toIndex) : null,
                swapBarcode: null,
                note,
            });

            setSuccess(true);

            // บันทึก position ล่าสุดสำหรับ ADD เพื่อใช้เป็นค่าเริ่มต้นครั้งถัดไป
            if (action === "add" && toShelf && toRow && toIndex) {
                try {
                    localStorage.setItem(LAST_ADD_POSITION_KEY, JSON.stringify({
                        shelf: toShelf,
                        row: Number(toRow),
                        index: Number(toIndex)
                    }));
                } catch (e) {
                    console.error("Failed to save last position:", e);
                }
            }
        } catch (e) {
            console.error("POG request error:", e);
            let msg = e?.response?.data?.message;
            if (typeof msg === 'string' && msg.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(msg);
                    msg = parsed.message || msg;
                } catch { }
            }
            setError(msg || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-50 flex-shrink-0 rounded-t-2xl">
                    <div>
                        <div className="text-base font-semibold text-emerald-800">แจ้งขอเปลี่ยนแปลง</div>
                        <div className="text-sm text-emerald-700 mt-0.5">
                            สาขา: {branchCode}{branchName ? ` - ${branchName}` : ""}
                        </div>
                    </div>

                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-grow">
                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-8">
                            <div className="text-lg font-semibold text-emerald-700">ส่งคำขอสำเร็จ!</div>
                            <div className="text-sm text-slate-600 mt-1">รอดำเนินการ</div>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                            >
                                ปิด
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Product Info */}
                            <div className="p-3 rounded-xl bg-slate-50 border">
                                <div className="text-sm text-slate-500">สินค้าที่เลือก</div>
                                <div className="text-base font-semibold text-slate-800 mt-1">{productName || "-"}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                    บาร์โค้ด: {barcode}
                                    {currentShelf && (
                                        <> • ตำแหน่งปัจจุบัน: {currentShelf} / ชั้น {currentRow} / ลำดับ {currentIndex}</>
                                    )}
                                </div>
                            </div>

                            {/* Action Selection */}
                            <div>
                                <div className="text-sm font-semibold text-slate-800 mb-2">เลือกประเภท</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {ACTION_OPTIONS.map((opt) => {
                                        // Disable conditions
                                        const isAddDisabled = opt.value === "add" && existingLocationForBarcode;
                                        const isMoveDisabled = opt.value === "move" && !existingLocationForBarcode;
                                        const isDeleteDisabled = opt.value === "delete" && !existingLocationForBarcode;
                                        const isDisabled = isAddDisabled || isMoveDisabled || isDeleteDisabled;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => !isDisabled && setAction(opt.value)}
                                                disabled={isDisabled}
                                                className={cx(
                                                    "w-full text-left p-3 rounded-xl border-2 transition",
                                                    isDisabled
                                                        ? "border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed"
                                                        : action === opt.value
                                                            ? (opt.value === 'add' ? "border-emerald-500 bg-emerald-50" :
                                                               opt.value === 'move' ? "border-blue-500 bg-blue-50" :
                                                               "border-rose-500 bg-rose-50")
                                                            : "border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                <div className={cx("font-semibold text-sm", isDisabled && "text-slate-400")}>{opt.label}</div>
                                                <div className={cx("text-xs mt-0.5", isDisabled ? "text-slate-400" : "text-slate-500")}>{opt.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Target Position (for add/move) */}
                            {(action === "add" || action === "move") && (
                                <div className={cx(
                                    "p-3 rounded-xl border space-y-3",
                                    action === "add" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"
                                )}>
                                    <div className={cx(
                                        "text-sm font-semibold",
                                        action === "add" ? "text-emerald-800" : "text-blue-800"
                                    )}>
                                        {action === "add" ? "ตำแหน่งที่ต้องการเพิ่ม" : "ตำแหน่งปลายทาง (ย้ายไป)"}
                                    </div>

                                    {/* Shelf Selector */}
                                    <div>
                                        <label className="text-sm text-slate-600">ชั้นวาง</label>
                                        {shelvesLoading ? (
                                            <div className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-slate-100 text-slate-500">
                                                กำลังโหลดข้อมูลชั้นวาง...
                                            </div>
                                        ) : availableShelves.length === 0 ? (
                                            <div className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-slate-50 text-slate-700">
                                                ⚠️ ไม่พบข้อมูลชั้นวางในสาขานี้
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsShelfDropdownOpen(!isShelfDropdownOpen)}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 flex items-center justify-between"
                                                >
                                                    <span className={!toShelf ? "text-slate-500" : ""}>
                                                        {toShelf
                                                            ? (() => {
                                                                const s = availableShelves.find(sh => sh.shelfCode === toShelf);
                                                                return s ? `${s.shelfCode} - ${s.fullName || s.shelfCode}` : toShelf;
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
                                                        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {availableShelves.map((shelf) => (
                                                                <li
                                                                    key={shelf.shelfCode}
                                                                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-emerald-50 ${toShelf === shelf.shelfCode ? 'text-emerald-900 bg-emerald-50 font-medium' : 'text-slate-700'
                                                                        }`}
                                                                    onClick={() => {
                                                                        setToShelf(shelf.shelfCode);
                                                                        setToRow("");
                                                                        setToIndex("");
                                                                        setIsShelfDropdownOpen(false);
                                                                    }}
                                                                >
                                                                    <span className={`block truncate ${toShelf === shelf.shelfCode ? 'font-semibold' : 'font-normal'}`}>
                                                                        {shelf.shelfCode} - {shelf.fullName || shelf.shelfCode}
                                                                    </span>
                                                                    {toShelf === shelf.shelfCode && (
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
                                        <div>
                                            <label className="text-sm text-slate-600">ชั้นที่</label>
                                            <select
                                                value={toRow}
                                                onChange={(e) => {
                                                    setToRow(e.target.value);
                                                    setToIndex("");
                                                }}
                                                disabled={!toShelf || availableRows.length === 0}
                                                className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-white disabled:bg-slate-100"
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
                                        <div>
                                            <label className="text-sm text-slate-600">ลำดับ</label>
                                            <select
                                                value={toIndex}
                                                onChange={(e) => setToIndex(e.target.value)}
                                                disabled={!toRow || availableIndices.length === 0}
                                                className="w-full mt-1 px-3 py-2.5 border rounded-lg text-sm bg-white disabled:bg-slate-100"
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
                                            "text-xs px-3 py-2 rounded-lg border",
                                            isSamePosition
                                                ? "text-rose-700 bg-rose-100 border-rose-200"
                                                : action === "add" ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-blue-700 bg-blue-100 border-blue-200"
                                        )}>
                                            {isSamePosition ? (
                                                <>
                                                    ⚠️ <strong>ตำแหน่งเดิม!</strong> กรุณาเลือกตำแหน่งอื่น
                                                </>
                                            ) : (
                                                <>
                                                    📍 ตำแหน่งที่เลือก: <strong>{toShelf} / ชั้น {toRow} / ลำดับ {toIndex}</strong>
                                                    {Number(toIndex) === availableIndices.length && (
                                                        <span className="ml-2 text-emerald-600 font-medium">(ตำแหน่งใหม่)</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Note */}
                            <div>
                                <label className="text-sm font-semibold text-slate-800">หมายเหตุ (ถ้ามี)</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="ระบุเหตุผลหรือรายละเอียดเพิ่มเติม..."
                                    rows={2}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm border bg-white hover:bg-slate-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || !action || isDuplicateAdd || isSamePosition}
                                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
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

